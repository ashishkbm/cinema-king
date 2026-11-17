# Cinema King — mobile-first AI film studio

Cinema King is a standalone, offline-first storyboard and video creation app for Android and web. Android is packaged with Capacitor. It is separate from Motion Explainer.

## App features

- Multiple film projects, autosaved locally on the device; large storyboard photos are stored in IndexedDB to avoid the browser localStorage quota.
- Storyboard scenes with titles, narration, duration and imported photos.
- Cinematic scene preview with image motion, title treatment and project import/export.
- Browser/device speech preview when a speech voice is available, with server-side voice preview fallback.
- Local browser video export (WebM) using the device canvas recorder.
- Remote cinematic MP4 rendering through the Python/Skia engine.
- Seven cinematic looks (night, wall, slate, charcoal, paper, studio, blueprint), natural/B&W/sepia photo grades, and landscape/portrait 720p, square 1080 and full-HD landscape/portrait output presets.
- English, Hindi and Gujarati language selection; actual voices depend on the render host's installed TTS engines and language data.
- Render server health check, remote voice preview, and clear connection diagnostics.
- Image optimization before storage/upload; JPEG/PNG/WebP source photos are sent to the renderer as optimized JPEG.
- Offline shell caching for the core editor.

## Important architecture

The Android app does not run Python/Skia inside WebView. It runs the editor locally and calls a separate render service over HTTPS for cinematic MP4 generation. The render service imports storyboard photos, prepares them with the cinematic-film asset pipeline, creates scratch narration with a local TTS engine, aligns scene timing and invokes the original Skia/FFmpeg renderer. The browser-only export remains WebM and is a separate lightweight path.

## Run the app

Requires Node.js 22+.

```bash
npm install
npm run verify
npm test
npm run start
```

Open http://localhost:5173.

## Run the cinematic render service locally

Requires Python 3.11+, FFmpeg/FFprobe, Skia's system graphics libraries and a TTS engine. On Debian/Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y ffmpeg espeak-ng libegl1 libgl1 libgles2 fonts-dejavu-core
python3 -m pip install -r cinematic-engine/requirements.txt
python3 -m pip install -r render_service/requirements.txt
npm run render:service
```

The service listens on 0.0.0.0:8787. Check http://127.0.0.1:8787/health from the host. Do not enter 127.0.0.1 in the phone app unless the service is running on the phone itself. For Android, deploy the service to a host with a public HTTPS URL, then enter that URL in the Cinematic Engine panel and tap **Check server connection**.

### Docker deployment

Build from the repository root:

```bash
docker build -f render_service/Dockerfile -t cinema-king-renderer .
docker run --rm -p 8787:8787 -e CINEMA_KING_RENDER_TOKEN="replace-with-a-long-random-secret" -e CINEMA_KING_ALLOWED_ORIGINS="capacitor://localhost,https://your-web-origin.example" cinema-king-renderer
```

Put the container behind an HTTPS reverse proxy before connecting a phone. Keep the token secret. Configure exact web origins in CINEMA_KING_ALLOWED_ORIGINS. Do not expose the service publicly without TLS, authentication, rate limits and resource limits. The container is stateless and uses temporary working folders; generated videos are returned directly to the caller.

## Voice support

- The renderer uses espeak-ng on Linux or macOS say for scratch narration.
- The server exposes /api/voice-preview so the Android app can preview a server-side voice when device speech synthesis is unavailable.
- English, Hindi and Gujarati are selectable, but language quality and availability are not guaranteed by the selector alone. Install the relevant voice data on the render host and verify it using the server health endpoint.
- For natural multilingual narration, connect a compatible high-quality TTS command through the upstream engine's `--cmd` support or extend the service with a chosen TTS provider. No paid provider or API key is bundled.

## Render limits and security

- Up to 80 storyboard scenes.
- Each uploaded photo is limited to 8 MB after client-side optimization; combined photos are limited to 25 MB per render request.
- Server-side image decoding, dimensions and formats are validated.
- A strong CINEMA_KING_RENDER_TOKEN is supported for render and voice-preview endpoints.
- Long/high-resolution renders are CPU/RAM intensive and can take several minutes. Hosting needs sufficient memory, CPU, disk and request timeouts.
- The GitHub Actions MP4 smoke test uses a tiny FFmpeg-generated sample to verify API delivery. It does **not** count as proof that a full Skia cinematic render has completed successfully.

## Build Android

Install Android Studio, Android SDK and a compatible JDK:

```bash
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
```

GitHub Actions also builds a debug APK artifact. Successful CI packaging is not a substitute for installing and testing on a physical device.

## Source and attribution

The cinematic engine source is included under its upstream MIT license. See cinematic-engine/LICENSE and cinematic-engine/README.upstream.md.


### Docker Compose deployment

Copy `render_service/.env.example` to `.env` in the repository root. Set a long random `CINEMA_KING_RENDER_TOKEN` and the exact allowed origins. Run `docker compose up -d --build`. The compose file binds the service to host loopback so an HTTPS reverse proxy on the same server can forward requests to it. Do not expose port 8787 directly to the public internet.
