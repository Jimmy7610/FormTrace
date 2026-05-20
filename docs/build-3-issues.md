# FormTrace — Build 3 Issues & Tasks

This document breaks Build 3 down into small, isolated, and implementable tasks. Each task contains target files, acceptance criteria, and risk level classifications.

---

## Issue 1: Optional Persistent FormTrace Window [COMPLETED]
- **Goal**: Allow users to open FormTrace in a separate pop-out window that stays open when focus shifts, preventing automatic popup closure.
- **Files Affected**:
  - [FormTracePanel.tsx](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/src/ui/FormTracePanel.tsx) (UI layout core)
  - [persistentWindow.ts](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/src/windows/persistentWindow.ts) (Window manager)
  - [App.tsx (Popup)](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/entrypoints/popup/App.tsx) (Mount core panel)
  - [App.tsx (Persistent)](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/entrypoints/persistent/App.tsx) (Persistent window entry component)
  - [index.html](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/entrypoints/persistent/index.html) (Persistent window entry HTML)
  - [main.tsx](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/entrypoints/persistent/main.tsx) (Persistent bootstrap script)
  - [style.css](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/entrypoints/popup/style.css) (Flexible sizing styles)
  - [persistent-window-check.ts](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/tools/persistent-window-check.ts) (Tests)
  - [build-output-check.mjs](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/tools/build-output-check.mjs) (Production string check)
  - [package.json](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/package.json) (Test scripts registry)
- **Acceptance Criteria**:
  1. A "Open persistent window" action link exists in the normal popup panel footer.
  2. Clicking "Open persistent window" opens a new browser window referencing `persistent.html` at default dimensions of `420` width and `720` height.
  3. Single-instance restriction: If the window is already open, clicking the action link will focus the existing window instead of launching a duplicate.
  4. The persistent window layout matches the popup theme but adapts responsively to fluid width/height resizing.
  5. Close/stale window tracking: If the window is closed manually, clicking the link again correctly creates a new window.
  6. Automatic unit tests verify:
     - Storage key existence (`formtracePersistentWindowId`)
     - Default width (420) and height (720) constants
     - Presence of stable string markers (`Open persistent window`, etc.)
     - Mocked lifecycle behavior (create, focus existing, recreate stale)
- **Manual QA Retest Required**:
  - The first implementation failed manual testing because the persistent window behaved like the normal action popup and did not stay visible when the user clicked outside.
  - The fix resolved this by declaring `"windows"` permission and ensuring `chrome.windows.create` uses `type: "popup"`, `focused: true`, and correct URL retrieval.
  - Retest manually using the exact test instructions in the test plan before accepting this issue.
- **Risk Level**: **Low**

---

## Issue 2: CSS Blame Overlay [PLANNED]
- **Goal**: Inject visual highlighting overlays directly into the active tab to call out fields causing validation failures, empty required inputs, or disabled buttons.
- **Acceptance Criteria**:
  1. A toggle setting "Enable Blame Overlay" exists.
  2. Enabling it highlights failing form elements in the page with distinct color borders (e.g., orange/indigo).
- **Risk Level**: **Medium**

---

## Issue 3: Framework Mimic Demo Pages [PLANNED]
- **Goal**: Create production-style SPA and form framework simulation pages (React Hook Form, Formik, Shopify checkout flow, WordPress AJAX forms).
- **Acceptance Criteria**:
  1. Validate FormTrace recording and analysis engine rules against all complex framework form layouts.
- **Risk Level**: **Low**
