import { analyzeSession } from '../src/analyzer/analyzeSession';
import type { RecordingSession } from '../src/types/formtrace';

function runAnalyzerCheck() {
  console.log('--- Starting Analyzer Verification ---');

  // Test 1: Hidden required field is empty.
  const hiddenMockSession: RecordingSession = {
    id: 'test-session-1',
    startedAt: Date.now(),
    stoppedAt: Date.now() + 5000,
    pageUrl: 'http://localhost/demo',
    pageTitle: 'Test',
    formCount: 1,
    submitAttemptCount: 1,
    clickWithoutSubmitCount: 0,
    events: [
      {
        type: 'submit-click',
        timestamp: Date.now(),
        message: 'Submit clicked',
        snapshot: {
          hasVisibleError: false,
          submitButtonDisabled: false,
          submitButtonExists: true,
          fields: [
            {
              tag: 'input',
              id: 'visible-username',
              name: 'username',
              label: 'Username',
              type: 'text',
              valueState: 'present',
              required: true,
              valid: true,
              hidden: false,
              disabled: false,
              validationMessage: '',
            },
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

  const hiddenReport = analyzeSession(hiddenMockSession);
  let passed = true;

  if (hiddenReport.likelyIssue !== 'Hidden required field blocked submission') {
    console.error(`[FAIL] Test 1: Expected "Hidden required field blocked submission", got: "${hiddenReport.likelyIssue}"`);
    passed = false;
  } else {
    console.log('[PASS] Test 1: likelyIssue is correctly prioritized as "Hidden required field blocked submission"');
  }

  if (hiddenReport.severity !== 'high') {
    console.error(`[FAIL] Test 1: Expected severity "high", got: "${hiddenReport.severity}"`);
    passed = false;
  } else {
    console.log('[PASS] Test 1: severity is "high"');
  }

  if (hiddenReport.confidenceScore < 90) {
    console.error(`[FAIL] Test 1: Expected confidenceScore >= 90, got: ${hiddenReport.confidenceScore}`);
    passed = false;
  } else {
    console.log(`[PASS] Test 1: confidenceScore is high (${hiddenReport.confidenceScore})`);
  }

  const hasHiddenFinding = hiddenReport.findings.some(f => f.code === 'HIDDEN_REQUIRED_FIELD');
  if (!hasHiddenFinding) {
    console.error(`[FAIL] Test 1: Expected findings to include HIDDEN_REQUIRED_FIELD`);
    passed = false;
  } else {
    console.log('[PASS] Test 1: findings include HIDDEN_REQUIRED_FIELD');
  }

  // Test 2: Visible required field is empty (no hidden fields).
  const visibleEmptySession: RecordingSession = {
    id: 'test-session-2',
    startedAt: Date.now(),
    stoppedAt: Date.now() + 5000,
    pageUrl: 'http://localhost/demo2',
    pageTitle: 'Test 2',
    formCount: 1,
    submitAttemptCount: 1,
    clickWithoutSubmitCount: 0,
    events: [
      {
        type: 'submit-click',
        timestamp: Date.now(),
        message: 'Submit clicked',
        snapshot: {
          hasVisibleError: true,
          submitButtonDisabled: false,
          submitButtonExists: true,
          fields: [
            {
              tag: 'input',
              id: 'visible-email',
              name: 'email',
              label: 'Email',
              type: 'text',
              valueState: 'empty',
              required: true,
              valid: false,
              hidden: false,
              disabled: false,
              validationMessage: 'Missing email',
            }
          ]
        }
      }
    ]
  };

  const visibleReport = analyzeSession(visibleEmptySession);

  if (visibleReport.likelyIssue !== 'Required fields are missing') {
    console.error(`[FAIL] Test 2: Expected "Required fields are missing", got: "${visibleReport.likelyIssue}"`);
    passed = false;
  } else {
    console.log('[PASS] Test 2: likelyIssue is correctly prioritized as "Required fields are missing"');
  }

  if (!passed) {
    console.error('\nAnalyzer Verification FAILED!');
    process.exit(1);
  } else {
    console.log('\nAnalyzer Verification PASSED!');
    process.exit(0);
  }
}

runAnalyzerCheck();
