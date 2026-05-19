import type { AnalysisReport } from '../types/formtrace';

/** Converts an AnalysisReport into a Markdown string for copying. */
export function buildMarkdownReport(report: AnalysisReport): string {
  const severityLabel =
    report.severity.charAt(0).toUpperCase() + report.severity.slice(1);

  const findingsMarkdown = report.findings
    .map((f) => `- ${f.label}${f.detail ? `: ${f.detail}` : ''}`)
    .join('\n');

  const technicalMarkdown = report.technicalDetails.map((d) => `- ${d}`).join('\n');

  const fixesMarkdown = report.suggestedFixes.map((f) => `- ${f}`).join('\n');

  return `# FormTrace Report

**Page:** ${report.pageTitle || '(no title)'}
**URL:** ${report.pageUrl}
**Timestamp:** ${report.timestamp}

---

## Likely Issue

${report.likelyIssue}

**Confidence:** ${report.confidenceScore}%
**Severity:** ${severityLabel}

---

## Summary

${report.summary}

---

## Findings

${findingsMarkdown || '- No specific findings recorded.'}

---

## Technical Details

${technicalMarkdown || '- No technical details available.'}

---

## Suggested Fixes

${fixesMarkdown || '- No suggestions available.'}

---

## Privacy

FormTrace stores only form metadata locally. Actual form values are not included in this report.
`;
}
