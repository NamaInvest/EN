/**
 * AI Background Workers (BullMQ-inspired lightweight queue)
 * ──────────────────────────────────────────────────────────
 * Processes heavy AI tasks asynchronously without blocking API responses.
 */

import { logger } from '../lib/logger';

const log = logger.child({ route: 'AIWorker' });

export interface AITask {
  id: string;
  type: 'extract_document' | 'generate_report' | 'bulk_classify';
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
}

const queue: AITask[] = [];
const results = new Map<string, AITask>();

let isProcessing = false;

export const aiQueue = {
  add(type: AITask['type'], payload: any): string {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const task: AITask = { id, type, payload, status: 'pending', createdAt: new Date() };
    queue.push(task);
    results.set(id, task);
    log.info(`Task added: ${id} (${type})`);
    
    // Auto-start processing if not already running
    if (!isProcessing) {
      this.processQueue();
    }
    
    return id;
  },

  getStatus(id: string): AITask | undefined {
    return results.get(id);
  },

  async processQueue() {
    if (isProcessing) return;
    isProcessing = true;

    while (queue.length > 0) {
      const task = queue.shift()!;
      task.status = 'processing';
      log.info(`Processing task: ${task.id}`);

      try {
        // Simulate heavy AI processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Handlers based on task type
        if (task.type === 'extract_document') {
          task.result = { extractedItems: 5, confidence: 0.92 };
        } else if (task.type === 'generate_report') {
          task.result = { reportUrl: '/reports/generated/' + task.id };
        } else {
          task.result = { success: true };
        }

        task.status = 'completed';
        log.info(`Task completed: ${task.id}`);
      } catch (err: any) {
        task.status = 'failed';
        task.error = err.message;
        log.error(`Task failed: ${task.id}`, err);
      }
    }

    isProcessing = false;
  }
};
