// INSTÄLLNING - Default width for the persistent FormTrace window.
export const DEFAULT_PERSISTENT_WINDOW_WIDTH = 420;

// INSTÄLLNING - Default height for the persistent FormTrace window.
export const DEFAULT_PERSISTENT_WINDOW_HEIGHT = 720;

export const PERSISTENT_WINDOW_STORAGE_KEY = 'formtracePersistentWindowId';

/**
 * Opens the persistent FormTrace window.
 * If the window is already open, it focuses that window instead of opening a duplicate.
 * Stale window IDs are automatically detected and replaced.
 */
export async function openPersistentWindow(): Promise<void> {
  const width = DEFAULT_PERSISTENT_WINDOW_WIDTH;
  const height = DEFAULT_PERSISTENT_WINDOW_HEIGHT;
  const url = chrome.runtime.getURL('persistent.html');

  // Check if there is an existing window ID stored
  const storage = await chrome.storage.local.get([PERSISTENT_WINDOW_STORAGE_KEY]);
  const storedId = storage[PERSISTENT_WINDOW_STORAGE_KEY];

  if (storedId !== undefined && typeof storedId === 'number') {
    try {
      // Check if this window actually exists and focus it
      const existingWindow = await chrome.windows.get(storedId);
      if (existingWindow && existingWindow.id !== undefined) {
        await chrome.windows.update(existingWindow.id, { focused: true });
        return;
      }
    } catch (e) {
      // Stale window ID - clear the stored id
      await chrome.storage.local.remove([PERSISTENT_WINDOW_STORAGE_KEY]);
    }
  }

  // Open a new window
  try {
    const newWindow = await chrome.windows.create({
      url,
      type: 'popup',
      width,
      height,
      focused: true
    });

    if (newWindow && newWindow.id !== undefined) {
      await chrome.storage.local.set({ [PERSISTENT_WINDOW_STORAGE_KEY]: newWindow.id });
    }
  } catch (error) {
    console.warn('[FormTrace] Failed to create persistent window:', error);
  }
}
