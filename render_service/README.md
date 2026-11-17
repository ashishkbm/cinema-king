# Cinema King cinematic render service

This adapter runs the original Python/Skia `cinematic-film` renderer as a separate HTTP service. The browser and Capacitor app call it over HTTP; Python/Skia does not run inside Android WebView.

## Requirements

- Python 3.9+
- FFmpeg and FFprobe with H.264/AAC support
- `espeak-ng` on Linux or macOS `say` for scratch narration
- Python packages in `cinematic-engine/requirements.txt` and `render_service/requirements.txt`

Install from the repository root:

```bash
python3 -m pip install -r cinematic-engine/requirements.txt
python3 -m pip install -r render_service/requirements.txt
```

Start locally:

```bash
npm run render:service
```

Health check: `GET http://127.0.0.1:8787/health`. The app sends its storyboard to `POST /api/render`. The service creates a temporary project, generates scratch narration with an installed system voice, aligns timings and renders an MP4. Temporary files are removed after the response.

For any network-accessible deployment, set a strong `CINEMA_KING_RENDER_TOKEN` and configure `CINEMA_KING_ALLOWED_ORIGINS` to exact origins. Use HTTPS, authentication, request quotas and a reverse proxy. Do not expose an unauthenticated renderer publicly.

The language selector maps to installed host TTS voices; Hindi and Gujarati voice packs are not bundled. The first adapter renders titles and narration as animated typography/cards. Scene image uploads are not yet passed into the Python renderer. Long renders are CPU/RAM intensive.
