# FormTrace — Product Specification

## Product Goal

FormTrace is a browser extension that helps developers, QA testers and support teams understand why web forms fail — without requiring access to backend logs, network tools, or DevTools expertise.

It records a form interaction session, analyzes the most likely failure cause using a rule-based engine, and produces a structured, shareable report.

---

## Target Users

| User | Use Case |
|---|---|
| Frontend developer | Debugging why a form doesn't submit after a deploy |
| QA tester | Writing reproducible bug reports for broken forms |
| Support team | Helping a user who reports "the form doesn't work" |
| SaaS team | Validating checkout / signup flows after UI changes |
| Web agency | Diagnosing client-reported form issues on WordPress / Webflow / Shopify |

---

## MVP Scope (Build 1)

### In scope

- Chrome extension (Manifest V3)
- Popup UI with recording controls and analysis display
- Content script recording: submit events, click events, field states, invalid events
- Network failure detection via fetch/XHR patching
- Console error capture
- Rule-based analysis engine (no AI)
- Confidence score (0–100) and severity rating (low/medium/high)
- Markdown report generation and copy-to-clipboard
- `chrome.storage.local` persistence of last session and report
- Privacy-safe field serialization (no actual values stored)
- 5 demo pages for manual QA testing

### Out of scope for Build 1

- Backend or cloud services
- AI-powered analysis
- SPA route change detection
- CSS overlay
- Export integrations
- Multi-tab recording
- Team features

---

## Core User Flow

1. User opens a page with a broken form
2. Opens the FormTrace popup
3. Clicks **Start recording**
4. Attempts to submit the form (fills fields, clicks submit, etc.)
5. Clicks **Stop & analyze**
6. Reads the analysis: likely issue, confidence score, severity
7. Optionally copies the Markdown report to share with a developer

---

## Main Feature List

- **Form detection** — counts forms on the page, watches for dynamically added forms via MutationObserver
- **Submit recording** — captures `submit` events and submit button `click` events
- **Field state capture** — records required, disabled, hidden, valid/invalid state (no values)
- **Disabled button detection** — detects clicks on disabled submit buttons
- **Hidden required field detection** — detects required fields hidden from the user
- **Validation detection** — uses HTML5 Constraint Validation API
- **Missing error feedback detection** — checks for visible error elements after submit attempt
- **Click-without-submit detection** — flags when a button click produced no form submit event
- **Network failure detection** — patches fetch/XHR to catch failed requests
- **Console error capture** — patches console.error during session
- **Analysis report** — rule-based, produces likelyIssue, confidenceScore, severity, findings, suggestedFixes
- **Markdown export** — structured, copyable Markdown report
- **Privacy-safe storage** — only metadata stored, never field values

---

## Non-Goals

- FormTrace is not a full network inspector (use DevTools Network tab for that)
- FormTrace is not an accessibility checker
- FormTrace does not modify or fix forms
- FormTrace does not communicate with any server
- FormTrace does not track users or sessions across sites
