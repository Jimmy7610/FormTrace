import type { RecordedEvent, FormTraceMessage } from '../src/types/formtrace';
import {
  attachFormRecorder,
  detachFormRecorder,
  setRecorderCallback,
} from '../src/recorder/formRecorder';
import {
  attachNetworkRecorder,
  setNetworkRecorderCallback,
  resetNetworkRecorder,
} from '../src/recorder/networkRecorder';
import {
  attachConsoleRecorder,
  setConsoleRecorderCallback,
  resetConsoleRecorder,
} from '../src/recorder/consoleRecorder';
import { getFormCount } from '../src/utils/dom';
import { DEBUG } from '../src/utils/messaging';
import { defineContentScript } from 'wxt/sandbox';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    let isRecording = false;
    let events: RecordedEvent[] = [];
    let submitAttemptCount = 0;
    let clickWithoutSubmitCount = 0;
    let mutationObserver: MutationObserver | null = null;

    function handleEvent(event: RecordedEvent): void {
      if (!isRecording) return;
      events.push(event);

      if (event.type === 'form-submit') {
        submitAttemptCount++;
      }

      if (
        event.type === 'submit-click' &&
        event.message === 'Click detected but no form-submit event followed'
      ) {
        clickWithoutSubmitCount++;
      }
    }

    function startMutationObserver(): void {
      mutationObserver = new MutationObserver(() => {
        chrome.runtime.sendMessage({
          type: 'PAGE_INFO',
          pageUrl: location.href,
          pageTitle: document.title,
          formCount: getFormCount(),
        } satisfies FormTraceMessage).catch(() => {});
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    function stopMutationObserver(): void {
      mutationObserver?.disconnect();
      mutationObserver = null;
    }

    function startRecording(): void {
      if (isRecording) return;
      isRecording = true;
      events = [];
      submitAttemptCount = 0;
      clickWithoutSubmitCount = 0;

      setRecorderCallback(handleEvent);
      setNetworkRecorderCallback(handleEvent);
      setConsoleRecorderCallback(handleEvent);

      attachFormRecorder();
      attachNetworkRecorder();
      attachConsoleRecorder();
      startMutationObserver();

      if (DEBUG) console.debug('[FormTrace] Recording started');
    }

    function stopRecording(): void {
      if (!isRecording) return;
      isRecording = false;
      detachFormRecorder();
      resetNetworkRecorder();
      resetConsoleRecorder();
      stopMutationObserver();
      if (DEBUG) console.debug('[FormTrace] Recording stopped');
    }

    function resetSession(): void {
      stopRecording();
      events = [];
      submitAttemptCount = 0;
      clickWithoutSubmitCount = 0;
    }

    chrome.runtime.onMessage.addListener(
      (message: FormTraceMessage, _sender, sendResponse) => {
        switch (message.type) {
          case 'START_RECORDING':
            startRecording();
            sendResponse({ ok: true });
            return false;

          case 'STOP_RECORDING':
            stopRecording();
            sendResponse({
              type: 'SESSION_DATA',
              session: {
                id: `ft-${Date.now()}`,
                startedAt: Date.now(),
                stoppedAt: Date.now(),
                pageUrl: location.href,
                pageTitle: document.title,
                formCount: getFormCount(),
                events,
                submitAttemptCount,
                clickWithoutSubmitCount,
              },
            });
            return false;

          case 'GET_STATUS':
            sendResponse({
              type: 'STATUS_UPDATE',
              isRecording,
              formCount: getFormCount(),
              eventCount: events.length,
              submitAttemptCount,
            });
            return false;

          case 'RESET_SESSION':
            resetSession();
            sendResponse({ ok: true });
            return false;

          default:
            return false;
        }
      }
    );

    // Report initial page info
    chrome.runtime.sendMessage({
      type: 'PAGE_INFO',
      pageUrl: location.href,
      pageTitle: document.title,
      formCount: getFormCount(),
    } satisfies FormTraceMessage).catch(() => {});
  },
});
