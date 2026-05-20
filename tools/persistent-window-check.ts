import fs from 'fs';
import path from 'path';

// Mock chrome APIs before importing persistentWindow helper
let mockStorage: Record<string, any> = {};
let windowsList: Array<{ id: number; url: string; type: string; width: number; height: number; focused?: boolean }> = [];
let nextWindowId = 1000;
let getThrowsForId: number | null = null;
let lastCreateOptions: any = null;
let lastUpdateCalls: Array<{ id: number; updateInfo: any }> = [];

(global as any).chrome = {
  storage: {
    local: {
      get: (keys: string[] | Record<string, any>, callback?: (result: Record<string, any>) => void) => {
        const result: Record<string, any> = {};
        let actualKeys: string[] = [];
        if (typeof keys === 'string') {
          actualKeys = [keys];
        } else if (Array.isArray(keys)) {
          actualKeys = keys;
        } else if (keys && typeof keys === 'object') {
          actualKeys = Object.keys(keys);
        }
        actualKeys.forEach((key) => {
          result[key] = mockStorage[key];
        });
        if (callback) {
          setTimeout(() => callback(result), 0);
          return;
        }
        return Promise.resolve(result);
      },
      set: (data: Record<string, any>, callback?: () => void) => {
        Object.entries(data).forEach(([key, val]) => {
          mockStorage[key] = val;
        });
        if (callback) {
          setTimeout(callback, 0);
          return;
        }
        return Promise.resolve();
      },
      remove: (keys: string[] | string, callback?: () => void) => {
        const actualKeys = typeof keys === 'string' ? [keys] : keys;
        actualKeys.forEach((k) => delete mockStorage[k]);
        if (callback) {
          setTimeout(callback, 0);
          return;
        }
        return Promise.resolve();
      }
    }
  },
  windows: {
    get: async (id: number) => {
      if (getThrowsForId === id) {
        throw new Error('Window not found');
      }
      const win = windowsList.find(w => w.id === id);
      if (!win) {
        throw new Error('Window not found');
      }
      return win;
    },
    create: async (options: { url: string; type: string; width: number; height: number; focused?: boolean }) => {
      lastCreateOptions = options;
      const newWin = {
        id: nextWindowId++,
        url: options.url,
        type: options.type,
        width: options.width,
        height: options.height,
        focused: options.focused ?? true
      };
      windowsList.push(newWin);
      return newWin;
    },
    update: async (id: number, updateInfo: { focused: boolean }) => {
      lastUpdateCalls.push({ id, updateInfo });
      const win = windowsList.find(w => w.id === id);
      if (!win) {
        throw new Error('Window not found');
      }
      win.focused = updateInfo.focused;
      return win;
    }
  },
  runtime: {
    getURL: (pathStr: string) => `chrome-extension://mock-extension-id/${pathStr}`
  }
};

import {
  openPersistentWindow,
  DEFAULT_PERSISTENT_WINDOW_WIDTH,
  DEFAULT_PERSISTENT_WINDOW_HEIGHT,
  PERSISTENT_WINDOW_STORAGE_KEY
} from '../src/windows/persistentWindow';

async function runTests() {
  console.log('--- Starting Persistent Window Verification ---');

  // Test 1: Validate Constants
  if (DEFAULT_PERSISTENT_WINDOW_WIDTH !== 420) {
    console.error(`[FAIL] Expected DEFAULT_PERSISTENT_WINDOW_WIDTH to be 420, got ${DEFAULT_PERSISTENT_WINDOW_WIDTH}`);
    process.exit(1);
  }
  if (DEFAULT_PERSISTENT_WINDOW_HEIGHT !== 720) {
    console.error(`[FAIL] Expected DEFAULT_PERSISTENT_WINDOW_HEIGHT to be 720, got ${DEFAULT_PERSISTENT_WINDOW_HEIGHT}`);
    process.exit(1);
  }
  if (PERSISTENT_WINDOW_STORAGE_KEY !== 'formtracePersistentWindowId') {
    console.error(`[FAIL] Expected PERSISTENT_WINDOW_STORAGE_KEY to be 'formtracePersistentWindowId', got ${PERSISTENT_WINDOW_STORAGE_KEY}`);
    process.exit(1);
  }
  console.log('[PASS] Test 1: Window constants and storage keys are correct.');

  // Test 2: Source code contains stable user-facing strings
  const panelPath = path.resolve(__dirname, '../src/ui/FormTracePanel.tsx');
  const panelContent = fs.readFileSync(panelPath, 'utf8');

  const stableStrings = [
    'Open persistent window',
    'Persistent window',
    'FormTrace persistent window active',
    'Chrome closes normal popups automatically'
  ];

  stableStrings.forEach((str) => {
    if (!panelContent.includes(str)) {
      console.error(`[FAIL] Source code is missing stable string: "${str}"`);
      process.exit(1);
    }
  });
  console.log('[PASS] Test 2: Panel source code contains all required stable strings.');

  // Test 3: Open window when none exists
  mockStorage = {};
  windowsList = [];
  nextWindowId = 1000;
  getThrowsForId = null;
  lastCreateOptions = null;

  await openPersistentWindow();
  
  if (windowsList.length !== 1) {
    console.error(`[FAIL] Expected 1 window to be created, got ${windowsList.length}`);
    process.exit(1);
  }
  if (!lastCreateOptions) {
    console.error(`[FAIL] Expected chrome.windows.create options to be recorded`);
    process.exit(1);
  }
  if (lastCreateOptions.type !== 'popup') {
    console.error(`[FAIL] Expected window type 'popup', got ${lastCreateOptions.type}`);
    process.exit(1);
  }
  if (!lastCreateOptions.url.includes('persistent.html')) {
    console.error(`[FAIL] Expected url to use 'persistent.html', got ${lastCreateOptions.url}`);
    process.exit(1);
  }
  if (lastCreateOptions.width !== 420) {
    console.error(`[FAIL] Expected width 420, got ${lastCreateOptions.width}`);
    process.exit(1);
  }
  if (lastCreateOptions.height !== 720) {
    console.error(`[FAIL] Expected height 720, got ${lastCreateOptions.height}`);
    process.exit(1);
  }
  const firstWinId = windowsList[0].id;
  if (mockStorage[PERSISTENT_WINDOW_STORAGE_KEY] !== firstWinId) {
    console.error(`[FAIL] Stored window ID ${mockStorage[PERSISTENT_WINDOW_STORAGE_KEY]} does not match created window ID ${firstWinId}`);
    process.exit(1);
  }
  console.log('[PASS] Test 3: Correctly opens window when none exists with correct configuration.');

  // Test 4: Focus existing window instead of duplicate opening
  windowsList[0].focused = false;
  lastUpdateCalls = [];
  await openPersistentWindow();

  if (windowsList.length !== 1) {
    console.error(`[FAIL] Expected window count to remain 1, but got ${windowsList.length}`);
    process.exit(1);
  }
  if (!windowsList[0].focused) {
    console.error('[FAIL] Existing window was not focused');
    process.exit(1);
  }
  if (lastUpdateCalls.length !== 1) {
    console.error(`[FAIL] Expected 1 call to chrome.windows.update, got ${lastUpdateCalls.length}`);
    process.exit(1);
  }
  if (lastUpdateCalls[0].id !== firstWinId) {
    console.error(`[FAIL] Expected chrome.windows.update to target ID ${firstWinId}, got ${lastUpdateCalls[0].id}`);
    process.exit(1);
  }
  if (lastUpdateCalls[0].updateInfo.focused !== true) {
    console.error(`[FAIL] Expected chrome.windows.update to request focus: true, got ${JSON.stringify(lastUpdateCalls[0].updateInfo)}`);
    process.exit(1);
  }
  console.log('[PASS] Test 4: Correctly focuses existing window.');

  // Test 5: Re-open new window if the stored ID is stale
  getThrowsForId = firstWinId; // simulate window deleted
  await openPersistentWindow();

  if (windowsList.length !== 2) {
    console.error(`[FAIL] Expected a new window to be opened due to stale ID, total windows: ${windowsList.length}`);
    process.exit(1);
  }
  const secondWinId = windowsList[1].id;
  if (mockStorage[PERSISTENT_WINDOW_STORAGE_KEY] !== secondWinId) {
    console.error(`[FAIL] Expected new window ID ${secondWinId} to be stored, got ${mockStorage[PERSISTENT_WINDOW_STORAGE_KEY]}`);
    process.exit(1);
  }
  console.log('[PASS] Test 5: Correctly opens a new window if stored ID is stale.');

  console.log('Persistent Window Verification PASSED!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('[ERROR] Persistent test failed:', err);
  process.exit(1);
});
