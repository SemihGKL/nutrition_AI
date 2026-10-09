import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('workbox-core', () => ({ clientsClaim: vi.fn() }));
vi.mock('workbox-precaching', () => ({ precacheAndRoute: vi.fn(), cleanupOutdatedCaches: vi.fn() }));
vi.mock('workbox-routing', () => ({ registerRoute: vi.fn(), NavigationRoute: vi.fn() }));
vi.mock('workbox-strategies', () => ({ NetworkFirst: vi.fn() }));

type Listener = (event: { data?: unknown }) => void;
const listeners: Record<string, Listener> = {};
const skipWaiting = vi.fn();

describe('service worker — mise a jour a la demande', () => {
  beforeAll(async () => {
    const scope = globalThis as unknown as Record<string, unknown>;
    scope.__WB_MANIFEST = [];
    scope.skipWaiting = skipWaiting;
    vi.spyOn(globalThis, 'addEventListener').mockImplementation(((type: string, listener: Listener) => {
      listeners[type] = listener;
    }) as typeof globalThis.addEventListener);
    await import('../sw');
  });

  it('ne s\'active pas tout seul a l\'installation', () => {
    expect(skipWaiting).not.toHaveBeenCalled();
  });

  it('s\'active quand l\'app le demande (SKIP_WAITING)', () => {
    listeners.message({ data: { type: 'SKIP_WAITING' } });
    expect(skipWaiting).toHaveBeenCalledTimes(1);
  });

  it('ignore les autres messages', () => {
    skipWaiting.mockClear();
    listeners.message({ data: { type: 'AUTRE' } });
    listeners.message({});
    expect(skipWaiting).not.toHaveBeenCalled();
  });
});
