export interface ExtensionConfig {
  url: string;
  intervalSeconds: number;
  quantity: number;
}

export interface MonitorState {
  isMonitoring: boolean;
  tabId: number | null;
  lastRefreshTime: number | null;
  attemptCount: number;
  lastError: string | null;
  successDetected: boolean;
  addedToCart: boolean;
  clickAttempted: boolean;
  navigatedToCheckout: boolean;
}

export type MessageType =
  | 'START_MONITORING'
  | 'STOP_MONITORING'
  | 'GET_STATE'
  | 'STATE_UPDATE'
  | 'PAGE_STATUS';

export interface Message {
  type: MessageType;
  payload?: ExtensionConfig | MonitorState;
}

export interface StateUpdateMessage {
  type: 'STATE_UPDATE';
  payload: MonitorState;
}

export type PageAvailabilityStatus = 'available' | 'out_of_stock' | 'not_found';

export type ClickResult = 'clicked' | 'click_failed' | 'button_not_found';

export interface PageStatusMessage {
  type: 'PAGE_STATUS';
  status: PageAvailabilityStatus;
  clickResult?: ClickResult;
}
