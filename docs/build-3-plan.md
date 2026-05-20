# FormTrace — Build 3 Implementation Plan

## Goal
The primary objective of FormTrace Build 3 is to improve convenience and visual context during testing. The theme is **"Persistent Workspaces and Visual Element Highlighting."**

---

## Why Build 3 Matters
While Build 2 added rich export formatting and report history, developers and QA teams still face two main hurdles:
1. **Popup Lifecycle Limitations**: Standard Chrome popup interfaces close automatically when clicking away. Opening a separate persistent window allows FormTrace to stay visible during complex user flows.
2. **Finding the Culprit Element**: When a form contains many fields (some of which are hidden, disabled, or validation-blocked), reading the text report is helpful, but highlighting the exact problem element directly on the page visually (CSS Blame Overlay) speeds up debugging.
3. **Validating Framework Compatibility**: Rescheduled from Build 2, testing FormTrace against popular form libraries (React Hook Form, Formik, Webflow) ensures heuristic rules are accurate for production structures.

---

## Scope: What is Included

### 1. Optional Persistent Window Mode (Issue 1)
- **Shared UI Core**: Refactored the popup layout into a shared `<FormTracePanel>` component so that both the extension action popup and the persistent window share the exact same logic.
- **Window Controller**: Standard helper `persistentWindow.ts` managing window lifecycle, window dimensions (420x720), and focusing/opening.
  - *Note on Bugfix*: Initial implementation failed manual testing because the window did not stay visible. Fixed by adding `"windows"` permission in `wxt.config.ts` and configuring `chrome.windows.create` with `type: "popup"`, `focused: true` to guarantee separate window lifecycle.
- **Single-Instance Restriction**: Checks `chrome.storage.local` to prevent opening duplicate windows, updating focus on the existing instance if clicked again.
- **Responsive Layout**: Replaced rigid width boundaries with responsive rules when rendered in persistent window mode.

### 2. CSS Blame Overlay (Issue 2 - Planned)
- **Overlay Injection**: Inject styling rules and indicators directly into the tab's DOM to flag validation failures or hidden inputs.
- **Toggle Control**: Toggle element highlighting from the FormTrace UI.

### 3. Framework Mimic Demo Pages (Issue 3 - Planned)
- Create test pages representing React Hook Form, Formik, Shopify Checkout, Webflow, and WordPress structures.

---

## Scope: What is NOT Included (Out of Scope)
- **No Cloud Backend**: All storage (recent sessions, settings, persistent state) remains 100% local.
- **No Automatic Recording in Window**: Recording is still triggered via the standard tab capture model, keeping permissions narrow and performance high.

---

## Implementation Order
1. **Issue 1**: Optional persistent FormTrace window (Completed).
2. **Issue 2**: CSS Blame Overlay (Planned).
3. **Issue 3**: Framework Mimic Demo Pages (Planned).
