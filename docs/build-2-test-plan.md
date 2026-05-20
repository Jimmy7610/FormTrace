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
  7. Click **Copy Jira report**.
  8. Paste into a text editor and confirm it contains:
     - `h2. Summary`
     - `h2. Environment`
     - `h2. Issue`
     - `h2. Steps to Reproduce`
     - `h2. Actual Result`
     - `h2. Expected Result`
     - `h2. Findings`
     - `h2. Technical Details`
     - `h2. Suggested Fixes`
     - `h2. Privacy Notes`
  9. Confirm debug marker lines (e.g. `Analyzer runtime fix: hidden-required-first-pass`) are hidden when Show debug markers is off.
  10. Turn on Show debug markers, click **Copy Jira report** again, and confirm debug marker lines are included.
- **Expected Result**: Formatted text is copied to clipboard and respects the debug marker setting correctly.

### Test 2.4: Session History List
- **Steps**:
  1. Perform 11 recordings on different demo pages or forms.
  2. Open the popup and view the History section.
  3. **History Size**: Verify that exactly the last 10 sessions are visible in the history list (the oldest session should be pruned).
  4. **Restore Session**: Click **Open** on a historical entry and confirm that the stats grid, analysis card, and copy/export actions reload the state and display/copy the correct findings.
  5. **Delete Session**: Click **Delete** on a specific item and verify it is removed from the list.
  6. **Clear History**: Click **Clear history** and verify that all entries are removed and the UI displays "No saved reports yet."
- **Expected Result**: History saves state locally, supports up to 10 entries with pruning, and reloads/manages cleanly.

### Test 2.5: Polish and Release Verification
- **Steps**:
  1. Inspect version settings. Confirm that version is consistently set to `1.1.0` in both [package.json](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/package.json) and [wxt.config.ts](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/wxt.config.ts).
  2. Run the release check command:
     ```bash
     npm run release:check
     ```
     Verify that the test suite compiles and runs successfully, returning exit status 0.
  3. Verify that the privacy disclaimer text under history list displays: `"History is stored locally in this browser only. Form inputs and sensitive network payloads are never recorded."`
  4. Verify that very long page titles in history items are gracefully truncated with an ellipsis and do not break layout spacing.
- **Expected Result**: Versions are aligned, test suite returns exit code 0, and UI labels are refined and prevent overflows.
