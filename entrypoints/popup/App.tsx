import { useEffect, useState, useCallback } from 'react';
import type { RecordingSession, AnalysisReport, Finding, Severity } from '../../src/types/formtrace';
import { buildMarkdownReport } from '../../src/analyzer/buildMarkdownReport';
import { analyzeSession } from '../../src/analyzer/analyzeSession';
import { normalizeReportForHiddenRequiredFields } from '../../src/analyzer/normalizeReport';

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

function AnalysisCard({ report }: { report: AnalysisReport }) {
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
      <TechnicalDetails lines={report.technicalDetails} />
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
    setLoading(true);
    await sendMessage('START_RECORDING');
    await fetchStatus();
    setLoading(false);
  }

  async function handleStop() {
    setLoading(true);
    const res = await sendMessage('STOP_RECORDING') as {
      session?: RecordingSession;
      report?: AnalysisReport;
      error?: string;
    } | null;

    if (res?.session) {
      const freshReport = analyzeSession(res.session);
      const normalized = normalizeReportForHiddenRequiredFields(freshReport, res.session);
      setStatus((prev) => ({ ...prev, isRecording: false, lastReport: normalized }));
    } else if (res?.report) {
      const normalized = normalizeReportForHiddenRequiredFields(res.report, null);
      setStatus((prev) => ({ ...prev, isRecording: false, lastReport: normalized }));
    } else {
      setStatus((prev) => ({ ...prev, isRecording: false }));
    }
    await fetchStatus();
    setLoading(false);
  }

  async function handleReset() {
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

  async function handleCopyReport() {
    const report = status.lastReport;
    if (!report) return;

    const markdown = buildMarkdownReport(report);
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

  // ─── Render ─────────────────────────────────────────────────────────────────

  const { isRecording, formCount, eventCount, submitAttemptCount, lastReport } = status;

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
          <span className="stat-value">{formCount}</span>
          <span className="stat-label">Forms</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{eventCount}</span>
          <span className="stat-label">Events</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{submitAttemptCount}</span>
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
          className="btn btn-ghost"
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
          disabled={!lastReport || loading}
          type="button"
        >
          ⎘ Copy report
        </button>
      </div>

      <div className="divider" />

      {/* Analysis result */}
      {lastReport ? (
        <AnalysisCard report={lastReport} />
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p className="empty-text">
            Start recording, interact with a form,<br />
            then click <strong>Stop &amp; analyze</strong>.
          </p>
        </div>
      )}

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
