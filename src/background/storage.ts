import { ExtensionConfig, MonitorState } from '../shared/types';
import { STORAGE_KEYS, DEFAULT_CONFIG, DEFAULT_STATE } from '../shared/constants';

export async function getConfig(): Promise<ExtensionConfig> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.CONFIG);
  return result[STORAGE_KEYS.CONFIG] || DEFAULT_CONFIG;
}

export async function setConfig(config: ExtensionConfig): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEYS.CONFIG]: config });
}

export async function getState(): Promise<MonitorState> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.STATE);
  return result[STORAGE_KEYS.STATE] || DEFAULT_STATE;
}

export async function setState(state: MonitorState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.STATE]: state });
}

export async function updateState(
  updates: Partial<MonitorState>
): Promise<MonitorState> {
  const currentState = await getState();
  const newState = { ...currentState, ...updates };
  await setState(newState);
  return newState;
}
