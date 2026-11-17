import unittest
from render_service.server import RenderRequest, _scene_source

class RenderServiceTests(unittest.TestCase):
    def test_generated_scene_module_parses(self):
        compile(_scene_source(), "generated_scene.py", "exec")

    def test_render_request_accepts_storyboard(self):
        request = RenderRequest(title="Test", scenes=[{"title": "Opening", "narration": "A test scene."}], language="en")
        self.assertEqual(len(request.scenes), 1)
        self.assertEqual(request.scenes[0].narration, "A test scene.")

    def test_rejects_unsupported_language(self):
        with self.assertRaises(Exception):
            RenderRequest(title="Test", scenes=[{"title": "Opening"}], language="fr")

if __name__ == "__main__":
    unittest.main()
