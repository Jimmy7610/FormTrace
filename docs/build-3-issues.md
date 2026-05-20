# FormTrace — Build 3 Issues & Tasks

This document breaks Build 3 down into small, isolated, and implementable tasks. Each task contains target files, acceptance criteria, and risk level classifications.

---

## Issue 1: Native Side Panel Mode & Legacy Persistent Window [COMPLETED]
- **Goal**: Allow users to keep FormTrace open beside the page using Chrome Side Panel layout, or in a separate standalone window if preferred, preventing automatic popup closure when clicking away.
- **Files Affected**:
  - [FormTracePanel.tsx](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/src/ui/FormTracePanel.tsx) (UI layout core)
  - [sidePanel.ts](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/src/panels/sidePanel.ts) (Side panel manager)
  - [persistentWindow.ts](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/src/windows/persistentWindow.ts) (Window manager)
  - [App.tsx (Side Panel)](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/entrypoints/sidepanel/App.tsx) (Side panel entry component)
  - [style.css](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/entrypoints/popup/style.css) (Flexible sizing styles)
  - [sidepanel-check.ts](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/tools/sidepanel-check.ts) (Automated test)
  - [persistent-window-check.ts](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/tools/persistent-window-check.ts) (Automated test)
  - [build-output-check.mjs](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/tools/build-output-check.mjs) (Production string check)
  - [package.json](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/package.json) (Test scripts registry)
- **Acceptance Criteria**:
  1. A primary "Open side panel" button exists in the normal popup panel footer with helper text explaining its usage.
  2. Clicking "Open side panel" invokes `chrome.sidePanel.open` with fallback handling from current window ID to active tab ID context.
  3. The side panel loads `sidepanel.html` and renders the shared panel UI in a full-height scrollable container.
  4. A secondary "Open separate window" link exists in the normal popup panel footer as a legacy fallback.
  5. The separate window layout is responsive, enforces single-instance restriction, and targets `persistent.html` at default dimensions of `420` width and `720` height.
  6. The side panel helper logs `FormTrace side panel active` upon successful initialization.
  7. Automatic tests verify side panel manifest registration, permission configuration, action button text, and context queries.
- **Risk Level**: **Medium**

---

## Issue 2: Side Panel UX Polish [COMPLETED]
- **Goal**: Refine the visual UX and helper texts of the side panel to make it clearer for end-users, without disrupting the standard action popup layout.
- **Files Affected**:
  - `src/ui/FormTracePanel.tsx` (Component text & tooltips)
  - `entrypoints/popup/style.css` (Typography wrapping & scroll stability)
  - `tools/sidepanel-ux-check.ts` (New automated string check)
  - `package.json` (Verification pipeline registry)
- **Acceptance Criteria**:
  1. Helper text for side panel mode is added and strictly visible only inside the side panel layout.
  2. "Recording active" displays instead of "Recording..." with additional instructional text.
  3. Reset button tooltip explains it clears the session, not history.
  4. Automated `npm run sidepanel:ux-check` verifies production UI strings.
- **Risk Level**: **Low**

---

## Issue 3: Session State Clarity [COMPLETED]
- **Goal**: Make it clearer which tab/page FormTrace is recording and what the current recording/session state means, especially in Side Panel mode.
- **Files Affected**:
  - `src/ui/FormTracePanel.tsx` (UI labels & active tab polling)
  - `entrypoints/popup/style.css` (Active page layout styling)
  - `tools/session-state-check.ts` (Automated string verifier)
  - `tools/build-output-check.mjs` (Production string verifier)
- **Acceptance Criteria**:
  1. UI displays active page context (title, URL) inside the panel.
  2. Recording start time is tracked and shown locally.
  3. Opened reports indicate whether they are "Current session report" or "Saved report".
  4. Warnings shown if active tab changes during side panel recording.
  5. Automated verification passes in production builds.
- **Risk Level**: **Low**

---

## Issue 4: CSS Blame Overlay [PLANNED]
- **Goal**: Inject visual highlighting overlays directly into the active tab to call out fields causing validation failures, empty required inputs, or disabled buttons.
- **Acceptance Criteria**:
  1. A toggle setting "Enable Blame Overlay" exists.
  2. Enabling it highlights failing form elements in the page with distinct color borders (e.g., orange/indigo).
- **Risk Level**: **Medium**

---

## Issue 5: Framework Mimic Demo Pages [PLANNED]
- **Goal**: Create production-style SPA and form framework simulation pages (React Hook Form, Formik, Shopify checkout flow, WordPress AJAX forms).
- **Acceptance Criteria**:
  1. Validate FormTrace recording and analysis engine rules against all complex framework form layouts.
- **Risk Level**: **Low**
