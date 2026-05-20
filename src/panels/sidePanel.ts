export const SIDE_PANEL_STABLE_MARKER = 'FormTrace side panel active';

/**
 * Programmatically opens the FormTrace Side Panel.
 * Uses chrome.sidePanel.open API (requires a user gesture context).
 * Falls back from window context to tab context if needed.
 */
export async function openFormTraceSidePanel(): Promise<{ success: boolean; error?: string }> {
  if (
    typeof chrome === 'undefined' ||
    !chrome.sidePanel ||
    typeof chrome.sidePanel.open !== 'function'
  ) {
    console.warn('[FormTrace] chrome.sidePanel.open API is not available.');
    return { success: false, error: 'chrome.sidePanel.open API is not available' };
  }

  // 1. Try to query the current window context
  try {
    const currentWindow = await chrome.windows.getCurrent();
    if (currentWindow && currentWindow.id !== undefined) {
      await chrome.sidePanel.open({ windowId: currentWindow.id });
      console.log(`[FormTrace] ${SIDE_PANEL_STABLE_MARKER} via windowId: ${currentWindow.id}`);
      return { success: true };
    }
  } catch (e) {
    console.log('[FormTrace] Failed to open via current window context, attempting tab context fallback...');
  }

  // 2. Try to query the active tab context as a fallback
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab && activeTab.id !== undefined) {
      await chrome.sidePanel.open({ tabId: activeTab.id });
      console.log(`[FormTrace] ${SIDE_PANEL_STABLE_MARKER} via tabId: ${activeTab.id}`);
      return { success: true };
    }
  } catch (e: any) {
    console.warn('[FormTrace] Failed to open via tab context:', e);
    return { success: false, error: e?.message || String(e) };
  }

  return { success: false, error: 'Could not retrieve windowId or tabId' };
}
