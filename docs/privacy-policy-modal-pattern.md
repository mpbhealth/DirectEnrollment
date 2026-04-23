# Privacy policy PDF in a modal (reusable pattern)

Use this when you need to **stop sending users to an external website** for a legal or policy document and instead show a **local PDF in an in-app popup** (modal), with a clear title on the button and in the dialog header.

## What you deliver

1. A PDF in static assets (served as a normal URL, no import bundling required).
2. A button that opens a modal.
3. The modal title (e.g. `Privacy Policy | <Brand>`).
4. The PDF shown inside the modal (typically an `<iframe src="...">`).

## 1. Add the file

- Place the PDF under the **public** folder (Vite/React: `public/assets/`).
- Example path on disk: `public/assets/Your Document Name.pdf`
- The browser URL is **from the site root**: `/assets/Your Document Name.pdf`

**Encode spaces in the URL** so the link is reliable in all environments:

- Correct: `/assets/Your%20Document%20Name.pdf`
- Or build it in code: `` `/assets/${encodeURI('Your Document Name.pdf')}` `` (encodeURI keeps slashes; for a path segment only, `encodeURIComponent` on the filename is also fine)

## 2. Replace an external link with a button

If you currently have:

```tsx
<a href="https://example.com/privacy" target="_blank" rel="noopener noreferrer">
  Privacy Policy | Brand
</a>
```

Switch to a **button** with `type="button"` (avoids submitting forms) and `onClick` that sets modal open state to `true`. Keep the same label and visual style as the old link for continuity.

## 3. State and effects (recommended)

- **`privacyPolicyOpen`** (or similar) `useState(false)`.
- **Body scroll lock** while open: set `document.body.style.overflow = 'hidden'` in a `useEffect` when open, restore on cleanup.
- **Escape to close**: `useEffect` that listens for `keydown` on `window` and closes when `e.key === 'Escape'`, cleanup on unmount or when closed.

## 4. Modal structure (accessibility)

- **Backdrop**: full-screen, semi-transparent, `onClick` → close. Use `role="presentation"` on the backdrop if it is not interactive beyond closing.
- **Panel**: `onClick` with `e.stopPropagation()` so clicks on the content do not close the panel.
- **Dialog**: `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the heading’s `id`.
- **Header**: visible `<h2 id="...">` with the same text as the button (or a slightly fuller title).
- **Close control**: button with `aria-label="Close privacy policy"` (or equivalent) and an icon.

## 5. PDF display

- Use an `<iframe title="...">` with a short, human-readable `title` (e.g. “Brand Privacy Policy PDF”).
- Give the iframe a **bounded height** (e.g. `min(70vh, 800px)`) so the modal does not grow past the viewport.
- Rely on the browser’s built-in PDF plugin when available. If the iframe is blank (strict browser settings or mobile quirks), add an optional “Open in new tab” link in the header pointing to the same PDF URL as a fallback.

## 6. Stacking and layout

- Use a high `z-index` (e.g. `z-[100]`) so the modal sits above the rest of the app.
- `max-h-[90vh]` on the panel and `min-h-0` on the scroll/iframe region helps flex layouts not overflow on small screens.

## 7. Per-project checklist

- [ ] PDF path under `public/` and final URL (with encoding) correct.
- [ ] Button and modal title match product copy.
- [ ] No accidental form submit (`type="button"`).
- [ ] Close: header button, overlay click, Escape.
- [ ] Optional: body scroll lock while open.
- [ ] Commit the PDF; verify size is acceptable for the repo and hosting.

## Example constant

```ts
const PRIVACY_POLICY_PDF = '/assets/Your%20Document%20Name.pdf';
// or: const PRIVACY_POLICY_PDF = `/assets/${encodeURIComponent('Your Document Name.pdf')}`;
```

This document describes the same approach used in **Care+ Enrollment** (Step 2 questionnaire: Zion HealthShare privacy policy PDF modal).

## Direct Enrollment (this repo)

Implementation lives in `src/components/Step2Questionnaire.tsx`: the PDF is at **`public/assets/Zion HealthShare Privacy Policy.pdf`**, loaded with an encoded path:

`const PRIVACY_POLICY_PDF = \`/assets/${encodeURIComponent('Zion HealthShare Privacy Policy.pdf')}\`;`

`iframe` and “Open in new tab” use that same URL. Follow this doc when changing the modal so behavior stays aligned (backdrop `role="presentation"`, body scroll lock, Escape, `aria-label="Close privacy policy"` on the close control, `z-[100]`, `max-h-[90vh]`, bounded iframe height).
