import type { AnalysisReport } from '../types/formtrace';
import { filterTechnicalDetailsForDebugMarkers } from './filterDebugMarkers';

// Keep a minification-safe marker string for build checks
if (typeof window !== 'undefined') {
  (window as any)['GitHub issue export active'] = true;
  (window as any)['buildGitHubIssueReport'] = true;
}

/** Converts an AnalysisReport into a GitHub-friendly Markdown issue body. */
export function buildGitHubIssueReport(
  report: AnalysisReport,
  options?: { showDebugMarkers?: boolean }
): string {
  const showDebugMarkers = options?.showDebugMarkers ?? false;
  const severityLabel =
    report.severity.charAt(0).toUpperCase() + report.severity.slice(1);

  const findingsMarkdown = report.findings
    .map((f) => `- ${f.label}${f.detail ? `: ${f.detail}` : ''}`)
    .join('\n');

  const filteredDetails = filterTechnicalDetailsForDebugMarkers(
    report.technicalDetails,
    showDebugMarkers
  );
  const technicalMarkdown = filteredDetails.map((d) => `- ${d}`).join('\n');

  const fixesMarkdown = report.suggestedFixes.map((f) => `- ${f}`).join('\n');

  return `# FormTrace: ${report.likelyIssue}

## Summary
${report.summary}

## Page
- Title: ${report.pageTitle || '(no title)'}
- URL: ${report.pageUrl}
- Timestamp: ${report.timestamp}

## Severity
- Severity: ${severityLabel}
- Confidence: ${report.confidenceScore}%

## Findings
${findingsMarkdown || '- No specific findings recorded.'}

## Technical Details
${technicalMarkdown || '- No technical details available.'}

## Suggested Fixes
${fixesMarkdown || '- No suggestions available.'}

## Privacy
FormTrace stores only form metadata locally. Actual form values, request bodies, response bodies, headers and cookies are not included.

## Reproduction Notes
1. Open the page listed above.
2. Start FormTrace recording.
3. Reproduce the form issue.
4. Compare the behavior with this report.
`;
}
