import type { RecordingSession, FieldSnapshot } from '../types/formtrace';

/** Returns invalid fields detected via the HTML5 Constraint Validation API. */
export function detectInvalidFields(session: RecordingSession): FieldSnapshot[] {
  const found: FieldSnapshot[] = [];
  const seen = new Set<string>();

  for (const event of session.events) {
    if (!event.snapshot) continue;
    for (const field of event.snapshot.fields) {
      const key = `${field.name}|${field.id}`;
      if (!field.valid && !seen.has(key)) {
        seen.add(key);
        found.push(field);
      }
    }
  }

  return found;
}

/** Returns required fields that were empty when a snapshot was taken. */
export function detectRequiredEmptyFields(
  session: RecordingSession
): FieldSnapshot[] {
  const found: FieldSnapshot[] = [];
  const seen = new Set<string>();

  for (const event of session.events) {
    if (!event.snapshot) continue;
    for (const field of event.snapshot.fields) {
      const key = `${field.name}|${field.id}`;
      if (
        field.required &&
        !field.hidden &&
        field.valueState === 'empty' &&
        !seen.has(key)
      ) {
        seen.add(key);
        found.push(field);
      }
    }
  }

  return found;
}
