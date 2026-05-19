import { normalizeReportForHiddenRequiredFields } from '../src/analyzer/normalizeReport';
import type { AnalysisReport, RecordingSession } from '../src/types/formtrace';

function runReportNormalizationCheck() {
  console.log('--- Starting Report Normalization Verification ---');
  let passed = true;

  // Test 1: Fallback from technicalDetails matching hidden required empty field
  const staleReport: AnalysisReport = {
    sessionId: 'stale-id',
    timestamp: new Date().toISOString(),
    pageUrl: 'http://localhost/stale',
    pageTitle: 'Stale',
    formCount: 1,
    submitAttemptCount: 1,
    eventCount: 1,
    likelyIssue: 'Required fields are missing',
    severity: 'medium',
    confidenceScore: 60,
    summary: 'One or more required fields were empty.',
    findings: [
      {
        code: 'REQUIRED_EMPTY',
        label: '1 required field(s) were empty',
        severity: 'medium',
        detail: 'company_id (text)',
      }
    ],
    technicalDetails: [
      'Forms detected: 1',
      'Submit attempts: 1',
      'Field: company_id, type: text, required: true, hidden: true, value: empty, validation: "Fyll i det här fältet."'
    ],
    suggestedFixes: ['Fix the visible empty fields.'],
  };

  const normalizedT1 = normalizeReportForHiddenRequiredFields(staleReport, null);

  if (normalizedT1.likelyIssue !== 'Hidden required field blocked submission') {
    console.error(`[FAIL] Test 1: Expected "Hidden required field blocked submission", got: "${normalizedT1.likelyIssue}"`);
    passed = false;
  } else {
    console.log('[PASS] Test 1: Fallback technicalDetails correctly normalized likelyIssue');
  }

  if (!normalizedT1.technicalDetails.some(d => d.includes('Popup normalization fix: final-report-guard'))) {
    console.error('[FAIL] Test 1: Expected technicalDetails to contain Popup normalization fix marker');
    passed = false;
  } else {
    console.log('[PASS] Test 1: Fallback report contains normalization debug markers');
  }


  // Test 2: Scanning a real session containing a hidden required empty field
  const mockSession: RecordingSession = {
    id: 'mock-session-2',
    startedAt: Date.now(),
    pageUrl: 'http://localhost/mock2',
    pageTitle: 'Mock 2',
    formCount: 1,
    submitAttemptCount: 1,
    clickWithoutSubmitCount: 0,
    events: [
      {
        type: 'submit-click',
        timestamp: Date.now(),
        message: 'Submit clicked',
        snapshot: {
          index: 0,
          id: 'test-form',
          action: '',
          method: 'get',
          hasVisibleError: false,
          submitButtonDisabled: false,
          submitButtonExists: true,
          fields: [
            {
              tag: 'input',
              id: 'hidden-company-id',
              name: 'company_id',
              label: 'Company',
              type: 'text',
              valueState: 'empty',
              required: true,
              valid: false,
              hidden: true,
              disabled: false,
              validationMessage: 'Fyll i det här fältet.',
            }
          ]
        }
      }
    ]
  };

  const normalReport: AnalysisReport = {
    sessionId: 'normal-id',
    timestamp: new Date().toISOString(),
    pageUrl: 'http://localhost/normal',
    pageTitle: 'Normal',
    formCount: 1,
    submitAttemptCount: 1,
    eventCount: 1,
    likelyIssue: 'Required fields are missing',
    severity: 'medium',
    confidenceScore: 60,
    summary: 'One or more required fields were empty.',
    findings: [],
    technicalDetails: [],
    suggestedFixes: [],
  };

  const normalizedT2 = normalizeReportForHiddenRequiredFields(normalReport, mockSession);

  if (normalizedT2.likelyIssue !== 'Hidden required field blocked submission') {
    console.error(`[FAIL] Test 2: Expected session-based scan to normalize to "Hidden required field blocked submission", got: "${normalizedT2.likelyIssue}"`);
    passed = false;
  } else {
    console.log('[PASS] Test 2: Session-based scan correctly normalized likelyIssue');
  }


  // Test 3: Normal visible missing field report should NOT normalize to hidden required
  const visibleEmptyReport: AnalysisReport = {
    sessionId: 'visible-id',
    timestamp: new Date().toISOString(),
    pageUrl: 'http://localhost/visible',
    pageTitle: 'Visible',
    formCount: 1,
    submitAttemptCount: 1,
    eventCount: 1,
    likelyIssue: 'Required fields are missing',
    severity: 'medium',
    confidenceScore: 60,
    summary: 'One or more required fields were empty.',
    findings: [],
    technicalDetails: [
      'Field: email, type: email, required: true, hidden: false, value: empty'
    ],
    suggestedFixes: [],
  };

  const normalizedT3 = normalizeReportForHiddenRequiredFields(visibleEmptyReport, null);

  if (normalizedT3.likelyIssue !== 'Required fields are missing') {
    console.error(`[FAIL] Test 3: Expected likelyIssue to remain "Required fields are missing", got: "${normalizedT3.likelyIssue}"`);
    passed = false;
  } else {
    console.log('[PASS] Test 3: Standard visible missing field report was NOT normalized');
  }

  if (!normalizedT3.technicalDetails.some(d => d.includes('Analyzer bundle active: popup-local-normalized'))) {
    console.error('[FAIL] Test 3: Expected technicalDetails to contain active bundle marker');
    passed = false;
  } else {
    console.log('[PASS] Test 3: Standard report contains popup active bundle marker');
  }

  if (passed) {
    console.log('\nReport Normalization Verification PASSED!');
    process.exit(0);
  } else {
    console.error('\nReport Normalization Verification FAILED!');
    process.exit(1);
  }
}

runReportNormalizationCheck();
