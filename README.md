# Adamo Vitrină — E-commerce Storefront

Next.js 16 + Tailwind CSS + shadcn/ui storefront connected to Adamo CRM.

## Features

- **Products** — fetched from CRM (popular, promotions, new, search)
- **Categories** — dynamic category pages with product grids
- **Cart** — localStorage-based cart with add/remove/update quantity
- **Checkout** — form creates orders in CRM directly
- **Customer Auth** — register/login via CRM e-commerce auth
- **Account** — order history from CRM
- **maib merchants** — payment integration structure ready

## Architecture

- `src/app/api/*` — proxy API routes that authenticate with CRM using JWT
- `src/lib/crm-api.ts` — server-only CRM client with auto-login & token caching
- `src/hooks/use-cart.tsx` — React context for cart state in localStorage

## Environment Variables

Copy `.env.local` and fill in your values:

```bash
CRM_API_URL=https://api.crm.adamo.md/v1
CRM_API_LOGIN=your_crm_login
CRM_API_PASSWORD=your_crm_password

# Optional Redis caching
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# maib merchants (required for online payments)
MAIB_API_URL=https://api.maibmerchants.md/v1
MAIB_MERCHANT_ID=
MAIB_API_KEY=
MAIB_WEBHOOK_SECRET=
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Deploy

See `DEPLOY.md` for Vercel/Netlify instructions.

## Notes

- CRM products must be published to storefront to appear on the site
- Customer auth uses CRM `/ecommerce/e-commerce-auth/*` endpoints
- Internal CRM auth (for API routes) auto-refreshes JWT every 12 minutes
