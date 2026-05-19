import type { RecordingSession } from '../types/formtrace';

/**
 * Returns true if a submit attempt was made but no visible error
 * message was found near the form afterward.
 */
export function detectMissingVisibleErrors(session: RecordingSession): boolean {
  if (session.submitAttemptCount === 0) return false;

  // Check if any snapshot after a submit attempt shows no visible error
  let lastSubmitIdx = -1;
  for (let i = 0; i < session.events.length; i++) {
    const e = session.events[i];
    if (e.type === 'form-submit' || e.type === 'submit-click') {
      lastSubmitIdx = i;
    }
  }

  if (lastSubmitIdx === -1) return false;

  // Check snapshots after the last submit
  for (let i = lastSubmitIdx; i < session.events.length; i++) {
    const e = session.events[i];
    if (e.snapshot && !e.snapshot.hasVisibleError) {
      return true;
    }
  }

  return false;
}
