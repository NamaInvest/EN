/**
 * Standalone worker process for NamaSoft background tasks.
 * This should be run as a separate Node.js process (e.g. via pm2 or as a separate container)
 * rather than being embedded inside Next.js instrumentation to avoid duplicated executions.
 */
import { startWorkers } from '../lib/queue';

console.log('🚀 Starting NamaSoft background task workers in standalone mode...');

try {
    startWorkers();
    console.log('✅ Background task workers started successfully.');
} catch (err) {
    console.error('❌ Failed to start background task workers:', err);
    process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down background workers...');
    // Add any graceful shutdown logic if queue supports it
    process.exit(0);
});
