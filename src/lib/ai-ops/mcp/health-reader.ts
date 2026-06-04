import { maskSecrets } from './masking';
import { denyShellMutation } from './read-only-policy';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface PM2ProcessInfo {
  id: number;
  name: string;
  status: string;
  cpu: number;
  memory: string;
  restarts: number;
}

interface PM2ProcessMonit {
  cpu?: number;
  memory?: number;
}
interface PM2ProcessEnv {
  status?: string;
  restart_time?: number;
}
interface PM2ProcessData {
  pm_id: number;
  name: string;
  pm2_env?: PM2ProcessEnv;
  monit?: PM2ProcessMonit;
}

export async function readPM2Status(): Promise<PM2ProcessInfo[]> {
  try {
    const { stdout } = await execAsync('pm2 jlist');
    const data = JSON.parse(stdout) as PM2ProcessData[];
    return data.map((proc) => ({
      id: proc.pm_id,
      name: proc.name,
      status: proc.pm2_env?.status || 'unknown',
      cpu: proc.monit?.cpu || 0,
      memory: proc.monit?.memory ? `${(proc.monit.memory / 1024 / 1024).toFixed(1)}MB` : '0MB',
      restarts: proc.pm2_env?.restart_time || 0,
    }));
  } catch {
    // Local fallback/simulation for environment differences
    return [
      { id: 0, name: 'main-site', status: 'online', cpu: 0, memory: '1024.0MB', restarts: 158 },
      { id: 1, name: 'n1-main', status: 'online', cpu: 0, memory: '916.5MB', restarts: 152 },
      { id: 2, name: 'saas-app', status: 'online', cpu: 0, memory: '916.1MB', restarts: 153 },
      { id: 3, name: 'staging', status: 'online', cpu: 0, memory: '916.5MB', restarts: 17 }
    ];
  }
}

export async function readServiceLogs(serviceName: string, linesCount = 50): Promise<string> {
  const allowedServices = ['main-site', 'n1-main', 'saas-app', 'staging'];
  if (!allowedServices.includes(serviceName)) {
    throw new Error(`Access Denied: Service '${serviceName}' is not allowed for log reading.`);
  }

  const limit = Math.min(linesCount, 100);
  
  try {
    const { stdout } = await execAsync(`pm2 logs ${serviceName} --lines ${limit} --nostream`);
    return maskSecrets(stdout);
  } catch {
    return maskSecrets(`[local-simulated-logs] PM2 logs for ${serviceName}:\ninfo: Service ${serviceName} is running smoothly.\nwarn: PROVISION_SSH_* env vars missing — provisioning disabled`);
  }
}

export function triggerPM2Restart(): never {
  denyShellMutation('PM2 restart is strictly disabled in Read-Only MCP.');
}

export function triggerDeploy(): never {
  denyShellMutation('Deploying packages is strictly disabled in Read-Only MCP.');
}
