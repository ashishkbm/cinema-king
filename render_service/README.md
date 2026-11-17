# Cinema King cinematic render service

This FastAPI service runs the original Python/Skia cinematic-film renderer outside Android WebView. The Android/web editor calls it over HTTPS for MP4 output.

## Install on Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install -y ffmpeg espeak-ng libegl1 libgl1 libgles2 fonts-dejavu-core
python3 -m pip install -r cinematic-engine/requirements.txt
python3 -m pip install -r render_service/requirements.txt
npm run render:service
```

The server listens on 0.0.0.0:8787. Check `GET /health`. The health response reports missing tools, installed espeak-ng language voices and image/request limits.

## Docker

Build from the repository root:

```bash
docker build -f render_service/Dockerfile -t cinema-king-renderer .
docker run --rm -p 8787:8787 -e CINEMA_KING_RENDER_TOKEN="use-a-long-random-secret" -e CINEMA_KING_ALLOWED_ORIGINS="capacitor://localhost,https://your-web-origin.example" cinema-king-renderer
```

Place the container behind an HTTPS reverse proxy before connecting an Android phone. Enter the public HTTPS URL and the same token in the app. Never expose an unauthenticated render service directly to the internet.

## Endpoints

- `GET /health`: readiness, installed tools, voice-language availability and upload limits.
- `POST /api/voice-preview`: generate a short WAV preview with the host TTS engine.
- `POST /api/render`: accept a storyboard and return an MP4.

Both POST endpoints enforce `CINEMA_KING_RENDER_TOKEN` when configured. Set exact browser origins in `CINEMA_KING_ALLOWED_ORIGINS`.

## Storyboard payload and limits

- Up to 80 scenes.
- JPEG, PNG or WebP photos; client optimizes images to JPEG before upload.
- 8 MB per image and 25 MB combined photo payload.
- Image decode and pixel dimensions are validated before the cinematic engine receives files.
- Landscape 1280x720, portrait 720x1280 and square 1080x1080.

The renderer prepares photos through `prep_assets.py`, adds photo-print objects to the film, creates scratch narration and aligns it with scene timing. TTS language availability depends on installed host voice data. The UI's language selector does not install voices automatically.

## Operational notes

The renderer is CPU/RAM intensive. Start with short films and 720p output. Use a host with enough memory and configure reverse-proxy request timeouts for long jobs. This version renders synchronously and returns the MP4 in the response; it does not yet provide a persistent render queue, resumable jobs or cloud storage. Temporary projects are deleted after each request.
