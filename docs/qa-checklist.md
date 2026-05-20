# FormTrace — QA Checklist (Build 1 Release Readiness)

Use this checklist to perform final manual quality assurance testing for FormTrace Build 1.

---

## 1. Preparation & Setup

Ensure the testing environment is clean and running the latest production build:

- [ ] Clear any old content script errors in Chrome by opening `chrome://extensions` and reloading/removing the extension.
- [ ] Install latest dependencies:
  ```bash
  npm install
  ```
- [ ] Run the type check and build pipeline:
  ```bash
  npm run build
  npm run build:check
  ```
- [ ] Start the local development server:
  ```bash
  npm run demo
  ```
- [ ] Load the unpacked extension from `.output/chrome-mv3` in `chrome://extensions`.
- [ ] Navigate to the localhost portal in Chrome: **`http://127.0.0.1:4173/`**
- [ ] **Recommendation**: Avoid testing via `file://` protocols since Chrome file-URL permission mappings can silently reset during extension reloading.

---

## 2. Scenario Testing Checklist

Perform the following manual scenarios in order. For each test, click **Reset** in the FormTrace popup before starting to ensure a fresh session.

### Scenario A: Hidden Required Fields
- **URL**: `http://127.0.0.1:4173/hidden-required-field.html`
- **Steps**:
  1. Click the FormTrace extension icon in the toolbar.
  2. Click **Reset** to clear any previous data, then click **Start recording**.
  3. Fill in the visible text fields: **Username** and **Email**.
  4. Click the **Register** button (nothing happens visually, page does not submit).
  5. Wait 1 second.
  6. Open the FormTrace popup and click **Stop & analyze**.
- **Checklist**:
  - [ ] Likely issue is: `"Hidden required field blocked submission"`
  - [ ] Severity is: `HIGH`
  - [ ] Confidence Score is: `100%`
  - [ ] Technical details include:
    - `"Hidden required empty fields found: 1"`
    - `"Analyzer runtime fix: hidden-required-first-pass"`

### Scenario B: Disabled Submit Button
- **URL**: `http://127.0.0.1:4173/disabled-button.html`
- **Steps**:
  1. Open the popup, click **Reset**, then click **Start recording**.
  2. Fill in all visible text fields ("Username" and "Email").
  3. Attempt to click or press enter on the disabled **Submit** button.
  4. Wait 1 second.
  5. Open the popup and click **Stop & analyze**.
- **Checklist**:
  - [ ] Likely issue is: `"Submit button was disabled"`
  - [ ] Severity is: `HIGH`
  - [ ] Confidence Score is: `95%` or higher
  - [ ] Technical details include:
    - `"Disabled submit attempt detected: 1"`

### Scenario C: Invisible Validation Error
- **URL**: `http://127.0.0.1:4173/invisible-error.html`
- **Steps**:
  1. Open the popup, click **Reset**, then click **Start recording**.
  2. Leave the "Username" field blank.
  3. Click the **Submit** button (nothing visibly changes on the screen).
  4. Wait 1 second.
  5. Open the popup and click **Stop & analyze**.
- **Checklist**:
  - [ ] Likely issue is: `"Validation failed without visible feedback"`
  - [ ] Severity is: `MEDIUM`
  - [ ] Confidence Score is: `35%` or higher
  - [ ] Technical details include:
    - `"Forms detected: 1"`
    - `"Submit attempts: 1"`

### Scenario D: Failed API/Network Error
- **URL**: `http://127.0.0.1:4173/failed-api.html`
- **Steps**:
  1. Open the popup, click **Reset**, then click **Start recording**.
  2. Type any text in the feedback box.
  3. Click **Send feedback**.
  4. Wait until the red `"Network error: Failed to fetch"` message is visible in the page container.
  5. Wait 1 second.
  6. Open the popup and click **Stop & analyze**.
- **Checklist**:
  - [ ] Likely issue is: `"Network request failed after submit"`
  - [ ] Severity is: `HIGH`
  - [ ] Confidence Score is: `85%` or higher
  - [ ] Technical details include:
    - `"Network failure detected: 1"`
    - `"Network probe active"`
    - `"Network probe injected"`
    - `"Network DOM signal detected"` (fallback triggered)

### Scenario E: Successful Form Submission
- **URL**: `http://127.0.0.1:4173/success-form.html`
- **Steps**:
  1. Open the popup, click **Reset**, then click **Start recording**.
  2. Fill in all fields with valid data.
  3. Click **Subscribe**.
  4. Observe success message: `"Successfully subscribed!"`.
  5. Wait 1 second.
  6. Open the popup and click **Stop & analyze**.
- **Checklist**:
  - [ ] Likely issue is: `"No clear failure detected"`
  - [ ] Severity is: `LOW`
  - [ ] Confidence Score is: `15%` or lower

---

## 3. General Interface & Regression Checks

Verify the extension UI complies with MVP requirements:

- [ ] **Badge**: The Build badge clearly displays `"Build 1"`.
- [ ] **Reset**: Clicking **Reset** resets all event/form/submit counters to zero and disables the **Copy report** button.
- [ ] **Copy to Clipboard**: Clicking **Copy report** copies the full Markdown report without errors.
- [ ] **Diagnostics**: Runtime debug markers (e.g. `Network probe active`) appear in technical details, but no raw form values are exposed.
- [ ] **Code Quality**: Running `npm run verify` returns zero lint, compilation, or verification errors.
