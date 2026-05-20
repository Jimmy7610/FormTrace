# FormTrace Build 2 Progress Report

## Completed Tasks

### Issue 1: Debug Marker Visibility Toggle
- **Completed On**: 2026-05-20
- **What Changed**:
  - Created `src/analyzer/filterDebugMarkers.ts` to define and filter out development-oriented diagnostics from the user-facing report view and exports.
  - Configured `src/analyzer/buildMarkdownReport.ts` to optionally filter out debug markers based on `options.showDebugMarkers`.
  - Added a visual settings card in `entrypoints/popup/App.tsx` and custom styling in `entrypoints/popup/style.css`.
  - Integrated `chrome.storage.local` storage checks to save and restore the user's toggle setting.
  - Added a dedicated test runner `tools/debug-marker-check.ts` and automated script command `npm run debug:check`.
  - Updated verification pipeline `npm run verify` and production build output check (`tools/build-output-check.mjs`).

### Issue 2: Refine Validation Confidence Scoring
- **Completed On**: 2026-05-20
- **What Changed**:
  - Updated `src/analyzer/scoring.ts` to adjust weight thresholds for validation checks.
  - Implemented a +15 point combination bonus when a submit attempt, an invalid validation state, and a lack of visible error messages all occur together, boosting target confidence to exactly `80%`.
  - Added Test 6 and Test 7 cases to `tools/analyzer-check.ts` to programmatically assert validation confidence thresholds (>= 75%) and successful submissions respectively.
  - Updated `tools/build-output-check.mjs` to ensure the combo bonus check compiles correctly in minified production bundles.

---

## How to Test

### Automated Verification
Run the verification suite:
```bash
npm run verify
```
This runs typechecks, building, DOM verification, rule analysis, normalization checks, debug marker filters, and production bundle matches.

### Manual Verification

#### Debug Marker Toggle (Issue 1)
1. Run local demo page server:
   ```bash
   npm run demo
   ```
2. Open `http://127.0.0.1:4173/hidden-required-field.html`.
3. Complete Username and Email, leave the hidden field blank, and click Register.
4. Open the extension popup, stop recording, and expand **Technical details**.
5. Observe that the internal runtime guard lines are **hidden by default**.
6. Check **Show debug markers** in the settings section. Observe that the markers appear instantly in the UI.
7. Click **Copy report** with toggle off/on and inspect clipboard contents.

#### Validation Confidence Scoring (Issue 2)
1. Open `http://127.0.0.1:4173/invisible-error.html`.
2. Click **Reset** on the page.
3. Enter an invalid email address (e.g., `jimmy`).
4. Click **Start recording** in the popup.
5. Click **Subscribe**.
6. Click **Stop & analyze** in the popup.
7. Observe that the likely issue is `"Validation failed without visible feedback"` and the confidence score displays exactly **80%** (an improvement from 35%).

---

## Next Recommended Task
- **Issue 3: Add GitHub Issue export format** ([docs/build-2-issues.md](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/docs/build-2-issues.md#L32)).
