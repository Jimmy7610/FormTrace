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

  // Test 3: Disabled submit button interaction attempt.
  const disabledMockSession: RecordingSession = {
    id: 'test-session-3',
    startedAt: Date.now(),
    stoppedAt: Date.now() + 5000,
    pageUrl: 'http://localhost/demo3',
    pageTitle: 'Test 3',
    formCount: 1,
    submitAttemptCount: 0,
    clickWithoutSubmitCount: 0,
    events: [
      {
        type: 'disabled-submit-attempt',
        timestamp: Date.now(),
        tagName: 'button',
        fieldType: 'submit',
        buttonText: 'Submit (disabled)',
        disabled: true,
      }
    ]
  };

  const disabledReport = analyzeSession(disabledMockSession);

  if (disabledReport.likelyIssue !== 'Submit button was disabled') {
    console.error(`[FAIL] Test 3: Expected "Submit button was disabled", got: "${disabledReport.likelyIssue}"`);
    passed = false;
  } else {
    console.log('[PASS] Test 3: likelyIssue is correctly prioritized as "Submit button was disabled"');
  }

  if (disabledReport.severity !== 'high') {
    console.error(`[FAIL] Test 3: Expected severity "high", got: "${disabledReport.severity}"`);
    passed = false;
  } else {
    console.log('[PASS] Test 3: severity is "high"');
  }

  if (disabledReport.confidenceScore < 90) {
    console.error(`[FAIL] Test 3: Expected confidenceScore >= 90, got: ${disabledReport.confidenceScore}`);
    passed = false;
  } else {
    console.log(`[PASS] Test 3: confidenceScore is high (${disabledReport.confidenceScore})`);
  }

  const hasDisabledDebug = disabledReport.technicalDetails.some(d => d.includes('Disabled submit attempt detected: 1'));
  if (!hasDisabledDebug) {
    console.error(`[FAIL] Test 3: Expected technicalDetails to include "Disabled submit attempt detected: 1"`);
    passed = false;
  } else {
    console.log('[PASS] Test 3: technicalDetails includes "Disabled submit attempt detected: 1"');
  }

  const hasDisabledFinding = disabledReport.findings.some(f => f.code === 'DISABLED_SUBMIT' && f.label === 'Submit button was disabled at interaction time');
  if (!hasDisabledFinding) {
    console.error(`[FAIL] Test 3: Expected findings to include DISABLED_SUBMIT with "Submit button was disabled at interaction time"`);
    passed = false;
  } else {
    console.log('[PASS] Test 3: findings includes DISABLED_SUBMIT with "Submit button was disabled at interaction time"');
  }

  // Test 4: Network failure after submit.
  const networkMockSession: RecordingSession = {
    id: 'test-session-4',
    startedAt: Date.now(),
    stoppedAt: Date.now() + 5000,
    pageUrl: 'http://localhost/failed-api',
    pageTitle: 'Failed API Test',
    formCount: 1,
    submitAttemptCount: 1,
    clickWithoutSubmitCount: 0,
    events: [
      {
        type: 'submit-click',
        timestamp: Date.now(),
        message: 'Submit clicked',
      },
      {
        type: 'network-failure',
        timestamp: Date.now() + 200,
        url: 'http://localhost/api/submit',
        status: 500,
        message: 'Internal Server Error',
      }
    ]
  };

  const networkReport = analyzeSession(networkMockSession);

  if (networkReport.likelyIssue !== 'Network request failed after submit') {
    console.error(`[FAIL] Test 4: Expected "Network request failed after submit", got: "${networkReport.likelyIssue}"`);
    passed = false;
  } else {
    console.log('[PASS] Test 4: likelyIssue is correctly prioritized as "Network request failed after submit"');
  }

  if (networkReport.severity !== 'high' && networkReport.severity !== 'medium') {
    console.error(`[FAIL] Test 4: Expected severity "high" or "medium", got: "${networkReport.severity}"`);
    passed = false;
  } else {
    console.log(`[PASS] Test 4: severity is "${networkReport.severity}"`);
  }

  if (networkReport.confidenceScore < 80) {
    console.error(`[FAIL] Test 4: Expected confidenceScore >= 80, got: ${networkReport.confidenceScore}`);
    passed = false;
  } else {
    console.log(`[PASS] Test 4: confidenceScore is high (${networkReport.confidenceScore})`);
  }

  const hasNetworkDebug = networkReport.technicalDetails.some(d => d.includes('Network failure detected: 1'));
  if (!hasNetworkDebug) {
    console.error(`[FAIL] Test 4: Expected technicalDetails to include "Network failure detected: 1"`);
    passed = false;
  } else {
    console.log('[PASS] Test 4: technicalDetails includes "Network failure detected: 1"');
  }

  const hasNetworkFinding = networkReport.findings.some(f => f.code === 'NETWORK_FAILURE' && f.label === 'Network request failed after submit');
  if (!hasNetworkFinding) {
    console.error(`[FAIL] Test 4: Expected findings to include NETWORK_FAILURE with "Network request failed after submit"`);
    passed = false;
  } else {
    console.log('[PASS] Test 4: findings includes NETWORK_FAILURE with "Network request failed after submit"');
  }

  // Test 5: Network failure DOM signal fallback.
  const domSignalMockSession: RecordingSession = {
    id: 'test-session-5',
    startedAt: Date.now(),
    stoppedAt: Date.now() + 5000,
    pageUrl: 'http://localhost/failed-api',
    pageTitle: 'Failed API Test (DOM signal)',
    formCount: 1,
    submitAttemptCount: 1,
    clickWithoutSubmitCount: 0,
    events: [
      {
        type: 'submit-click',
        timestamp: Date.now(),
        message: 'Submit clicked',
      },
      {
        type: 'network-failure-dom-signal',
        timestamp: Date.now() + 200,
        message: 'Network failure detected from page DOM content',
      }
    ]
  };

  const domSignalReport = analyzeSession(domSignalMockSession);

  if (domSignalReport.likelyIssue !== 'Network request failed after submit') {
    console.error(`[FAIL] Test 5: Expected "Network request failed after submit", got: "${domSignalReport.likelyIssue}"`);
    passed = false;
  } else {
    console.log('[PASS] Test 5: likelyIssue is correctly prioritized as "Network request failed after submit"');
  }

  if (domSignalReport.severity !== 'high' && domSignalReport.severity !== 'medium') {
    console.error(`[FAIL] Test 5: Expected severity "high" or "medium", got: "${domSignalReport.severity}"`);
    passed = false;
  } else {
    console.log(`[PASS] Test 5: severity is "${domSignalReport.severity}"`);
  }

  if (domSignalReport.confidenceScore < 80) {
    console.error(`[FAIL] Test 5: Expected confidenceScore >= 80, got: ${domSignalReport.confidenceScore}`);
    passed = false;
  } else {
    console.log(`[PASS] Test 5: confidenceScore is high (${domSignalReport.confidenceScore})`);
  }

  const hasDomSignalDebug = domSignalReport.technicalDetails.some(d => d.includes('Network DOM signal detected'));
  if (!hasDomSignalDebug) {
    console.error(`[FAIL] Test 5: Expected technicalDetails to include "Network DOM signal detected"`);
    passed = false;
  } else {
    console.log('[PASS] Test 5: technicalDetails includes "Network DOM signal detected"');
  }

  const hasDomSignalFailureDebug = domSignalReport.technicalDetails.some(d => d.includes('Network failure detected: 1'));
  if (!hasDomSignalFailureDebug) {
    console.error(`[FAIL] Test 5: Expected technicalDetails to include "Network failure detected: 1"`);
    passed = false;
  } else {
    console.log('[PASS] Test 5: technicalDetails includes "Network failure detected: 1"');
  }

  const hasDomSignalFinding = domSignalReport.findings.some(f => f.code === 'NETWORK_FAILURE' && f.label === 'Network request failed after submit');
  if (!hasDomSignalFinding) {
    console.error(`[FAIL] Test 5: Expected findings to include NETWORK_FAILURE with "Network request failed after submit"`);
    passed = false;
  } else {
    console.log('[PASS] Test 5: findings includes NETWORK_FAILURE with "Network request failed after submit"');
  }

  // Test 6: Validation failed without visible feedback.
  const validationNoFeedbackSession: RecordingSession = {
    id: 'test-session-6',
    startedAt: Date.now(),
    stoppedAt: Date.now() + 5000,
    pageUrl: 'http://localhost/invisible-error',
    pageTitle: 'Invisible Error Test',
    formCount: 1,
    submitAttemptCount: 1,
    clickWithoutSubmitCount: 0,
    events: [
      {
        type: 'form-submit',
        timestamp: Date.now(),
        snapshot: {
          index: 0,
          id: 'test-form',
          action: '',
          method: 'post',
          hasVisibleError: false,
          submitButtonDisabled: false,
          submitButtonExists: true,
          fields: [
            {
              tag: 'input',
              id: 'email-input',
              name: 'email',
              label: 'Email',
              type: 'email',
              valueState: 'present',
              required: true,
              valid: false,
              hidden: false,
              disabled: false,
              validationMessage: 'Constraint validation failure message',
            }
          ]
        }
      }
    ]
  };

  const validationNoFeedbackReport = analyzeSession(validationNoFeedbackSession);

  if (validationNoFeedbackReport.likelyIssue !== 'Validation failed without visible feedback') {
    console.error(`[FAIL] Test 6: Expected "Validation failed without visible feedback", got: "${validationNoFeedbackReport.likelyIssue}"`);
    passed = false;
  } else {
    console.log('[PASS] Test 6: likelyIssue is correctly prioritized as "Validation failed without visible feedback"');
  }

  if (validationNoFeedbackReport.severity !== 'medium' && validationNoFeedbackReport.severity !== 'high') {
    console.error(`[FAIL] Test 6: Expected severity "medium" or "high", got: "${validationNoFeedbackReport.severity}"`);
    passed = false;
  } else {
    console.log(`[PASS] Test 6: severity is "${validationNoFeedbackReport.severity}"`);
  }

  if (validationNoFeedbackReport.confidenceScore < 75) {
    console.error(`[FAIL] Test 6: Expected confidenceScore >= 75, got: ${validationNoFeedbackReport.confidenceScore}`);
    passed = false;
  } else {
    console.log(`[PASS] Test 6: confidenceScore is high enough (${validationNoFeedbackReport.confidenceScore})`);
  }

  const hasSubmitAttemptFinding = validationNoFeedbackReport.findings.some(f => f.code === 'SUBMIT_ATTEMPT' && f.label === 'Submit attempt detected');
  const hasInvalidFieldFinding = validationNoFeedbackReport.findings.some(f => f.code === 'INVALID_FIELD' && f.label.includes('failed validation'));
  const hasNoVisibleErrorFinding = validationNoFeedbackReport.findings.some(f => f.code === 'NO_VISIBLE_ERROR' && f.label === 'No visible error message was found after submit');

  if (!hasSubmitAttemptFinding || !hasInvalidFieldFinding || !hasNoVisibleErrorFinding) {
    console.error(`[FAIL] Test 6: Findings are missing some expected items. Submit attempt: ${hasSubmitAttemptFinding}, Invalid field: ${hasInvalidFieldFinding}, No visible error: ${hasNoVisibleErrorFinding}`);
    passed = false;
  } else {
    console.log('[PASS] Test 6: findings include all expected indicators');
  }

  // Test 7: Success / No clear failure detected.
  const successSession: RecordingSession = {
    id: 'test-session-7',
    startedAt: Date.now(),
    stoppedAt: Date.now() + 5000,
    pageUrl: 'http://localhost/success-form',
    pageTitle: 'Success Form Test',
    formCount: 1,
    submitAttemptCount: 1,
    clickWithoutSubmitCount: 0,
    events: [
      {
        type: 'form-submit',
        timestamp: Date.now(),
        snapshot: {
          index: 0,
          id: 'test-form',
          action: '',
          method: 'post',
          hasVisibleError: false,
          submitButtonDisabled: false,
          submitButtonExists: true,
          fields: [
            {
              tag: 'input',
              id: 'email-input',
              name: 'email',
              label: 'Email',
              type: 'email',
              valueState: 'present',
              required: true,
              valid: true,
              hidden: false,
              disabled: false,
              validationMessage: '',
            }
          ]
        }
      }
    ]
  };

  const successReport = analyzeSession(successSession);

  if (successReport.likelyIssue !== 'No clear failure detected') {
    console.error(`[FAIL] Test 7: Expected "No clear failure detected", got: "${successReport.likelyIssue}"`);
    passed = false;
  } else {
    console.log('[PASS] Test 7: likelyIssue is correctly prioritized as "No clear failure detected"');
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
