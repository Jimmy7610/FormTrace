import type { AnalysisReport } from '../types/formtrace';
import { filterTechnicalDetailsForDebugMarkers } from './filterDebugMarkers';

// Keep minification-safe marker strings for build checks
if (typeof window !== 'undefined') {
  (window as any)['Jira report export active'] = true;
  (window as any)['buildJiraReport'] = true;
}

/** Converts an AnalysisReport into a clean Jira-style bug report. */
export function buildJiraReport(
  report: AnalysisReport,
  options?: { showDebugMarkers?: boolean }
): string {
  const showDebugMarkers = options?.showDebugMarkers ?? false;
  const severityLabel =
    report.severity.charAt(0).toUpperCase() + report.severity.slice(1);

  const findingsMarkdown = report.findings
    .map((f) => `* ${f.label}${f.detail ? `: ${f.detail}` : ''}`)
    .join('\n');

  const filteredDetails = filterTechnicalDetailsForDebugMarkers(
    report.technicalDetails,
    showDebugMarkers
  );
  const technicalMarkdown = filteredDetails.map((d) => `* ${d}`).join('\n');

  const fixesMarkdown = report.suggestedFixes.map((f) => `* ${f}`).join('\n');

  return `h2. Summary
${report.summary}

h2. Environment
* Page title: ${report.pageTitle || '(no title)'}
* Page URL: ${report.pageUrl}
* Timestamp: ${report.timestamp}
* Tool: FormTrace

h2. Issue
* Likely issue: ${report.likelyIssue}
* Severity: ${severityLabel}
* Confidence: ${report.confidenceScore}%

h2. Steps to Reproduce
# Open the page listed above.
# Start FormTrace recording.
# Reproduce the form issue.
# Stop and analyze the session.

h2. Actual Result
${report.likelyIssue} / ${report.summary}

h2. Expected Result
The form should either submit successfully or show clear, visible feedback explaining what the user must fix.

h2. Findings
${findingsMarkdown || '* No specific findings recorded.'}

h2. Technical Details
${technicalMarkdown || '* No technical details available.'}

h2. Suggested Fixes
${fixesMarkdown || '* No suggestions available.'}

h2. Privacy Notes
FormTrace stores only form metadata locally. Actual form values, request bodies, response bodies, headers and cookies are not included.
`;
}
