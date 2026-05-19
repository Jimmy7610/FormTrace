import type { RecordingSession, FieldSnapshot } from '../types/formtrace';

/** 
 * Central helper to aggressively find any hidden, required, empty fields.
 * Scans ALL possible locations in the recorded session.
 */
export function getHiddenRequiredEmptyFieldsFromSession(
  session: RecordingSession
): FieldSnapshot[] {
  const found: FieldSnapshot[] = [];
  const seen = new Set<string>();

  if (!session) return found;

  const checkField = (field: any) => {
    if (!field) return;
    
    // Check required
    const isRequired = field.required === true;
    if (!isRequired) return;

    // Check hidden
    const isHidden = 
      field.hidden === true || 
      field.isHidden === true || 
      field.visible === false || 
      field.visibility === 'hidden' || 
      field.display === 'none' ||
      !!field.hiddenReason;

    if (!isHidden) return;

    // Check empty
    const isEmpty = 
      field.value === 'empty' || 
      field.valueState === 'empty' || 
      field.present === false || 
      field.hasValue === false || 
      field.empty === true || 
      field.value === '';

    if (!isEmpty) return;

    const key = `${field.name || 'noname'}|${field.id || 'noid'}`;
    if (!seen.has(key)) {
      seen.add(key);
      found.push(field as FieldSnapshot);
    }
  };

  const checkFieldsList = (fields: any[]) => {
    if (Array.isArray(fields)) {
      fields.forEach(checkField);
    }
  };

  const checkSnapshot = (snapshot: any) => {
    if (!snapshot) return;
    checkFieldsList(snapshot.fields);
    if (Array.isArray(snapshot.forms)) {
      snapshot.forms.forEach((form: any) => {
        if (form) checkFieldsList(form.fields);
      });
    }
  };

  // Safely scan events
  if (Array.isArray(session.events)) {
    for (const event of session.events) {
      if (!event) continue;
      
      const dynEvent = event as any;

      // event.snapshot
      checkSnapshot(dynEvent.snapshot);
      
      // event.payload
      if (dynEvent.payload) {
        checkSnapshot(dynEvent.payload.snapshot);
        checkFieldsList(dynEvent.payload.fields);
      }

      // formSnapshots
      if (dynEvent.formSnapshot) checkSnapshot(dynEvent.formSnapshot);
      if (Array.isArray(dynEvent.formSnapshots)) {
        dynEvent.formSnapshots.forEach(checkSnapshot);
      }

      // raw fields
      checkFieldsList(dynEvent.fields);
    }
  }

  return found;
}
