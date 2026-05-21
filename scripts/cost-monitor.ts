import fs from 'fs';
import path from 'path';

// This script simulates gathering infrastructure costs
async function monitorCosts() {
  console.log('Gathering infrastructure cost metrics...');
  
  const metrics = {
    date: new Date().toISOString().split('T')[0],
    hetznerServer: 1.5, // Daily cost estimate for CX41
    cloudflare: 0.5,
    sentry: 0.1,
    aiTokens: 2.3,
  };

  const total = Object.values(metrics).reduce((sum, val) => typeof val === 'number' ? sum + val : sum, 0);

  console.log(`Daily Total: $${total.toFixed(2)}`);

  if (total > 50) {
    console.error('ALERT: Daily cost threshold exceeded!');
    // Trigger alert webhook...
  }

  // Save to dummy CSV or DB
  const logEntry = `${metrics.date},${metrics.hetznerServer},${metrics.cloudflare},${metrics.sentry},${metrics.aiTokens},${total}\n`;
  const logPath = path.join(process.cwd(), 'tmp', 'cost-log.csv');
  
  if (!fs.existsSync(path.dirname(logPath))) {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
  }

  fs.appendFileSync(logPath, logEntry);
  console.log('Cost metrics recorded successfully.');
}

monitorCosts();
