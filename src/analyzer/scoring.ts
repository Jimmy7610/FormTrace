import type { RecordingSession } from '../types/formtrace';
import { getHiddenRequiredEmptyFieldsFromSession } from './detectHiddenRequiredFields';

// ─── Scoring weights ───────────────────────────────────────────────────────────
// INSTÄLLNING - Justera poäng för varje fyndat problem (0–100 klampat)

/** Submit button was disabled when clicked. */
export const SCORE_DISABLED_SUBMIT = 30;

/** A hidden required field was found empty. */
export const SCORE_HIDDEN_REQUIRED_FIELD = 90;

/** A visible required field was empty. */
export const SCORE_REQUIRED_EMPTY = 20;

/** An invalid field was detected (Constraint Validation API). */
export const SCORE_INVALID_FIELD = 20;

/** No visible error shown after a failed submit attempt. */
export const SCORE_NO_VISIBLE_ERROR = 15;

/** Submit button was clicked but no form-submit event followed. */
export const SCORE_CLICK_WITHOUT_SUBMIT = 20;

/** A network request failed after submit. */
export const SCORE_NETWORK_FAILURE = 25;

/** A console error occurred during the recording session. */
export const SCORE_CONSOLE_ERROR = 15;

// ─── Score computation ────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  disabledSubmit: boolean;
  hiddenRequiredField: boolean;
  requiredEmpty: boolean;
  invalidField: boolean;
  noVisibleError: boolean;
  clickWithoutSubmit: boolean;
  networkFailure: boolean;
  consoleError: boolean;
  total: number;
}

/** Computes a confidence score breakdown from the session data. */
export function computeScore(session: RecordingSession): ScoreBreakdown {
  const events = session.events;

  const disabledSubmit = events.some(
    (e) =>
      e.type === 'submit-click' &&
      e.snapshot?.submitButtonDisabled === true
  );

  const hiddenFields = getHiddenRequiredEmptyFieldsFromSession(session);
  const hiddenRequiredField = hiddenFields.length > 0;

  const requiredEmpty = events.some(
    (e) =>
      e.snapshot?.fields.some((f) => !f.hidden && f.required && f.valueState === 'empty')
  );

  const invalidField = events.some(
    (e) =>
      (e.type === 'form-invalid' || e.type === 'page-snapshot') &&
      (e.snapshot?.fields.some((f) => !f.valid) ?? false)
  );

  const noVisibleError =
    session.submitAttemptCount > 0 &&
    events.some(
      (e) =>
        (e.type === 'form-submit' || e.type === 'submit-click') &&
        e.snapshot?.hasVisibleError === false
    );

  const clickWithoutSubmit = session.clickWithoutSubmitCount > 0;

  const networkFailure = events.some((e) => e.type === 'network-failure');

  const consoleError = events.some((e) => e.type === 'console-error');

  let total = 0;
  if (disabledSubmit) total += SCORE_DISABLED_SUBMIT;
  if (hiddenRequiredField) total += SCORE_HIDDEN_REQUIRED_FIELD;
  if (requiredEmpty) total += SCORE_REQUIRED_EMPTY;
  if (invalidField) total += SCORE_INVALID_FIELD;
  if (noVisibleError) total += SCORE_NO_VISIBLE_ERROR;
  if (clickWithoutSubmit) total += SCORE_CLICK_WITHOUT_SUBMIT;
  if (networkFailure) total += SCORE_NETWORK_FAILURE;
  if (consoleError) total += SCORE_CONSOLE_ERROR;

  // INSTÄLLNING - Maxpoäng är 100
  total = Math.min(100, total);

  return {
    disabledSubmit,
    hiddenRequiredField,
    requiredEmpty,
    invalidField,
    noVisibleError,
    clickWithoutSubmit,
    networkFailure,
    consoleError,
    total,
  };
}
