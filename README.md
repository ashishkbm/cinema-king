# Cinema King — mobile-first film studio

Cinema King is a standalone web application packaged for Android with Capacitor. It is separate from Motion Explainer.

## Current app features

- Create and switch between film projects saved in browser local storage.
- Build a scene-by-scene storyboard with titles, narration and imported scene images.
- Preview scenes with cinematic styling and motion.
- Preview narration using speech voices installed in the browser/device.
- Export the current storyboard as a browser-rendered WebM video.
- Import and export project JSON.
- Offline shell caching for the core web application.

## Cinematic Film Engine integration

The original MIT-licensed `cinematic-film` skill is included under `cinematic-engine/cinematic-film/`. It uses Python, Skia and FFmpeg to create deterministic code-rendered films with a continuous camera, animated typography/cards, sound and synchronized narration.

The app's **Cinematic Engine · MP4** panel sends the current storyboard to a separate Python render service. That service creates a temporary project, generates scratch narration using the host's installed TTS voice, aligns scene timings, and invokes the original renderer.

The first integration renders scene titles and narration as cinematic animated typography/cards. Scene image uploads remain available in the browser editor but are not yet passed into the Python renderer. Final-quality multilingual voice packs, image-aware rendering, render queues and remote job progress are future improvements.

### Start the render service

Install Python 3.9+, FFmpeg/FFprobe, a system TTS voice (`espeak-ng` on Linux or macOS `say`), and the Python packages:

```bash
python3 -m pip install -r cinematic-engine/requirements.txt
python3 -m pip install -r render_service/requirements.txt
```

Run from the repository root:

```bash
npm run render:service
```

Check readiness at `http://127.0.0.1:8787/health`. Configure the render service URL in the editor. For an Android device, use a reachable HTTPS service URL; `127.0.0.1` on the phone points to the phone itself, not your computer.

For a network-accessible service, set `CINEMA_KING_RENDER_TOKEN` to a strong secret and `CINEMA_KING_ALLOWED_ORIGINS` to the exact web origins. Use HTTPS, authentication, quotas and an appropriate reverse proxy. Do not expose an unauthenticated render service publicly.

### Rendering limitations

- The Python/Skia engine runs on the render-service host, not inside Android WebView.
- Browser export is WebM; the separate cinematic service returns MP4.
- Scratch narration quality and language depend on installed host voices. Hindi and Gujarati voices are not bundled.
- The current adapter does not transfer scene image files into the cinematic project.
- The renderer is CPU/RAM intensive. Long videos may take several minutes or more.

## Run the web app

Node.js 22+:

```bash
npm install
npm run verify
npm test
npm run start
```

Open `http://localhost:5173`.

## Build Android

Install Android Studio, Android SDK and a compatible JDK:

```bash
npm install
npm run build
npx cap add android
npx cap sync android
```

Then build the debug APK in Android Studio or with `cd android && ./gradlew assembleDebug`. The repository's GitHub Actions workflow also builds a debug APK artifact. An APK or on-device test is not claimed until that workflow succeeds and the app is tested on a device.

## Source and attribution

The cinematic engine source is included under the upstream MIT license. See `cinematic-engine/LICENSE` and `cinematic-engine/README.upstream.md`.
