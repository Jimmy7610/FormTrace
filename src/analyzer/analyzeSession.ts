import type { RecordingSession, AnalysisReport, Finding, Severity } from '../types/formtrace';
import { computeScore } from './scoring';
import { detectDisabledSubmit } from './detectDisabledSubmit';
import { detectHiddenRequiredFields } from './detectHiddenRequiredFields';
import { detectInvalidFields, detectRequiredEmptyFields } from './detectInvalidFields';
import { detectMissingVisibleErrors } from './detectMissingVisibleErrors';

// ─── Issue resolution order ────────────────────────────────────────────────────
// INSTÄLLNING - Ordning avgör vilken orsak som visas som "troligast"

function resolveLikelyIssue(
  score: ReturnType<typeof computeScore>,
  session: RecordingSession
): { likelyIssue: string; severity: Severity } {
  if (score.hiddenRequiredField) {
    return { likelyIssue: 'Hidden required field blocked submission', severity: 'high' };
  }
  if (score.disabledSubmit) {
    return { likelyIssue: 'Submit button was disabled', severity: 'high' };
  }
  if (score.networkFailure) {
    return { likelyIssue: 'Network request failed after submit', severity: 'high' };
  }
  if (score.invalidField) {
    return { likelyIssue: 'Validation failed without visible feedback', severity: 'medium' };
  }
  if (score.requiredEmpty) {
    return { likelyIssue: 'Required fields are missing', severity: 'medium' };
  }
  if (score.clickWithoutSubmit) {
    return { likelyIssue: 'Click did not trigger a form submit', severity: 'medium' };
  }
  if (score.consoleError) {
    return { likelyIssue: 'Console error occurred during form interaction', severity: 'low' };
  }
  return { likelyIssue: 'No clear failure detected', severity: 'low' };
}

function buildFindings(
  score: ReturnType<typeof computeScore>,
  session: RecordingSession
): Finding[] {
  const findings: Finding[] = [];

  if (session.submitAttemptCount > 0) {
    findings.push({
      code: 'SUBMIT_ATTEMPT',
      label: 'Submit attempt detected',
      severity: 'low',
      detail: `${session.submitAttemptCount} submit attempt(s) recorded.`,
    });
  }

  if (score.disabledSubmit) {
    findings.push({
      code: 'DISABLED_SUBMIT',
      label: 'Submit button was disabled at click time',
      severity: 'high',
      detail: 'The submit button had the disabled attribute when it was clicked.',
    });
  }

  const hiddenFields = detectHiddenRequiredFields(session);
  if (hiddenFields.length > 0) {
    findings.push({
      code: 'HIDDEN_REQUIRED_FIELD',
      label: `${hiddenFields.length} hidden required field(s) detected`,
      severity: 'high',
      detail: hiddenFields
        .map((f) => `${f.name || f.id || f.label || 'unnamed'} (${f.type})`)
        .join(', '),
    });
  }

  const requiredEmpty = detectRequiredEmptyFields(session);
  if (requiredEmpty.length > 0) {
    findings.push({
      code: 'REQUIRED_EMPTY',
      label: `${requiredEmpty.length} required field(s) were empty`,
      severity: 'medium',
      detail: requiredEmpty
        .map((f) => `${f.name || f.id || f.label || 'unnamed'} (${f.type})`)
        .join(', '),
    });
  }

  const invalidFields = detectInvalidFields(session);
  if (invalidFields.length > 0) {
    findings.push({
      code: 'INVALID_FIELD',
      label: `${invalidFields.length} field(s) failed validation`,
      severity: 'medium',
      detail: invalidFields
        .map((f) => `${f.name || f.id || f.label || 'unnamed'}: ${f.validationMessage}`)
        .join('; '),
    });
  }

  if (score.noVisibleError) {
    findings.push({
      code: 'NO_VISIBLE_ERROR',
      label: 'No visible error message was found after submit',
      severity: 'medium',
      detail: 'Users may not know why the form failed to submit.',
    });
  }

  if (score.clickWithoutSubmit) {
    findings.push({
      code: 'CLICK_WITHOUT_SUBMIT',
      label: 'Submit click did not trigger a form submit event',
      severity: 'medium',
      detail: `${session.clickWithoutSubmitCount} click(s) with no resulting submit event.`,
    });
  }

  const networkEvents = session.events.filter((e) => e.type === 'network-failure');
  if (networkEvents.length > 0) {
    findings.push({
      code: 'NETWORK_FAILURE',
      label: `${networkEvents.length} network failure(s) detected`,
      severity: 'high',
      detail: networkEvents.map((e) => `${e.url ?? 'unknown URL'} (${e.status ?? 'no status'})`).join('; '),
    });
  }

  const consoleErrors = session.events.filter((e) => e.type === 'console-error');
  if (consoleErrors.length > 0) {
    findings.push({
      code: 'CONSOLE_ERROR',
      label: `${consoleErrors.length} console error(s) during recording`,
      severity: 'low',
      detail: consoleErrors
        .slice(0, 3)
        .map((e) => e.message ?? '')
        .join(' | '),
    });
  }

  return findings;
}

function buildTechnicalDetails(
  session: RecordingSession,
  findings: Finding[]
): string[] {
  const details: string[] = [
    `Forms detected: ${session.formCount}`,
    `Submit attempts: ${session.submitAttemptCount}`,
    `Events captured: ${session.events.length}`,
  ];

  // Add field details from the last snapshot
  const snapshots = session.events.filter((e) => e.snapshot);
  if (snapshots.length > 0) {
    const last = snapshots[snapshots.length - 1].snapshot!;
    for (const field of last.fields) {
      const parts = [
        `Field: ${field.name || field.id || field.label || 'unnamed'}`,
        `type: ${field.type}`,
        `required: ${field.required}`,
        `hidden: ${field.hidden}`,
        `value: ${field.valueState}`,
      ];
      if (!field.valid && field.validationMessage) {
        parts.push(`validation: "${field.validationMessage}"`);
      }
      details.push(parts.join(', '));
    }
  }

  return details;
}

function buildSuggestedFixes(score: ReturnType<typeof computeScore>): string[] {
  const fixes: string[] = [];

  if (score.disabledSubmit) {
    fixes.push('Ensure the submit button is enabled, or show a clear explanation of why it is disabled.');
    fixes.push('Verify no JavaScript is incorrectly disabling the button on load.');
  }
  if (score.hiddenRequiredField) {
    fixes.push('Make all required fields visible to the user, or remove the required attribute from hidden fields.');
    fixes.push('Consider providing the hidden required value programmatically before submission.');
  }
  if (score.requiredEmpty) {
    fixes.push('Ensure all required fields have a value before the user tries to submit.');
    fixes.push('Add clear visual indicators (*) to mark required fields.');
  }
  if (score.invalidField) {
    fixes.push('Use the HTML5 Constraint Validation API to surface field errors inline.');
    fixes.push('Add clear validation feedback near each invalid field.');
  }
  if (score.noVisibleError) {
    fixes.push('Show a visible error message near the form when validation fails.');
    fixes.push('Use role="alert" for error containers so screen readers announce them.');
  }
  if (score.clickWithoutSubmit) {
    fixes.push('Check if the button is inside the <form> element, or uses form="id" attribute.');
    fixes.push('Verify no JavaScript is calling event.preventDefault() without a reason.');
  }
  if (score.networkFailure) {
    fixes.push('Check the network request URL, headers, and CORS configuration.');
    fixes.push('Ensure the API endpoint is reachable and returns the expected response code.');
  }
  if (score.consoleError) {
    fixes.push('Investigate JavaScript errors in DevTools > Console during the form interaction.');
  }

  if (fixes.length === 0) {
    fixes.push('No specific fixes suggested — the form appears to be working correctly.');
  }

  return fixes;
}

/** Main analysis function. Converts a RecordingSession into an AnalysisReport. */
export function analyzeSession(session: RecordingSession): AnalysisReport {
  const score = computeScore(session);
  const { likelyIssue, severity } = resolveLikelyIssue(score, session);
  const findings = buildFindings(score, session);
  const technicalDetails = buildTechnicalDetails(session, findings);
  const suggestedFixes = buildSuggestedFixes(score);

  const summaryMap: Record<string, string> = {
    'Submit button was disabled':
      'The submit button was disabled when the user tried to click it. This is a common issue on forms that disable the button until some condition is met.',
    'Hidden required field blocked submission':
      'A required field appears to be hidden from the user and may be blocking form submission.',
    'Network request failed after submit':
      'A network request made after the submit attempt returned an error. This may indicate a broken API endpoint or connectivity issue.',
    'Required fields are missing':
      'One or more required fields were empty when the form was submitted.',
    'Validation failed without visible feedback':
      'The form has invalid fields but no visible error message was shown to the user.',
    'Click did not trigger a form submit':
      'A click on the submit button was detected but no form submit event followed. The form may not be wired correctly.',
    'Console error occurred during form interaction':
      'A JavaScript error occurred during the recording session, which may have interfered with form behavior.',
    'No clear failure detected':
      'No obvious failure was detected. The form may have submitted successfully, or the issue is outside what FormTrace can detect.',
  };

  return {
    sessionId: session.id,
    timestamp: new Date().toISOString(),
    pageUrl: session.pageUrl,
    pageTitle: session.pageTitle,
    formCount: session.formCount,
    submitAttemptCount: session.submitAttemptCount,
    eventCount: session.events.length,
    likelyIssue,
    confidenceScore: score.total,
    severity,
    summary: summaryMap[likelyIssue] ?? 'Analysis complete.',
    findings,
    technicalDetails,
    suggestedFixes,
  };
}
