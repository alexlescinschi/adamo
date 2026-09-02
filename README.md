# Adamo Vitrină — E-commerce Storefront

Next.js 16 + Tailwind CSS + shadcn/ui storefront connected to Adamo CRM.

## Features

- **Products** — fetched from CRM (popular, promotions, new, search)
- **Categories** — dynamic category pages with product grids
- **Cart** — localStorage-based cart with add/remove/update quantity
- **Checkout** — form creates orders in CRM directly
- **Customer Auth** — register/login via CRM e-commerce auth
- **Account** — order history from CRM
- **Content** — informational pages and blog from Sanity Studio
- **Payments** — IutePay configuration from CRM

## Architecture

- `src/app/api/*` — proxy API routes that authenticate with CRM using JWT
- `src/lib/crm-api.ts` — server-only CRM client with auto-login & token caching
- `src/hooks/use-cart.tsx` — React context for cart state in localStorage
- `studio/*` — standalone Sanity Studio for pages, blog and contact details

## Environment Variables

Copy `.env.local` and fill in your values:

```bash
CRM_API_URL=https://api.crm.adamo.md/v1
CRM_API_LOGIN=your_crm_login
CRM_API_PASSWORD=your_crm_password

SITE_URL=https://new.adamo.md
DEPLOY_ENV=staging
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production

# Optional Redis caching
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# BPay sandbox
BPAY_MERCHANT_ID=adamodev
BPAY_SECRET_KEY=
BPAY_GATEWAY_URL=https://pay.dev5.bpay.md/merchant

```

BPay requires `SITE_URL=https://adamo.md` for its public callback at
`/api/payments/bpay/callback`. BPay orders are created as local pickup orders
and remain in the CRM `Резерв` stage; no courier shipment is created.

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

See `DEPLOY.md` for the Contabo, systemd and Caddy setup.

## Notes

- CRM products must be published to storefront to appear on the site
- Customer auth uses CRM `/ecommerce/e-commerce-auth/*` endpoints
- Internal CRM auth (for API routes) auto-refreshes JWT every 12 minutes
