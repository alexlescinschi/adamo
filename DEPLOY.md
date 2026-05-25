# Deploy Adamo Vitrină

## Recomandare: Vercel (optim pentru Next.js)

1. Creează cont pe [vercel.com](https://vercel.com)
2. Instalează Vercel CLI: `npm i -g vercel`
3. Rulează în terminal din folderul proiectului:
   ```bash
   vercel
   ```
4. Adaugă variabilele de mediu în dashboard-ul Vercel:
   - `CRM_API_URL` = `https://api.crm.adamo.md/v1`
   - `CRM_API_LOGIN` = `Serghei`
   - `CRM_API_PASSWORD` = `Adamocrm2026`
   - `UPSTASH_REDIS_REST_URL` (opțional)
   - `UPSTASH_REDIS_REST_TOKEN` (opțional)
   - `MAIB_API_KEY` (când primești de la maib)
   - `MAIB_MERCHANT_ID` (când primești de la maib)

## Alternativă: Netlify

1. Creează cont pe [netlify.com](https://netlify.com)
2. Conectează repository-ul Git
3. Setează variabilele de mediu în Site settings → Environment variables

## Build local

```bash
npm run build
npm start
```
