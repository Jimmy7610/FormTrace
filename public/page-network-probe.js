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
