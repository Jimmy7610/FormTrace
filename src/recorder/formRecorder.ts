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

function checkDomForNetworkErrors(formElement: HTMLFormElement | null): void {
  const searchArea = formElement || document.body;
  const text = searchArea.textContent || "";
  const lowerText = text.toLowerCase();
  
  const hasErrorText = 
    lowerText.includes("network error") ||
    lowerText.includes("failed to fetch") ||
    lowerText.includes("request failed");
    
  if (hasErrorText) {
    emit({
      type: 'network-failure-dom-signal',
      timestamp: Date.now(),
      message: 'Network failure detected from page DOM content',
    });
    if (DEBUG) console.debug('[FormTrace] network-failure-dom-signal captured');
  }
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

  // Check for DOM network failure signals after a submit attempt
  [100, 300, 600, 1000].forEach((delay) => {
    setTimeout(() => {
      if (attached) {
        checkDomForNetworkErrors(formIndex >= 0 ? forms[formIndex] : null);
      }
    }, delay);
  });
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

  // Check for DOM network failure signals after submit click in case submit event is bypassed
  [200, 500, 800, 1200].forEach((delay) => {
    setTimeout(() => {
      if (attached) {
        checkDomForNetworkErrors(formIndex >= 0 ? forms[formIndex] : null);
      }
    }, delay);
  });

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

// ─── Disabled Submit Button Attempt Detection ───

function findSubmitDisabledButton(target: HTMLElement | null, x?: number, y?: number): HTMLElement | null {
  if (target) {
    const btn = target.closest('button, input[type="submit"]');
    if (btn && (btn.hasAttribute('disabled') || btn.getAttribute('aria-disabled') === 'true')) {
      if (btn.tagName.toLowerCase() === 'button') {
        const type = btn.getAttribute('type');
        if (!type || type === 'submit') {
          return btn as HTMLElement;
        }
      } else if (btn.tagName.toLowerCase() === 'input') {
        if ((btn as HTMLInputElement).type === 'submit') {
          return btn as HTMLElement;
        }
      }
    }

    // Support elements with aria-disabled="true" and submit-like role/text
    const ariaDisabledEl = target.closest('[aria-disabled="true"]');
    if (ariaDisabledEl) {
      const role = ariaDisabledEl.getAttribute('role');
      if (role === 'button' || role === 'link' || ariaDisabledEl.tagName.toLowerCase() === 'button') {
        const text = ariaDisabledEl.textContent?.toLowerCase() ?? '';
        const isSubmitLike =
          text.includes('submit') ||
          text.includes('skicka') ||
          text.includes('send') ||
          text.includes('save') ||
          text.includes('create') ||
          text.includes('registrera') ||
          text.includes('logga in') ||
          text.includes('sign in');
        if (isSubmitLike) {
          return ariaDisabledEl as HTMLElement;
        }
      }
    }
  }

  // Fallback using elementFromPoint
  if (x !== undefined && y !== undefined) {
    try {
      const el = document.elementFromPoint(x, y) as HTMLElement | null;
      if (el && el !== target) {
        const btn = el.closest('button, input[type="submit"]');
        if (btn && (btn.hasAttribute('disabled') || btn.getAttribute('aria-disabled') === 'true')) {
          if (btn.tagName.toLowerCase() === 'button') {
            const type = btn.getAttribute('type');
            if (!type || type === 'submit') {
              return btn as HTMLElement;
            }
          } else if (btn.tagName.toLowerCase() === 'input') {
            if ((btn as HTMLInputElement).type === 'submit') {
              return btn as HTMLElement;
            }
          }
        }
      }
    } catch (err) {
      // Ignore errors
    }
  }

  return null;
}

let lastDisabledSubmitAttemptTime = 0;

function emitDisabledSubmitAttempt(btn: HTMLElement): void {
  const now = Date.now();
  if (now - lastDisabledSubmitAttemptTime < 100) return;
  lastDisabledSubmitAttemptTime = now;

  const form = btn.closest('form');
  const forms = getAllForms();
  const formIndex = form ? forms.indexOf(form) : -1;
  const snapshot = form ? snapshotForm(form, formIndex) : undefined;

  const buttonText = btn.textContent?.trim().slice(0, 50) ?? '';

  emit({
    type: 'disabled-submit-attempt',
    timestamp: now,
    formIndex: formIndex >= 0 ? formIndex : undefined,
    snapshot,
    tagName: btn.tagName.toLowerCase(),
    fieldType: btn.getAttribute('type') || undefined,
    buttonText,
    disabled: true,
    formId: form?.id || undefined,
    formName: form?.getAttribute('name') || undefined,
  });

  if (DEBUG) console.debug('[FormTrace] disabled-submit-attempt captured');
}

function handlePointerDown(e: PointerEvent): void {
  const target = e.target as HTMLElement | null;
  const btn = findSubmitDisabledButton(target, e.clientX, e.clientY);
  if (btn) {
    emitDisabledSubmitAttempt(btn);
  }
}

function handleMouseDown(e: MouseEvent): void {
  if (window.PointerEvent) return; // Skip if PointerEvent is supported
  const target = e.target as HTMLElement | null;
  const btn = findSubmitDisabledButton(target, e.clientX, e.clientY);
  if (btn) {
    emitDisabledSubmitAttempt(btn);
  }
}

function handleKeyDown(e: KeyboardEvent): void {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const target = document.activeElement as HTMLElement | null;
  const btn = findSubmitDisabledButton(target);
  if (btn) {
    emitDisabledSubmitAttempt(btn);
  }
}

// ─── Attach / detach ──────────────────────────────────────────────────────────

let attached = false;

/** Attaches all DOM event listeners for recording. */
export function attachFormRecorder(): void {
  if (attached) return;
  attached = true;
  eventCount = 0;
  pendingClickTimestamp = null;
  lastDisabledSubmitAttemptTime = 0;

  document.addEventListener('submit', handleSubmit, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('invalid', handleInvalid, true);
  document.addEventListener('change', handleChange, true);
  document.addEventListener('pointerdown', handlePointerDown, true);
  document.addEventListener('mousedown', handleMouseDown, true);
  document.addEventListener('keydown', handleKeyDown, true);

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
  document.removeEventListener('pointerdown', handlePointerDown, true);
  document.removeEventListener('mousedown', handleMouseDown, true);
  document.removeEventListener('keydown', handleKeyDown, true);

  if (DEBUG) console.debug('[FormTrace] Form recorder detached');
}

/** Returns count of forms currently on the page. */
export function getCurrentFormCount(): number {
  return getFormCount();
}
