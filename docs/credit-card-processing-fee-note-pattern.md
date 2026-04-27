# Credit card processing fee note — replication guide

Use this when a wizard-based enrollment (or checkout) offers **Credit Card** vs **Bank Account (ACH)** as two side-by-side selectable controls, and you need a **muted helper line** shown **only under the Credit Card** option so users see the fee disclosure before they choose a method.

**Direct Enrollment (this repo):** [`src/components/PaymentInformationSection.tsx`](../src/components/PaymentInformationSection.tsx) — the note sits directly under the Credit Card `button`, inside the first column of a two-column grid.

---

## Goals

| Goal | Detail |
|------|--------|
| Placement | Under the Credit Card control (the “blue” styled `type="button"` tile), not under ACH, not below the whole row only. |
| Always visible | Show the note whether or not Credit Card is selected — it is disclosure for that payment path, not conditional copy. |
| Layout | Two-column grid stays balanced: use `items-start` on the grid so the ACH button top-aligns with the Credit Card column (which is taller because of the note). |
| Typography | Small, secondary text (`text-xs`), neutral gray (`text-gray-600`), not warning red unless your legal team asks. |
| Accessibility | The note is plain text in a `<p>`; no `aria-hidden`; screen readers get it in reading order after the Credit Card button label. |

---

## When *not* to use this pattern

- If the fee only applies **after** card fields are shown, you might instead duplicate the note inside the card form block — this pattern is for **up-front** disclosure next to the method toggle.
- If both methods have fees, use a **single** line under the whole payment method group or a short comparison table.

---

## Reference structure (verbatim JSX)

**Imports:** your icon for Credit Card (e.g. `CreditCard` from `lucide-react`) and whatever you use for ACH — unchanged from your project.

**Replace a flat “two buttons in one row”** implementation with: **first column = wrapper `div` (flex column) → button + `<p>` note**; second column = ACH button only.

```tsx
<div className="grid grid-cols-2 gap-4 items-start">
  <div className="flex flex-col gap-1.5">
    <button
      type="button"
      onClick={() => onChange('paymentMethod', 'credit-card')}
      className={`flex w-full items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
        payment.paymentMethod === 'credit-card'
          ? 'border-blue-600 bg-blue-50 text-blue-700'
          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
      }`}
    >
      <CreditCard className="w-5 h-5" />
      <span className="font-semibold">Credit Card</span>
    </button>
    <p className="text-xs text-gray-600 text-center sm:text-left">
      A 3% credit card processing fee will apply
    </p>
  </div>
  <button
    type="button"
    onClick={() => onChange('paymentMethod', 'ach')}
    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
      payment.paymentMethod === 'ach'
        ? 'border-blue-600 bg-blue-50 text-blue-700'
        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
    }`}
  >
    <Building2 className="w-5 h-5" />
    <span className="font-semibold">Bank Account (ACH)</span>
  </button>
</div>
```

**Critical details:**

1. **`items-start` on the grid** — without this, the default `stretch` can make the ACH `button` as tall as the first column, which looks wrong.
2. **`w-full` on the Credit Card `button`** — keeps the button full width of the first column; the note aligns under the same width.
3. **Wrap only Credit Card** — the ACH control stays a single `button` in column two (do not put an empty placeholder under ACH unless you need symmetry for design).

---

## Copy and localization

- **Default string (this repo):** `A 3% credit card processing fee will apply`
- If your product uses a different percentage or wording from finance/legal, **change only the `<p>` text**; keep the layout pattern.
- For i18n: the `<p>` is the string resource; the two button labels stay separate keys.

---

## Styling notes (Tailwind)

| Class | Purpose |
|-------|---------|
| `gap-1.5` | Tight vertical spacing between button and note. |
| `text-xs text-gray-600` | Secondary, non-alarming disclaimer. |
| `text-center sm:text-left` | Readable on narrow screens (stacked layout); aligns with form on `sm+`. |

Optional tweaks (not in the default pattern): `text-blue-800` to match a blue theme, or `text-amber-800` + `bg-amber-50` if you must signal “read this” (confirm with design).

---

## State and behavior

- **No new state** — the note does not depend on `paymentMethod === 'credit-card'`. It is static copy for the card option.
- **No change to validation, API payload, or pricing math** in Direct Enrollment; this is UI copy only. If another project must **charge** the 3%, that is a separate backend/billing task.

---

## PDF / email

- If you echo payment method in a PDF, **do not** assume this MD adds a new field; optionally add a line like: “Credit card: a 3% processing fee applies” only if legal wants it on the document — coordinate copy with this UI string.

---

## Replication checklist

- [ ] Locate the payment method toggle (Credit Card vs ACH) in the target project (often a dedicated `Payment*Section` or step-N address/payment view).
- [ ] Change the layout from “two sibling buttons in the grid” to “column one: `flex flex-col` with button + note; column two: ACH button only.”
- [ ] Add `items-start` to the grid; add `w-full` to the Credit Card button.
- [ ] Paste the exact disclaimer text (or the approved variant for that product).
- [ ] Quick visual check: mobile width, both methods selected, neither looks vertically stretched incorrectly.

---

## One-paragraph prompt (for an AI or teammate)

> In the payment step, we use two side-by-side `type="button"` tiles to choose **Credit Card** or **Bank Account (ACH)**. Replicate the Direct Enrollment pattern: wrap only the Credit Card tile in a `flex flex-col` column, put a `<p className="text-xs text-gray-600 text-center sm:text-left">` directly under the Credit Card button with the exact text: “A 3% credit card processing fee will apply”. Keep the ACH button as a single button in the second grid column. On the parent grid, use `className="grid grid-cols-2 gap-4 items-start"`. Add `w-full` to the Credit Card button. Do not gate the note on `paymentMethod === 'credit-card'`. Styling and behavior should match `docs/credit-card-processing-fee-note-pattern.md` in the Direct Enrollment repo.

---

## File map (Direct Enrollment)

| File | Role |
|------|------|
| [`src/components/PaymentInformationSection.tsx`](../src/components/PaymentInformationSection.tsx) | Payment method UI used from Step 3 (`Step2AddressInfo`); contains the note. |

If your “similar project” names components differently, search for `paymentMethod`, `credit-card`, and `ach` to find the equivalent.
