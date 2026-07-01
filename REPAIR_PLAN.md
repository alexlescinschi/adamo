# Plan reparare — Autentificare Google (10 bug-uri)

## Bug #1 — Register page nu colectează telefonul după Google sign-up
**Fișier**: `src/app/[locale]/register/page.tsx`
**Linia**: 47-64 (`handleGoogleCredential`)
**Problemă**: După `POST /api/auth/google`, dacă CRM răspunde cu `needsPhone: true`, pagina face direct `router.push("/account")` fără să ceară telefonul.
**Fix**: Adaug același pattern ca pe login page — dacă `data.needsPhone`, salvez `googleName`/`googleEmail`, afișez un form de telefon, trimit la `/api/auth/google/phone`, apoi redirect.

---

## Bug #2 — Register page, butonul Google nu se reinițializează la SPA navigation
**Fișier**: `src/app/[locale]/register/page.tsx`
**Linia**: 24
**Problemă**: `useEffect` face return early dacă Google script e deja încărcat (`window.google?.accounts?.id`), deci nu mai inițializează butonul după navigare login→register.
**Fix**: Copiez logica de re-init de pe login page — dacă `google.accounts.id` există, chem `initGoogle()` direct în loc de return.

---

## Bug #3 — `firstName`/`lastName` goi pentru userii Google (numele se pierde)
**Fișier**: `src/app/api/auth/google/route.ts`
**Linia**: 33-34
**Problemă**: CRM `EcommerceAuthUser` are doar `id, email, username, phone, contact_id`. Codul caută `first_name`, `last_name`, `name` — toate lipsesc. `username` (care conține numele Google) nu e folosit.
**Fix**: Adaug fallback `user.username` la extragerea numelui:
```
const firstName = user.first_name || user.username?.split(" ")[0] || user.name?.split(" ")[0] || "";
```

---

## Bug #4 — `createContact` poate eșua silențios, userul rămâne fără contact în CRM
**Fișier**: `src/app/api/auth/google/phone/route.ts`
**Linia**: 38-48
**Problemă**: Eșecul `createContact` e prins și doar logat. Frontend-ul primește `{ success: true }` și redirect la `/account` fără să știe că contactul nu s-a creat.
**Fix**: Returnez eroarea în răspuns:
```
return NextResponse.json({ success: true, contactWarning: "Contact creation failed" });
```
Frontend-ul poate să logheze sau să reîncerce. Nu blochez flow-ul principal (telefonul e deja setat).

---

## Bug #5 — `NEXT_PUBLIC_GOOGLE_CLIENT_ID` lipsește din `.env.local`
**Fișier**: `.env.local`
**Problemă**: Fără client ID, butoanele Google nu se randă deloc local.
**Fix**: Adaug cheia în `.env.local`. (Ai valoarea?)

---

## Bug #6 — Email-ul se pierde pe checkout la userii logați cu Google
**Fișier**: `src/app/[locale]/checkout/page.tsx`
**Linia**: 82-93 (fetch `/api/account/me`)
**Problemă**: Checkout-ul citește `data.user.email`. Dar `/api/account/me` returnează `email` și la nivel top-level și în `user`. Dacă refresh-ul de token intervine, structura difera și checkout-ul pierde email-ul.
**Fix**: Unific citirea în checkout:
```
email: data?.user?.email || data?.email || c.email
```

---

## Bug #7 — Răspunsul `/api/account/me` inconsistent între path-ul cu refresh și cel normal
**Fișier**: `src/app/api/account/me/route.ts`
**Linia**: 48-51 vs 31-33
**Problemă**: Două code path-uri returnează același shape dar sunt scrise separat. E redundanță și risc de drift.
**Fix**: Unific răspunsul — după refresh, returnez cu aceeași funcție helper.

---

## Bug #8 — `first_name`/`last_name` goi la `createContact` în phone route (consecință bug #3)
**Fișier**: `src/app/api/auth/google/phone/route.ts`
**Linia**: 39-41
**Problemă**: Frontend-ul trimite `firstName`/`lastName` extrase din `googleName.split(" ")`. Dacă `googleName` e gol (bug #3), contactul se creează fără nume.
**Fix**: Se repară automat după bug #3. Adaug fallback în phone route: dacă `firstName` e gol, îl iau din body sau din token claims.

---

## Bug #9 — `username`-ul din CRM (numele Google) nu e returnat către frontend
**Fișier**: `src/app/api/auth/google/route.ts`
**Linia**: 36-43
**Problemă**: Când `needsPhone` e true, răspunsul include `name` dar nu și `username`. Dacă name e reconstruit din first_name/last_name goale (bug #3), frontend-ul rămâne fără nume.
**Fix**: Se repară după bug #3 (username intră în lanțul de fallback pentru name).

---

## Bug #10 — Butonul Google One Tap de pe register page are callback-ul greșit după SPA navigare
**Fișier**: `src/app/[locale]/register/page.tsx`
**Linia**: 24
**Problemă**: Efectul combinat cu bug #2 — dacă navighezi login→register și `google.accounts.id` deja există, nici nu se re-creează butonul, nici nu se schimbă callback-ul. Butonul rămâne pe callback-ul din login (`signin_with`).
**Fix**: Acoperit de fix-ul la bug #2 — re-init complet la SPA navigation.

---

## Ordinea de reparare

| Pas | Fișier | Bug-uri |
|-----|--------|---------|
| 1 | `src/app/api/auth/google/route.ts` | #3, #9 |
| 2 | `src/app/api/auth/google/phone/route.ts` | #4, #8 |
| 3 | `src/app/[locale]/register/page.tsx` | #1, #2, #10 |
| 4 | `src/app/api/account/me/route.ts` | #7 |
| 5 | `src/app/[locale]/checkout/page.tsx` | #6 |
| 6 | `.env.local` | #5 |
