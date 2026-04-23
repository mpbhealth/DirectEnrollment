# Replicate: privacy policy in the footer (fine print + popup)

This guide is tied to the request you gave for **CareEnrollment**. Use it as a checklist when you want the **same outcome** on another app.

## Original prompt (reference)

> Move **“Privacy Policy | Zion HealthShare”** to **fine print at the bottom of the page** (don’t make it stand out) **next to** “© 2026 MPB Health. All rights reserved.” Make it **just text with a hyperlink** that will **open the popup** (the PDF modal—not the external website).

Earlier in the same thread, the PDF was added under `public/assets/` and the flow used a **modal with an iframe** to the PDF instead of linking out.

**Intent in plain terms**

- **No** large CTA, colored bar, or icon in the middle of a form step.
- **Yes** muted footer copy, same line as copyright, **clickable text** that opens the **same PDF modal** you already have (or add per `docs/privacy-policy-modal-pattern.md`).

---

## What you need

1. **PDF** in static assets, e.g. `public/assets/Your Policy.pdf` → URL `/assets/Your%20Policy.pdf` (encode spaces).
2. **Footer** (or global layout) where the copyright line lives.
3. **Remove** any old, prominent privacy control from a wizard step if it still exists.

---

## Replication steps

### 1. Extract the modal + “link” into a small component

- One component that returns:
  - A **`type="button"`** control (not `<a href="...">` to the PDF—no full navigation) styled to look like **inline body text**, not a primary button.
  - The **modal** (backdrop, dialog, close, `iframe` `src` = PDF URL, Escape + body scroll lock). See **`docs/privacy-policy-modal-pattern.md`** for the full pattern.

**Styling goals** (from your prompt: “don’t make it stand out”):

- `text-xs`, gray palette (`e.g. text-gray-500`, slightly darker on `hover:`).
- `hover:underline` is enough affordance; avoid bright blues or heavy borders.
- `inline`, `p-0`, `border-0`, `bg-transparent` on the button so it reads as **text**, not a chip.

**CareEnrollment reference:** `src/components/ZionPrivacyPolicyFooterLink.tsx`

### 2. Place it in the footer next to the copyright

- In the same `<p>` as the © line, add a **single space** (or an **em dash** `—` with spaces) before the component so the privacy control reads as a continuation of the sentence.
- Keep the line **one visual tier** with other footer fine print (same or adjacent `text-xs` / gray).

**Avoid the “double dot” (period + middot):** If the copyright ends with a full stop—e.g. `All rights reserved.`—do **not** put a **middle dot** (`·`, U+00B7) immediately after it. Users will read it as two dots: `reserved.·Privacy…`. Prefer a plain space after the period, or use an em dash instead of a middot (e.g. `reserved — Privacy Policy…`).

**CareEnrollment reference:** `src/App.tsx` (footer: `…All rights reserved. <ZionPrivacyPolicyFooterLink />` with a space only—no `·` after `reserved.`).

### 3. Remove the old placement

- Delete the in-flow banner/button from the step or page where it used to sit so users aren’t nudged twice.

**CareEnrollment reference:** `src/components/Step2Questionnaire.tsx` (privacy block removed from step 2).

### 4. Edge cases to decide per project

- **Routes without this footer** (e.g. a tool on `/other`): either add the same footer, or accept that the policy is only on the main layout.
- **Screen readers:** button + dialog is valid; if you use `role="dialog"` and `aria-labelledby` on the modal, keep that.

---

## Related doc

- **`docs/privacy-policy-modal-pattern.md`** — PDF in `public/`, URL encoding, iframe, a11y, z-index, optional fallbacks.

---

## Direct Enrollment (this repo) — file map

| Piece | File |
|--------|------|
| Footer copy + inline control | `src/App.tsx` |
| Muted “link” + PDF modal | `src/components/ZionPrivacyPolicyFooterLink.tsx` |
| Form step (no in-flow privacy CTA) | `src/components/Step2Questionnaire.tsx` |
| PDF asset | `public/assets/Zion HealthShare Privacy Policy.pdf` |

## CareEnrollment reference (original)

| Piece | File |
|--------|------|
| Footer copy + inline control | `src/App.tsx` |
| Muted “link” + PDF modal | `src/components/ZionPrivacyPolicyFooterLink.tsx` |
| Form step (policy removed) | `src/components/Step2Questionnaire.tsx` |
| PDF asset | `public/assets/Zion HealthShare Privacy Policy.pdf` |

Copy this file into another repo’s `docs/` when you need the same UX pattern; swap brand names, PDF filename, and copyright holder.
