import { buildJiraReport } from '../src/analyzer/buildJiraReport';
import type { AnalysisReport } from '../src/types/formtrace';

const mockReport: AnalysisReport = {
  sessionId: 'test-session-jira',
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

console.log('--- Starting Jira Report Export Format Verification ---');
let passed = true;

// Test 1: Verification with showDebugMarkers = false
const jiraNoMarkers = buildJiraReport(mockReport, { showDebugMarkers: false });

const expectedNoMarkers = [
  'h2. Summary',
  'A required field was hidden and empty, preventing submission.',
  'h2. Environment',
  '* Page title: Demo Page Title',
  '* Page URL: http://localhost/demo-page',
  '* Timestamp: 2026-05-20T10:00:00.000Z',
  '* Tool: FormTrace',
  'h2. Issue',
  '* Likely issue: Hidden required field blocked submission',
  '* Severity: High',
  '* Confidence: 100%',
  'h2. Steps to Reproduce',
  '# Open the page listed above.',
  '# Start FormTrace recording.',
  '# Reproduce the form issue.',
  '# Stop and analyze the session.',
  'h2. Actual Result',
  'Hidden required field blocked submission / A required field was hidden and empty, preventing submission.',
  'h2. Expected Result',
  'The form should either submit successfully or show clear, visible feedback explaining what the user must fix.',
  'h2. Findings',
  '* Required field was empty: company_id (text)',
  'h2. Technical Details',
  '* Forms detected: 1',
  '* Submit attempts: 1',
  '* Hidden required empty fields found: 1',
  '* Field: company_id, type: text, required: true, hidden: true',
  'h2. Suggested Fixes',
  '* Ensure company_id is filled.',
  '* Remove the required attribute if it is meant to be hidden.',
  'h2. Privacy Notes',
  'FormTrace stores only form metadata locally. Actual form values, request bodies, response bodies, headers and cookies are not included.'
];

for (const line of expectedNoMarkers) {
  if (!jiraNoMarkers.includes(line)) {
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
  if (jiraNoMarkers.includes(marker)) {
    console.error(`[FAIL] Test 1: Expected debug marker "${marker}" to be EXCLUDED, but it was found.`);
    passed = false;
  }
}

if (passed) {
  console.log('[PASS] Test 1: Jira report format compiles correctly and excludes debug markers when requested.');
}

// Test 2: Verification with showDebugMarkers = true
const jiraWithMarkers = buildJiraReport(mockReport, { showDebugMarkers: true });

for (const line of expectedNoMarkers) {
  // Check baseline content still exists
  if (!jiraWithMarkers.includes(line)) {
    console.error(`[FAIL] Test 2: Expected output to include line "${line}"`);
    passed = false;
  }
}

// Assert that debug markers are included
for (const marker of excludedDebugMarkers) {
  if (!jiraWithMarkers.includes(marker)) {
    console.error(`[FAIL] Test 2: Expected debug marker "${marker}" to be INCLUDED, but it was missing.`);
    passed = false;
  }
}

if (passed) {
  console.log('[PASS] Test 2: Jira report format correctly includes debug markers when requested.');
}

if (!passed) {
  console.error('\nJira Report Export Format Verification FAILED!');
  process.exit(1);
} else {
  console.log('\nJira Report Export Format Verification PASSED!');
  process.exit(0);
}
