import { ExtensionConfig, MonitorState, PageStatusMessage, ClickResult } from '../shared/types';
import { getState, updateState, getConfig } from './storage';
import { scheduleRefresh, cancelScheduledRefresh } from './scheduler';
import { DEFAULT_STATE } from '../shared/constants';

let monitoredTabId: number | null = null;
let currentUrl: string | null = null;
let pendingCheckoutNavigation = false;

function getCheckoutUrl(productUrl: string): string {
  const url = new URL(productUrl);
  return `${url.origin}/s/checkout`;
}

function notifyUser(title: string, message: string): void {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'assets/icon-128.png',
    title,
    message,
  });
}

function broadcastState(state: MonitorState): void {
  chrome.runtime.sendMessage({ type: 'STATE_UPDATE', payload: state }).catch(() => {
    // Popup might not be open, ignore error
  });
}

async function injectContentScript(tabId: number): Promise<void> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    });
  } catch (error) {
    console.error('Failed to inject content script:', error);
  }
}

async function handlePageAvailable(clickResult?: ClickResult): Promise<void> {
  const addedToCart = clickResult === 'clicked';
  const clickAttempted = clickResult !== undefined;

  const state = await updateState({
    lastRefreshTime: Date.now(),
    lastError: null,
    successDetected: true,
    addedToCart,
    clickAttempted,
  });

  let notificationTitle: string;
  let notificationMessage: string;

  if (clickResult === 'clicked') {
    notificationTitle = 'Added to Cart!';
    notificationMessage = 'The product was automatically added to your cart!';

    // Navigate to checkout page
    if (monitoredTabId !== null && currentUrl) {
      pendingCheckoutNavigation = true;
      const checkoutUrl = getCheckoutUrl(currentUrl);
      chrome.tabs.update(monitoredTabId, { url: checkoutUrl });
    }
  } else if (clickResult === 'click_failed') {
    notificationTitle = 'Product Available!';
    notificationMessage = 'Product is available but auto-click failed. Check the tab.';
  } else {
    notificationTitle = 'Product Available!';
    notificationMessage = 'The product has an "Add to Cart" button - it may be available!';
  }

  notifyUser(notificationTitle, notificationMessage);

  broadcastState(state);

  // Stop monitoring after success
  cancelScheduledRefresh();
}

async function handleOutOfStock(): Promise<void> {
  const state = await updateState({
    lastRefreshTime: Date.now(),
    lastError: 'out_of_stock',
    successDetected: false,
  });

  notifyUser(
    'Item Out of Stock',
    'The product page exists but shows out of stock.'
  );

  broadcastState(state);

  // Stop monitoring - item exists but is out of stock
  cancelScheduledRefresh();
}

async function handlePageNotFound(): Promise<void> {
  const config = await getConfig();
  const currentState = await getState();

  const state = await updateState({
    lastRefreshTime: Date.now(),
    attemptCount: currentState.attemptCount + 1,
    lastError: 'not_found',
    successDetected: false,
  });

  broadcastState(state);

  // Schedule next refresh - keep looking
  if (state.isMonitoring && monitoredTabId !== null) {
    scheduleRefresh(() => refreshTab(), config.intervalSeconds);
  }
}

async function refreshTab(): Promise<void> {
  if (monitoredTabId === null) {
    return;
  }

  try {
    await chrome.tabs.reload(monitoredTabId);
  } catch {
    // Tab might have been closed
    await stopMonitoring();
  }
}

function setupListeners(): void {
  // Listen for tab load completion to inject content script
  chrome.webNavigation.onCompleted.addListener(async (details) => {
    // Only process main frame for our monitored tab
    if (details.tabId !== monitoredTabId || details.frameId !== 0) {
      return;
    }

    // Check if we're waiting for checkout page navigation
    if (pendingCheckoutNavigation && details.url.includes('/s/checkout')) {
      pendingCheckoutNavigation = false;
      const state = await updateState({ navigatedToCheckout: true });
      broadcastState(state);
      notifyUser('Ready for checkout!', 'You are now on the checkout page. Complete your purchase!');
      return;
    }

    // Only inject content script if we're on the monitored item page
    if (currentUrl && !details.url.startsWith(currentUrl)) {
      return;
    }

    const state = await getState();
    if (!state.isMonitoring) {
      return;
    }

    // Inject content script to check page availability
    await injectContentScript(details.tabId);
  });

  // Listen for PAGE_STATUS messages from content script
  chrome.runtime.onMessage.addListener((message: PageStatusMessage, sender) => {
    // Verify message is from our monitored tab
    if (message.type !== 'PAGE_STATUS' || sender.tab?.id !== monitoredTabId) {
      return;
    }

    switch (message.status) {
      case 'available':
        handlePageAvailable(message.clickResult);
        break;
      case 'out_of_stock':
        handleOutOfStock();
        break;
      case 'not_found':
        handlePageNotFound();
        break;
    }
  });
}

// Handle tab closure
chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (tabId === monitoredTabId) {
    await stopMonitoring();
  }
});

export async function startMonitoring(config: ExtensionConfig): Promise<MonitorState> {
  // Stop any existing monitoring
  await stopMonitoring();

  currentUrl = config.url;

  // Create a new tab
  const tab = await chrome.tabs.create({ url: config.url, active: true });

  if (!tab.id) {
    throw new Error('Failed to create tab');
  }

  monitoredTabId = tab.id;

  const state = await updateState({
    isMonitoring: true,
    tabId: tab.id,
    lastRefreshTime: Date.now(),
    attemptCount: 1,
    lastError: null,
    successDetected: false,
  });

  return state;
}

export async function stopMonitoring(): Promise<MonitorState> {
  cancelScheduledRefresh();

  monitoredTabId = null;

  currentUrl = null;

  const state = await updateState({
    ...DEFAULT_STATE,
  });

  return state;
}

export function getMonitoredTabId(): number | null {
  return monitoredTabId;
}

// Initialize listeners
setupListeners();
