import { useEffect, useState, useCallback } from 'react';
import type { RecordingSession, AnalysisReport, Finding, Severity } from '../../src/types/formtrace';
import { buildMarkdownReport } from '../../src/analyzer/buildMarkdownReport';
import { buildGitHubIssueReport } from '../../src/analyzer/buildGitHubIssueReport';
import { buildJiraReport } from '../../src/analyzer/buildJiraReport';
import { analyzeSession } from '../../src/analyzer/analyzeSession';
import { normalizeReportForHiddenRequiredFields } from '../../src/analyzer/normalizeReport';
import { filterTechnicalDetailsForDebugMarkers } from '../../src/analyzer/filterDebugMarkers';
import {
  getReportHistory,
  saveReportHistory,
  deleteSavedReport,
  clearReportHistory,
  type SavedReport
} from '../../src/storage/reportHistory';

// INSTÄLLNING - Hur ofta popup:en pollar status från content script (ms)
const POLL_INTERVAL_MS = 1500;

// INSTÄLLNING - Hur länge "Copied!" toast visas (ms)
const TOAST_DURATION_MS = 1800;

interface StatusState {
  isRecording: boolean;
  formCount: number;
  eventCount: number;
  submitAttemptCount: number;
  lastReport: AnalysisReport | null;
}

async function sendMessage(type: string, extra?: Record<string, unknown>): Promise<unknown> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, ...extra }, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
      } else {
        resolve(response);
      }
    });
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`severity-badge ${severity}`}>
      {severity}
    </span>
  );
}

function ConfidenceBar({ score }: { score: number }) {
  return (
    <div className="confidence-row">
      <div className="confidence-bar-track">
        <div
          className="confidence-bar-fill"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="confidence-value">{score}%</span>
    </div>
  );
}

function FindingItem({ finding }: { finding: Finding }) {
  return (
    <li className="finding-item">
      <span className={`finding-dot ${finding.severity}`} />
      <span>{finding.label}</span>
    </li>
  );
}

function TechnicalDetails({ lines }: { lines: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        className="details-toggle"
        onClick={() => setOpen((o) => !o)}
        type="button"
        id="btn-toggle-details"
      >
        <span className={`details-toggle-icon ${open ? 'open' : ''}`}>▶</span>
        Technical details
      </button>
      {open && (
        <div className="details-panel" style={{ marginTop: 6 }}>
          {lines.map((line, i) => (
            <span key={i} className="detail-line">{line}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalysisCard({ report, showDebugMarkers }: { report: AnalysisReport; showDebugMarkers: boolean }) {
  return (
    <div className="analysis-card">
      {/* Header */}
      <div>
        <div className="analysis-title">Likely Issue</div>
        <div className="analysis-header">
          <div className="analysis-issue">{report.likelyIssue}</div>
          <SeverityBadge severity={report.severity} />
        </div>
      </div>

      {/* Confidence */}
      <ConfidenceBar score={report.confidenceScore} />

      {/* Summary */}
      <p className="analysis-summary">{report.summary}</p>

      {/* Findings */}
      {report.findings.length > 0 && (
        <div>
          <div className="findings-label">Findings</div>
          <ul className="findings-list">
            {report.findings.slice(0, 6).map((f, i) => (
              <FindingItem key={i} finding={f} />
            ))}
          </ul>
        </div>
      )}

      {/* Technical details */}
      <TechnicalDetails lines={filterTechnicalDetailsForDebugMarkers(report.technicalDetails, showDebugMarkers)} />
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [status, setStatus] = useState<StatusState>({
    isRecording: false,
    formCount: 0,
    eventCount: 0,
    submitAttemptCount: 0,
    lastReport: null,
  });
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState('Copied!');
  const [debugMarkersVisible, setDebugMarkersVisible] = useState(false);
  const [openedReport, setOpenedReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<SavedReport[]>([]);

  // Load setting and history on mount
  const loadHistory = useCallback(async () => {
    const data = await getReportHistory();
    setHistory(data);
  }, []);

  useEffect(() => {
    chrome.storage.local.get(['debugMarkersVisible'], (result) => {
      if (result.debugMarkersVisible !== undefined) {
        setDebugMarkersVisible(result.debugMarkersVisible);
      }
    });
    loadHistory();
  }, [loadHistory]);

  const saveHistoryHelper = async (report: AnalysisReport) => {
    const updated = await saveReportHistory(report);
    setHistory(updated);
  };

  const handleToggleDebug = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.checked;
    setDebugMarkersVisible(nextVal);
    chrome.storage.local.set({ debugMarkersVisible: nextVal });
  };

  // ─── Poll status ────────────────────────────────────────────────────────────

  const fetchStatus = useCallback(async () => {
    const res = await sendMessage('GET_STATUS') as {
      isRecording?: boolean;
      formCount?: number;
      eventCount?: number;
      submitAttemptCount?: number;
      lastReport?: AnalysisReport | null;
    } | null;

    if (!res) return;

    // Load active session for normalization if available
    const sessionRes = await sendMessage('GET_SESSION') as { session?: RecordingSession } | null;
    const session = sessionRes?.session ?? null;

    const normalizedReport = res.lastReport
      ? normalizeReportForHiddenRequiredFields(res.lastReport, session)
      : null;

    if (res.isRecording) {
      setOpenedReport((prev) => (prev !== null ? null : prev));
    }

    setStatus({
      isRecording: res.isRecording ?? false,
      formCount: res.formCount ?? 0,
      eventCount: res.eventCount ?? 0,
      submitAttemptCount: res.submitAttemptCount ?? 0,
      lastReport: normalizedReport,
    });
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // ─── Toast helper ───────────────────────────────────────────────────────────

  function toast(text: string) {
    setToastText(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), TOAST_DURATION_MS);
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  async function handleStart() {
    setOpenedReport(null);
    setLoading(true);
    await sendMessage('START_RECORDING');
    await fetchStatus();
    setLoading(false);
  }

  async function handleStop() {
    setOpenedReport(null);
    setLoading(true);
    // INSTÄLLNING - Wait briefly so async network-failure events can arrive before analysis.
    await new Promise((resolve) => setTimeout(resolve, 350));

    const res = await sendMessage('STOP_RECORDING') as {
      session?: RecordingSession;
      report?: AnalysisReport;
      error?: string;
    } | null;

    if (res?.session) {
      const freshReport = analyzeSession(res.session);
      const normalized = normalizeReportForHiddenRequiredFields(freshReport, res.session);
      setStatus((prev) => ({ ...prev, isRecording: false, lastReport: normalized }));
      await saveHistoryHelper(normalized);
    } else if (res?.report) {
      const normalized = normalizeReportForHiddenRequiredFields(res.report, null);
      setStatus((prev) => ({ ...prev, isRecording: false, lastReport: normalized }));
      await saveHistoryHelper(normalized);
    } else {
      setStatus((prev) => ({ ...prev, isRecording: false }));
    }
    await fetchStatus();
    setLoading(false);
  }

  async function handleReset() {
    setOpenedReport(null);
    setLoading(true);
    await sendMessage('RESET_SESSION');
    setStatus({
      isRecording: false,
      formCount: 0,
      eventCount: 0,
      submitAttemptCount: 0,
      lastReport: null,
    });
    setLoading(false);
    toast('Session reset');
  }

  function handleOpenHistoryItem(item: SavedReport) {
    setOpenedReport(item.report);
    toast('Report loaded');
  }

  async function handleDeleteHistoryItem(id: string) {
    const reportToDelete = history.find(item => item.id === id);
    const updated = await deleteSavedReport(id);
    setHistory(updated);
    if (openedReport && reportToDelete && openedReport.sessionId === reportToDelete.report.sessionId) {
      setOpenedReport(null);
    }
    toast('Report deleted');
  }

  async function handleClearHistory() {
    await clearReportHistory();
    setHistory([]);
    setOpenedReport(null);
    toast('History cleared');
  }

  async function handleCopyReport() {
    const report = activeReport;
    if (!report) return;

    const markdown = buildMarkdownReport(report, { showDebugMarkers: debugMarkersVisible });
    try {
      await navigator.clipboard.writeText(markdown);
      toast('Report copied!');
    } catch {
      // Fallback for clipboard permission issues
      const el = document.createElement('textarea');
      el.value = markdown;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      toast('Report copied!');
    }
  }

  async function handleCopyGitHubIssue() {
    const report = activeReport;
    if (!report) return;

    const markdown = buildGitHubIssueReport(report, { showDebugMarkers: debugMarkersVisible });
    try {
      await navigator.clipboard.writeText(markdown);
      toast('GitHub issue copied!');
    } catch {
      // Fallback for clipboard permission issues
      const el = document.createElement('textarea');
      el.value = markdown;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      toast('GitHub issue copied!');
    }
  }

  async function handleCopyJiraReport() {
    const report = activeReport;
    if (!report) return;

    const jiraReport = buildJiraReport(report, { showDebugMarkers: debugMarkersVisible });
    try {
      await navigator.clipboard.writeText(jiraReport);
      toast('Jira report copied!');
    } catch {
      // Fallback for clipboard permission issues
      const el = document.createElement('textarea');
      el.value = jiraReport;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      toast('Jira report copied!');
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const { isRecording, formCount, eventCount, submitAttemptCount, lastReport } = status;

  const activeReport = openedReport || lastReport;
  const displayFormCount = activeReport ? activeReport.formCount : formCount;
  const displayEventCount = activeReport ? activeReport.eventCount : eventCount;
  const displaySubmitAttemptCount = activeReport ? activeReport.submitAttemptCount : submitAttemptCount;

  return (
    <div className="popup">

      {/* Header */}
      <div className="header">
        <div className="header-left">
          <div className="logo">FormTrace</div>
          <div className="subtitle">Diagnose broken forms</div>
        </div>
        <span className="build-badge" id="build-badge">Build 1</span>
      </div>

      {/* Status pill */}
      <div className="status-pill">
        <span className={`status-dot ${isRecording ? 'recording' : ''}`} />
        <span className={`status-label ${isRecording ? 'recording' : ''}`}>
          {isRecording ? 'Recording…' : 'Idle'}
        </span>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{displayFormCount}</span>
          <span className="stat-label">Forms</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{displayEventCount}</span>
          <span className="stat-label">Events</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{displaySubmitAttemptCount}</span>
          <span className="stat-label">Submits</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="button-group">
        <button
          id="btn-start"
          className="btn btn-primary"
          onClick={handleStart}
          disabled={isRecording || loading}
          type="button"
        >
          ● Start recording
        </button>

        <button
          id="btn-stop"
          className="btn btn-danger"
          onClick={handleStop}
          disabled={!isRecording || loading}
          type="button"
        >
          ■ Stop &amp; analyze
        </button>

        <button
          id="btn-reset"
          className="btn btn-ghost btn-full"
          onClick={handleReset}
          disabled={loading}
          type="button"
        >
          ↺ Reset
        </button>

        <button
          id="btn-copy"
          className="btn btn-success"
          onClick={handleCopyReport}
          disabled={!activeReport || loading}
          type="button"
        >
          ⎘ Copy report
        </button>

        <button
          id="btn-copy-github"
          className="btn btn-success"
          onClick={handleCopyGitHubIssue}
          disabled={!activeReport || loading}
          type="button"
        >
          ⎘ Copy GitHub issue
        </button>

        <button
          id="btn-copy-jira"
          className="btn btn-success btn-full"
          onClick={handleCopyJiraReport}
          disabled={!activeReport || loading}
          type="button"
        >
          ⎘ Copy Jira report
        </button>
      </div>

      <div className="divider" />

      {/* Analysis result */}
      {activeReport ? (
        <AnalysisCard report={activeReport} showDebugMarkers={debugMarkersVisible} />
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p className="empty-text">
            Start recording, interact with a form,<br />
            then click <strong>Stop &amp; analyze</strong>.
          </p>
        </div>
      )}

      <div className="divider" />

      {/* Recent reports history */}
      <div className="history-section">
        <div className="history-header">
          <h3>Recent reports</h3>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="btn-clear-history"
              type="button"
              id="btn-clear-history"
            >
              Clear history
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="history-empty">No saved reports yet.</div>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-item-header">
                  <span className="history-item-title">{item.likelyIssue}</span>
                  <SeverityBadge severity={item.severity as any} />
                </div>
                <div className="history-meta">
                  <span className="history-meta-title" title={item.pageTitle}>{item.pageTitle}</span>
                  <span>•</span>
                  <span>{new Date(item.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>•</span>
                  <span>{item.confidenceScore}%</span>
                </div>
                <div className="history-actions">
                  <button
                    onClick={() => handleOpenHistoryItem(item)}
                    className="btn-history btn-history-open"
                    type="button"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleDeleteHistoryItem(item.id)}
                    className="btn-history btn-history-delete"
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="history-note">
          History is stored locally in this browser only. Form inputs and sensitive network payloads are never recorded.
        </div>
      </div>

      {/* Settings Panel */}
      <div className="settings-area">
        <div className="settings-label-container">
          <span className="settings-title">Show debug markers</span>
          <span className="settings-helper">Shows internal Build diagnostic lines in technical details.</span>
        </div>
        <input
          type="checkbox"
          id="chk-show-debug"
          className="settings-checkbox"
          checked={debugMarkersVisible}
          onChange={handleToggleDebug}
        />
      </div>

      {/* Privacy note */}
      <div className="privacy-note">
        <span className="privacy-icon">🔒</span>
        <span>Runs locally. Form values are not uploaded or stored.</span>
      </div>

      {/* Toast */}
      {showToast && <div className="toast">{toastText}</div>}
    </div>
  );
}
