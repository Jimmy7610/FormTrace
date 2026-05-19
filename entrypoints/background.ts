import type { FormTraceMessage, RecordingSession, AnalysisReport } from '../src/types/formtrace';
import {
  saveSession,
  saveReport,
  loadReport,
  clearStorage,
} from '../src/recorder/sessionStore';
import { analyzeSession } from '../src/analyzer/analyzeSession';
import { defineBackground } from 'wxt/sandbox';

// INSTÄLLNING - Sätt true för att aktivera debug-loggar i bakgrundstjänsten
const DEBUG = false;

export default defineBackground(() => {
  // ─── In-memory state ──────────────────────────────────────────────────────────
  let isRecording = false;
  let lastReport: AnalysisReport | null = null;

  async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab ?? null;
  }

  async function sendToContentScript(
    tabId: number,
    message: FormTraceMessage
  ): Promise<unknown> {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (err) {
      if (DEBUG) console.debug('[FormTrace BG] sendToContentScript error:', err);
      return null;
    }
  }

  async function handlePopupMessage(
    message: FormTraceMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (r: unknown) => void
  ): Promise<void> {
    const tab = await getActiveTab();
    if (!tab?.id) {
      sendResponse({ error: 'No active tab' });
      return;
    }
    const tabId = tab.id;

    switch (message.type) {
      case 'START_RECORDING': {
        isRecording = true;
        const result = await sendToContentScript(tabId, { type: 'START_RECORDING' });
        sendResponse(result ?? { ok: true });
        break;
      }

      case 'STOP_RECORDING': {
        isRecording = false;
        const result = (await sendToContentScript(tabId, {
          type: 'STOP_RECORDING',
        })) as { type: string; session: RecordingSession } | null;

        if (result?.session) {
          const session = result.session;
          lastReport = analyzeSession(session);
          await saveSession(session);
          await saveReport(lastReport);
          sendResponse({ session, report: lastReport });
        } else {
          sendResponse({ error: 'No session data from content script' });
        }
        break;
      }

      case 'GET_STATUS': {
        const statusResult = (await sendToContentScript(tabId, {
          type: 'GET_STATUS',
        })) as {
          isRecording: boolean;
          formCount: number;
          eventCount: number;
          submitAttemptCount: number;
        } | null;

        if (!lastReport) {
          lastReport = await loadReport();
        }

        sendResponse({
          type: 'STATUS_UPDATE',
          isRecording: statusResult?.isRecording ?? isRecording,
          formCount: statusResult?.formCount ?? 0,
          eventCount: statusResult?.eventCount ?? 0,
          submitAttemptCount: statusResult?.submitAttemptCount ?? 0,
          lastReport,
        });
        break;
      }

      case 'RESET_SESSION': {
        isRecording = false;
        lastReport = null;
        await clearStorage();
        await sendToContentScript(tabId, { type: 'RESET_SESSION' });
        sendResponse({ ok: true });
        break;
      }

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  }

  chrome.runtime.onMessage.addListener(
    (message: FormTraceMessage, sender, sendResponse) => {
      if (message.type === 'PAGE_INFO') {
        if (DEBUG) console.debug('[FormTrace BG] PAGE_INFO:', message);
        sendResponse({ ok: true });
        return false;
      }
      handlePopupMessage(message, sender, sendResponse);
      return true;
    }
  );

  if (DEBUG) console.debug('[FormTrace] Background service worker started');
});
