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
- **Goal**: Refine the visual experience when FormTrace runs in a wider, taller panel context.
- **Improvements**:
  - Automatically expand technical details / root cause when a high-severity issue is detected.
  - Show a persistent "Recording active" pulse indicator so users don't forget it's running.
  - Expand the "Recent reports" history view to take advantage of the vertical space.
  - **Scroll Usability (Follow-up):** Increased scrollbar width, removed nested scrolling friction in history lists, and added bottom padding to ensure the UI feels native and comfortable to scroll when pinned to the side.
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

## Issue 4: CSS Blame Overlay / Hidden Element Cause Inspector [COMPLETED]
- **Goal**: Improve FormTrace's ability to explain WHY a required field or form element is visually unavailable using a privacy-first DOM inspector.
- **Files Affected**:
  - `src/types/formtrace.ts`
  - `src/recorder/inspectElementVisibility.ts`
  - `src/utils/dom.ts`
  - `src/analyzer/analyzeSession.ts`
  - `tools/css-blame-check.ts`
- **Implementation Notes**:
  - Exposes causes like `display:none`, `opacity:0`, `hidden` attributes, and `offscreen` positioning without leaking user input or DOM values.
  - Automatically appends CSS cause flags to the Technical Details section and concise finding summary.
- **Risk Level**: **Low**

---

## Issue 5: Framework Mimic Demo Pages [COMPLETED]
- **Goal**: Create representative test pages simulating React, Vue, Angular, and other modern SPA implementations to ensure FormTrace's robust, generic heuristics succeed in complex scenarios.
- **Demos Created**:
  - `react-like-controlled-form.html`: JS submit handler with conditional rendering hiding a required field.
  - `vue-like-conditional-form.html`: Required field hidden within a collapsed (v-show) ancestor.
  - `angular-like-disabled-submit.html`: State-bound HTML `disabled` attribute on the submit button.
  - `custom-validation-no-visible-error.html`: JS `.checkValidity()` prevention without rendering a visible error to the user.
  - `async-submit-api-error.html`: Async SPA fetch failure returning a fake HTTP 404.
- **Risk Level**: **Low**
