import type { RecordedEvent } from '../types/formtrace';
import { DEBUG } from '../utils/messaging';

// INSTÄLLNING - Max antal nätverksfel som registreras per session
const MAX_NETWORK_ERRORS = 20;

type EventCallback = (event: RecordedEvent) => void;

let callback: EventCallback | null = null;
let errorCount = 0;
let patched = false;
let messageListener: ((e: MessageEvent) => void) | null = null;

export function setNetworkRecorderCallback(cb: EventCallback): void {
  callback = cb;
}

function emit(event: RecordedEvent): void {
  if (!callback) return;
  if (event.type === 'network-failure' || event.type === 'network-failure-dom-signal') {
    if (errorCount >= MAX_NETWORK_ERRORS) return;
    errorCount++;
  }
  callback(event);
}

function injectNetworkProbe(): void {
  if (document.querySelector('script[data-formtrace-probe]')) return;
  try {
    const script = document.createElement('script');
    script.dataset.formtraceProbe = 'true';
    script.src = chrome.runtime.getURL('page-network-probe.js');
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  } catch (err) {
    if (DEBUG) console.error('[FormTrace] Failed to inject network probe:', err);
  }
}

function handleMessage(event: MessageEvent): void {
  const data = event.data;
  if (!data || data.source !== 'FormTraceNetworkProbe') return;

  if (data.type === 'probe-active') {
    emit({
      type: 'network-probe-status',
      timestamp: Date.now(),
      message: 'Network probe active',
    });
    return;
  }

  if (data.type === 'network-failure') {
    emit({
      type: 'network-probe-status',
      timestamp: Date.now(),
      message: 'Network probe message received',
    });

    let url = data.url ?? '';
    try {
      const parsedUrl = new URL(url);
      parsedUrl.search = '';
      url = parsedUrl.toString();
    } catch (err) {
      const qIndex = url.indexOf('?');
      if (qIndex >= 0) {
        url = url.substring(0, qIndex);
      }
    }

    emit({
      type: 'network-failure',
      timestamp: data.timestamp ?? Date.now(),
      url,
      method: data.method,
      status: data.status ?? 0,
      statusText: data.statusText,
      message: data.errorMessage
        ? `fetch error: ${data.errorMessage}`
        : `fetch failed: ${data.status} ${data.statusText ?? ''}`,
    });

    if (DEBUG) console.debug('[FormTrace] Detected page-context network failure:', url, data.status);
  }
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

let customDemoListener: ((e: Event) => void) | null = null;

function handleCustomDemoError(event: Event): void {
  const customEv = event as CustomEvent;
  const message = customEv.detail?.message || 'Failed to fetch';
  
  emit({
    type: 'network-failure',
    timestamp: Date.now(),
    url: 'http://localhost/failed-api-custom-event',
    status: 0,
    message: `demo custom event error: ${message}`,
  });
  
  if (DEBUG) console.debug('[FormTrace] Detected custom demo error event');
}

/** Attaches network monitoring. */
export function attachNetworkRecorder(): void {
  if (patched) return;
  patched = true;
  errorCount = 0;

  if (!messageListener) {
    messageListener = handleMessage;
    window.addEventListener('message', messageListener);
  }

  if (!customDemoListener) {
    customDemoListener = handleCustomDemoError;
    window.addEventListener('formtrace-demo-network-error', customDemoListener);
  }

  injectNetworkProbe();

  emit({
    type: 'network-probe-status',
    timestamp: Date.now(),
    message: 'Network probe injected',
  });

  // Ping the probe in case it was already loaded
  window.postMessage({
    source: 'FormTraceContentScript',
    type: 'ping-probe'
  }, '*');

  patchFetch();
  patchXHR();

  if (DEBUG) console.debug('[FormTrace] Network recorder attached');
}

/** Resets network recorder state (patching cannot be undone). */
export function resetNetworkRecorder(): void {
  errorCount = 0;
  if (messageListener) {
    window.removeEventListener('message', messageListener);
    messageListener = null;
  }
  if (customDemoListener) {
    window.removeEventListener('formtrace-demo-network-error', customDemoListener);
    customDemoListener = null;
  }
  patched = false;
}
