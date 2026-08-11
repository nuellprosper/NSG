import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';

export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
}

// Key-Value Storage wrapper using Capacitor Preferences / localStorage
export const storage = {
  async set(key: string, value: any): Promise<void> {
    const stringVal = typeof value === 'string' ? value : JSON.stringify(value);
    try {
      await Preferences.set({ key, value: stringVal });
    } catch (e) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, stringVal);
      }
    }
  },

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const res = await Preferences.get({ key });
      if (!res.value) return null;
      try {
        return JSON.parse(res.value) as T;
      } catch (e) {
        return res.value as unknown as T;
      }
    } catch (e) {
      if (typeof window !== 'undefined') {
        const item = localStorage.getItem(key);
        if (!item) return null;
        try {
          return JSON.parse(item) as T;
        } catch {
          return item as unknown as T;
        }
      }
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (e) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    }
  }
};

const QUEUE_STORAGE_KEY = 'nsg_offline_action_queue';

// Queue action when offline
export async function queueOfflineAction(type: string, payload: any): Promise<OfflineAction> {
  const existingQueue = (await storage.get<OfflineAction[]>(QUEUE_STORAGE_KEY)) || [];
  const action: OfflineAction = {
    id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type,
    payload,
    timestamp: Date.now()
  };

  const updatedQueue = [...existingQueue, action];
  await storage.set(QUEUE_STORAGE_KEY, updatedQueue);
  console.log(`📥 Queued offline action [${type}]:`, action);
  return action;
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  return (await storage.get<OfflineAction[]>(QUEUE_STORAGE_KEY)) || [];
}

export async function clearOfflineQueue(): Promise<void> {
  await storage.remove(QUEUE_STORAGE_KEY);
}

// Background Sync Manager
export function initOfflineQueueSync(
  syncHandler: (action: OfflineAction) => Promise<boolean>
) {
  let isSyncing = false;

  const flushQueue = async () => {
    if (isSyncing) return;
    isSyncing = true;

    try {
      const queue = await getOfflineQueue();
      if (queue.length === 0) {
        isSyncing = false;
        return;
      }

      console.log(`🔄 Flushing ${queue.length} offline queued actions...`);
      const remaining: OfflineAction[] = [];

      for (const action of queue) {
        try {
          const success = await syncHandler(action);
          if (!success) {
            remaining.push(action);
          }
        } catch (e) {
          console.error(`Failed syncing action ${action.id}:`, e);
          remaining.push(action);
        }
      }

      await storage.set(QUEUE_STORAGE_KEY, remaining);
      if (remaining.length === 0) {
        console.log('✅ Offline queue synced successfully!');
      } else {
        console.warn(`⚠️ ${remaining.length} actions remaining in offline queue.`);
      }
    } catch (err) {
      console.error('Error in offline queue flush:', err);
    } finally {
      isSyncing = false;
    }
  };

  // Listen for online reconnection
  const listenerPromise = Network.addListener('networkStatusChange', (status) => {
    if (status.connected) {
      flushQueue();
    }
  });

  // Also check immediately
  Network.getStatus().then(status => {
    if (status.connected) flushQueue();
  });

  return () => {
    listenerPromise.then(l => l.remove()).catch(() => {});
  };
}
