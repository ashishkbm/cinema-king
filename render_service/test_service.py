import unittest
from render_service.server import RenderRequest, Scene, _scene_source


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

    def test_render_request_accepts_photo_data_url(self):
        image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w=="
        request = RenderRequest(title="Photo test", scenes=[{"title": "Photo", "image": image}])
        self.assertEqual(request.scenes[0].image, image)

    def test_rejects_unsupported_language(self):
        with self.assertRaises(Exception):
            RenderRequest(title="Test", scenes=[{"title": "Opening"}], language="fr")


if __name__ == "__main__":
    unittest.main()
