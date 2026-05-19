# FormTrace — Privacy Policy

**Last updated:** May 2026

---

## Summary

FormTrace is a **local-only** browser extension. It does not upload, transmit, or share any data with any server, service, or third party.

---

## What data is collected locally

FormTrace stores the following data in `chrome.storage.local` on your own device:

| Data | What is stored |
|---|---|
| Form field metadata | Tag name, input type, name, id, label text |
| Field state | Whether the field is required, disabled, hidden |
| Field validity | Whether the field passed HTML5 validation |
| Validation message | The browser's validation message (e.g. "Please fill in this field") |
| Value state | `"empty"` or `"present"` — **never the actual value** |
| Network failures | URL of failed request, HTTP status code |
| Console errors | First 200 characters of `console.error` output |
| Page URL | The URL of the page being recorded |
| Page title | The title of the page being recorded |
| Timestamp | When the session was recorded |

---

## What is NOT collected

- ❌ Form field values (text, numbers, selections)
- ❌ Password values — ever, under any circumstance
- ❌ Credit card numbers or CVV codes
- ❌ Personal data (names, emails, addresses as values)
- ❌ Cookies or session tokens
- ❌ Browser history
- ❌ Data from other tabs or pages
- ❌ Anything uploaded to a server

---

## Password & credit card handling

FormTrace explicitly **never stores the value** of any field. For fields of type `password`, or fields whose name/id suggests credit card or sensitive financial data, FormTrace stores only the `valueState` (`"empty"` or `"present"`).

The code for this is in `src/utils/privacy.ts`. It is open source and auditable.

---

## Network requests

FormTrace makes **zero outbound network requests**. It operates entirely offline. There is no analytics, no telemetry, and no crash reporting.

---

## Local storage

All data is stored in `chrome.storage.local`. This storage is:

- Local to your Chrome profile on your device
- Not synced to `chrome.storage.sync` or any Google account
- Cleared when you click **Reset** in the popup
- Cleared when you uninstall the extension

---

## User trust principles

1. **Transparency** — all source code is readable and auditable
2. **Minimalism** — only the metadata needed for analysis is recorded
3. **Local-first** — no backend, no cloud, no third parties
4. **Control** — you can reset or delete all data at any time
5. **Honesty** — this policy says exactly what is and isn't collected
