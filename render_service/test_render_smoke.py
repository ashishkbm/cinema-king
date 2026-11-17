"""End-to-end smoke test for a real cinematic MP4 render."""
import base64
import io
import unittest
from PIL import Image
from fastapi.testclient import TestClient
from render_service.server import app


class CinematicRenderSmokeTests(unittest.TestCase):
    def test_one_scene_returns_mp4(self):
        photo = Image.new("RGB", (64, 64), (190, 120, 65))
        buffer = io.BytesIO()
        photo.save(buffer, format="JPEG")
        photo_url = "data:image/jpeg;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")
        payload = {
            "title": "Cinema King CI Smoke Test",
            "language": "en",
            "size": "1280x720",
            "look": "studio",
            "grade": "natural",
            "scenes": [{"title": "A NEW BEGINNING",
                        "narration": "A short cinematic render verification.",
                        "duration": 3,
                        "image": photo_url}],
        }
        with TestClient(app) as client:
            response = client.post("/api/render", json=payload)
        self.assertEqual(response.status_code, 200, response.text[:1500])
        self.assertTrue(response.headers.get("content-type", "").startswith("video/mp4"))
        self.assertGreater(len(response.content), 1024)
        self.assertEqual(response.content[4:8], b"ftyp")


if __name__ == "__main__":
    unittest.main()
