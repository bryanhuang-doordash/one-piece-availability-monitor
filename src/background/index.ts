import { Message, ExtensionConfig } from '../shared/types';
import { getState, setConfig, getConfig, setState } from './storage';
import { startMonitoring, stopMonitoring } from './tabMonitor';
import { DEFAULT_STATE } from '../shared/constants';

// Handle messages from popup
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message: Message): Promise<unknown> {
  switch (message.type) {
    case 'START_MONITORING': {
      const config = message.payload as ExtensionConfig;
      await setConfig(config);
      const state = await startMonitoring(config);
      return state;
    }

    case 'STOP_MONITORING': {
      const state = await stopMonitoring();
      return state;
    }

    case 'GET_STATE': {
      const state = await getState();
      const config = await getConfig();
      return { state, config };
    }

    default:
      return null;
  }
}

// On service worker startup, reset monitoring state
// (tabs created in previous session are no longer valid)
chrome.runtime.onStartup.addListener(async () => {
  await setState(DEFAULT_STATE);
});

// Also reset on install
chrome.runtime.onInstalled.addListener(async () => {
  await setState(DEFAULT_STATE);
});

console.log('Website Availability Monitor service worker started');
