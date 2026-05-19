import type { RecordedEvent } from '../types/formtrace';
import { DEBUG } from '../utils/messaging';

// INSTÄLLNING - Max antal console-fel som registreras per session
const MAX_CONSOLE_ERRORS = 30;

type EventCallback = (event: RecordedEvent) => void;

let callback: EventCallback | null = null;
let errorCount = 0;
let patched = false;

export function setConsoleRecorderCallback(cb: EventCallback): void {
  callback = cb;
}

function emit(event: RecordedEvent): void {
  if (!callback || errorCount >= MAX_CONSOLE_ERRORS) return;
  errorCount++;
  callback(event);
}

/** Patches console.error to capture errors during recording. */
export function attachConsoleRecorder(): void {
  if (patched) return;
  patched = true;
  errorCount = 0;

  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]): void => {
    const message = args
      .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
      .join(' ')
      .slice(0, 200); // INSTÄLLNING - Max tecken per felmeddelande

    emit({
      type: 'console-error',
      timestamp: Date.now(),
      message,
    });

    originalError(...args);

    if (DEBUG) console.debug('[FormTrace] console.error captured');
  };

  if (DEBUG) console.debug('[FormTrace] Console recorder attached');
}

/** Resets error count (patch cannot be undone). */
export function resetConsoleRecorder(): void {
  errorCount = 0;
}
