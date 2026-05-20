# FormTrace — Build 3 Test Plan

This document describes the manual and automated validation routines to verify both Build 1/2 regressions and new Build 3 feature updates.

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

## 2. Build 1 & 2 Regression Verification

Run through these checks to ensure existing functionality remains unbroken:

- Hidden Required Field Test (`/hidden-required-field.html`)
- Disabled Submit Button Test (`/disabled-button.html`)
- Validation Without Visible Error Test (`/invisible-error.html`)
- Failed Network Request Test (`/failed-api.html`)
- Successful Form Test (`/success-form.html`)
- Settings Toggle (Debug Markers)
- Export formats (Copy GitHub issue, Copy Jira report)
- Local History storage (10 items, pruning, load, delete, clear)

---

## 3. Build 3 Feature Verification

Verify the following new capabilities:

### Test 3.1: Side Panel Mode Launch
- **Steps**:
  1. Open the FormTrace extension action popup.
  2. Locate the "Open side panel" button in the footer.
  3. Click **"Open side panel"**.
- **Expected Result**:
  - Chrome Side Panel opens on the right side of the active tab.
  - The side panel loads `sidepanel.html` and renders the FormTrace UI with full height.
  - The header displays a green badge stating "Side panel".
  - The console logs: `[FormTrace] FormTrace side panel active via windowId: ...` or `via tabId: ...`.

### Test 3.2: Legacy Separate Window Launch
- **Steps**:
  1. Open the FormTrace extension action popup.
  2. Locate the "Open separate window" action link below the side panel button.
  3. Click **"Open separate window"**.
- **Expected Result**:
  - A separate browser popup window opens loading `persistent.html`.
  - The window's outer dimensions match `420` width and `720` height.
  - The persistent window header displays a green/indigo badge stating "Persistent window".

### Test 3.3: Separate Window Single-Instance & Stale Re-creation
- **Steps**:
  1. With the separate window open, click on the browser or page to blur/hide it behind other windows.
  2. Click the FormTrace extension popup again and click **"Open separate window"**.
- **Expected Result**:
  - No new window is spawned.
  - The existing separate window is focused and brought to the front.
- **Steps 2**:
  1. Close the separate window manually.
  2. Click the FormTrace extension popup again and click **"Open separate window"**.
- **Expected Result 2**:
  - FormTrace successfully detects the stale ID and spawns a new separate window instance.

### Test 3.4: Automated Test Verification
- **Steps**:
  1. Run the test verification scripts:
     ```bash
     npm run sidepanel:check
     npm run persistent:check
     ```
- **Expected Result**:
  - Both scripts execute in Node, mocking Chrome Extension APIs, and print their respective `PASSED!` messages, exiting with status code 0.

### Test 3.5: Side Panel UX Assertions
- **Steps**:
  1. Run the UX verification script:
     ```bash
     npm run sidepanel:ux-check
     ```
- **Expected Result**:
  - The script executes in Node, asserts that all stable layout helper strings exist in `FormTracePanel.tsx`, and exits with status code 0.

### Test 3.6: Session State Content Assertions
- **Steps**:
  1. Run the session verification script:
     ```bash
     npm run session:check
     ```
- **Expected Result**:
  - The script executes in Node, asserts that all active page context strings and timestamp helpers exist, and exits with status code 0.

### Test 3.7: CSS Blame Inspection Logic Assertions
- **Steps**:
  1. Run the CSS blame verification script:
     ```bash
     npm run css:blame-check
     ```
- **Expected Result**:
  - The mock DOM tests simulate `display:none`, `visibility:hidden`, `opacity:0`, hidden attributes, and zero-size elements.
  - The script ensures that the `inspectElementVisibility` utility correctly maps to the corresponding `VisibilityCause` types.
  - Asserts that report output strings (`CSS cause:`) are present in source files.

### Test 3.8: Framework Mimic Demo Pages
- **Steps**:
  1. Run the framework demo script:
     ```bash
     npm run framework:check
     ```
- **Expected Result**:
  - Validates that all new framework demo pages (`react`, `vue`, `angular`, `async`, `custom-validation`) exist and contain correct simulation code without introducing external dependencies.
  - Ensures the demo index page properly links to all of them.

### Test 3.9: Side Panel Scroll UX Usability Assertions
- **Steps**:
  1. Run the scroll UX verification script:
     ```bash
     npm run scroll:ux-check
     ```
- **Expected Result**:
  - The script executes in Node, asserting that all stable scroll styling markers (e.g. `Side Panel scrollbar width for easier manual scrolling`) and data attributes exist in the CSS and source code, and exits with status code 0.

---

## 4. Manual QA Verification (Issue 1 Side Panel Retest)

### Test 4.1: Side Panel & Recording Manual Steps
1. Run:
   ```bash
   npm run build
   ```
2. Reload FormTrace in `chrome://extensions` page.
3. Run the demo server:
   ```bash
   npm run demo
   ```
4. Open the demo page: **`http://127.0.0.1:4173/hidden-required-field.html`**
5. Click the FormTrace toolbar icon to open the action popup.
6. Click **"Open side panel"**.
7. Confirm that the side panel stays visible beside the page even when clicking/interacting with the page itself.
8. Click **Start recording** in the side panel.
9. Interact with the form (fill visible fields, click Register).
10. Click **Stop & analyze** in the side panel.
11. Verify that the FormTrace analysis report renders fully, and you can copy to clipboard in all formats (Default, GitHub, Jira), show/hide debug markers, and view recent report history.
