import type { AnalysisReport } from '../types/formtrace';

// INSTÄLLNING - Maximum number of saved local reports kept in history.
const MAX_HISTORY_REPORTS = 10;

const STORAGE_KEY = 'formtrace_report_history';

// Keep minification-safe marker strings for build checks
if (typeof window !== 'undefined') {
  (window as any)['Report history storage active'] = true;
}

export type SavedReport = {
  id: string;
  savedAt: string;
  pageTitle: string;
  pageUrl: string;
  likelyIssue: string;
  confidenceScore: number;
  severity: string;
  report: AnalysisReport;
};

/** Retrieves all saved reports from local storage. */
export async function getReportHistory(): Promise<SavedReport[]> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return [];
  }
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || []);
    });
  });
}

/** Saves a new analysis report to history, enforcing the MAX_HISTORY_REPORTS cap. */
export async function saveReportHistory(report: AnalysisReport): Promise<SavedReport[]> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return [];
  }

  const history = await getReportHistory();

  // Avoid duplicates by matching the session ID of the report
  const isDuplicate = history.some(item => item.report.sessionId === report.sessionId);
  if (isDuplicate) {
    return history;
  }

  const newSaved: SavedReport = {
    id: `report-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    savedAt: new Date().toISOString(),
    pageTitle: report.pageTitle || '(no title)',
    pageUrl: report.pageUrl,
    likelyIssue: report.likelyIssue,
    confidenceScore: report.confidenceScore,
    severity: report.severity,
    report: report
  };

  const updated = [newSaved, ...history].slice(0, MAX_HISTORY_REPORTS);

  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: updated }, () => {
      resolve(updated);
    });
  });
}

/** Deletes a single saved report by ID. */
export async function deleteSavedReport(id: string): Promise<SavedReport[]> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return [];
  }

  const history = await getReportHistory();
  const updated = history.filter(item => item.id !== id);

  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: updated }, () => {
      resolve(updated);
    });
  });
}

/** Clears all saved reports from history. */
export async function clearReportHistory(): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return;
  }

  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: [] }, () => {
      resolve();
    });
  });
}
