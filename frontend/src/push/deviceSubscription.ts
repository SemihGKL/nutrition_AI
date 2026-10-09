import { pushApi } from '../api/push';

// Délai max pour obtenir le service worker : sans SW actif (dev, navigateur privé),
// `serviceWorker.ready` ne se résout jamais et bloquerait la déconnexion.
const SERVICE_WORKER_TIMEOUT_MS = 2000;

function isPushSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator
    && typeof window !== 'undefined' && 'PushManager' in window;
}

async function currentDeviceSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), SERVICE_WORKER_TIMEOUT_MS));
  const registration = await Promise.race([navigator.serviceWorker.ready, timeout]);
  return registration ? registration.pushManager.getSubscription() : null;
}

/**
 * Rattache l'abonnement push de cet appareil (s'il existe) au compte connecté : sur un
 * appareil partagé, les rappels suivent la personne connectée.
 */
export async function attachDeviceToCurrentUser(): Promise<void> {
  const subscription = await currentDeviceSubscription();
  if (!subscription) return;
  const json = subscription.toJSON();
  await pushApi.subscribe({
    endpoint: json.endpoint!,
    p256dh: json.keys!['p256dh'],
    auth: json.keys!['auth'],
  });
}

/**
 * Détache l'appareil du compte côté serveur (plus aucun rappel pour ce compte ici).
 * Le navigateur garde son abonnement : il sera rattaché au prochain compte connecté.
 */
export async function detachDeviceFromCurrentUser(): Promise<void> {
  const subscription = await currentDeviceSubscription();
  if (!subscription) return;
  await pushApi.unsubscribe({ endpoint: subscription.endpoint });
}
