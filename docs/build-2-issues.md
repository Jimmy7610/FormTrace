# FormTrace — Build 2 Issues & Tasks

This document breaks Build 2 down into small, isolated, and implementable tasks. Each task contains target files, acceptance criteria, and risk level classifications.

---

## Issue 1: Debug Marker Visibility Toggle [COMPLETED]
- **Goal**: Allow users to hide technical diagnostics (e.g. `Network probe active`) from reports via a settings toggle in the popup.
- **Files Likely Affected**:
  - `src/popup/App.tsx` (UI checkbox/toggle)
  - `src/utils/reportGenerator.ts` (Filter markers if toggle is off)
  - `src/popup/types.ts` or storage schema (Persist setting)
- **Acceptance Criteria**:
  1. A "Show technical debug markers" checkbox exists in the popup settings/footer.
  2. When unchecked, the compiled technical details do not contain debug keywords (e.g. `Network probe active`, `Network DOM signal detected`, `Analyzer runtime fix`).
  3. The checkbox state is persisted to `chrome.storage.local`.
- **Risk Level**: **Low**

---

## Issue 2: Refine Validation Confidence Scoring [COMPLETED]
- **Goal**: Improve scoring rules for `Validation failed without visible feedback` to prevent collision with other rules and optimize false-positive rates.
- **Files Likely Affected**:
  - `src/analyzer/scoring.ts`
  - `tools/analyzer-check.ts` (Test case assertions)
- **Acceptance Criteria**:
  1. Ensure that the combination of invalid field state and lack of error messages outputs a `Validation failed without visible feedback` finding with a confidence score of exactly `80%` (combining invalid field (+30), no visible error (+35), and combo bonus (+15)).
  2. Ensure that it does not override high-priority findings like `Submit button was disabled` (`95%`) or `Hidden required field blocked submission` (`100%`).
- **Risk Level**: **Medium** (requires re-running the automated analyzer test checks to verify existing tests still pass).

---

## Issue 3: GitHub Issue Export Format [COMPLETED]
- **Goal**: Generate a copyable report formatted as a clean GitHub-friendly bug report.
- **Files Affected**:
  - [App.tsx](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/entrypoints/popup/App.tsx) (Add "Copy GitHub issue" button and handler)
  - [buildGitHubIssueReport.ts](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/src/analyzer/buildGitHubIssueReport.ts) (Implement template formatting)
  - [github-issue-report-check.ts](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/tools/github-issue-report-check.ts) (Unit tests)
- **Acceptance Criteria**:
  1. Copying as a GitHub Issue produces Markdown containing structured blocks:
     - Header (`# FormTrace: [Likely Issue]`)
     - `## Summary`
     - `## Page` (title, URL, timestamp)
     - `## Severity` (severity label and confidence)
     - `## Findings`
     - `## Technical Details` (respects debug marker settings)
     - `## Suggested Fixes`
     - `## Privacy`
     - `## Reproduction Notes`
  2. The output uses clean GitHub-flavored Markdown.
- **Risk Level**: **Low**

---

## Issue 4: Jira-Style Export Format [COMPLETED]
- **Goal**: Generate a copyable report formatted using Jira markup syntax.
- **Files Affected**:
  - [App.tsx](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/entrypoints/popup/App.tsx) (Add "Copy Jira report" button and handler)
  - [buildJiraReport.ts](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/src/analyzer/buildJiraReport.ts) (Implement template formatting)
  - [jira-report-check.ts](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/tools/jira-report-check.ts) (Unit tests)
- **Acceptance Criteria**:
  1. Copying as Jira produces clean Jira Rich Text Markup containing:
     - `h2. Summary`
     - `h2. Environment` (title, URL, timestamp, Tool)
     - `h2. Issue` (likely issue, severity, confidence)
     - `h2. Steps to Reproduce`
     - `h2. Actual Result`
     - `h2. Expected Result`
     - `h2. Findings`
     - `h2. Technical Details` (respects debug marker settings)
     - `h2. Suggested Fixes`
     - `h2. Privacy Notes`
  2. Uses Jira-native styles (e.g. list prefix `*` for findings/details, `#` for numbered reproduction steps, headers `h2.`).
- **Risk Level**: **Low**

---

## Issue 5: Saved Local Sessions & History [COMPLETED]
- **Goal**: Maintain a historical log of the last 10 form analysis sessions in `chrome.storage.local` and allow loading them from the popup.
- **Files Affected**:
  - [App.tsx](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/entrypoints/popup/App.tsx) (History UI section, Open/Delete/Clear handlers)
  - [style.css](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/entrypoints/popup/style.css) (CSS classes for history list)
  - [reportHistory.ts](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/src/storage/reportHistory.ts) (Save/fetch session history local storage manager)
  - [history-storage-check.ts](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/tools/history-storage-check.ts) (Test suite)
- **Acceptance Criteria**:
  1. Saving a session pushes it onto a stack. When the stack exceeds 10 entries, the oldest session is dropped.
  2. The popup lists these saved sessions (labeled with likely issue, timestamp, page title/URL, severity, and confidence score).
  3. Clicking a historical item loads its state and replaces the current analysis display, letting the user view or re-copy the bug report.
- **Risk Level**: **Medium** (requires careful handling of storage limits and state cleanup).

---

## Issue 6: Polish and Release Prep [COMPLETED]
- **Goal**: Review the popup UI for layout bugs, update project metadata/versions to `1.1.0`, add a `release:check` script, verify build compliance, and prepare for stable release tagging (`v1.1.0-build2`).
- **Files Affected**:
  - [App.tsx](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/entrypoints/popup/App.tsx) (UI text, metadata checks)
  - [style.css](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/entrypoints/popup/style.css) (CSS layout fixes)
  - [package.json](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/package.json) (Version updates, `release:check` script)
  - [wxt.config.ts](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/wxt.config.ts) (Manifest version update)
  - [build-2-release-notes.md](file:///C:/Users/Jimmy/Documents/GitHub/FormTrace/docs/build-2-release-notes.md) (Release notes)
- **Acceptance Criteria**:
  1. No text layout overflows or button alignment bugs occur in the popup.
  2. Version is set consistently to `1.1.0` in package configurations.
  3. `npm run release:check` successfully runs the entire test verification suite.
  4. Release tagging is verified.
- **Risk Level**: **Low**

> [!NOTE]
> Framework Mimic Demos and CSS Overlay features have been rescheduled to future builds (Build 3) to keep this release cycle tightly focused and stable.
