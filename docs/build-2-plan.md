# FormTrace — Build 2 Implementation Plan

## Goal
The primary objective of FormTrace Build 2 is to elevate the utility of the extension from a verified prototype to a robust, developer-friendly diagnostic companion. The theme is **"Better reports, cleaner debugging, and real-world form testing."**

---

## Why Build 2 Matters
While Build 1 successfully proved that common form blockages can be captured and resolved in a privacy-first manner, it remains a developer MVP. To make FormTrace ready for daily workflows:
1. **Reporting formats must fit into developer issue trackers**: Copying standard Markdown is helpful, but structured formats for GitHub Issues and Jira speed up QA-to-developer handoffs.
2. **Technical logs must be configurable**: Build 1 includes diagnostic strings (e.g. `Network probe active`) in the final technical details. Developers need the ability to hide these diagnostic markers for cleaner presentation.
3. **Session retention**: Users should be able to recall past recordings to compare successful vs. failed submissions without losing their state when the popup closes.
4. **Real-world framework support**: The extension needs testing against modern SPA frameworks and form builders to verify that rules translate properly to production apps.

---

## Scope: What is Included

### 1. Cleaner Reporting & Visibility Config
- **Technical Debug Toggle**: A checkbox/setting in the popup settings panel to show or hide raw internal diagnostic messages (e.g. `Network probe active`, `Network DOM signal detected`) in the final exported report.
- **Improved Confidence Rules**: Refine the analysis rule for `Validation failed without visible feedback` to avoid overlapping confidence score ranges and reduce false positives.

### 2. Multi-Format Exports
- **GitHub Issue Format**: Optimized markdown with environment details, captured steps, severity, and clear headings matching standard GitHub repository bug issue templates.
- **Jira Bug Report Format**: Formatting using Jira's markup notation (`{panel}`, `*bold*`, `{code:markdown}`) for clean styling in Jira cloud tickets.

### 3. Local History / Saved Sessions
- List the last 5 recorded sessions using `chrome.storage.local`.
- Allow the user to click a past session to reload its analysis, view its findings, and re-export the report.

### 4. Advanced Test Demos (Framework-Mimics)
- **React Hook Form**: A demo showcasing state-based validation with delayed DOM rendering of error logs.
- **Formik**: A demo featuring validation on-touch and submission-blocking states.
- **Shopify Checkout**: Mimics multistage page states with complex input validations.
- **Webflow Form**: Form structures containing custom styling and attribute-based inputs.
- **WordPress CF7**: Custom AJAX-driven form wrapper scripts.

### 5. Architectural Preparations
- **DevTools Panel Planning**: Detailed file layout guidelines for adding a custom Chrome DevTools panel in Build 3.
- **SPA Navigation Tracking**: Design patterns to listen to client-side state/route switches without interrupting ongoing session recordings.

---

## Scope: What is NOT Included (Out of Scope)
- **No Cloud/Backend Service**: All session logs, reports, and settings remain 100% in local `chrome.storage.local` to uphold our privacy promise.
- **No AI Processing**: Analyzer rules remain purely local, deterministic, and heuristic-based.
- **No Live DOM Highlighting (CSS Blame Overlay)**: Visual target outlining in the page DOM is deferred to Build 3.

---

## User Value
- **Faster QA Handoff**: Bug reports can be dumped straight into GitHub/Jira with zero manual formatting.
- **Lower Debug Noise**: Reports look cleaner when technical diagnostic flags are hidden.
- **Historical Analysis**: Users don't have to keep the recording tab open to check previous results.

---

## Technical Risks & Mitigations
- **Storage Limits**: `chrome.storage.local` could fill up if session lists grow too large. *Mitigation*: Limit the history queue strictly to the 5 most recent sessions and prune older items automatically.
- **SPA State Persistence**: Client-side page navigation can reload or clean state variables. *Mitigation*: Session recording state will survive soft reloads by constantly mirroring the capture log to storage.

---

## Suggested Feature Implementation Order
1. **Issue 1**: Debug marker visibility toggle (Popup UI + settings sync).
2. **Issue 2**: Validation-without-visible-feedback confidence score refinement.
3. **Issue 3 & 4**: GitHub & Jira export formats.
4. **Issue 5**: Session history storage queue (last 5 sessions).
5. **Issue 6**: Real-world framework mimic pages.
6. **Issue 7**: Report UI visual cleanup.
7. **Issue 8**: Regression validation.
