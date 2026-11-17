"""End-to-end smoke test for a real cinematic MP4 render.

The CI workflow installs FFmpeg, espeak-ng and the engine's Python dependencies
before running this test. It exercises the same FastAPI endpoint used by the app.
"""
import unittest

from fastapi.testclient import TestClient

from render_service.server import app


class CinematicRenderSmokeTests(unittest.TestCase):
    def test_one_scene_returns_mp4(self):
        payload = {
            "title": "Cinema King CI Smoke Test",
            "language": "en",
            "size": "1280x720",
            "scenes": [
                {
                    "title": "A NEW BEGINNING",
                    "narration": "A short cinematic render verification.",
                    "duration": 3,
                }
            ],
        }
        with TestClient(app) as client:
            response = client.post("/api/render", json=payload)
        self.assertEqual(response.status_code, 200, response.text[:1500])
        self.assertTrue(response.headers.get("content-type", "").startswith("video/mp4"))
        self.assertGreater(len(response.content), 1024)
        self.assertEqual(response.content[:8], b"\x00\x00\x00\x18ftyp")


if __name__ == "__main__":
    unittest.main()
