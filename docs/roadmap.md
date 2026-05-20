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

**Status:** In Progress (Issue 1 & 2 Completed)

**Focus:** Reporting formats, framework-mimic testing, UX settings, and local export formats.

**Core Rules:**
- **No Backend**: Remains 100% client-side in the extension sandbox.
- **No AI**: Purely rule-based heuristic logic.

### Completed
- **Settings Toggle (UX)**: Toggle visibility of internal debug markers in the report (Issue 1).
- **Scoring Improvements**: Refined confidence scores for validation issues (Issue 2).

### Planned (In Progress)
- **Export Formats**: Copy as GitHub Issue template and Jira rich markup syntax.
- **Local Session History**: Queue and browse the last 5 sessions.
- **Framework Mimic Pages (Testing)**: Build demo pages to verify performance against React Hook Form, Formik, Shopify, Webflow, and WordPress form structures.
- **UI Readability**: Improve report aesthetics, cards, and dynamic severity highlighting.
- **Arch Planning**: Optional DevTools panel scoping and client-side SPA routing support.

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
