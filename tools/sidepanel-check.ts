import fs from 'fs';
import path from 'path';

// Mock chrome APIs before importing sidePanel helper
let lastOpenOptions: any = null;
let queryWindowCalled = false;
let queryTabsCalled = false;
let currentWindowId: number | undefined = 999;
let activeTabId: number | undefined = 101;

(global as any).chrome = {
  windows: {
    getCurrent: async () => {
      queryWindowCalled = true;
      if (currentWindowId === undefined) {
        throw new Error('No current window');
      }
      return { id: currentWindowId };
    }
  },
  tabs: {
    query: async (queryInfo: any) => {
      queryTabsCalled = true;
      if (activeTabId === undefined) {
        return [];
      }
      return [{ id: activeTabId }];
    }
  },
  sidePanel: {
    open: async (options: any) => {
      lastOpenOptions = options;
      return Promise.resolve();
    }
  }
};

import { openFormTraceSidePanel, SIDE_PANEL_STABLE_MARKER } from '../src/panels/sidePanel';

async function runTests() {
  console.log('--- Starting Side Panel Verification ---');

  // Test 1: Verify config file content contains sidePanel permission and default_path
  const configPath = path.resolve(__dirname, '../wxt.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');

  if (!configContent.includes('sidePanel')) {
    console.error('[FAIL] wxt.config.ts is missing the "sidePanel" permission!');
    process.exit(1);
  }
  if (!configContent.includes('sidepanel.html')) {
    console.error('[FAIL] wxt.config.ts is missing the default_path pointing to sidepanel.html!');
    process.exit(1);
  }
  console.log('[PASS] Test 1: wxt.config.ts contains correct sidepanel manifest configuration.');

  // Test 2: Source code contains stable user-facing strings
  const panelPath = path.resolve(__dirname, '../src/ui/FormTracePanel.tsx');
  const panelContent = fs.readFileSync(panelPath, 'utf8');

  const sidePanelPath = path.resolve(__dirname, '../src/panels/sidePanel.ts');
  const sidePanelContent = fs.readFileSync(sidePanelPath, 'utf8');

  const stablePanelStrings = [
    'Open side panel',
    'Side panel',
    'Use the side panel to keep FormTrace visible beside the page.'
  ];

  stablePanelStrings.forEach((str) => {
    if (!panelContent.includes(str)) {
      console.error(`[FAIL] FormTracePanel is missing stable string: "${str}"`);
      process.exit(1);
    }
  });

  if (!sidePanelContent.includes('FormTrace side panel active')) {
    console.error('[FAIL] sidePanel.ts is missing stable string: "FormTrace side panel active"');
    process.exit(1);
  }

  // Verify normal popup functionality strings are still there
  const normalStrings = [
    '● Start recording',
    '■ Stop &amp; analyze',
    '⎘ Copy report',
    'Recent reports'
  ];
  normalStrings.forEach((str) => {
    if (!panelContent.includes(str)) {
      console.error(`[FAIL] Source code is missing normal popup string: "${str}"`);
      process.exit(1);
    }
  });

  console.log('[PASS] Test 2: Panel source code contains all required side panel and normal popup stable strings.');

  // Test 3: openFormTraceSidePanel uses chrome.sidePanel.open with window context first
  lastOpenOptions = null;
  queryWindowCalled = false;
  queryTabsCalled = false;
  currentWindowId = 999;

  let result = await openFormTraceSidePanel();
  if (!result.success) {
    console.error(`[FAIL] Expected successful open, got error: ${result.error}`);
    process.exit(1);
  }
  if (!queryWindowCalled) {
    console.error('[FAIL] Expected to call chrome.windows.getCurrent first');
    process.exit(1);
  }
  if (lastOpenOptions?.windowId !== 999) {
    console.error(`[FAIL] Expected open called with windowId 999, got ${JSON.stringify(lastOpenOptions)}`);
    process.exit(1);
  }
  console.log('[PASS] Test 3: openFormTraceSidePanel queries window context and calls chrome.sidePanel.open correctly.');

  // Test 4: openFormTraceSidePanel falls back to tabId if getCurrent window fails
  lastOpenOptions = null;
  queryWindowCalled = false;
  queryTabsCalled = false;
  currentWindowId = undefined; // trigger getCurrent failure/fallback
  activeTabId = 101;

  result = await openFormTraceSidePanel();
  if (!result.success) {
    console.error(`[FAIL] Expected fallback to succeed, got error: ${result.error}`);
    process.exit(1);
  }
  if (!queryTabsCalled) {
    console.error('[FAIL] Expected query active tab fallback');
    process.exit(1);
  }
  if (lastOpenOptions?.tabId !== 101) {
    console.error(`[FAIL] Expected open called with tabId 101, got ${JSON.stringify(lastOpenOptions)}`);
    process.exit(1);
  }
  console.log('[PASS] Test 4: openFormTraceSidePanel successfully falls back to tabId query.');

  // Test 5: Safe fallback behavior if chrome.sidePanel is completely unavailable
  delete (global as any).chrome.sidePanel;
  result = await openFormTraceSidePanel();
  if (result.success) {
    console.error('[FAIL] Expected success=false when chrome.sidePanel is unavailable');
    process.exit(1);
  }
  if (!result.error?.includes('chrome.sidePanel.open API is not available')) {
    console.error(`[FAIL] Expected specific API error message, got: ${result.error}`);
    process.exit(1);
  }
  console.log('[PASS] Test 5: Gracefully handles unavailable sidePanel API without throwing.');

  console.log('Side Panel Verification PASSED!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('[ERROR] Side panel verification failed:', err);
  process.exit(1);
});
