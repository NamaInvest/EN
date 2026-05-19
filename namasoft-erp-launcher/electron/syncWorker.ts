import { SyncEvent, SyncStatusReport } from './types';
import { getDb } from './database';

export async function getSyncStatus(): Promise<SyncStatusReport> {
  const db = getDb();
  if (!db) {
    return { pendingCount: 0, failedCount: 0, lastSyncAt: null, deadLetterCount: 0, recentEvents: [] };
  }

  const pendingResult = db.exec("SELECT COUNT(*) FROM local_outbox WHERE status = 'PENDING'");
  const failedResult = db.exec("SELECT COUNT(*) FROM local_outbox WHERE status = 'FAILED'");
  const deadLetterResult = db.exec("SELECT COUNT(*) FROM dead_letter_queue");
  const historyResult = db.exec("SELECT sync_run_at FROM sync_history ORDER BY sync_run_at DESC LIMIT 1");
  const recentEventsResult = db.exec("SELECT eventType, status, retryCount, createdAt, lastAttemptAt FROM local_outbox ORDER BY createdAt DESC LIMIT 10");

  const pendingCount = pendingResult[0]?.values[0]?.[0] as number || 0;
  const failedCount = failedResult[0]?.values[0]?.[0] as number || 0;
  const deadLetterCount = deadLetterResult[0]?.values[0]?.[0] as number || 0;
  const lastSyncAt = (historyResult[0]?.values[0]?.[0] as string) || null;

  const recentEvents = recentEventsResult[0]?.values.map(row => ({
    eventType: row[0] as string,
    status: row[1] as string,
    retryCount: row[2] as number,
    createdAt: row[3] as string,
    lastAttemptAt: (row[4] as string) || null,
  })) || [];

  return {
    pendingCount,
    failedCount,
    lastSyncAt,
    deadLetterCount,
    recentEvents
  };
}

export async function processOutboxOnce(): Promise<{ success: number, failed: number }> {
  console.log("Processing Outbox... (Placeholder)");
  return { success: 0, failed: 0 };
}

export async function moveToDeadLetter(event: SyncEvent, errorMsg: string): Promise<void> {
  console.log("Moved to Dead Letter:", event.id, errorMsg);
}

export async function recordSyncHistory(successCount: number, errorCount: number): Promise<void> {
  console.log(`Sync History: ${successCount} success, ${errorCount} errors`);
}
