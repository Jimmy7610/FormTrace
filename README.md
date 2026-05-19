# FormTrace

> **FormTrace helps developers, QA testers and support teams understand why forms fail — directly in the browser.**

FormTrace is a privacy-first Chrome extension that records a form interaction session, analyzes the most likely reason a form did not submit, and generates a clear report you can copy as Markdown.

---

## Who is it for?

- Frontend developers debugging form submissions
- QA testers writing test cases for web forms
- Support teams helping users who "can't submit the form"
- SaaS teams, web agencies, WordPress / Shopify / Webflow developers

---

## What does FormTrace do in Build 1?

- Detects forms on the current page (including dynamically added forms)
- Records submit button clicks, form submit events, field changes, invalid events
- Detects disabled submit buttons at click time
- Detects hidden required fields that silently block submission
- Detects required empty fields
- Detects invalid fields via HTML5 Constraint Validation API
- Detects missing visible error feedback after failed submit attempts
- Detects click-without-submit (button clicked but no submit event fired)
- Detects basic fetch/XHR failures after submission
- Detects console errors during the recording session
- Generates a confidence-scored, severity-rated analysis report
- Produces a copyable Markdown report
- Stores sessions and reports locally in `chrome.storage.local`

---

## What FormTrace does NOT do yet

- No AI or external API calls
- No cloud storage or data upload of any kind
- No CSS blame overlay (planned for Build 3)
- No multi-tab recording
- No export to GitHub Issues or Jira (planned for Build 4)
- No team / collaboration features (planned for Build 5)
- No SPA-aware route change detection (planned for Build 2)

---

## Privacy Promise

FormTrace **never uploads any data**. Everything runs locally in your browser.

- Form field **values are never stored** — only metadata (`empty` or `present`)
- Password fields are never recorded
- Credit card fields are never recorded
- All data stays in `chrome.storage.local` on your own machine
- Clearing extension data removes everything

---

## Install & Run

### Prerequisites

- Node.js 18+
- npm 9+
- Google Chrome

### Install dependencies

```bash
npm install
```

### Run in dev mode (Chrome)

```bash
npm run dev
```

This starts WXT in watch mode. Load the unpacked extension from `.output/chrome-mv3/`.

### Typecheck

```bash
npm run typecheck
```

### Build for production

```bash
npm run build
```

Output will be in `.output/chrome-mv3/`.

### Create a ZIP for distribution

```bash
npm run zip
```

---

## Loading in Chrome

1. Run `npm run build`
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (toggle in the top-right)
4. Click **Load unpacked**
5. Select the `.output/chrome-mv3/` folder
6. The FormTrace icon will appear in your toolbar

---

## Testing with Demo Pages

Open any of the files in the `demo-pages/` folder directly in Chrome:

| File | Tests |
|---|---|
| `index.html` | Overview / links |
| `disabled-button.html` | Disabled submit button |
| `hidden-required-field.html` | Hidden required field |
| `invisible-error.html` | Validation without visible error |
| `failed-api.html` | Failed fetch/network request |
| `success-form.html` | Successful submission |

**Test flow:**
1. Open a demo page in Chrome
2. Click the FormTrace extension icon
3. Click **Start recording**
4. Interact with the form
5. Click **Stop & analyze**
6. Read the analysis, copy the Markdown report

---

## Known Limitations

- The content script is injected on `<all_urls>` — some CSP-strict pages may block it
- Network recording patches `window.fetch` and `XMLHttpRequest` — cannot detect requests made before the content script loads
- Console recorder patches `console.error` — cannot capture errors from before recording starts
- Popup polling interval is 1.5s — live event counts may lag slightly
- MV3 service workers are ephemeral — state is persisted to `chrome.storage.local` to survive restarts

---

## Roadmap

| Build | Focus |
|---|---|
| Build 1 | MVP — recording, analysis, Markdown report |
| Build 2 | Improved network tracing, SPA route change detection |
| Build 3 | CSS Blame Overlay module |
| Build 4 | Export formats: GitHub Issues, Jira, PDF |
| Build 5 | Optional team/pro features |
