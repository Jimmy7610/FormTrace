// Mock chrome.storage.local before importing reportHistory
let mockStorage: Record<string, any> = {};

(global as any).chrome = {
  storage: {
    local: {
      get: (keys: string[], callback: (result: Record<string, any>) => void) => {
        const result: Record<string, any> = {};
        keys.forEach((key) => {
          result[key] = mockStorage[key];
        });
        setTimeout(() => callback(result), 0);
      },
      set: (data: Record<string, any>, callback?: () => void) => {
        Object.entries(data).forEach(([key, val]) => {
          mockStorage[key] = val;
        });
        if (callback) setTimeout(callback, 0);
      }
    }
  }
};

import {
  getReportHistory,
  saveReportHistory,
  deleteSavedReport,
  clearReportHistory,
  type SavedReport
} from '../src/storage/reportHistory';
import type { AnalysisReport } from '../src/types/formtrace';

function makeMockReport(id: string): AnalysisReport {
  return {
    sessionId: id,
    timestamp: new Date().toISOString(),
    pageUrl: 'http://127.0.0.1:4173/demo.html',
    pageTitle: `Demo Page ${id}`,
    formCount: 1,
    submitAttemptCount: 1,
    eventCount: 4,
    likelyIssue: 'Disabled submit button',
    confidenceScore: 90,
    severity: 'high',
    summary: 'A description',
    findings: [],
    technicalDetails: [
      'Forms detected: 1',
      'Field: company_id, type: text, required: true, hidden: true, value: empty'
    ],
    suggestedFixes: []
  };
}

async function runTests() {
  console.log('--- Starting History Storage Verification ---');

  // Test 1: Initial state is empty
  let history = await getReportHistory();
  if (history.length !== 0) {
    console.error('[FAIL] Expected history to be empty initially');
    process.exit(1);
  }
  console.log('[PASS] Test 1: History is initially empty.');

  // Test 2: Save a report
  const report1 = makeMockReport('session-1');
  history = await saveReportHistory(report1);
  if (history.length !== 1 || history[0].report.sessionId !== 'session-1') {
    console.error('[FAIL] Failed to save first report');
    process.exit(1);
  }
  console.log('[PASS] Test 2: Successfully saved first report.');

  // Test 3: Duplicates are ignored
  history = await saveReportHistory(report1);
  if (history.length !== 1) {
    console.error('[FAIL] Saved duplicate report');
    process.exit(1);
  }
  console.log('[PASS] Test 3: Duplicate report was correctly ignored.');

  // Test 4: Newest report is prepended first
  const report2 = makeMockReport('session-2');
  history = await saveReportHistory(report2);
  if (history.length !== 2 || history[0].report.sessionId !== 'session-2' || history[1].report.sessionId !== 'session-1') {
    console.error('[FAIL] Newest report should be first');
    process.exit(1);
  }
  console.log('[PASS] Test 4: Newest report is prepended first.');

  // Test 5: Max cap is enforced at 10
  for (let i = 3; i <= 11; i++) {
    await saveReportHistory(makeMockReport(`session-${i}`));
  }
  history = await getReportHistory();
  if (history.length !== 10) {
    console.error(`[FAIL] Expected history length to be 10, got ${history.length}`);
    process.exit(1);
  }
  if (history[0].report.sessionId !== 'session-11' || history[9].report.sessionId !== 'session-2') {
    console.error('[FAIL] History pruning or ordering is incorrect');
    console.log('History order:', history.map((h) => h.report.sessionId));
    process.exit(1);
  }
  console.log('[PASS] Test 5: Maximum cap of 10 reports is enforced, pruning the oldest.');

  // Test 6: Delete a specific report
  const deleteId = history[2].id;
  const deletedSessionId = history[2].report.sessionId;
  history = await deleteSavedReport(deleteId);
  if (history.length !== 9 || history.some((item) => item.id === deleteId)) {
    console.error(`[FAIL] Failed to delete report with ID ${deleteId}`);
    process.exit(1);
  }
  console.log('[PASS] Test 6: Successfully deleted a specific report.');

  // Test 7: Clear all reports
  await clearReportHistory();
  history = await getReportHistory();
  if (history.length !== 0) {
    console.error('[FAIL] Expected history to be cleared');
    process.exit(1);
  }
  console.log('[PASS] Test 7: Successfully cleared all history.');

  console.log('History Storage Verification PASSED!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('[ERROR] Test execution failed:', err);
  process.exit(1);
});
