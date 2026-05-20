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

const probeCode = `
(function() {
  if (window.__FormTraceNetworkProbeInstalled__) {
    window.postMessage({
      source: "FormTraceNetworkProbe",
      type: "probe-active",
      timestamp: Date.now()
    }, "*");
    return;
  }
  window.__FormTraceNetworkProbeInstalled__ = true;

  window.addEventListener('message', function(event) {
    const data = event.data;
    if (data && data.source === 'FormTraceContentScript' && data.type === 'ping-probe') {
      window.postMessage({
        source: "FormTraceNetworkProbe",
        type: "probe-active",
        timestamp: Date.now()
      }, "*");
    }
  });

  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const requestInfo = args[0];
    const init = args[1];
    let url = "";
    let method = "GET";

    if (typeof requestInfo === 'string') {
      url = requestInfo;
    } else if (requestInfo instanceof Request) {
      url = requestInfo.url;
      method = requestInfo.method || "GET";
    }
    if (init && init.method) {
      method = init.method;
    }

    try {
      const response = await originalFetch.apply(this, args);
      if (!response.ok) {
        window.postMessage({
          source: "FormTraceNetworkProbe",
          type: "network-failure",
          method,
          url,
          status: response.status,
          statusText: response.statusText,
          errorMessage: "",
          timestamp: Date.now()
        }, "*");
      }
      return response;
    } catch (err) {
      window.postMessage({
        source: "FormTraceNetworkProbe",
        type: "network-failure",
        method,
        url,
        status: 0,
        statusText: "",
        errorMessage: String(err),
        timestamp: Date.now()
      }, "*");
      throw err;
    }
  };

  const OriginalXHR = window.XMLHttpRequest;
  const originalOpen = OriginalXHR.prototype.open;
  const originalSend = OriginalXHR.prototype.send;

  OriginalXHR.prototype.open = function(method, url, ...args) {
    this._method = method;
    this._url = url.toString();
    return originalOpen.apply(this, [method, url, ...args]);
  };

  OriginalXHR.prototype.send = function(body) {
    const xhr = this;
    xhr.addEventListener('load', function() {
      if (xhr.status >= 400 || xhr.status === 0) {
        window.postMessage({
          source: "FormTraceNetworkProbe",
          type: "network-failure",
          method: xhr._method || "GET",
          url: xhr._url || "",
          status: xhr.status,
          statusText: xhr.statusText || "",
          errorMessage: "",
          timestamp: Date.now()
        }, "*");
      }
    });

    xhr.addEventListener('error', function() {
      window.postMessage({
        source: "FormTraceNetworkProbe",
        type: "network-failure",
        method: xhr._method || "GET",
        url: xhr._url || "",
        status: 0,
        statusText: "",
        errorMessage: "XHR network error",
        timestamp: Date.now()
      }, "*");
    });

    return originalSend.apply(this, [body]);
  };

  // Dispatch initial active message
  window.postMessage({
    source: "FormTraceNetworkProbe",
    type: "probe-active",
    timestamp: Date.now()
  }, "*");
})();
`;

function injectNetworkProbe(): void {
  if (document.querySelector('script[data-formtrace-probe]')) return;
  try {
    const script = document.createElement('script');
    script.setAttribute('data-formtrace-probe', 'true');
    script.textContent = probeCode;
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
