let scheduledTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleRefresh(
  callback: () => void,
  intervalSeconds: number
): void {
  cancelScheduledRefresh();
  scheduledTimer = setTimeout(callback, intervalSeconds * 1000);
}

export function cancelScheduledRefresh(): void {
  if (scheduledTimer !== null) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
}

export function isScheduled(): boolean {
  return scheduledTimer !== null;
}
