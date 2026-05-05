import prisma from '@/lib/prisma';

export type EventPayload = Record<string, any>;

export class EventBus {
  static async publish(eventType: string, sourceModule: string, payload: EventPayload) {
    try {
      const log = await prisma.eventLog.create({
        data: {
          eventType,
          sourceModule,
          payload,
          status: 'PENDING'
        }
      });
      // In a real system, you'd trigger a background job processor (like BullMQ or RabbitMQ)
      // For Next.js monolith, we log it and can process asynchronously or let a cron pick it up.
      return { success: true, eventId: log.id };
    } catch (e: any) {
      console.error('EventBus Publish Error:', e);
      return { success: false, error: e.message };
    }
  }

  static async markProcessed(eventId: number) {
    return prisma.eventLog.update({
      where: { id: eventId },
      data: { status: 'PROCESSED', processedAt: new Date() }
    });
  }

  static async markFailed(eventId: number, reason: string) {
    return prisma.eventLog.update({
      where: { id: eventId },
      data: { status: 'FAILED', errorReason: reason }
    });
  }
}
