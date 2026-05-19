import type { RecordedEvent } from '../types/formtrace';
import { getAllForms, snapshotForm, getFormCount, isSubmitButton } from '../utils/dom';
import { DEBUG } from '../utils/messaging';

// INSTÄLLNING - Fördröjning (ms) innan en snapshot tas efter ett submit-försök
const POST_SUBMIT_SNAPSHOT_DELAY_MS = 300;

// INSTÄLLNING - Max antal events som sparas i en session (förhindrar minnesproblem)
const MAX_EVENTS = 500;

type EventCallback = (event: RecordedEvent) => void;

let callback: EventCallback | null = null;
let eventCount = 0;

// Track pending submit clicks to detect click-without-submit
let pendingClickTimestamp: number | null = null;

/** Registers the callback that receives recorded events. */
export function setRecorderCallback(cb: EventCallback): void {
  callback = cb;
}

function emit(event: RecordedEvent): void {
  if (!callback) return;
  if (eventCount >= MAX_EVENTS) return;
  eventCount++;
  callback(event);
}

function takeSnapshot(formIndex?: number): RecordedEvent {
  const forms = getAllForms();
  const snapshot =
    formIndex !== undefined && forms[formIndex]
      ? snapshotForm(forms[formIndex], formIndex)
      : forms[0]
      ? snapshotForm(forms[0], 0)
      : undefined;

  return {
    type: 'page-snapshot',
    timestamp: Date.now(),
    formIndex,
    snapshot,
  };
}

// ─── Event handlers ────────────────────────────────────────────────────────────

function handleSubmit(e: Event): void {
  const form = e.target as HTMLFormElement;
  const forms = getAllForms();
  const formIndex = forms.indexOf(form);

  const snapshot = formIndex >= 0 ? snapshotForm(form, formIndex) : undefined;

  emit({
    type: 'form-submit',
    timestamp: Date.now(),
    formIndex: formIndex >= 0 ? formIndex : undefined,
    snapshot,
  });

  if (DEBUG) console.debug('[FormTrace] form-submit captured');

  // Clear pending click — submit event did follow
  pendingClickTimestamp = null;

  // Take a delayed snapshot to capture any error messages shown after submit
  setTimeout(() => {
    emit(takeSnapshot(formIndex >= 0 ? formIndex : undefined));
  }, POST_SUBMIT_SNAPSHOT_DELAY_MS);
}

function handleClick(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  if (!isSubmitButton(target)) return;

  // Find which form owns this button
  const form = target.closest('form');
  const forms = getAllForms();
  const formIndex = form ? forms.indexOf(form) : -1;

  const snapshot = form ? snapshotForm(form, formIndex) : undefined;

  emit({
    type: 'submit-click',
    timestamp: Date.now(),
    formIndex: formIndex >= 0 ? formIndex : undefined,
    snapshot,
  });

  // Record the timestamp; if no submit event follows within 500ms, flag it
  pendingClickTimestamp = Date.now();
  setTimeout(() => {
    if (pendingClickTimestamp !== null) {
      emit({
        type: 'submit-click',
        timestamp: Date.now(),
        formIndex: formIndex >= 0 ? formIndex : undefined,
        message: 'Click detected but no form-submit event followed',
        snapshot,
      });
      pendingClickTimestamp = null;
    }
  }, 500);

  if (DEBUG) console.debug('[FormTrace] submit-click captured');
}

function handleInvalid(e: Event): void {
  const target = e.target as HTMLInputElement;
  const form = target.closest('form');
  const forms = getAllForms();
  const formIndex = form ? forms.indexOf(form) : -1;

  emit({
    type: 'form-invalid',
    timestamp: Date.now(),
    fieldName: target.name || target.id || '',
    fieldType: target.type || '',
    fieldId: target.id || '',
    formIndex: formIndex >= 0 ? formIndex : undefined,
  });
}

function handleChange(e: Event): void {
  const target = e.target as HTMLInputElement;
  if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

  emit({
    type: 'input-change',
    timestamp: Date.now(),
    fieldName: target.name || target.id || '',
    fieldType: target.type || '',
    fieldId: target.id || '',
  });
}

// ─── Attach / detach ──────────────────────────────────────────────────────────

let attached = false;

/** Attaches all DOM event listeners for recording. */
export function attachFormRecorder(): void {
  if (attached) return;
  attached = true;
  eventCount = 0;
  pendingClickTimestamp = null;

  document.addEventListener('submit', handleSubmit, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('invalid', handleInvalid, true);
  document.addEventListener('change', handleChange, true);

  // Initial snapshot
  emit(takeSnapshot(0));

  if (DEBUG) console.debug('[FormTrace] Form recorder attached');
}

/** Removes all DOM event listeners. */
export function detachFormRecorder(): void {
  if (!attached) return;
  attached = false;

  document.removeEventListener('submit', handleSubmit, true);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('invalid', handleInvalid, true);
  document.removeEventListener('change', handleChange, true);

  if (DEBUG) console.debug('[FormTrace] Form recorder detached');
}

/** Returns count of forms currently on the page. */
export function getCurrentFormCount(): number {
  return getFormCount();
}
