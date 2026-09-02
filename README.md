# Roomly AI — AI Interior Design Studio

A polished responsive Next.js demo designed to be sold as a source-code/product asset.

## Included
- Responsive modern UI
- Room image upload + preview
- 20 interior styles
- 3 free styles; all Pro styles remain visible but locked
- 3 free generations
- 5 variants per generation
- Demo rendering flow using prepared images (no AI API cost)
- $9.99/month and $29.99/year pricing
- Payment toggle prepared via environment variable
- Clear separation point for production AI/billing integrations

## Run

```bash
npm install
npm run dev
```

Open the local URL shown by Next.js.

## Production handoff

Set:

```env
NEXT_PUBLIC_PAYMENTS_ENABLED=true
AI_PROVIDER=replicate
AI_API_KEY=...
DATABASE_URL=...
PAYMENT_SECRET=...
```

Then replace the demo generation in `app/page.tsx` with a server API route calling the selected image-generation provider.

### Suggested production routes

- `POST /api/generate` — upload image + style + room settings
- `GET /api/generations` — user history
- `POST /api/billing/checkout` — monthly/yearly checkout
- `POST /api/billing/webhook` — subscription events
- `POST /api/download` — signed HD output
- `/dashboard` — generation history
- `/settings` — account/preferences

### Important

The demo uses remote Unsplash images as visual placeholders. For a commercial product, replace them with licensed/generated assets and wire a real image-generation model.

Payment is deliberately disabled for the demo. The buyer can connect their own billing account later.
