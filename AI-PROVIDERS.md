# AI provider setup

Cinema King's AI storyboard feature calls POST {baseUrl}/chat/completions using an OpenAI-compatible chat-completions schema. Scene still generation calls POST {baseUrl}/images/generations and expects data[0].b64_json or a CORS-readable data[0].url.

Required configuration:
- API base URL, without trailing slash
- Chat model identifier
- Image model identifier
- API key, if required

The browser makes requests directly. The endpoint must allow CORS from the Cinema King origin. Do not expose a production secret key in a public web deployment. For a public release, proxy API requests through a secured backend with authentication, quotas and abuse controls.

There is no universal AI video-generation API shape. Add a provider-specific adapter for authentication, job creation, polling, errors, output download and billing.
