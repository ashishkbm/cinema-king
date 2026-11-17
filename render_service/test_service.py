import os
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from render_service.server import RenderRequest, _require_token, _scene_source, app


class RenderServiceTests(unittest.TestCase):
    def test_generated_scene_module_parses(self):
        compile(_scene_source(), "generated_scene.py", "exec")

    def test_scene_module_uses_photo_items(self):
        source = _scene_source()
        self.assertIn("from engine import BigText, Card, Film, Print", source)
        self.assertIn("film.add(Print(", source)

    def test_render_request_accepts_storyboard(self):
        request = RenderRequest(title="Test", scenes=[{"title": "Opening", "narration": "A test scene."}], language="en")
        self.assertEqual(len(request.scenes), 1)
        self.assertEqual(request.scenes[0].narration, "A test scene.")
        self.assertIsNone(request.scenes[0].image)
        self.assertEqual(request.look, "night")
        self.assertEqual(request.grade, "natural")

    def test_render_request_accepts_photo_data_url(self):
        image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w=="
        request = RenderRequest(title="Photo test", scenes=[{"title": "Photo", "image": image}])
        self.assertEqual(request.scenes[0].image, image)

    def test_render_request_accepts_style_and_full_hd(self):
        request = RenderRequest(title="Style test", scenes=[{"title": "Scene"}],
                                look="blueprint", grade="sepia", size="1080x1920")
        self.assertEqual(request.look, "blueprint")
        self.assertEqual(request.grade, "sepia")
        self.assertEqual(request.size, "1080x1920")

    def test_rejects_unsupported_language(self):
        with self.assertRaises(Exception):
            RenderRequest(title="Test", scenes=[{"title": "Opening"}], language="fr")

    def test_health_exposes_voice_and_limit_capabilities(self):
        with TestClient(app) as client:
            response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertIn("language_support", response.json())
        self.assertIn("max_total_images_bytes", response.json()["limits"])

    def test_voice_preview_rejects_empty_text_before_tts(self):
        with TestClient(app) as client:
            response = client.post("/api/voice-preview", json={"text": "  ", "language": "en"})
        self.assertEqual(response.status_code, 422)

    def test_render_token_is_enforced(self):
        with patch.dict(os.environ, {"CINEMA_KING_RENDER_TOKEN": "test-secret"}):
            with self.assertRaises(Exception):
                _require_token(None)
            _require_token("Bearer test-secret")


if __name__ == "__main__":
    unittest.main()
