import { analyzeSession } from '../src/analyzer/analyzeSession';
import type { RecordingSession } from '../src/types/formtrace';

function runAnalyzerCheck() {
  console.log('--- Starting Analyzer Verification ---');

  // Simulate a session with a visible required field that is filled, 
  // and a hidden required field that is empty.
  const mockSession: RecordingSession = {
    id: 'test-session',
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
          fields: [
            {
              id: 'visible-username',
              name: 'username',
              type: 'text',
              valueState: 'present',
              required: true,
              valid: true,
              hidden: false,
            },
            {
              id: 'hidden-company-id',
              name: 'company_id',
              type: 'text',
              valueState: 'empty',
              required: true,
              valid: false,
              hidden: true,
              validationMessage: 'Fyll i det här fältet.',
            }
          ]
        }
      }
    ]
  };

  const report = analyzeSession(mockSession);

  let passed = true;

  if (report.likelyIssue !== 'Hidden required field blocked submission') {
    console.error(`[FAIL] Expected likelyIssue to be "Hidden required field blocked submission", got: "${report.likelyIssue}"`);
    passed = false;
  } else {
    console.log('[PASS] likelyIssue is correctly prioritized as "Hidden required field blocked submission"');
  }

  if (report.severity !== 'high') {
    console.error(`[FAIL] Expected severity to be "high", got: "${report.severity}"`);
    passed = false;
  } else {
    console.log('[PASS] severity is "high"');
  }

  if (report.confidenceScore < 90) {
    console.error(`[FAIL] Expected confidenceScore >= 90, got: ${report.confidenceScore}`);
    passed = false;
  } else {
    console.log(`[PASS] confidenceScore is high (${report.confidenceScore})`);
  }

  const hasHiddenFinding = report.findings.some(f => f.code === 'HIDDEN_REQUIRED_FIELD');
  if (!hasHiddenFinding) {
    console.error(`[FAIL] Expected findings to include HIDDEN_REQUIRED_FIELD`);
    passed = false;
  } else {
    console.log('[PASS] findings include HIDDEN_REQUIRED_FIELD');
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
