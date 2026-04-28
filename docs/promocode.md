# Promocode system — export guide for similar projects

This document describes how enrollment promocodes work in this codebase pattern (Supabase + PostgREST + Edge API validation). Use it when porting the same behavior to another repository. Replace the example **`DEFAULT_PROMO_PDID`** ( **`42465`** for Direct Enrollment in [`src/constants/promoDefaults.ts`](../src/constants/promoDefaults.ts) ) when you fork — it is **not** fixed globally across product lines.

---

## Direct Enrollment — implementation status (this repo)

| Area | Status |
|------|--------|
| Default PDID | **`42465`** — form default [`useEnrollmentStorage`](../src/hooks/useEnrollmentStorage.ts); Edge fallback and promo matching use **`DEFAULT_PROMO_PDID`** from [`promoDefaults`](../src/constants/promoDefaults.ts) or `VITE_DEFAULT_PROMO_PDID` / optional `DEFAULT_PROMO_PDID` env on Edge. |
| Client | [`src/utils/promoCodeService.ts`](../src/utils/promoCodeService.ts): `escapePromoCodeForILike`, `ilike`, `limit(1)`, **`product`** / PDID wildcard match, `validatePromoCode(code, pdid)`. |
| UI | [`EnrollmentSummary`](../src/components/EnrollmentSummary.tsx) passes **`pdid`** from form state into `validatePromoCode`. |
| Server parity | [`enrollment-api-direct/index.ts`](../supabase/functions/enrollment-api-direct/index.ts): same lookup + **`product`** check + **`max(0, base_fee - discount_amount)`**. |

Historical note: sibling repos may reference different PDIDs; this file’s **canonical default for Direct Enrollment** is **`42465`**.

---

## 1. What you are implementing

| Piece | Role |
|--------|------|
| **`promocodes` table** | Stores one row per code; each row has a **product scope** string and a **fixed dollar discount**. |
| **Client validation** | User enters a code; app loads the active row, checks **product** against the enrollment’s PDID, then applies **discount** to the initial payment. |
| **Server re-validation** | Enrollment submission repeats the same lookup + product check so discounts cannot be forged client-side. |
| **Pricing helper** | `initial_payment_after_discount = max(0, initial_payment - discount_amount)`. |

This repo scopes **`promocodes.product`** to a **single enrollment identifier: PDID** (numeric product ID). Other projects might store PDID under another name; the **mechanism** is the same: **match DB `product` column to whatever ID represents “this enrollment product”.**

---

## 2. Config you must set per project

Define **one default PDID** used when the form does not yet have a positive PDID:

```text
DEFAULT_PROMO_PDID = <your number>   // Direct Enrollment uses 42465 (see src/constants/promoDefaults.ts)
```

**Where it is wired in Direct Enrollment:**

- **Frontend** — [`src/constants/promoDefaults.ts`](../src/constants/promoDefaults.ts): `DEFAULT_PROMO_PDID` reads `import.meta.env.VITE_DEFAULT_PROMO_PDID` with fallback **`42465`**.
- **Edge function / API** — optional env `DEFAULT_PROMO_PDID`; otherwise **`42465`**, aligned with client.

---

## 3. Database: `promocodes`

Reference migration shape:

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `code` | **UNIQUE** — each promo string appears once (different codes can share the same `product`). |
| `product` | **Not unique.** Stores the product scope: typically **`"<PDID>"`** as text (e.g. `"42465"` for Direct Enrollment only). See wildcards below. |
| `discount_amount` | Non-negative numeric; dollars subtracted from initial payment. |
| `active` | Boolean; only `active = true` rows participate in validation. |

**RLS:** Policy that allows **anonymous `SELECT`** for rows with `active = true` is typical so the browser can validate without a logged-in user. Inserts/updates remain admin-only.

**Indexes:** Unique on `code`; optional index on `active`.

Migration: [`supabase/migrations/20260123163522_create_promocodes_table.sql`](../supabase/migrations/20260123163522_create_promocodes_table.sql)

---

## 4. Product column semantics (`product`)

The enrollment **eligible PDID** is computed as:

```text
effective_pdid = (user_pdid is number && user_pdid > 0) ? user_pdid : DEFAULT_PROMO_PDID
```

A promocode row **matches** the enrollment when:

1. **`product` is empty**, or equals (case-insensitive) **`*`**, **`ALL`**, or **`ANY`** → code applies to any enrollment (wildcard rows).
2. Otherwise **`product`** (normalized) must equal **`String(effective_pdid)`** (normalized).

**Multiple codes per product:** Many rows may use the same `product` value (same PDID). **`code` stays unique** across the table.

---

## 5. Code lookup: case-insensitive + literal string

PostgREST/Supabase: use **`ilike`** on `code` with the **trimmed user input**, not `eq` with forced uppercase, so DB casing can differ from user input.

**Critical:** `ilike` treats `%` and `_` as wildcards. **Escape** backslash, percent, and underscore in the user’s input before sending:

```typescript
function escapePromoCodeForILike(trimmed: string): string {
  return trimmed
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}
```

**Query pattern:**

- `from('promocodes').select('code, product, discount_amount')`
- `.ilike('code', escapePromoCodeForILike(trimmedUserInput))`
- `.eq('active', true)`
- `.limit(1)`

Use **`limit(1)`** instead of **`maybeSingle()`** if your PostgREST stack misbehaves on zero-or-many rows.

If no row → **invalid code**. If row exists → proceed to product match.

---

## 6. Client-side validation flow

1. Trim user input.
2. Run the query above.
3. If no row → error.
4. Build **`effective_pdid`** using **`DEFAULT_PROMO_PDID`** when `pdid` is missing or ≤ 0.
5. Compare row `product` to eligible IDs using wildcard rules (Section 4).
6. On success, persist **`AppliedPromo`**: `{ code, product, discountAmount }` from the row.

**UI:** Do not force uppercase on every keystroke if you rely on `ilike`; trimming is enough.

---

## 7. Applying the discount

```typescript
function applyPromoDiscount(initialPayment: number, appliedPromo: AppliedPromo | null): number {
  if (!appliedPromo) return initialPayment;
  return Math.max(0, initialPayment - appliedPromo.discountAmount);
}
```

Use the same helper anywhere the enrollment fee is shown (summary, payment step, PDF, etc.).

---

## 8. Server-side (Edge function / API) parity

When the client submits enrollment:

1. If `promoCode` is non-empty, repeat the **same** `promocodes` query + **same** `escapePromoCodeForILike` + **same** `effective_pdid` / product match (using **the same `DEFAULT_PROMO_PDID`** as the client).
2. If the match succeeds, recompute enrollment fee: **`max(0, base_fee - discount_amount)`** — do **not** trust client-sent dollar amounts for the promo discount.

Duplicate `escapePromoCodeForILike` in the Edge bundle if needed (no shared package), but keep logic **byte-identical**.

---

## 9. Admin data entry cheat sheet

| Goal | Set `product` to |
|------|---------------------|
| Code valid only for PDID **12345** | `12345` (string) |
| Code valid only for Direct Enrollment default line | **`42465`** |
| Code valid for **any** product line | `*` or `ALL` or `ANY`, or leave empty per your wildcard implementation |

Always insert **distinct `code`** values per row.

---

## 10. Checklist when copying to another repo

- [ ] Create `promocodes` table + RLS + indexes (or equivalent).
- [ ] Set **`DEFAULT_PROMO_PDID`** (and document it for admins creating rows).
- [ ] Implement **`escapePromoCodeForILike`** + **`ilike`** lookup + **`limit(1)`**.
- [ ] Implement **wildcard + PDID** matching for `product`.
- [ ] Wire **`validatePromoCode`** (or equivalent) with **`pdid`** from enrollment state.
- [ ] Implement **`applyPromoDiscount`** (or equivalent) with **`Math.max(0, …)`**.
- [ ] Mirror promo validation + fee math on **submit** server-side.
- [ ] Smoke-test: unknown code, inactive row, wrong PDID row, wildcard row, multiple codes same PDID.

---

## 11. Prompt snippet for AI-assisted ports

```text
Implement promocode validation per docs/promocode.md pattern:
- Supabase table promocodes (code unique, product text, discount_amount, active).
- Lookup: trim input, escape % _ \ for ilike, filter active=true, limit 1.
- Product match: wildcards empty/* /ALL/ANY = any; else product must equal String(effective_pdid).
- effective_pdid = user pdid if > 0 else DEFAULT_PROMO_PDID.
- Use DEFAULT_PROMO_PDID for this project: read from env or use 42465 for Direct Enrollment pattern.
- Client applies max(0, initial - discount); server recomputes on submit.
```

---

## 12. Reference locations in this repository

| Area | Path |
|------|------|
| This guide | `docs/promocode.md` |
| Default PDID constant | [`src/constants/promoDefaults.ts`](../src/constants/promoDefaults.ts) |
| Client service | [`src/utils/promoCodeService.ts`](../src/utils/promoCodeService.ts) |
| UI apply | [`src/components/EnrollmentSummary.tsx`](../src/components/EnrollmentSummary.tsx) |
| Edge validation | [`supabase/functions/enrollment-api-direct/index.ts`](../supabase/functions/enrollment-api-direct/index.ts) |
| Migration | [`supabase/migrations/20260123163522_create_promocodes_table.sql`](../supabase/migrations/20260123163522_create_promocodes_table.sql) |

Direct Enrollment bundles **`42465`** as the default when no positive `pdid`; override via `VITE_DEFAULT_PROMO_PDID` (client) or `DEFAULT_PROMO_PDID` (Edge) only if deploys split product lines.

---

*Last aligned: Direct Enrollment — PDID **`42465`**, `ilike` + escape, **`product`/PDID match**, server parity in `enrollment-api-direct`.*
