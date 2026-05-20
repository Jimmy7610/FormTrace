# FormTrace Build 3 Release Notes

Version:
v1.2.0-build3

Release summary:
Build 3 turns FormTrace into a much more usable debugging workspace by adding Chrome Side Panel support, better session clarity, CSS cause inspection, framework-like demos, and improved scroll usability.

Completed work:
1. Side Panel Mode
2. Side Panel UX polish
3. Better session state / recording clarity
4. CSS visibility cause inspector
5. Framework-like form demos
6. Side Panel scroll usability fix

Key user-facing improvements:
- FormTrace can stay visible beside the webpage using Chrome Side Panel.
- Reports now show active page and recording context.
- Reports can explain why hidden required fields are hidden using CSS/DOM metadata.
- Framework-like demos make the tool easier to test against modern form patterns.
- Side Panel scrolling is easier and more comfortable.

Privacy notes:
- FormTrace remains local-first.
- No backend.
- No AI.
- No external services.
- No actual form values are stored.
- No request bodies, response bodies, headers, cookies or sensitive network payloads are stored.
- CSS cause inspection uses metadata only.

Known limitations:
- Side Panel support depends on Chrome's sidePanel API.
- Legacy separate window can still fall behind Chrome and should be considered secondary.
- Detection is heuristic-based and may need future tuning for complex apps.
- Framework demo pages are simulations, not real React/Vue/Angular dependencies.
- FormTrace still does not capture screenshots or full DOM snapshots.

Manual QA checklist:
- Original demos:
  - hidden-required-field.html
  - disabled-button.html
  - invisible-error.html
  - failed-api.html
  - success-form.html
- Framework-like demos:
  - react-like-controlled-form.html
  - vue-like-conditional-form.html
  - angular-like-disabled-submit.html
  - custom-validation-no-visible-error.html
  - async-submit-api-error.html
- Side Panel:
  - opens correctly
  - remains visible beside page
  - recording works
  - stop/analyze works
  - scroll feels comfortable
- Exports:
  - Copy report
  - Copy GitHub issue
  - Copy Jira report
- History:
  - save report
  - open saved report
  - delete report
  - clear history
- Debug markers:
  - hidden by default
  - shown when enabled

Recommended Build 4 direction:
- More advanced report grouping and prioritization
- Better accessibility/a11y diagnostics
- Optional visual element highlight/inspect mode
- More robust SPA route/tab awareness
- Import/export local history
- User settings polish
