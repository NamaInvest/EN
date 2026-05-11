import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ipaas-engine' });

/**
 * P-12: iPaaS Connector Engine
 * Webhook-based outbound connectors for Zapier / Make / custom integrations
 */

interface ConnectorDefinition {
  id: string;
  name: string;
  type: 'ZAPIER' | 'MAKE' | 'CUSTOM' | 'POWERAUTOMATE';
  webhookUrl: string;
  events: string[];
  headers?: Record<string, string>;
  active: boolean;
}

const connectors = new Map<string, ConnectorDefinition>();

export class IPaaSEngine {
  static register(def: Omit<ConnectorDefinition, 'id'>): ConnectorDefinition {
    const id = `CONN-${Date.now()}`;
    const connector = { ...def, id };
    connectors.set(id, connector);
    log.info(`Connector registered: ${def.name} (${def.type})`);
    return connector;
  }

  static async trigger(connectorId: string, event: string, payload: object) {
    const connector = connectors.get(connectorId);
    if (!connector || !connector.active) return;
    if (!connector.events.includes(event) && !connector.events.includes('*')) return;

    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString(), source: 'NamaSoft-ERP' });
    log.info(`iPaaS trigger: ${connector.name} → event=${event}`);

    try {
      const res = await fetch(connector.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...connector.headers },
        body,
      });
      return { connector: connector.name, event, status: res.status, success: res.ok };
    } catch (err) {
      log.error(`iPaaS connector ${connectorId} failed: ${err}`);
      return { connector: connector.name, event, success: false };
    }
  }

  /** Broadcast event to all active connectors listening to it */
  static async broadcast(event: string, payload: object) {
    const active = Array.from(connectors.values()).filter(c => c.active);
    return Promise.all(active.map(c => this.trigger(c.id, event, payload)));
  }

  static list(): ConnectorDefinition[] {
    return Array.from(connectors.values());
  }
}
