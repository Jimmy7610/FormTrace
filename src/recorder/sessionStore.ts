import type { RecordingSession, RecordedEvent, AnalysisReport } from '../types/formtrace';

// INSTÄLLNING - Chrome storage nycklar
const KEY_SESSION = 'formtrace_session';
const KEY_REPORT = 'formtrace_report';

/** Generates a simple unique session ID. */
export function generateSessionId(): string {
  return `ft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Creates a fresh empty recording session. */
export function createEmptySession(pageUrl: string, pageTitle: string): RecordingSession {
  return {
    id: generateSessionId(),
    startedAt: Date.now(),
    pageUrl,
    pageTitle,
    formCount: 0,
    events: [],
    submitAttemptCount: 0,
    clickWithoutSubmitCount: 0,
  };
}

/** Saves the current session to chrome.storage.local. */
export async function saveSession(session: RecordingSession): Promise<void> {
  await chrome.storage.local.set({ [KEY_SESSION]: session });
}

/** Loads the last session from chrome.storage.local. */
export async function loadSession(): Promise<RecordingSession | null> {
  const result = await chrome.storage.local.get(KEY_SESSION);
  return (result[KEY_SESSION] as RecordingSession) ?? null;
}

/** Saves an analysis report to chrome.storage.local. */
export async function saveReport(report: AnalysisReport): Promise<void> {
  await chrome.storage.local.set({ [KEY_REPORT]: report });
}

/** Loads the last report from chrome.storage.local. */
export async function loadReport(): Promise<AnalysisReport | null> {
  const result = await chrome.storage.local.get(KEY_REPORT);
  return (result[KEY_REPORT] as AnalysisReport) ?? null;
}

/** Clears session and report from chrome.storage.local. */
export async function clearStorage(): Promise<void> {
  await chrome.storage.local.remove([KEY_SESSION, KEY_REPORT]);
}

/** Appends an event to the session and saves. */
export async function appendEvent(
  session: RecordingSession,
  event: RecordedEvent
): Promise<RecordingSession> {
  const updated: RecordingSession = {
    ...session,
    events: [...session.events, event],
    submitAttemptCount:
      event.type === 'form-submit' || event.type === 'submit-click'
        ? session.submitAttemptCount + 1
        : session.submitAttemptCount,
  };
  await saveSession(updated);
  return updated;
}
