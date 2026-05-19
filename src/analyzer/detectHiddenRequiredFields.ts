import type { RecordingSession, FieldSnapshot } from '../types/formtrace';

/** Returns all hidden required fields from the session's snapshot events. */
export function detectHiddenRequiredFields(
  session: RecordingSession
): FieldSnapshot[] {
  const found: FieldSnapshot[] = [];
  const seen = new Set<string>();

  for (const event of session.events) {
    if (!event.snapshot) continue;
    for (const field of event.snapshot.fields) {
      const key = `${field.name}|${field.id}`;
      if (field.hidden && field.required && field.valueState === 'empty' && !seen.has(key)) {
        seen.add(key);
        found.push(field);
      }
    }
  }

  return found;
}
