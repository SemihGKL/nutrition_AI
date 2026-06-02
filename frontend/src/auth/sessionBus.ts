type SessionExpiredHandler = () => void;

let registeredHandler: SessionExpiredHandler | null = null;

export const sessionBus = {
  onSessionExpired(handler: SessionExpiredHandler): void {
    registeredHandler = handler;
  },

  emitSessionExpired(): void {
    registeredHandler?.();
  },
};
