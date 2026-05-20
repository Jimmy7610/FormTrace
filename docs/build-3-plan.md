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

### 1. Native Side Panel Mode & Legacy Persistent Window (Issue 1)
- **Native Side Panel**: Integrated Chrome Side Panel API permissions and registered `sidepanel.html` entrypoint in WXT config. Side Panel layout provides an elegant, non-obtrusive, always-visible side pane beside the active browser tab.
- **Legacy Persistent Window**: Maintained the standalone pop-out window (`persistent.html`) as a secondary option for environments or users that prefer separate window tracking.
- **Shared UI Panel Component**: The main layout is powered by the polymorphic `<FormTracePanel>` component, which adapts seamlessly between standard Action Popup, Side Panel, and Separate Window modes.
- **Single-Instance & Stale Tracking**: Employs robust storage-backed state tracing to ensure only single instances of the persistent window are active, and utilizes separated try-catch handlers to gracefully fall back from window querying to tab querying during side panel launches.

### 2. Side Panel UX Polish (Issue 2)
- **Visual Hierarchy**: Improved text wrapping for layout edge-cases in the side panel mode.
- **UX Text Helpers**: Introduced contextual helper text that clarifies the behavior of recording states and session resets.
- **Automated String Verification**: Added `sidepanel-ux-check.ts` to ensure layout strings remain stable through minification.

### 3. Session State Clarity (Issue 3)
- **Active Page Context**: UI components added to show the current active tab hostname/URL.
- **Recording Time Tracking**: Local timestamps tracked to clarify recording length ("Recording since...").
- **Current vs Saved Identification**: Explicitly labeling when viewing an active current session report vs an old history report.
- **Side Panel Warnings**: Displaying warnings when the active tab shifts away from the recorded tab while using the side panel.

### 4. CSS Blame Overlay (Issue 4 - Planned)
- **Overlay Injection**: Inject styling rules and indicators directly into the tab's DOM to flag validation failures or hidden inputs.
- **Toggle Control**: Toggle element highlighting from the FormTrace UI.

### 5. Framework Mimic Demo Pages (Issue 5 - Planned)
- Create test pages representing React Hook Form, Formik, Shopify Checkout, Webflow, and WordPress structures.

---

## Scope: What is NOT Included (Out of Scope)
- **No Cloud Backend**: All storage (recent sessions, settings, persistent state) remains 100% local.
- **No Automatic Recording in Window**: Recording is still triggered via the standard tab capture model, keeping permissions narrow and performance high.

---

## Implementation Order
1. **Issue 1**: Native Side Panel mode & Legacy Persistent Window (Completed).
2. **Issue 2**: Side Panel UX Polish (Completed).
3. **Issue 3**: Session State Clarity (Completed).
4. **Issue 4**: CSS Blame Overlay (Planned).
5. **Issue 5**: Framework Mimic Demo Pages (Planned).
