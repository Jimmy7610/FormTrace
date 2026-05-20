import type { RecordingSession } from '../types/formtrace';

/**
 * Returns true if any snapshot captured a disabled submit button
 * at the time of a submit-click event.
 */
export function detectDisabledSubmit(session: RecordingSession): boolean {
  return session.events.some(
    (e) =>
      (e.type === 'submit-click' && e.snapshot?.submitButtonDisabled === true) ||
      e.type === 'disabled-submit-attempt'
  );
}
