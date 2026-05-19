import type { FormTraceMessage } from '../types/formtrace';

/**
 * Send a typed message to the background service worker from any context.
 * Returns the response, or null on error.
 */
export async function sendToBackground<T = unknown>(
  message: FormTraceMessage
): Promise<T | null> {
  try {
    const response = await chrome.runtime.sendMessage(message);
    return response as T;
  } catch (err) {
    // INSTÄLLNING - Sätt DEBUG = true för att aktivera utförliga loggar
    if (DEBUG) console.debug('[FormTrace] sendToBackground error:', err);
    return null;
  }
}

/**
 * Send a typed message to a specific tab's content script.
 */
export async function sendToTab<T = unknown>(
  tabId: number,
  message: FormTraceMessage
): Promise<T | null> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, message);
    return response as T;
  } catch (err) {
    if (DEBUG) console.debug('[FormTrace] sendToTab error:', err);
    return null;
  }
}

/**
 * Listen for typed messages in the current context.
 * Returns a cleanup function to remove the listener.
 */
export function onMessage(
  handler: (
    message: FormTraceMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => boolean | void
): () => void {
  chrome.runtime.onMessage.addListener(handler);
  return () => chrome.runtime.onMessage.removeListener(handler);
}

// INSTÄLLNING - Sätt till true för att aktivera debug-loggar i konsolen
export const DEBUG = false;
