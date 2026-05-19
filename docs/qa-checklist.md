# FormTrace — QA Checklist

Use this checklist when testing FormTrace manually before any release.

---

## Extension Loading Checklist

- [ ] Run `npm run build` — build completes with no errors
- [ ] Run `npm run typecheck` — TypeScript reports no errors
- [ ] Open `chrome://extensions`
- [ ] Enable Developer mode
- [ ] Click **Load unpacked** and select `.output/chrome-mv3/`
- [ ] FormTrace icon appears in the Chrome toolbar
- [ ] Clicking the icon opens the popup
- [ ] Popup shows "FormTrace", "Diagnose broken forms", "Build 1"
- [ ] Popup shows 3 stat cards: Forms, Events, Submits
- [ ] Popup shows the privacy note at the bottom

---

## Demo Page: Disabled Submit Button (`disabled-button.html`)

**Setup:** Open the page. Load extension. Click extension icon.

| Step | Action | Expected result |
|---|---|---|
| 1 | Click **Start recording** | Status changes to "Recording…" with red pulse |
| 2 | Click the disabled Submit button | Nothing happens on the page |
| 3 | Click **Stop & analyze** | Analysis card appears |
| 4 | Read likely issue | "Submit button was disabled" |
| 5 | Check severity | High |
| 6 | Check confidence | ≥ 30% |
| 7 | Click **Copy report** | Toast shows "Report copied!" |
| 8 | Paste into text editor | Valid Markdown report with findings |

---

## Demo Page: Hidden Required Field (`hidden-required-field.html`)

**Setup:** Open the page. Start recording. Click Create account without filling in anything.

| Step | Action | Expected result |
|---|---|---|
| 1 | Start recording | Status: Recording |
| 2 | Click **Create account** (submit) | Form blocks silently |
| 3 | Stop & analyze | Analysis card appears |
| 4 | Likely issue | "Hidden required field blocked submission" |
| 5 | Severity | High |
| 6 | Confidence | ≥ 35% |
| 7 | Technical details | Shows `company_id` field as hidden, required, empty |

---

## Demo Page: Invisible Error (`invisible-error.html`)

**Setup:** Open the page. Start recording. Enter an invalid email (e.g. `notanemail`). Click Subscribe.

| Step | Action | Expected result |
|---|---|---|
| 1 | Start recording | Status: Recording |
| 2 | Type invalid email | No visible feedback |
| 3 | Click Subscribe | Form does not submit, no error visible |
| 4 | Stop & analyze | Analysis card appears |
| 5 | Likely issue | "Validation failed without visible feedback" or "Required fields are missing" |
| 6 | Severity | Medium |
| 7 | Findings | Shows invalid field or no visible error |

---

## Demo Page: Failed API (`failed-api.html`)

**Setup:** Open the page. Start recording. Fill in name and feedback. Click Send feedback.

| Step | Action | Expected result |
|---|---|---|
| 1 | Start recording | Status: Recording |
| 2 | Fill in name + feedback | Fields show as filled |
| 3 | Click Send feedback | Page shows "Network error: …" |
| 4 | Stop & analyze | Analysis card appears |
| 5 | Likely issue | "Network request failed after submit" |
| 6 | Severity | High |
| 7 | Technical details | Shows failed URL |

---

## Demo Page: Successful Form (`success-form.html`)

**Setup:** Open the page. Start recording. Fill in valid name and email. Click Subscribe.

| Step | Action | Expected result |
|---|---|---|
| 1 | Start recording | Status: Recording |
| 2 | Fill valid name + email | — |
| 3 | Click Subscribe | "Successfully subscribed!" shown |
| 4 | Stop & analyze | Analysis card appears |
| 5 | Likely issue | "No clear failure detected" |
| 6 | Severity | Low |
| 7 | Confidence | Low (< 30%) |

---

## Reset Checklist

- [ ] Click **Reset** — stats reset to 0
- [ ] Analysis card disappears (replaced by empty state)
- [ ] Toast shows "Session reset"
- [ ] **Copy report** button becomes disabled

---

## Regression Checklist

Run after any code change:

- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes with no errors
- [ ] All 5 demo page scenarios produce expected likely issues
- [ ] Copy report produces valid Markdown
- [ ] Reset clears all state
- [ ] Popup loads correctly on first open (no crashes)
- [ ] Extension does not break normal page functionality
- [ ] No form submits are blocked or altered by the extension
- [ ] Privacy note is visible in the popup
- [ ] Build badge shows "Build 1"
