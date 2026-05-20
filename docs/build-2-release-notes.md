# FormTrace — Build 2 Release Notes

- **Version**: Build 2 (v1.1.0-build2)
- **Release Tag**: `v1.1.0-build2`
- **Release Date**: May 20, 2026

FormTrace Build 2 enhances user control, optimizes validation analysis, introduces multiple export templates for team integration, preserves recent reports across popup close events, and provides release-ready polish.

---

## Release Summary

Build 2 extends the Build 1 MVP foundation with developer-focused productivity features and bug reporting shortcuts, operating entirely client-side and keeping all data private and local on-device.

### Key Highlights
1. **Debug Marker Visibility Toggle**: A configuration setting in the popup to hide or show technical debug markers (e.g. `Network probe active`) in user-facing reports and exported Markdown text.
2. **Optimized Validation Scoring**: Recalibrated weight logic and added a combination bonus (+15) for invisible form validation errors, lifting confidence score assessments to a robust `80%` when validation triggers fail to show visible feedback.
3. **GitHub Issue Export Format**: Generates a clean GitHub-flavored Markdown issue with structured headings for instant ticket submission.
4. **Jira-Style Export Format**: Generates a bug report formatted using Jira rich text markup (e.g. `h2.`, list indicators, reproduction steps).
5. **Saved Local Sessions & History**: Automatically stores up to 10 form analysis reports locally in `chrome.storage.local`. Allows browsing, reopening, deleting individual saved reports, or clearing the entire history queue.
6. **Stable Release Prep**: Visual UI refinements for long page titles/URLs, updated metadata, and a formalized verification checklist.

---

## Completed Issues & Features

### 1. Debug Marker Visibility Toggle (Issue 1)
- Added checkbox under settings: **Show debug markers** (persisted locally).
- Filters internal markers from report displays, standard copy, GitHub copy, and Jira copy unless explicitly checked.

### 2. Refined Validation Scoring (Issue 2)
- Combination of invalid validation states, submit actions, and lack of visible error elements outputs exactly `80%` confidence.
- Correctly scales priorities without overriding 100% hidden required field blockages or 95% disabled submit button detections.

### 3. GitHub Issue Export Format (Issue 3)
- Copies report formatted as GFM. Includes `# FormTrace: [Likely Issue]`, `## Summary`, `## Findings`, `## Suggested Fixes`, etc.

### 4. Jira-Style Export Format (Issue 4)
- Copies report formatted as Jira rich text markup using `h2.`, `#` for steps, and `*` for lists.

### 5. Saved Local Session History (Issue 5)
- Preserves the last 10 reports across popup closures using `chrome.storage.local`.
- History items show the likely issue, page title (truncated gracefully), timestamp, and confidence score.
- Clicking **Open** restores the report details and updates all export buttons to operate on the restored historical state.

### 6. Release Polish & Verification Script (Issue 6)
- Graced history card page title display with text-overflow truncation rules.
- Clarified local history privacy disclaimer.
- Added `release:check` to the project pipeline.

---

## Manual QA Checklist

Start the localhost demo page server (`npm run demo`) and open `http://127.0.0.1:4173/` in Google Chrome with the built unpacked extension loaded.

1. **Hidden Required Field (`/hidden-required-field.html`)**:
   - Fill visible fields, click Register.
   - Stop and analyze. Expect `Hidden required field blocked submission` (Severity: High, Confidence: 100%).
   - Toggle **Show debug markers** off and on. Confirm markers appear and disappear in the UI.

2. **Disabled Submit Button (`/disabled-button.html`)**:
   - Click disabled submit button.
   - Stop and analyze. Expect `Submit button was disabled` (Severity: High, Confidence: 95%).

3. **Invisible Validation Error (`/invisible-error.html`)**:
   - Click Reset. Enter invalid email, click Subscribe.
   - Stop and analyze. Expect `Validation failed without visible feedback` (Severity: Medium, Confidence: 80%).

4. **Failed Network Request (`/failed-api.html`)**:
   - Enter text, click Send feedback.
   - Stop and analyze after network failure displays. Expect `Network request failed after submit` (Severity: High, Confidence: 85%+).

5. **Successful Submission (`/success-form.html`)**:
   - Fill valid inputs, click Subscribe.
   - Stop and analyze. Expect `No clear failure detected` (Severity: Low).

6. **Export Tests**:
   - Click **Copy report**, **Copy GitHub issue**, and **Copy Jira report**. Confirm copy notification toast and check pasted clipboard syntax.
   - Verify that show/hide debug marker settings are respected in all copied outputs.

7. **History Management**:
   - Generate multiple reports across different forms.
   - Verify that up to 10 reports are listed under **Recent reports**.
   - Verify that generating an 11th report prunes the oldest entry.
   - Click **Open** on a previous report and check that the details load and exports copy the selected history item.
   - Click **Delete** on a specific item to remove it.
   - Click **Clear history** to clear all items.
   - Close the popup, reopen, and confirm that history is retained.

---

## Privacy Notes

- **Zero Server Interaction**: All analysis and history storage are kept locally in the user's browser storage.
- **No Form Input Stored**: Only element type and field presence/state metadata is recorded. Actual text, password values, and custom details are ignored.
- **Privacy-Safe Network Interception**: Captures HTTP request URLs and response codes, but ignores request/response payload bodies, cookies, and HTTP headers.

---

## Known Limitations

- **Metadata Analysis Only**: FormTrace does not read form field values, so validation issues relying on specific value rules (e.g. password strength) are not analyzed directly unless they trigger HTML5 validation states.
- **Privacy-Safe Interception**: Technical details will show network failures but cannot report exact payload data.
- **Popup Lifecycle**: The popup layout is sandboxed by Chrome; while the new history feature protects against report loss, closed popups will abort active recording states (we plan to mitigate this in Build 3/4).
- **Complex UI Frameworks**: Certain deeply custom Single Page App forms may bypass standard event capturing rules and require custom heuristics.

---

## Recommended Next Steps: Build 3

The next planned phase of development is **Build 3 — CSS Blame Overlay**:
- Direct visual page element highlighting using a non-invasive in-page overlay.
- Highlighting hidden required inputs, disabled buttons, and validation targets directly in the page DOM.
- Toggleable overlay mode controlled directly from the extension popup.
