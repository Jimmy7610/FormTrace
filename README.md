# FormTrace

> **FormTrace helps developers, QA testers and support teams understand why forms fail — directly in the browser.**

FormTrace is a privacy-first Chrome extension that records form interactions, detects failure points (such as hidden fields, disabled buttons, lack of visible validation messages, and failed API requests), and generates a copyable Markdown bug report.

---

## Who is it for?

- **Frontend Developers**: Quickly debug validation and submission bugs.
- **QA Testers**: Capture precise steps and technical details for reproducible issues.
- **Support Teams**: Guide customers and record diagnostics when a submission fails.
- **SaaS & Web Agencies**: Ensure custom forms (React Hook Form, Formik, Shopify, WordPress) work perfectly.

---

## Current Status: Build 3 Development (In Progress)
 
FormTrace Build 3 is in progress. Native Side Panel mode has been completed, verified via automated integration tests, and is ready for manual QA verification. Legacy persistent window mode is also supported as a secondary fallback option.
 
### What FormTrace Can Detect:
1. **Hidden Required Fields**: Detects fields styled with `display: none` or `visibility: hidden` (or inside hidden containers) that are marked `required` but remain empty.
2. **Disabled Submit Buttons**: Detects pointer/keyboard attempts to submit a form when the submit button is set to `disabled` or has `aria-disabled="true"`.
3. **Validation Without Visible Feedback**: Detects when form validation fails (triggering an `invalid` state) but no visible error message appears in the DOM. Confidence score is optimized to **80%**.
4. **Failed Network Requests After Submit**: Captures failed asynchronous API calls (`fetch` / `XMLHttpRequest` returning `>= 400` or `0` status codes) triggered during or immediately after a submit attempt.
5. **Successful/No-Clear-Failure Forms**: Captures normal submissions and marks them as successful with no clear failure detected.
 
### Build 2 Enhancements:
- **Debug Marker Toggle**: Toggle visibility of internal debug diagnostics in reports.
- **Multiple Export Formats**: Copy reports as GFM GitHub Issues or Jira Rich Text descriptions.
- **Saved Local History**: Automatically saves the last 10 reports in local storage for viewing, copying, or deletion.
- **Privacy Disclaimers**: Explicitly highlights privacy-safe boundaries.
 
---

## Privacy Promise (100% Local & Secure)

FormTrace is designed from the ground up for strict security and compliance:
- **No Backend, No AI, No Cloud Services**: All computations, recording, and report compiling happen locally in the browser extension.
- **No Form Values Recorded**: Only field metadata (`empty` or `present`) is recorded. The actual inputs, text, passwords, or values are **never stored**.
- **No Sensitive Network Payload Stored**: Network probe logs URLs and HTTP statuses but **never stores request/response bodies, cookies, or headers**.

---

## Install & Run

### 1. Prerequisites
- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher
- **Google Chrome**

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Extension
```bash
npm run build
```
The compiled files will be output to the `.output/chrome-mv3` folder.

### 4. Run Automated Verification Suite
Verify type correctness, DOM layouts, analyzer rules, report normalization, and production build compliance:
```bash
npm run verify
```

### 5. Start Localhost Demo Server
> [!IMPORTANT]
> **Prefer localhost testing over file:// URL testing.**
> Loading demo pages using `file://` is discouraged because Chrome extension permissions for local files may reset whenever the extension is reloaded or updated. Always run the localhost demo server instead:
```bash
npm run demo
```
This serves the demo pages at: **`http://127.0.0.1:4173/`**

---

## Loading the Extension in Google Chrome

1. Build the production files: `npm run build`
2. Open Chrome and go to `chrome://extensions`.
3. Toggle the **Developer mode** switch in the top-right corner.
4. Click **Load unpacked** in the top-left.
5. Choose the `.output/chrome-mv3` directory inside the project repository.
6. The FormTrace extension badge will now be active in your toolbar.

---

## Exact Manual Test Checklist

Run the localhost demo server with `npm run demo` and open **`http://127.0.0.1:4173/`** in Chrome. Follow these verification steps:

### 1. Hidden Required Field Test
- **URL**: `http://127.0.0.1:4173/hidden-required-field.html`
- **Steps**:
  1. Open the FormTrace popup, click **Reset**, then click **Start recording**.
  2. Fill in all visible fields ("Username" and "Email").
  3. Click the **Register** button (nothing visibly happens).
  4. Wait 1 second, then open the popup and click **Stop & analyze**.
- **Expected Result**: 
  - Likely issue: `Hidden required field blocked submission` (Severity: `high`, Confidence: `100%`)
  - Technical Details include: `Hidden required empty fields found: 1` and `Analyzer runtime fix: hidden-required-first-pass`

### 2. Disabled Submit Button Test
- **URL**: `http://127.0.0.1:4173/disabled-button.html`
- **Steps**:
  1. Reset and click **Start recording** in the popup.
  2. Click the disabled **Submit** button on the page.
  3. Wait 1 second, then click **Stop & analyze** in the popup.
- **Expected Result**:
  - Likely issue: `Submit button was disabled` (Severity: `high`, Confidence: `95%` or higher)
  - Technical Details include: `Disabled submit attempt detected: 1`

### 3. Validation Without Visible Error Test
- **URL**: `http://127.0.0.1:4173/invisible-error.html`
- **Steps**:
  1. Reset and click **Start recording** in the popup.
  2. Leave the "Username" field blank and click **Submit**.
  3. Wait 1 second, then click **Stop & analyze** in the popup.
- **Expected Result**:
  - Likely issue: `Validation failed without visible feedback` (Severity: `medium`, Confidence: `80%`)
  - Technical Details include: `Forms detected: 1`, `Submit attempts: 1`

### 4. Failed Network Request Test
- **URL**: `http://127.0.0.1:4173/failed-api.html`
- **Steps**:
  1. Reset and click **Start recording** in the popup.
  2. Enter any input in the text box and click **Send feedback**.
  3. Wait for the red "Network error" text to appear on the page.
  4. Wait 1 second, then click **Stop & analyze** in the popup.
- **Expected Result**:
  - Likely issue: `Network request failed after submit` (Severity: `high`, Confidence: `80%` or higher)
  - Technical Details include: `Network failure detected: 1`, `Network DOM signal detected` (if using DOM signal fallback), and `Network probe active`

### 5. Successful Form Test
- **URL**: `http://127.0.0.1:4173/success-form.html`
- **Steps**:
  1. Reset and click **Start recording** in the popup.
  2. Fill in all valid fields and click **Submit**.
  3. Wait 1 second, then click **Stop & analyze** in the popup.
- **Expected Result**:
  - Likely issue: `No clear failure detected` (Severity: `low`)

---

## Known Limitations

- **Network Interception Limit**: Patches `window.fetch` and `XMLHttpRequest`. Requests sent *prior* to recording initialization or extension startup won't be captured.
- **Ephemerality**: As a Manifest V3 extension, the background page is a Service Worker that sleeps/wakes. To handle this, session states are securely cached to `chrome.storage.local`.
- **Diagnostic Markers**: Technical diagnostic markers (e.g., `Network probe active`) are hidden by default in report views and copied Markdown, but can be enabled via the "Show debug markers" toggle in settings.

---

## Roadmap

| Build | Status | Focus |
|---|---|---|
| **Build 1** | **Completed & Verified** | Core recorder, DOM signal checks, static network probe, report normalization, copyable Markdown. |
| **Build 2** | **Completed & Verified** | Settings toggle, validation confidence scoring, GitHub Issue & Jira report export formats, local session history, and release prep. |
| **Build 3** | **In Progress** | Side Panel mode, legacy persistent window, and Visual CSS Blame overlay to highlight broken elements directly in the page DOM. |
| **Build 4** | Planned | PDF export, and additional route/SPA support. |
| **Build 5** | Planned | Optional sync/team workspace integrations. |
 
---
 
## Build 3 Planning & Progress
 
Documentation for the current Build 3 cycle and past builds can be found here:
- [docs/build-3-plan.md](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/docs/build-3-plan.md) — Build 3 scope, goals, and architecture.
- [docs/build-3-issues.md](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/docs/build-3-issues.md) — Build 3 task list and issue tracking.
- [docs/build-3-test-plan.md](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/docs/build-3-test-plan.md) — QA verification steps for Build 3.
- [docs/build-2-release-notes.md](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/docs/build-2-release-notes.md) — Build 2 release notes and checklist.
- [docs/roadmap.md](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/docs/roadmap.md) — Overall project roadmap and development status.
