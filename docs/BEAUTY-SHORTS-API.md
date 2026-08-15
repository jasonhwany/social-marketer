# Beauty Shorts API

Goal: turn a Coupang affiliate product URL + reusable character/product reference images into a curiosity-first vertical Seedance video task.

## Workflow

1. Chat/client sends product URL and reference image URLs.
2. `POST /api/beauty-video` builds the brand-obscured beauty UGC prompt.
3. Provider adapter submits a Seedance task to PiAPI.
4. Client polls `GET /api/beauty-video/:taskId` until completion.
5. The returned provider result contains the generated video output when ready.

The provider is intentionally isolated under `src/lib/video-providers/`. A future BytePlus, fal.ai, Kling, Wan, Hailuo, or Seedance 2.5 adapter can be added without changing the public API.

## Environment

```bash
PIAPI_API_KEY=
PIAPI_BASE_URL=https://api.piapi.ai
PIAPI_SEEDANCE_MODEL=seedance-2.0-fast
```

Before production, confirm the current PiAPI Seedance model identifier and request schema against the provider dashboard/docs; those provider-specific values are isolated in `src/lib/video-providers/piapi.ts` for this reason.

## Create request

```json
{
  "productUrl": "https://link.coupang.com/a/example",
  "productName": "lipstick",
  "productCategory": "lip color",
  "characterImageUrls": ["https://your-storage.example/yura-beauty-closeup.jpg"],
  "productImageUrls": ["https://your-storage.example/product.jpg"],
  "duration": 10,
  "resolution": "480p",
  "aspectRatio": "9:16"
}
```

Start with 480p for inexpensive concept validation. Generate 720p only after the creative direction is proven.

## Creative invariant

The prompt builder always optimizes for curiosity and profile clicks rather than product recognition. Brand/logo/package text must not be readable; product appearances should be brief, partial, cropped, obscured, or out of focus.

## Next production steps

- Store a reusable YURA master reference set in durable object storage.
- Add a product-ingestion module that resolves permitted product metadata/images from a URL or accepts an uploaded screenshot when automated retrieval is unavailable.
- Add a provider router and cost table so the cheapest acceptable model can be selected automatically.
- Add callback/webhook handling or background polling.
- Add an authenticated tool endpoint/OpenAPI surface for ChatGPT/app integration.
- Add optional scene splitting (for example 6s application + 6s reveal) so only failed scenes need regeneration.
