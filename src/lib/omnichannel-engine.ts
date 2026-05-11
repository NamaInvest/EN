import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'omnichannel-engine' });

export class OmnichannelEngine {
  static async createConversation(tenantId: string, channelType: string, customerId?: number) {
    return prisma.conversation.create({ data: { tenantId, channelType, customerId, status: 'OPEN' } });
  }

  static async addMessage(conversationId: number, direction: 'INBOUND' | 'OUTBOUND', content: string, sentBy?: number) {
    return prisma.conversationMessage.create({ data: { conversationId, direction, content, sentBy } });
  }

  static async assignAgent(conversationId: number, agentId: number) {
    return prisma.conversation.update({ where: { id: conversationId }, data: { assignedTo: agentId, status: 'ASSIGNED' } });
  }

  static async closeConversation(conversationId: number) {
    return prisma.conversation.update({ where: { id: conversationId }, data: { status: 'CLOSED' } });
  }

  static async getOpenByChannel(tenantId: string) {
    const open = await prisma.conversation.findMany({ where: { tenantId, status: { in: ['OPEN', 'ASSIGNED'] } } });
    const grouped: Record<string, number> = {};
    for (const c of open) { grouped[c.channelType] = (grouped[c.channelType] || 0) + 1; }
    return grouped;
  }
}
