import type { FormSnapshot } from '../types/formtrace';
import { serializeField, findLabelText } from './privacy';
import { isElementHidden, isVisibleErrorElement } from './visibility';
import { inspectElementVisibility } from '../recorder/inspectElementVisibility';

// INSTÄLLNING - CSS-selektorer för element som kan fungera som submit-knappar
const SUBMIT_SELECTORS = [
  'button[type="submit"]',
  'input[type="submit"]',
  'button:not([type])',          // default type is submit inside forms
  '[role="button"][type="submit"]',
];

// INSTÄLLNING - Selektorer för synliga felmeddelanden nära formulär
const ERROR_SELECTORS = [
  '[role="alert"]',
  '[aria-live]',
  '.error',
  '.errors',
  '.error-message',
  '.field-error',
  '.invalid-feedback',
  '.validation-error',
  '.form-error',
  '.alert-error',
  '[class*="error"]',
  '[class*="invalid"]',
];

/** Returns all form elements on the current page. */
export function getAllForms(): HTMLFormElement[] {
  return Array.from(document.querySelectorAll('form'));
}

/** Returns the count of forms detected on the current page. */
export function getFormCount(): number {
  return document.querySelectorAll('form').length;
}

/** Returns interactive fields within a form. */
export function getFormFields(form: HTMLFormElement): HTMLElement[] {
  return Array.from(
    form.querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]), textarea, select'
    )
  );
}

/** Returns the primary submit button for a form, if any. */
export function getSubmitButton(form: HTMLFormElement): HTMLButtonElement | HTMLInputElement | null {
  for (const selector of SUBMIT_SELECTORS) {
    const btn = form.querySelector<HTMLButtonElement | HTMLInputElement>(selector);
    if (btn) return btn;
  }
  return null;
}

/** Returns true if a visible error message exists near or within the form. */
export function hasVisibleErrorNearForm(form: HTMLFormElement): boolean {
  // Check inside the form
  for (const selector of ERROR_SELECTORS) {
    const els = form.querySelectorAll<HTMLElement>(selector);
    for (const el of els) {
      if (isVisibleErrorElement(el)) return true;
    }
  }

  // Check siblings of the form (error containers placed after form)
  const siblings = form.parentElement?.querySelectorAll<HTMLElement>(ERROR_SELECTORS.join(','));
  if (siblings) {
    for (const el of siblings) {
      if (isVisibleErrorElement(el)) return true;
    }
  }

  return false;
}

/** Builds a full FormSnapshot for a given form element. */
export function snapshotForm(form: HTMLFormElement, index: number): FormSnapshot {
  const fields = getFormFields(form).map((el) => {
    const field = serializeField(el, findLabelText(el));
    field.cssVisibilityCauses = inspectElementVisibility(el);
    return field;
  });

  const submitBtn = getSubmitButton(form);
  const submitButtonExists = submitBtn !== null;
  const submitButtonDisabled = submitBtn
    ? submitBtn.disabled || submitBtn.getAttribute('aria-disabled') === 'true'
    : false;

  return {
    index,
    id: form.id ?? '',
    action: form.action ?? '',
    method: form.method ?? 'get',
    fields,
    hasVisibleError: hasVisibleErrorNearForm(form),
    submitButtonDisabled,
    submitButtonExists,
  };
}

/** Returns true if an element is a submit-type button. */
export function isSubmitButton(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input') {
    return (el as HTMLInputElement).type === 'submit';
  }
  if (tag === 'button') {
    const type = (el as HTMLButtonElement).type;
    return type === 'submit';
  }
  return false;
}
