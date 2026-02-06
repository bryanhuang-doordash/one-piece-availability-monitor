export const STORAGE_KEYS = {
  CONFIG: 'monitor_config',
  STATE: 'monitor_state',
} as const;

export const INTERVAL_BOUNDS = {
  MIN: 0.5,
  MAX: 3600,
  DEFAULT: 5,
} as const;

export const QUANTITY_BOUNDS = {
  MIN: 1,
  MAX: 99,
  DEFAULT: 1,
} as const;

export const DEFAULT_CONFIG: { url: string; intervalSeconds: number; quantity: number } = {
  url: '',
  intervalSeconds: INTERVAL_BOUNDS.DEFAULT,
  quantity: QUANTITY_BOUNDS.DEFAULT,
};

export const DEFAULT_STATE: {
  isMonitoring: boolean;
  tabId: number | null;
  lastRefreshTime: number | null;
  attemptCount: number;
  lastError: string | null;
  successDetected: boolean;
  addedToCart: boolean;
  clickAttempted: boolean;
  navigatedToCheckout: boolean;
} = {
  isMonitoring: false,
  tabId: null,
  lastRefreshTime: null,
  attemptCount: 0,
  lastError: null,
  successDetected: false,
  addedToCart: false,
  clickAttempted: false,
  navigatedToCheckout: false,
};
