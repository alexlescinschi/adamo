# FanCourier — Plan de realizare

> Creat în urma auditului compara între codul actual (`src/lib/fancourier.ts`) și
> documentația oficială FanCourier (`https://app.fancourier.md/fan/Main?apiDocs=true`).
> Ne întoarcem la acest plan mai târziu pentru implementare. Bifează (`- [x]`) pe măsură ce rezolvi.

---

## Context

La o comandă de test, destinatarul a primit afișat „Chișinău Chișinău" ca locație. Auditul
compara datele trimise de noi cu doc-ul oficial FanCourier și a găsit **3 bug-uri confirmate**
și **4 probleme de format/robustețe**.

### Fișiere implicate
- `src/lib/fancourier.ts` — clientul FanCourier (`createFanCourierAwb`, `getFanCourierPrice`)
- `src/app/api/fancourier/awb/route.ts` — route-ul POST care expune AWB-ul
- `src/app/[locale]/checkout/page.tsx` — construiește request-ul către route (linia 150-166)

### Doc oficial confirmat public (HTTP 200, fără login)
- `https://app.fancourier.md/fan/Main?apiDocs=true`
- Endpoint-uri relevante: `create_shipment`, `get_price`, `list_services`, `list_cities`

---

## 🔴 BUG-URI CONFIRMATE (discrepanțe față de doc)

### [ ] 1. `type: "Colet"` — valoare INVALIDĂ

**Loc:** `src/lib/fancourier.ts:44`

**Doc zice:** `type: envelope | package`
**Noi trimitem:** `type: "Colet"`

`"Colet"` nu e în lista acceptată. Probabil cel mai grav bug — FanCourier poate respinge
sau interpreta greșit tipul expedierii.

**Fix:**
```ts
type: "package",  // era "Colet"
```

Apare în 2 locuri: `createFanCourierAwb` (linia 44) și `getFanCourierPrice` (linia 87).

---

### [ ] 2. `service_type: "Standard"` — PROBABIL INVALID

**Loc:** `src/lib/fancourier.ts:45` și `:88`

**Doc zice:**
> service_type: obtain from courier company (eg: regular, express).
> IMPORTANT: When creating shipments, you must use a valid service_type from list_services?type=main

`"Standard"` nu e menționat nicăieri în doc. Exemplele sunt `regular`, `express`.

**Fix în 2 pași:**
1. **Întâi**: interoghează `API/list_services?type=main` cu `FANCOURIER_API_KEY` din `.env.local`
   ca să obții lista exactă de `service_type` valide pentru contul nostru. Exemplu call:
   ```
   https://app.fancourier.md/fan/API/list_services?api_key=YOUR_KEY&type=main
   ```
2. **Apoi**: hardcodelă valoarea corectă (ex: `"regular"` sau `"express"`) în ambele locuri.

> ⚠️ Nu ghici. Trebuie valoarea exactă din `list_services`, altfel FanCourier respinge expedierea.

---

### [ ] 3. `ramburs` trimis fără `ramburs_type`

**Loc:** `src/lib/fancourier.ts:51`

**Doc zice:**
```
ramburs: <CoD amount>
ramburs_type: cont | cash | instrumente_plata   (CoD type: account | cash | check)
```
**Noi trimitem:** doar `ramburs: String(cod)`, **fără `ramburs_type`**.

Pentru ramburs cash la curier (cazul nostru principal), trebuie `ramburs_type: "cash"`.

**Fix:**
```ts
...(p.cod !== undefined && p.cod > 0 ? {
  ramburs: String(p.cod),
  ramburs_type: "cash",   // ADĂUGAT
} : {}),
```

---

## 🟡 PROBLEME DE FORMAT / ROBUSTEȚE

### [ ] 4. `to_email = ""` (string gol) când clientul nu dă email

**Loc:** `src/lib/fancourier.ts:43`

**Noi:** `to_email: p.toEmail ?? ""` trimite string gol.
**Doc:** câmp opțional.

String gol poate fi interpretat greșit de unele validări. Mai bine omitem câmpul când e gol
(ca facem deja pentru `to_nr`/`to_bl`/`to_ap`).

**Fix:**
```ts
...(p.toEmail ? { to_email: p.toEmail } : {}),
```

---

### [ ] 5. `to_phone` fără validare / format

**Loc:** checkout formular + `fancourier.ts:42`

Clientul scrie telefonul liber în checkout. `rate-calculator.tsx:203` adaugă `+373`,
dar **checkout-ul NU**. Inconsistență.

Doc nu specifică format strict, dar pentru livrare reală e mai sigur format internațional.

**Fix (2 opțiuni — alege la implementare):**
- **A.** Normalizează telefonul în `createFanCourierAwb`: dacă începe cu `0` și are 9 cifre,
  înlocuiește `0` cu `+373`. Simplu, izolat în client.
- **B.** Adaugă validare + prefix în formularul de checkout (mai vizibil pentru client).

Recomand **A** (mai puțin cod atins, consistent cu toate punctele de intrare).

---

### [ ] 6. `to_zipcode` default `"2000"` (Chișinău) când lipsește

**Loc:** `src/lib/fancourier.ts:37` și checkout `:156`

**Cauza probabilă a „Chișinău Chișinău"**: dacă un client din alt oraș lasă cod poștal gol,
trimitem `2000` (Chișinău). FanCourier deduce orașul din cod poștal → conflict cu `to_city`
scris de client → afișează dublu.

**Doc:** există `list_cities` (cere courier api key) pentru validare orașe. Noi nu validăm.

**Fix (progresiv):**
- **Minim:** nu mai pune default `2000`. Trimite cod poștal doar dacă clientul l-a completat.
  FanCourier poate deduce din `to_city` + `to_country`.
  ```ts
  ...(p.toZipcode ? { to_zipcode: p.toZipcode } : {}),
  ```
- **Ideal:** validează `to_city` contra `list_cities` în checkout (mai multă muncă, necesită
  courier api key). Lasă pentru o iterație viitoare.

---

### [ ] 7. `dimensions` într-un singur câmp vs. `length/height/width` separate

**Loc:** `src/lib/fancourier.ts:47`

**Noi trimitem:** `dimensions: process.env.FANCOURIER_DIMENSIONS ?? "20x20x10"`
**Doc:** câmpuri separate `length, height, width` (în cm), linia 124.

`dimensions` nu e un câmp documentat. Probabil e ignorat → FanCourier nu are dimensiuni reale
→ poate taxa greșit (pe greutate volumetrică).

**Fix:**
```ts
// Elimină dimensions; adaugă length/height/width separate
length: process.env.FANCOURIER_LENGTH ?? "20",
height: process.env.FANCOURIER_HEIGHT ?? "20",
width:  process.env.FANCOURIER_WIDTH  ?? "10",
```

> Note: pentru `cnt > 1` (mai multe colete), doc suportă `length2/height2/width2` etc.
> Pentru moment `cnt: "1"` fix, deci nu e nevoie.

---

## 📋 RECOMANDĂRI SUPLIMENTARE DIN DOC

### [ ] 8. (Opțional) Cache list_services la pornire

`service_type` valid poate varia după cont. În loc să hardcodăm, am putea chema
`list_services?type=main` o dată și memora rezultatul. Overkill pentru moment —
hardcodare după pasul #2 e suficient.

### [ ] 9. (Opțional) Validare `to_city` contra `list_cities`

Necesită courier api key (nu client api key). Lasă pentru mai târziu dacă devine problemă.

---

## ORDINE RECOMANDATĂ DE IMPLEMENTARE

1. **#1 (`type: "package"`)** — 1 linie, impact mare. Face imediat.
2. **#3 (`ramburs_type: "cash"`)** — 3 linii, izolat.
3. **#4 (`to_email` omit când gol)** — 1 linie.
4. **#6 (`to_zipcode` fără default 2000)** — 1 linie. Probabil rezolvă „Chișinău Chișinău".
5. **#7 (`length/height/width` separate)** — schimbă env var + 3 linii.
6. **#5 (`to_phone` normalizare)** — mică funcție helper.
7. **#2 (`service_type` corect)** — necesită întâi interogare `list_services?type=main`
   cu `FANCOURIER_API_KEY` din `.env.local`. Fă-o prima oară când te apuici de FanCourier.

## VERIFICARE DUPĂ IMPLEMENTARE

1. `npm run lint` + `npm run build` (regresii tipuri).
2. Comandă de test cu:
   - client persoană fizică + curier + cash → verifică AWB în FanCourier
   - client din alt oraș (nu Chișinău), fără cod poștal → verifică că orașul nu mai apare dublu
3. Confirmă în panoul FanCourier că: `type=package`, `service_type` valid, `ramburs_type=cash`,
   dimensiuni prezente.

## NOTE

- Doc-ul FanCourier e public, nu necesită login — se poate re-interoga oricând la
  `https://app.fancourier.md/fan/Main?apiDocs=true`.
- Toate modificările sunt izolate în `src/lib/fancourier.ts` (+ eventual checkout formular
  pentru #5/#6). Nu afectează restul aplicației.
- Acest plan NU atinge integrarea CRM (vede `FAN_COURIER_RAMBUS` în `src/lib/checkout.ts` —
  aia e valoarea CRM, nu FanCourier; rămâne corectă).
