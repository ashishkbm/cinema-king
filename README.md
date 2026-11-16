# Cinema King — Standalone Full Video Studio

Cinema King is an independent mobile-first filmmaking application based on the supplied `cinematic-film` skill. It is not a Motion Explainer fork.

## Included studio features
- Multiple projects saved locally in IndexedDB, with a project switcher.
- Import photos, video files and audio files into the local media bin.
- Three-track timeline: video, text/graphics and audio; seek, playhead, zoom and duration ruler.
- Clip inspector: rename, start time, duration, duplicate, delete and split at playhead.
- Scene controls: image fit, cinematic/monochrome/vintage/bright/cool looks, slow zoom/pan motion and fade/cut transition selection.
- Editable title cards, lower thirds and captions.
- Audio clips with volume and fade controls.
- Speech synthesis preview through installed device/browser voices.
- Subtitle SRT export from scene narration.
- Aspect ratios 16:9, 9:16, 1:1 and 4:5.
- Browser WebM rendering with optional audio mixing where MediaRecorder supports it.
- Optional Android native bridge source for H.264 MP4 video encoding, Gallery saving and Android TextToSpeech audio-file generation.
- Offline app shell caching.
- The original uploaded Skia/Python cinematic-film skill remains included under `cinematic-engine/cinematic-film/`.

## AI Studio
AI Studio can generate a script/storyboard and generate still images for selected scenes through an OpenAI-compatible API. Configure the API base URL, chat model, image model and key in Settings. The API key is stored locally and sent to the configured endpoint. Provider charges, rate limits, CORS restrictions and model availability apply. AI video generation is not included yet; provider-specific adapters are required.

## Voiceover and language support
Browser speech preview uses installed device voices. Android native TextToSpeech can generate WAV files using installed voice data. Hindi (`hi-IN`), Gujarati (`gu-IN`) and English variants are selectable, subject to installed language data. Cinema King does not bundle proprietary voice packs.

## Export formats and limitations
Browser mode exports WebM using Canvas + MediaRecorder. The Android native bridge includes MediaCodec H.264 MP4 encoding and Gallery saving, but native audio-track muxing is not implemented; native MP4 is currently silent. The native bridge has not yet been compiled or device-tested. Video decode depends on Android WebView codec support.

## Run in browser
Node.js 22+:
```bash
npm install
npm run start
npm run build
```

## Build Android
Install Android Studio, Android SDK and a compatible JDK:
```bash
npm install
npm run build
npx cap add android
bash android-setup/setup-android-native.sh
npx cap sync android
```
Then build the debug APK in Android Studio or run `cd android && ./gradlew assembleDebug`.

No APK build or on-device test is claimed until the Android toolchain is available and the build is verified.

## Included rendering engine
`cinematic-engine/cinematic-film/` contains the original skill, templates, Python scripts and references. It is a desktop/server renderer requiring Python, Skia, NumPy, Pillow and FFmpeg; it is not yet ported into the Android WebView.

## Next engineering tasks
- Compile and test the native bridge; implement audio-track muxing.
- Add provider-specific AI video adapters.
- Port the Skia renderer or connect it to a local rendering service.
- Add keyframe curves, proxies, colour scopes, compositing and transitions.
