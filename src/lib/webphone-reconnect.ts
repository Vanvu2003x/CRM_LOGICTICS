const delays = [1000, 3000, 7000, 15000] as const;

export function reconnectDelay(attempt: number) {
  return delays[Math.min(Math.max(0, attempt), delays.length - 1)];
}

export function shouldReconnect({ manuallyStopped, online, attempt = 0 }: { manuallyStopped: boolean; online: boolean; attempt?: number }) {
  return !manuallyStopped && online && attempt < 5;
}
