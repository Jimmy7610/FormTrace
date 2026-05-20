# FormTrace — Roadmap

## Build 1 — MVP (Current)

**Status:** Completed & Manually Verified

### Delivered
- Chrome extension (Manifest V3, WXT + React + TypeScript)
- Popup UI with dark mode, recording controls, stats, analysis card
- Content script recording: form events, field states, submit detection
- Network failure detection (fetch + XHR) using CSP-compliant static probe (`page-network-probe.js`)
- DOM signal fallback scan for network error text on submit
- Console error capture
- Rule-based analysis engine with 8 detection rules
- Confidence scoring (0–100) and severity classification
- Markdown report generation and copy-to-clipboard
- `chrome.storage.local` persistence
- Privacy-safe field serialization
- 5 demo pages for manual testing
- Full QA checklist and documentation

---

## Build 2 — Network Tracing & Framework Support

**Focus:** Deeper network insight, better confidence scoring, optional panels, and modern web form frameworks.

**Planned Features:**
- **Enhanced Framework Testing**: Broaden compatibility and add specific test suites for React Hook Form, Formik, Shopify, Webflow, and WordPress forms.
- **Saved Local Sessions**: Save, list, and reload previous local recording sessions.
- **Optional DevTools Panel**: Provide a dedicated tab in Chrome Developer Tools for a full-pane debugger workspace.
- **Better SPA Support**: Add route change detection to trace forms that perform client-side history navigation or virtual submissions.
- **Export Formats**: Support exporting reports directly in GitHub Issue and Jira markdown formats.
- **Debug Settings Panel**: Add a toggle in the UI to hide or show technical debug markers (e.g. `Network probe active`) in the final report.
- **Better confidence scoring for validation-without-visible-feedback**.
- CORs / detailed status mapping for failed fetch requests.

---

## Build 3 — CSS Blame Overlay

**Focus:** Visual overlay to identify layout-related form issues.

### Planned
- In-page overlay mode (non-invasive, opt-in)
- Highlight hidden required fields with a subtle indicator
- Highlight disabled buttons with explanation tooltip
- Show field validation state visually on the page
- Toggle overlay on/off from the popup
- Color-coded severity indicators on form elements

---

## Build 4 — Export Formats & Issue Templates

**Focus:** Turn FormTrace reports into actionable developer tickets.

### Planned
- Export report as GitHub Issue (Markdown with template)
- Export report as Jira ticket description
- Export as PDF
- Custom report templates
- Shareable report link (local file or encoded URL)
- Session replay as JSON export

---

## Build 5 — Optional Team / Pro Features

**Focus:** Collaborative debugging for agencies and SaaS teams.

### Planned
- Optional self-hosted report server (bring your own backend)
- Session sharing via secure link
- Team workspace with shared report history
- Integration with project management tools
- Custom detection rules per project
- White-label option for agencies
