# Cinematic engine integration notes

- Upstream source: `Moh4696/cinematic-skill`, included under its MIT license.
- Browser/Capacitor UI: the editor posts its storyboard to `render_service.server`.
- Render backend: Python/Skia + FFmpeg, isolated from the WebView.
- The current adapter turns each scene into one narrated beat, uses host TTS for scratch voice timing, and renders animated title/card compositions.
- Existing browser preview and WebM export remain intact.
- Scene image transfer, final multilingual TTS selection, progress streaming, render queueing and Android-native file handoff are not implemented in this first integration.
- Run `python3 -m unittest render_service.test_service` for adapter tests.
- Check `GET /health` before attempting an MP4 render.
