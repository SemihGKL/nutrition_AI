import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../api/push', () => ({
  pushApi: { subscribe: vi.fn(), unsubscribe: vi.fn(), getVapidPublicKey: vi.fn() },
}));

import { pushApi } from '../../api/push';
import { attachDeviceToCurrentUser, detachDeviceFromCurrentUser } from '../../push/deviceSubscription';

const fakeSubscription = {
  endpoint: 'https://push.example/device-1',
  toJSON: () => ({ endpoint: 'https://push.example/device-1', keys: { p256dh: 'p256', auth: 'auth' } }),
};

function stubServiceWorker(ready: Promise<unknown>) {
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { ready } });
  Object.defineProperty(window, 'PushManager', { configurable: true, value: function PushManager() {} });
}

function withSubscription(sub: unknown) {
  stubServiceWorker(Promise.resolve({ pushManager: { getSubscription: async () => sub } }));
}

describe('deviceSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pushApi.subscribe).mockResolvedValue(undefined);
    vi.mocked(pushApi.unsubscribe).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    // @ts-expect-error nettoyage des stubs de test
    delete navigator.serviceWorker;
    // @ts-expect-error nettoyage des stubs de test
    delete window.PushManager;
  });

  it('rattache l\'abonnement de l\'appareil au compte connecte', async () => {
    withSubscription(fakeSubscription);

    await attachDeviceToCurrentUser();

    expect(pushApi.subscribe).toHaveBeenCalledWith({
      endpoint: 'https://push.example/device-1', p256dh: 'p256', auth: 'auth',
    });
  });

  it('detache l\'appareil du compte cote serveur', async () => {
    withSubscription(fakeSubscription);

    await detachDeviceFromCurrentUser();

    expect(pushApi.unsubscribe).toHaveBeenCalledWith({ endpoint: 'https://push.example/device-1' });
  });

  it('ne fait rien quand l\'appareil n\'est pas abonne', async () => {
    withSubscription(null);

    await attachDeviceToCurrentUser();
    await detachDeviceFromCurrentUser();

    expect(pushApi.subscribe).not.toHaveBeenCalled();
    expect(pushApi.unsubscribe).not.toHaveBeenCalled();
  });

  it('ne fait rien quand le navigateur ne gere pas les notifications', async () => {
    await attachDeviceToCurrentUser();
    expect(pushApi.subscribe).not.toHaveBeenCalled();
  });

  it('abandonne sans bloquer si le service worker n\'est jamais pret', async () => {
    vi.useFakeTimers();
    stubServiceWorker(new Promise(() => {}));

    const detaching = detachDeviceFromCurrentUser();
    await vi.advanceTimersByTimeAsync(5000);
    await detaching;

    expect(pushApi.unsubscribe).not.toHaveBeenCalled();
  });
});
