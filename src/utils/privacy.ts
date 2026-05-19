import type { FieldSnapshot } from '../types/formtrace';
import { isElementHidden } from './visibility';

// INSTÄLLNING - Typer av inputs vars värden aldrig sparas, oavsett inställning
const ALWAYS_MASKED_TYPES = new Set([
  'password',
  'credit-card',
  'card',
  'cvv',
  'cvc',
  'ssn',
]);

// INSTÄLLNING - Namnmönster som indikerar känsliga fält (case-insensitive)
const SENSITIVE_NAME_PATTERNS = [
  /passw/i,
  /credit.?card/i,
  /card.?num/i,
  /cvv/i,
  /cvc/i,
  /ssn/i,
  /social.?sec/i,
  /tax.?id/i,
];

/**
 * Returns 'empty' | 'present' — never the actual value.
 * Passwords and credit-card-like fields always return 'present' if non-empty
 * to avoid leaking even the emptiness state for security fields.
 */
export function safeValueState(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): 'empty' | 'present' {
  const value = (element as HTMLInputElement).value ?? '';
  return value.trim().length > 0 ? 'present' : 'empty';
}

/** Returns true if the field type or name indicates sensitive data. */
export function isSensitiveField(
  type: string,
  name: string,
  id: string
): boolean {
  if (ALWAYS_MASKED_TYPES.has(type.toLowerCase())) return true;
  const combined = `${name} ${id}`.toLowerCase();
  return SENSITIVE_NAME_PATTERNS.some((p) => p.test(combined));
}

/**
 * Builds a safe FieldSnapshot from a real DOM element.
 * Never stores actual values.
 */
export function serializeField(
  element: HTMLElement,
  labelText: string
): FieldSnapshot {
  const inp = element as HTMLInputElement;
  const tag = inp.tagName.toLowerCase();
  const type = inp.type ?? 'text';
  const name = inp.name ?? '';
  const id = inp.id ?? '';
  const required = inp.required ?? false;
  const disabled = inp.disabled ?? false;
  const valid = inp.validity ? inp.validity.valid : true;
  const validationMessage = inp.validationMessage ?? '';

  // Check visual visibility using robust DOM utility
  const hidden = isElementHidden(inp);

  // INSTÄLLNING - Byt till true för att alltid sätta valueState till 'empty' för alla fält
  const valueState = safeValueState(inp);

  return {
    tag,
    type,
    name,
    id,
    label: labelText,
    required,
    disabled,
    hidden,
    valid,
    validationMessage,
    valueState,
  };
}

/** Finds the <label> text associated with a form field. */
export function findLabelText(element: HTMLElement): string {
  const inp = element as HTMLInputElement;

  // Check for aria-label
  const ariaLabel = inp.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel.trim();

  // Check for associated <label> via id
  if (inp.id) {
    const label = document.querySelector<HTMLLabelElement>(`label[for="${inp.id}"]`);
    if (label) return label.innerText.trim();
  }

  // Check for wrapping <label>
  const parent = inp.closest('label');
  if (parent) return parent.innerText.replace(inp.value, '').trim();

  // Check placeholder as fallback
  const placeholder = inp.getAttribute('placeholder');
  if (placeholder) return placeholder.trim();

  return '';
}
