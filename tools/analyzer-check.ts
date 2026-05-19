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
    submitAttemptCount: 0, // as requested
    clickWithoutSubmitCount: 1, // simulates no submit event triggered
    events: [
      { type: 'page-snapshot', timestamp: Date.now() },
      { type: 'input-change', timestamp: Date.now() + 100 },
      { type: 'input-change', timestamp: Date.now() + 200 },
      {
        type: 'submit-click',
        timestamp: Date.now() + 300,
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
              id: 'visible-email',
              name: 'email',
              label: 'Email',
              type: 'email',
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

  const hasHiddenDebug = hiddenReport.technicalDetails.some(d => d.includes('Hidden required empty fields found: 1'));
  if (!hasHiddenDebug) {
    console.error(`[FAIL] Test 1: Expected technicalDetails to include "Hidden required empty fields found: 1"`);
    passed = false;
  } else {
    console.log('[PASS] Test 1: technicalDetails includes "Hidden required empty fields found: 1"');
  }

  const hasVersionDebug = hiddenReport.technicalDetails.some(d => d.includes('Analyzer runtime fix: hidden-required-first-pass'));
  if (!hasVersionDebug) {
    console.error(`[FAIL] Test 1: Expected technicalDetails to include "Analyzer runtime fix: hidden-required-first-pass"`);
    passed = false;
  } else {
    console.log('[PASS] Test 1: technicalDetails includes "Analyzer runtime fix: hidden-required-first-pass"');
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
          index: 0,
          id: 'test-form',
          action: '',
          method: 'get',
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
