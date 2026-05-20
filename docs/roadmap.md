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

## Build 2 — Network Tracing & Export Support

**Status:** Completed & Verified

**Focus:** Reporting formats, UX settings, local session history, and release readiness.

### Delivered
- **Settings Toggle (UX)**: Toggle visibility of internal debug markers in the report (Issue 1).
- **Scoring Improvements**: Refined confidence scores for validation issues to 80% (Issue 2).
- **GitHub Issue Export**: Formatted GFM Markdown bug report generation (Issue 3).
- **Jira Export Format**: Copy as Jira rich markup syntax (Issue 4).
- **Local Session History**: Queue and browse the last 10 sessions with open/delete actions (Issue 5).
- **Polish & Release Prep**: Refined CSS padding/alignment and verified metadata version v1.1.0 (Issue 6).

---

## Build 3 — CSS Blame Overlay & Framework Demos

**Status:** In Progress

**Focus:** Persistent window mode, visual overlay to identify layout-related form issues, and SPAs.

### Delivered
- **Optional Persistent Window Mode**: Add a separate persistent window that stays open when focus shifts, complete with flexible layouts, a header badge, single-instance enforcement, and robust chrome.windows.create standalone lifecycle management.

### Planned
- Visual CSS Blame overlay to highlight broken elements directly in the page DOM.
- framework-mimic-pages: Build demo pages to verify performance against React Hook Form, Formik, Shopify, Webflow, WordPress, etc.

---

## Build 4 — PDF Export & Advanced Route Tracking

**Focus:** Exporting and routing options.

### Planned
- Export as PDF
- Single Page App (SPA) routing support
- Custom report templates
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
