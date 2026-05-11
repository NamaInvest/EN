/**
 * Offline Sync Engine (Phase 86.2)
 * ──────────────────────────────────────────────────────────
 * Provides a robust Queue Strategy for Offline mode in POS and Field Sales.
 * It caches operations when offline, and automatically syncs them when the device
 * reconnects to the network, preventing any data loss.
 */
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'OfflineSyncEngine' });

export type SyncActionType = 'CREATE_INVOICE' | 'UPDATE_CUSTOMER' | 'SYNC_INVENTORY' | 'PROCESS_PAYMENT';

export interface PendingAction {
  id: string;
  type: SyncActionType;
  payload: any;
  timestamp: number;
  retries: number;
  status: 'pending' | 'failed' | 'synced' | 'conflict';
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  conflicts: PendingAction[];
}

export class OfflineSyncEngine {
  private static readonly STORAGE_KEY = 'namasoft_offline_queue';

  /**
   * Safe access to localStorage (Browser-only)
   */
  private static getQueue(): PendingAction[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      log.error('Failed to parse offline queue', { error: (e as Error).message });
      return [];
    }
  }

  private static saveQueue(queue: PendingAction[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      log.error('Failed to save offline queue', { error: (e as Error).message });
    }
  }

  /**
   * Add a new action to the queue when the app detects offline mode.
   */
  static async addToQueue(type: SyncActionType, payload: any): Promise<void> {
    const queue = this.getQueue();
    const newAction: PendingAction = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending'
    };

    queue.push(newAction);
    this.saveQueue(queue);
    
    log.info('Action added to offline queue', { actionId: newAction.id, type });
  }

  /**
   * Process all pending actions in the queue sequentially.
   * This should be called when the 'online' event is fired.
   */
  static async sync(apiProcessor: (action: PendingAction) => Promise<boolean>): Promise<SyncResult> {
    const queue = this.getQueue();
    if (queue.length === 0) {
      return { success: true, syncedCount: 0, failedCount: 0, conflicts: [] };
    }

    log.info(`Starting synchronization of ${queue.length} pending actions`);
    
    let syncedCount = 0;
    let failedCount = 0;
    const conflicts: PendingAction[] = [];
    const remainingQueue: PendingAction[] = [];

    for (const action of queue) {
      if (action.status === 'synced') continue;

      try {
        const isSuccess = await apiProcessor(action);
        
        if (isSuccess) {
          action.status = 'synced';
          syncedCount++;
        } else {
          action.retries++;
          action.status = action.retries > 3 ? 'conflict' : 'failed';
          
          if (action.status === 'conflict') {
            conflicts.push(action);
          } else {
            remainingQueue.push(action);
          }
          failedCount++;
        }
      } catch (err: any) {
        log.error(`Sync failed for action ${action.id}`, { error: err.message });
        action.retries++;
        action.status = action.retries > 3 ? 'conflict' : 'failed';
        
        if (action.status === 'conflict') {
          conflicts.push(action);
        } else {
          remainingQueue.push(action);
        }
        failedCount++;
      }
    }

    // Save unresolved actions back to the queue
    this.saveQueue([...remainingQueue, ...conflicts]);

    const result: SyncResult = {
      success: remainingQueue.length === 0,
      syncedCount,
      failedCount,
      conflicts,
    };

    log.info('Synchronization complete', result);
    return result;
  }

  /**
   * Manually resolve a conflict by providing the correct remote state,
   * dropping the local action from the queue.
   */
  static async resolveConflict(actionId: string, resolution: 'discard' | 'force_retry'): Promise<void> {
    let queue = this.getQueue();
    const actionIndex = queue.findIndex(a => a.id === actionId);

    if (actionIndex > -1) {
      if (resolution === 'discard') {
        queue.splice(actionIndex, 1);
        log.info(`Conflict discarded for action ${actionId}`);
      } else if (resolution === 'force_retry') {
        queue[actionIndex].status = 'pending';
        queue[actionIndex].retries = 0;
        log.info(`Conflict reset to pending for action ${actionId}`);
      }
      this.saveQueue(queue);
    }
  }

  /**
   * Get all actions that require manual intervention
   */
  static getConflicts(): PendingAction[] {
    return this.getQueue().filter(a => a.status === 'conflict');
  }
}
