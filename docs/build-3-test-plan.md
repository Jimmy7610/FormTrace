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

### Test 3.1: Persistent Window Launch
- **Steps**:
  1. Open the FormTrace extension popup.
  2. Locate the "Open persistent window" action link in the footer.
  3. Click "Open persistent window".
- **Expected Result**:
  - A separate browser popup window opens loading `persistent.html`.
  - The window's outer dimensions match `420` width and `720` height.
  - The persistent window header displays a green/indigo badge stating "Persistent window".
  - The layout stretches responsively to the full width and height of the window without rigid width margins.

### Test 3.2: Single-Instance Focus & Duplicate Prevention
- **Steps**:
  1. With the persistent window open, click on the browser or page to blur/hide the window behind other elements.
  2. Click the FormTrace extension icon in the toolbar again to open the popup.
  3. Click "Open persistent window".
- **Expected Result**:
  - No new window is spawned.
  - The existing persistent window is immediately focused and brought to the front of the screen.

### Test 3.3: Recreate Stale Window
- **Steps**:
  1. Close the persistent window by clicking its close button.
  2. Click the FormTrace popup icon in the toolbar.
  3. Click "Open persistent window".
- **Expected Result**:
  - Since the previous window ID is now stale, FormTrace successfully creates, opens, and focuses a new window.

### Test 3.4: Automated Test Verification
- **Steps**:
  1. Run the test verification script:
     ```bash
     npm run persistent:check
     ```
- **Expected Result**:
  - The script executes in Node, mocking Chrome Extension APIs, and prints:
    `Persistent Window Verification PASSED!`
    exiting with status code 0.
