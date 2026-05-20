import { buildGitHubIssueReport } from '../src/analyzer/buildGitHubIssueReport';
import type { AnalysisReport } from '../src/types/formtrace';

const mockReport: AnalysisReport = {
  sessionId: 'test-session-github',
  timestamp: '2026-05-20T10:00:00.000Z',
  pageUrl: 'http://localhost/demo-page',
  pageTitle: 'Demo Page Title',
  formCount: 1,
  submitAttemptCount: 1,
  eventCount: 4,
  likelyIssue: 'Hidden required field blocked submission',
  severity: 'high',
  confidenceScore: 100,
  summary: 'A required field was hidden and empty, preventing submission.',
  findings: [
    {
      code: 'REQUIRED_EMPTY',
      label: 'Required field was empty',
      severity: 'high',
      detail: 'company_id (text)',
    }
  ],
  technicalDetails: [
    'Forms detected: 1',
    'Submit attempts: 1',
    'Hidden required empty fields found: 1',
    'Analyzer runtime fix: hidden-required-first-pass',
    'Popup normalization fix: final-report-guard',
    'Field: company_id, type: text, required: true, hidden: true'
  ],
  suggestedFixes: [
    'Ensure company_id is filled.',
    'Remove the required attribute if it is meant to be hidden.'
  ]
};

console.log('--- Starting GitHub Issue Export Format Verification ---');
let passed = true;

// Test 1: Verification with showDebugMarkers = false
const issueMarkdownNoMarkers = buildGitHubIssueReport(mockReport, { showDebugMarkers: false });

const expectedNoMarkers = [
  '# FormTrace: Hidden required field blocked submission',
  '## Summary',
  'A required field was hidden and empty, preventing submission.',
  '## Page',
  '- Title: Demo Page Title',
  '- URL: http://localhost/demo-page',
  '- Timestamp: 2026-05-20T10:00:00.000Z',
  '## Severity',
  '- Severity: High',
  '- Confidence: 100%',
  '## Findings',
  '- Required field was empty: company_id (text)',
  '## Technical Details',
  '- Forms detected: 1',
  '- Submit attempts: 1',
  '- Hidden required empty fields found: 1',
  '- Field: company_id, type: text, required: true, hidden: true',
  '## Suggested Fixes',
  '- Ensure company_id is filled.',
  '- Remove the required attribute if it is meant to be hidden.',
  '## Privacy',
  'FormTrace stores only form metadata locally. Actual form values, request bodies, response bodies, headers and cookies are not included.',
  '## Reproduction Notes',
  '1. Open the page listed above.',
  '2. Start FormTrace recording.',
  '3. Reproduce the form issue.',
  '4. Compare the behavior with this report.'
];

for (const line of expectedNoMarkers) {
  if (!issueMarkdownNoMarkers.includes(line)) {
    console.error(`[FAIL] Test 1: Expected output to include line "${line}"`);
    passed = false;
  }
}

// Assert that debug markers are excluded
const excludedDebugMarkers = [
  'Analyzer runtime fix: hidden-required-first-pass',
  'Popup normalization fix: final-report-guard'
];

for (const marker of excludedDebugMarkers) {
  if (issueMarkdownNoMarkers.includes(marker)) {
    console.error(`[FAIL] Test 1: Expected debug marker "${marker}" to be EXCLUDED, but it was found.`);
    passed = false;
  }
}

if (passed) {
  console.log('[PASS] Test 1: GitHub Issue report format compiles correctly and excludes debug markers when requested.');
}

// Test 2: Verification with showDebugMarkers = true
const issueMarkdownWithMarkers = buildGitHubIssueReport(mockReport, { showDebugMarkers: true });

for (const line of expectedNoMarkers) {
  // Check baseline content still exists
  if (!issueMarkdownWithMarkers.includes(line)) {
    console.error(`[FAIL] Test 2: Expected output to include line "${line}"`);
    passed = false;
  }
}

// Assert that debug markers are included
for (const marker of excludedDebugMarkers) {
  if (!issueMarkdownWithMarkers.includes(marker)) {
    console.error(`[FAIL] Test 2: Expected debug marker "${marker}" to be INCLUDED, but it was missing.`);
    passed = false;
  }
}

if (passed) {
  console.log('[PASS] Test 2: GitHub Issue report format correctly includes debug markers when requested.');
}

if (!passed) {
  console.error('\nGitHub Issue Export Format Verification FAILED!');
  process.exit(1);
} else {
  console.log('\nGitHub Issue Export Format Verification PASSED!');
  process.exit(0);
}
