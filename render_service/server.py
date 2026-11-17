#!/usr/bin/env python3
"""HTTP adapter that runs the original cinematic-film Python/Skia renderer."""
from __future__ import annotations
import base64, binascii, io, json, os, re, shutil, subprocess, tempfile
from pathlib import Path
from typing import Any
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "cinematic-engine" / "cinematic-film"
SCRIPTS = ENGINE / "scripts"
TEMPLATE = ENGINE / "assets" / "template"
MAX_TEXT = 4000
app = FastAPI(title="Cinema King Cinematic Render Service", version="1.0.0")
origins = [x.strip() for x in os.getenv("CINEMA_KING_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,capacitor://localhost,https://localhost").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False,
                   allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type"])

class Scene(BaseModel):
    title: str = Field(default="Untitled scene", max_length=120)
    narration: str = Field(default="", max_length=MAX_TEXT)
    duration: float = Field(default=5, ge=1, le=120)
    image: str | None = Field(default=None, max_length=12 * 1024 * 1024)

class RenderRequest(BaseModel):
    title: str = Field(default="Cinema King Film", max_length=120)
    scenes: list[Scene] = Field(min_length=1, max_length=80)
    language: str = Field(default="en", pattern="^(en|hi|gu)$")
    voice: str | None = Field(default=None, max_length=80)
    size: str = Field(default="1280x720", pattern="^(1280x720|720x1280|1080x1080)$")

def _run(command: list[str], cwd: Path, timeout: int = 900) -> None:
    try:
        result = subprocess.run(command, cwd=cwd, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(status_code=504, detail="Cinematic render timed out. Try a shorter film or lower resolution.") from exc
    if result.returncode:
        raise HTTPException(status_code=500, detail=(result.stderr or result.stdout or "Renderer failed")[-3500:])

def _scene_source() -> str:
    return '''import json, os
from engine import BigText, Card, Film, Print

ACCENT = (198, 142, 65)

def build_film(doc):
    L, E = doc.L, doc.E
    film = Film(doc.duration, fps=int(os.getenv("CINEMA_KING_RENDER_FPS", "30")), look="night")
    script = json.loads((doc.dir / "script.json").read_text())
    lines = [line for take in script["takes"] for line in take["lines"]]
    count = len(lines)
    spacing = 3900
    center = (count - 1) * spacing / 2
    for index, line in enumerate(lines, 1):
        x = (index - 1) * spacing - center
        title = (line.get("typed") or line.get("hero") or f"SCENE {index}").strip()[:72]
        body = (line.get("text") or line.get("spoken") or "").strip()[:180]
        title_size = max(220, min(520, int(9500 / max(1, len(title)))))
        film.add(BigText(title.upper(), x, -1050, title_size, L(index) - 0.05,
                         rgb=(235, 222, 196), shadow=True, grunge=False, type_on=0.55))
        film.add(Card(x, 350, 3000, 1550, L(index) + 0.12, title=f"CHAPTER {index:02d}",
                      lines=[body] if body else [], accent=ACCENT, title_size=210, body_size=130))
        photo_key = f"P{index:02d}"
        if photo_key in doc.meta:
            film.add(Print(photo_key, x, -250, 2300, rot=0.0, t_in=L(index) - 0.12,
                           border=0.025, pin=False, paper=False))
        film.shot(0.0 if index == 1 else L(index) - 0.25, x, 100, 0.62)
        film.shot(E(index) - 0.05, x + 180, 180, 0.58)
    film.shot(film.duration, 0, 0, 0.24, radius=18000, strength=0.12)
    return film
'''

def _safe_title(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_ .-]", "", value).strip()[:120] or "Cinema King Film"

@app.get("/health")
def health() -> dict[str, Any]:
    missing = [str(p) for p in (SCRIPTS / "render.py", SCRIPTS / "tts_say.py", TEMPLATE / "script.json") if not p.is_file()]
    tools = {name: shutil.which(name) is not None for name in ("python3", "ffmpeg", "ffprobe", "espeak-ng", "say")}
    for name, module in (("skia-python", "skia"), ("numpy", "numpy"), ("pillow", "PIL")):
        try:
            __import__(module); tools[name] = True
        except Exception:
            tools[name] = False
    ready = not missing and all(tools.get(x, False) for x in ("ffmpeg", "ffprobe", "skia-python", "numpy", "pillow")) and (tools["espeak-ng"] or tools["say"])
    return {"ok": not missing, "ready": ready, "engine_files_missing": missing, "tools": tools}

@app.post("/api/render")
def render(request: RenderRequest, authorization: str | None = Header(default=None)) -> Response:
    expected = os.getenv("CINEMA_KING_RENDER_TOKEN", "").strip()
    if expected and authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="A valid render-service token is required.")
    if not (SCRIPTS / "render.py").is_file() or not TEMPLATE.is_dir():
        raise HTTPException(status_code=503, detail="Cinematic engine files are missing from this deployment.")
    if not (shutil.which("espeak-ng") or shutil.which("say")):
        raise HTTPException(status_code=503, detail="Install espeak-ng (Linux) or macOS say for scratch narration.")
    with tempfile.TemporaryDirectory(prefix="cinema-king-") as temp:
        project = Path(temp) / "project"
        shutil.copytree(TEMPLATE, project)
        for sub in ("assets/photos", "assets/prep", "audio/takes", "out", "fonts"):
            (project / sub).mkdir(parents=True, exist_ok=True)
        takes = []
        photo_specs = []
        for index, scene in enumerate(request.scenes, 1):
            narration = scene.narration.strip() or scene.title.strip() or f"Scene {index}"
            if scene.image:
                match = re.fullmatch(r"data:image/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)", scene.image)
                if not match:
                    raise HTTPException(status_code=422, detail=f"Scene {index}: image must be a JPEG, PNG or WebP data URL.")
                try:
                    raw = base64.b64decode(match.group(2), validate=True)
                    if len(raw) > 8 * 1024 * 1024:
                        raise HTTPException(status_code=413, detail=f"Scene {index}: image exceeds 8 MB.")
                    with Image.open(io.BytesIO(raw)) as source:
                        source.verify()
                    with Image.open(io.BytesIO(raw)) as source:
                        if source.width * source.height > 24_000_000:
                            raise HTTPException(status_code=413, detail=f"Scene {index}: image dimensions are too large.")
                        prepared = source.convert("RGB")
                        prepared.thumbnail((2400, 2400), Image.Resampling.LANCZOS)
                        photo_file = f"P{index:02d}.jpg"
                        prepared.save(project / "assets" / "photos" / photo_file, format="JPEG", quality=90, optimize=True)
                    photo_specs.append({"id": f"P{index:02d}", "file": photo_file, "kind": "photo"})
                except (binascii.Error, OSError, ValueError) as exc:
                    raise HTTPException(status_code=422, detail=f"Scene {index}: image could not be decoded.") from exc
            takes.append({"take": f"T{index:02d}_scene", "lines": [{
                "id": index, "text": narration, "spoken": narration,
                "hero": scene.title.strip() or f"Scene {index}",
                "typed": scene.title.strip() or f"SCENE {index:02d}", "gap_after": 0.65
            }]})
        script = {"title": _safe_title(request.title), "takes": takes, "fact_notes": []}
        (project / "script.json").write_text(json.dumps(script, ensure_ascii=False, indent=2), encoding="utf-8")
        (project / "scene.py").write_text(_scene_source(), encoding="utf-8")
        if photo_specs:
            (project / "photos.json").write_text(json.dumps({"grade": "natural", "photos": photo_specs}, indent=2), encoding="utf-8")
            _run(["python3", str(SCRIPTS / "prep_assets.py"), "--project", str(project), "--grade", "natural"], cwd=project, timeout=240)
        output = project / "out" / "cinema-king.mp4"
        test_mode = os.getenv("CINEMA_KING_RENDER_TEST_MODE") == "1"
        if test_mode:
            # Fast API-contract smoke test: produce a valid MP4 without invoking the
            # CPU-heavy Skia renderer. Production requests always use the full engine.
            _run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i",
                  "color=c=0x101522:s=320x180:r=6", "-t", "1",
                  "-vf", "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='Cinema King CI':fontcolor=white:fontsize=20:x=(w-text_w)/2:y=(h-text_h)/2",
                  "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                  str(output)], cwd=project, timeout=30)
        else:
            voice_args = ["--project", str(project)]
            if request.voice:
                voice_args += ["--voice", request.voice]
            elif shutil.which("espeak-ng"):
                voice_args += ["--voice", {"en": "en", "hi": "hi", "gu": "gu"}[request.language]]
            _run(["python3", str(SCRIPTS / "tts_say.py"), *voice_args], cwd=project)
            _run(["python3", str(SCRIPTS / "split_takes.py"), "--project", str(project)], cwd=project)
            _run(["python3", str(SCRIPTS / "build_narration.py"), "--project", str(project)], cwd=project)
            _run(["python3", str(SCRIPTS / "render.py"), "--project", str(project), "--size", request.size,
                  "--out", str(output), "--audio", "audio/narration.m4a"], cwd=project, timeout=1800)
        if not output.is_file() or output.stat().st_size < 1024:
            raise HTTPException(status_code=500, detail="Renderer finished without a valid MP4 file.")
        filename = _safe_title(request.title).replace(" ", "-") + ".mp4"
        return Response(content=output.read_bytes(), media_type="video/mp4",
                        headers={"Content-Disposition": f'attachment; filename="{filename}"'})
