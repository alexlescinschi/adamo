# Audit Adamo Vitrină — Probleme identificate & Soluții

> Document de orientare creat în urma auditului global al proiectului (Next.js 16 + CRM).
> Ordinea = prioritate. Bifează (`- [x]`) pe măsură ce rezolvi.

---

## 🔴 CRITIC

### [x] 1. Checkout trimite `payment_method: "ONLINE"` pentru „Plată la livrare" (CASH)

**Fișier:** `src/app/[locale]/checkout/page.tsx:115`

**Problema:** Pe UI, pentru INDIVIDUAL, singura variantă activă e „Plată la livrare" (`payMode === "CASH"`); „Achitare online" e `disabled` (coming soon). Totuși, pentru TOATE comenzile individuale, CRM-ul primește `payment_method: "ONLINE"`. Consecințe:
- CRM-ul poate marca comanda ca „așteaptă plată online" care nu vine niciodată.
- Pentru livrare curier, AWB-ul se creează cu ramburs corect (`cod: total`), dar semnalul către CRM e greșit.
- Pentru pickup cu cash, situația e și mai contradictorie.

**Soluție:** Introduce un al treilea mod și îl sincronizează cu CRM:

```ts
// 1. Verifică cu echipa CRM ce valori acceptă /ecommerce/checkout/orders
//    pentru payment_method. Probabil: "ONLINE" | "BANK_TRANSFER" | "CASH_ON_DELIVERY"
// 2. Modifică payload-ul în checkout/page.tsx:
const paymentMethod =
  payMode === "BANK_TRANSFER" ? "BANK_TRANSFER"
  : payMode === "CASH"        ? "CASH_ON_DELIVERY"  // sau valoarea confirmată de CRM
  : "ONLINE";

// 3. Actualizează CheckoutPayload în src/lib/crm-api.ts (linia 107):
payment_method: "ONLINE" | "BANK_TRANSFER" | "CASH_ON_DELIVERY";
```

---

### [ ] 2. TTL token CRM: 12 ORE vs. documentație 12 minute

**Fișiere:** `src/lib/crm-api.ts:31`, `README.md:63`

**Problema:**
```ts
{ revalidate: 12 * 60 * 60 }   // = 43200s = 12 ORE
```
README spune „auto-refresh JWT every 12 minutes". Dacă `expiresIn` de la CRM e sub 12h, toate requestele după expirare pică cu 401 până la revalidarea cache-ului.

**Soluție:**
1. Verifică TTL-ul real al token-ului CRM (interoghează `/auth/login` și citește `expiresIn`).
2. Aliniază `revalidate` la **~80% din TTL-ul real**, ca să se reînnoiască înainte de expirare:
```ts
{ revalidate: 10 * 60 }  // dacă token-ul trăiește 15 min
```
3. Sau, mai robust: ia `expiresIn` din răspunsul de login și stochează-l împreună cu token-ul; re-fetch când `Date.now() >= expiresAt - delta`.

---

### [ ] 3. Google OAuth fără verificare obligatorie a `aud`

**Fișier:** `src/app/api/auth/google/route.ts:29`

**Problema:**
```ts
if (GOOGLE_CLIENT_ID && payload.aud !== GOOGLE_CLIENT_ID) { ... }
```
Dacă env var lipsește, **orice** `aud` e acceptat. Un token Google emis pentru altă aplicație = login valid.

**Soluție:**
```ts
if (!GOOGLE_CLIENT_ID) {
  // În producție, config incomplet → refuză, nu ocoli
  return NextResponse.json({ error: "Google auth not configured" }, { status: 503 });
}
if (payload.aud !== GOOGLE_CLIENT_ID) {
  return NextResponse.json({ error: "Token audience mismatch" }, { status: 401 });
}
// Bonus: verifică payload.iss === "https://accounts.google.com"
//        și payload.exp > Date.now()/1000 (tokeninfo o face deja, dar confirmă)
```

---

### [ ] 4. Secret JWT cu fallback public hardcodat

**Fișiere:** `src/app/api/auth/google/route.ts:5`, `src/app/api/account/me/route.ts:5`

**Problema:**
```ts
const JWT_SECRET = process.env.GOOGLE_JWT_SECRET || "adamo-google-jwt-fallback";
```
Dacă lipsește în producție, semnătura se calculează cu un secret cunoscut → JWT-uri `googleAccessToken` forjabile.

**Soluție:**
```ts
const JWT_SECRET = process.env.GOOGLE_JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("GOOGLE_JWT_SECRET must be set");
}
```
Verifică că e setat pe Vercel/Netlify în toate mediile. Adaugă-l în checklist-ul DEPLOY.md.

---

### [ ] 5. Conturile Google nu se leagă de contul CRM

**Fișiere:** `src/app/api/auth/google/route.ts`, `src/app/api/account/orders/route.ts`

**Problema:** `/api/auth/google` emite doar un JWT intern `{ email, name }`, fără id-client CRM. `/api/account/orders` folosește `ecommerceAccessToken`. Un utilizator autentificat prin Google **nu poate vedea comenzile** plasate.

**Soluție (alege una):**
- **A.** La Google login, caută clientul în CRM după email; dacă există, obține `ecommerceAccessToken` pentru el și setează ambele cookies. Dacă nu există, creează client CRM la fel ca la register.
- **B.** Dacă CRM-ul nu suportă acest flux, ascunde butonul Google până la integrare completă (mai sigur decât un login „mort").

---

## 🟠 RIDICAT (UX / securitate)

### [ ] 6. Locale switcher nu persistă limba în cookie

**Fișier:** `src/components/locale-switcher.tsx:53`

**Problema:** Doar `router.push`, fără să seteze `NEXT_LOCALE`. Middleware-ul citește cookie-ul la redirect pe root → limba se resetează la `Accept-Language` la prima navigare internă.

**Soluție:**
```ts
onClick={() => {
  setOpen(false);
  document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=${60*60*24*365}; samesite=lax`;
  router.push(hrefFor(code));
  router.refresh();
}}
```

---

### [ ] 7. Link-uri interne pierd prefixul de locale

**Problema:** Componentele folosesc `<Link href="/product/...">`, `/checkout`, `/cart` etc. **fără** `/${locale}`. Middleware-ul le redirectează, dar folosind `getPreferredLocale` → utilizator pe `/en` care dă click pe produs ajunge pe `/ro/product/...`.

**Fișiere afectate:**
- `src/components/product-card.tsx:30` (`href`)
- `src/components/cart-drawer.tsx:66`, `:116`
- `src/app/[locale]/cart/page.tsx:41`, `:80`
- `src/app/[locale]/checkout/page.tsx:80`, `:194`
- `src/app/[locale]/account/page.tsx:42`, `:55`
- `src/app/[locale]/favorites/page.tsx:17`
- `src/app/[locale]/login/page.tsx:122` (link register)
- `src/components/product-info.tsx:22`
- `src/app/[locale]/account/orders/page.tsx:21,51,68` (router.push fără locale)

**Soluție:** Creează un helper și folosește-l peste tot:
```ts
// src/lib/locale.ts
export function localeHref(locale: string, path: string) {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}
```
Apoi în componente client există deja `useParams()`. Pentru componente, obține `locale` și prefixează. Alternativ, setează `NEXT_LOCALE` cookie (vezi #6) + elimină `getPreferredLocale` din redirect și păstrează limba curentă.

> ⚠️ Verifică și redirect-urile `router.push("/login")`, `router.push("/account")` din paginile de auth/account — duc la schimbarea limbii.

---

### [ ] 8. `dynamic = "force-dynamic"` ignorat pe componente client

**Fișier:** `src/app/[locale]/account/orders/page.tsx:1-3`

**Problema:**
```ts
"use client";
export const dynamic = "force-dynamic";  // no-op pe client component
```
Config de segment merge doar pe server components.

**Soluție:** Mută `export const dynamic = "force-dynamic"` într-un layout sau page server component părinte, sau șterge-l (este inutil aici).

---

### [ ] 9. `generateStaticParams` + `force-dynamic` contradictorii

**Fișier:** `src/app/[locale]/product/[id]/page.tsx:9` + `:11`

**Problema:** `force-dynamic` anulează pre-generarea statică, deci `generateStaticParams` e moartă. În plus, `generateStaticParams` face fetch direct la `api.crm.adamo.md` ocolind `crmFetch` (fără auth, fără cache) — dacă endpoint-ul cere token, returnează `[]` silențios.

**Soluție:** Alege una:
- **A.** Vrei SSR dinamic → șterge `generateStaticParams`, păstrează `force-dynamic`.
- **B.** Vrei ISR/SSG → șterge `force-dynamic`, lasă `generateStaticParams`, dar mută fetch-ul prin `crmFetch` (sau `getPublishedProducts`) ca să aibă auth + cache.

---

### [ ] 10. Webhook MAIB: `timingSafeEqual` greșit + validare ocolită

**Fișier:** `src/app/api/webhooks/maib/route.ts:13` și `:24`

**Problema A (comparație greșită):**
```ts
crypto.timingSafeEqual(
  Buffer.from(expected, "hex"),     // 32 bytes
  Buffer.from(signature, "utf8")    // signature client e hex-string → interpretat utf8
);
```
Dacă signature-ul de la MAIB e hex, a 2-a conversie e din `"utf8"` și produce bytes greșiți ⇒ comparație permanent falsă sau aruncare pe diferență de lungime (în try/catch → `false`). Validarea probabil **nu trece niciodată corect**.

**Problema B (secret opțional):**
```ts
if (MAIB_WEBHOOK_SECRET) { ... }
```
Dacă lipsește env var, **validarea e complet omorâtă** → oricine poate trimite webhook-uri și marca comenzi `PAID`.

**Soluție:**
```ts
const MAIB_WEBHOOK_SECRET = process.env.MAIB_WEBHOOK_SECRET;
if (!MAIB_WEBHOOK_SECRET) {
  // Nu accepta webhooks fără secret
  return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
}

// Confirmă cu MAIB ce header de semnătură folosesc și ce format (hex/base64).
function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");  // presupunând hex; confirmă cu MAIB
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
```

---

### [ ] 11. Webhook MAIB marchează `PAID` fără reconciliere

**Fișier:** `src/app/api/webhooks/maib/route.ts:35-44`

**Problema:** Ia `orderId` direct din body și face PATCH fără a verifica că acea comandă a avut o plată inițiată. Combinat cu #10, o comandă BANK_TRANSFER/CASH ar putea fi forțată la `PAID`.

**Soluție:**
1. Stochează `payId` la inițierea plății (legat de `orderId`) în CRM sau Redis.
2. În webhook, verifică că `payId` aparține într-adevăr acelui `orderId` și că status-ul anterior era „pending online".
3. Opțional: interoghează `getPaymentInfo(payId)` ca sursă secundară de adevăr înainte de PATCH.

---

### [ ] 12. AWB-ul se pierde tăcut la eșec

**Fișier:** `src/app/[locale]/checkout/page.tsx:148-172`

**Problema:** Dacă `createOrder` reușește dar `/api/fancourier/awb` pică, `catch {}` înghițe eroarea → comandă în CRM fără AWB, fără log vizibil pentru operator.

**Soluție:**
- Cel puțin loghează eroarea (`console.error("[checkout] AWB failed for order", orderId, err)`).
- Ideal: marchează în CRM (comment / flag) că AWB-ul trebuie generat manual, sau pune-l într-o coadă de retry.

---

## 🟡 MEDIU

### [ ] 13. `vercel.json` cron vs. comentariu inconsistent

**Fișiere:** `vercel.json:8` (`0 4 * * *` = zilnic 4AM), `src/app/api/cron/revalidate/route.ts:6` (comentariu: „every 5 minutes")

**Problema:** Homepage-ul are `force-dynamic`, deci revalidarea explicită e discutabilă. Docs contrazic realitatea.

**Soluție:**
- Dacă vrei cache: scoate `force-dynamic` de pe home, setează `revalidate`, păstrează cron la o frecvență realistă (ex. orar).
- Dacă vrei mereu proaspăt: șterge cron-ul (e inutil cu `force-dynamic`).
- Actualizează comentariul să reflecte `vercel.json`.

---

### [ ] 14. `next.config.ts` — `remotePatterns: hostname: "**"`

**Fișier:** `next.config.ts:5-9`

**Problema:** Permite `next/image` să optimizeze imagini de pe **orice** hostname → risc SSRF/proxy arbitrar + procesare CPU necontrolată.

**Soluție:**
```ts
remotePatterns: [
  { protocol: "https", hostname: "api.crm.adamo.md" },
  { protocol: "https", hostname: "adamo.md" },
  { protocol: "https", hostname: "*.adamo.md" },
  // adaugă orice CDN/CDN-uri de imagini folosite efectiv
],
```

---

### [ ] 15. Stock nelimitat în cart pe paginile de categorie

**Fișiere:** `src/app/[locale]/category/[slug]/page.tsx:18`, `src/app/[locale]/minipc/page.tsx:19` (`stock: 0`), `src/hooks/use-cart.tsx:48,55,74` (`stock || 99`)

**Problema:** Pe categorii `stock` e forțat `0` → `use-cart` îl tratează ca `99`. Utilizatorul poate adăuga 99 bucăți indiferent de stocul real. Limita corectă vine doar din pagina de produs (`product-info.tsx` trimite `units_total`).

**Soluție:** `extractBase` deja e urmat de `enrichWithSpecs` care apelează `getProductById` și setează `stock` corect prin `enrichStock`. Verifică că `stock` ajunge efectiv în `ProductCard.addItem(..., stock: product.stock)`. Dacă nu se propague, forțează-l în obiectul final.

---

### [ ] 16. Favoritele afișează preț stale

**Fișier:** `src/hooks/use-favorites.tsx` + `src/app/[locale]/favorites/page.tsx`

**Problema:** Favoritele stochează doar `{ product_id, name, price, image_url }` în localStorage. La redeschidere, prețul afișat e cel vechi, fără revalidare contra CRM.

**Soluție:** Pe pagina favorites, fetch one-shot `/api/products?id=...` pentru favorite și suprascrie prețul/numele cu date proaspete; păstrează doar `product_id`-urile ca sursă de adevăr.

---

### [ ] 17. Search fără sanitizare ca cheie Redis

**Fișier:** `src/app/api/search/route.ts:16`

**Problema:** `cacheKey = search:${q}:...` — `q` nelimitat ca lungime sau normalizare → chei Redis uriașe / posibila poluare memorie.

**Soluție:**
```ts
const q = (searchParams.get("q") || "").trim().slice(0, 100);
const cacheKey = `search:${q.toLowerCase()}:${locale}:${limit}`;
```

---

### [ ] 18. Contacte create cu telefon gol

**Fișiere:** `src/app/api/auth/google/route.ts:38`, `src/app/api/auth/register/route.ts:23`

**Problema:** Telefoane goale trimise la CRM. Dacă `phone` e NOT NULL în CRM, eroarea e înghițită tăcut.

**Soluție:** Trimite `phone` doar dacă e ne-gol, sau cere telefon la Google signup.

---

## 🔵 CODE QUALITY / MENTENABILITATE

### [ ] 19. Elimină `any`-urile masive

`extractBase`, `transformProduct`, `ProductInfoProps`, stările din checkout (`any[]`), etc. Definește tipuri CRM în `src/lib/types.ts` și folosește-le.

### [ ] 20. De-duplică transformările de produse

Logica `extractBase`/`enrichWithSpecs`/`enrichPrice`/`enrichStock` e **identică** în:
- `src/app/[locale]/category/[slug]/page.tsx`
- `src/app/[locale]/minipc/page.tsx`

Și `extractProducts`/`extractSpecs` sunt duplicate între:
- `src/app/[locale]/page.tsx` (home)
- `src/app/api/products/route.ts`
- `src/app/api/search/route.ts`
- `src/app/api/products/[id]/route.ts`

**Soluție:** Creează `src/lib/transform.ts` cu funcții unice.

### [ ] 21. Endpoint hardcodat în `generateStaticParams`

**Fișier:** `src/app/[locale]/product/[id]/page.tsx:13` — fetch direct la `api.crm.adamo.md` ocolind `crmFetch`. Mută prin `getPublishedProducts` sau `crmFetch`.

### [ ] 22. PII în log-uri

**Fișier:** `src/app/api/checkout/route.ts:30` — `console.log("[checkout] payload to CRM:", ...)` loghează telefon, email, adresă. Șterge sau redactează în producție.

### [ ] 23. Endpoint-uri de debug expuse

**Fișiere:** `src/app/api/debug-env/route.ts`, `src/app/api/test-999/route.ts` — scurg config (lungimi chei, status 999). Șterge-le sau protejează-le cu `CRON_SECRET` / restrictionează la `NODE_ENV !== "production"`.

### [ ] 24. `next-env.d.ts` e committed

Ar trebui în `.gitignore` (e generat de Next).

### [ ] 25. Verifică `lucide-react: ^1.16.0`

Versiune atipică (lucide e de obicei 0.4xx în React). Confirmă că e alias corect și nu un fork abandonat.

---

## Ordine recomandată de execuție

1. **Batch securitate rapid:** #3, #4, #10, #23 (mic, izolat, impact mare)
2. **Batch corectitudine business:** #1, #2 (verifică cu echipa CRM valorile acceptate)
3. **Batch locale/UX:** #6, #7 (vizibile imediat de utilizator)
4. **Batch consistență:** #11, #12, #13, #14
5. **Refactor mentenabilitate:** #19, #20, #21
6. **Curățenie:** #22, #24, #25

---

## Note pentru implementare

- **AGENTS.md avertizează**: „This is NOT the Next.js you know" — Next.js 16 are breaking changes. Înainte de a atinge rute/cache/middleware, citește `node_modules/next/dist/docs/` pentru ghidul relevant (în special `unstable_cache`, `revalidatePath`, middleware matcher, `params` Promise).
- Înainte de fiecare fix, **verifică cu echipa CRM** contractele de API (mai ales #1, #2, #11).
- După fiecare batch, rulează `npm run lint` și `npm run build` pentru a prinde regresii de tipuri.
