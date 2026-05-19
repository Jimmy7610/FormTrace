import type { RecordedEvent } from '../types/formtrace';
import { DEBUG } from '../utils/messaging';

// INSTÄLLNING - Max antal nätverksfel som registreras per session
const MAX_NETWORK_ERRORS = 20;

type EventCallback = (event: RecordedEvent) => void;

let callback: EventCallback | null = null;
let errorCount = 0;
let patched = false;

export function setNetworkRecorderCallback(cb: EventCallback): void {
  callback = cb;
}

function emit(event: RecordedEvent): void {
  if (!callback || errorCount >= MAX_NETWORK_ERRORS) return;
  errorCount++;
  callback(event);
}

/** Patches window.fetch to detect failed requests. */
function patchFetch(): void {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (...args: Parameters<typeof fetch>): Promise<Response> {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
    try {
      const response = await originalFetch(...args);
      if (!response.ok) {
        emit({
          type: 'network-failure',
          timestamp: Date.now(),
          url,
          status: response.status,
          message: `fetch failed: ${response.status} ${response.statusText}`,
        });
        if (DEBUG) console.debug('[FormTrace] fetch failure:', url, response.status);
      }
      return response;
    } catch (err) {
      emit({
        type: 'network-failure',
        timestamp: Date.now(),
        url,
        status: 0,
        message: `fetch error: ${String(err)}`,
      });
      if (DEBUG) console.debug('[FormTrace] fetch error:', url, err);
      throw err;
    }
  };
}

/** Patches XMLHttpRequest to detect failed requests. */
function patchXHR(): void {
  const OriginalXHR = window.XMLHttpRequest;

  class PatchedXHR extends OriginalXHR {
    private _url = '';

    open(method: string, url: string | URL, ...rest: unknown[]): void {
      this._url = url.toString();
      // @ts-expect-error — forwarding variadic args
      super.open(method, url, ...rest);
    }

    send(body?: Document | XMLHttpRequestBodyInit | null): void {
      this.addEventListener('load', () => {
        if (this.status >= 400 || this.status === 0) {
          emit({
            type: 'network-failure',
            timestamp: Date.now(),
            url: this._url,
            status: this.status,
            message: `XHR failed: ${this.status}`,
          });
          if (DEBUG) console.debug('[FormTrace] XHR failure:', this._url, this.status);
        }
      });
      this.addEventListener('error', () => {
        emit({
          type: 'network-failure',
          timestamp: Date.now(),
          url: this._url,
          status: 0,
          message: 'XHR network error',
        });
      });
      super.send(body);
    }
  }

  window.XMLHttpRequest = PatchedXHR;
}

/** Attaches network monitoring. */
export function attachNetworkRecorder(): void {
  if (patched) return;
  patched = true;
  errorCount = 0;

  patchFetch();
  patchXHR();

  if (DEBUG) console.debug('[FormTrace] Network recorder attached');
}

/** Resets network recorder state (patching cannot be undone). */
export function resetNetworkRecorder(): void {
  errorCount = 0;
}
