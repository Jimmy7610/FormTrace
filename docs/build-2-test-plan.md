# FormTrace — Build 2 Test Plan

This document describes the manual and automated validation routines to verify both Build 1 regressions and new Build 2 feature updates.

---

## 1. Test Setup & Environment

All manual tests must be run on a local HTTP server. Avoid using `file://` protocols since file-access extension permissions are prone to resetting when reload events occur.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the project:
   ```bash
   npm run build
   ```
3. Run the verification script:
   ```bash
   npm run verify
   ```
4. Start the server:
   ```bash
   npm run demo
   ```
5. Open Chrome and load the unpacked extension folder `.output/chrome-mv3`.
6. Open: **`http://127.0.0.1:4173/`**

---

## 2. Build 1 Regression Verification

Run through these checks to ensure existing functionality remains unbroken:

| Target Page | Interaction | Expected Issue | Severity | Conf. |
|---|---|---|---|---|
| `/hidden-required-field.html` | Fill visible inputs, click Register. | `Hidden required field blocked submission` | `HIGH` | `100%` |
| `/disabled-button.html` | Fill visible inputs, click disabled submit. | `Submit button was disabled` | `HIGH` | `95%+` |
| `/invisible-error.html` | Leave Username blank, click Submit. | `Validation failed without visible feedback` | `MEDIUM` | `35%+` |
| `/failed-api.html` | Type input, click Send. Wait for red error. | `Network request failed after submit` | `HIGH` | `85%+` |
| `/success-form.html` | Fill all fields with valid data, click Subscribe. | `No clear failure detected` | `LOW` | `< 20%` |

---

## 3. Build 2 Feature Verification

Verify the following new capabilities:

### Test 2.1: Debug Marker Toggle
- **Steps**:
  1. Open the FormTrace popup after recording a session on `http://127.0.0.1:4173/hidden-required-field.html`.
  2. Fill the visible fields and click submit to trigger a "Hidden required field blocked submission" report.
  3. Expand **Technical details**. Confirm that by default, it does **NOT** show the following internal debug lines:
     - `Analyzer runtime fix: hidden-required-first-pass`
     - `Popup normalization fix: final-report-guard`
     - `Analyzer bundle active: popup-local-normalized`
  4. Locate the "Show debug markers" settings checkbox at the bottom of the popup.
  5. Check "Show debug markers" and verify that the internal debug lines instantly appear under **Technical details**.
  6. Click **Copy report** with the toggle checked. Paste into a text editor and confirm the debug lines are included.
  7. Uncheck "Show debug markers" and verify that the debug lines are immediately hidden again in the UI.
  8. Click **Copy report** with the toggle unchecked. Paste and confirm the debug lines are excluded.
- **Expected Result**: Reports and copied Markdown are dynamically cleaned based on the toggle state, defaulting to hidden.

### Test 2.2: Confidence Optimization
- **Steps**:
  1. Run local demo server with `npm run demo`.
  2. Open `http://127.0.0.1:4173/invisible-error.html`.
  3. Click **Reset** on the page.
  4. Enter an invalid email address (e.g., `jimmy`) and enter any first name.
  5. Click **Start recording** in the FormTrace popup.
  6. Click the form's **Subscribe** submit button.
  7. Click **Stop & analyze** in the popup.
- **Expected Result**:
  - `likelyIssue` is `"Validation failed without visible feedback"`.
  - `severity` is `"medium"`.
  - `confidenceScore` is exactly `80%` (must be at or above `75%`).
  - Findings list includes submit attempts, invalid validation, and no visible error messages.

### Test 2.3: GitHub and Jira Format Copies
- **Steps**:
  1. Run `npm run demo` and open `http://127.0.0.1:4173/hidden-required-field.html`.
  2. Trigger hidden required field report (click Register with username and email filled, but company_id empty).
  3. Click **Copy GitHub issue**.
  4. Paste into a text editor and confirm it contains:
     - `# FormTrace: Hidden required field blocked submission`
     - `## Summary`
     - `## Page`
     - `## Severity`
     - `## Findings`
     - `## Technical Details`
     - `## Suggested Fixes`
     - `## Privacy`
     - `## Reproduction Notes`
  5. Confirm debug marker lines (e.g. `Analyzer runtime fix: hidden-required-first-pass`) are hidden when Show debug markers is off.
  6. Turn on Show debug markers, click **Copy GitHub issue** again, and confirm debug marker lines are included.
  7. Confirm Copy as Jira Bug operates similarly (to be fully tested once Issue 4 is completed).
- **Expected Result**: Formatted text is copied to clipboard and respects the debug marker setting correctly.

### Test 2.4: Session History List
- **Steps**:
  1. Perform 6 recordings on different demo pages.
  2. Open the popup and expand the History section.
  3. **History Size**: Verify that exactly the last 5 sessions are visible in the history list (the oldest session should be pruned).
  4. **Restore Session**: Click on a historical entry and confirm that the analysis panel successfully reloads the state and displays the correct findings.
- **Expected Result**: History saves state locally and reloads cleanly.

### Test 2.5: Framework-Mimic Verification
- **Steps**:
  1. Run the local server and navigate to each new mimic page:
     - `http://127.0.0.1:4173/framework-react-hook-form.html`
     - `http://127.0.0.1:4173/framework-formik.html`
     - `http://127.0.0.1:4173/framework-shopify.html`
     - `http://127.0.0.1:4173/framework-webflow.html`
     - `http://127.0.0.1:4173/framework-wordpress.html`
  2. Perform recording runs and submit attempts on each form.
- **Expected Result**: Captures standard validation triggers and submit blockages under state-driven environments.
