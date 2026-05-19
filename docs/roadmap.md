# FormTrace — Roadmap

## Build 1 — MVP (Current)

**Status:** Complete

### Delivered
- Chrome extension (Manifest V3, WXT + React + TypeScript)
- Popup UI with dark mode, recording controls, stats, analysis card
- Content script recording: form events, field states, submit detection
- Network failure detection (fetch + XHR)
- Console error capture
- Rule-based analysis engine with 8 detection rules
- Confidence scoring (0–100) and severity classification
- Markdown report generation and copy-to-clipboard
- `chrome.storage.local` persistence
- Privacy-safe field serialization
- 5 demo pages for manual testing
- Full documentation

---

## Build 2 — Network Tracing & SPA Support

**Focus:** Deeper network insight and better handling of single-page applications.

### Planned
- Improved network timeline — correlate network failures with specific submit attempts
- SPA route change detection — detect form submission that causes a client-side navigation
- Request/response body inspection (with privacy filtering)
- Detection of 401/403/429 responses as likely auth or rate-limit failures
- Better handling of React/Vue/Angular form event patterns
- Popup: network timeline panel

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
