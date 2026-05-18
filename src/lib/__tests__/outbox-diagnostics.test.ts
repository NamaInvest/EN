import { OutboxService } from '@/lib/services/outbox.service';

type DiagnosticsClient = Parameters<typeof OutboxService.getDiagnostics>[0];

function createDiagnosticsClient() {
  const outboxEvent = {
    count: jest.fn(),
    findFirst: jest.fn(),
  };

  return {
    prisma: { outboxEvent } as unknown as DiagnosticsClient,
    outboxEvent,
  };
}

describe('OutboxService.getDiagnostics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scopes every diagnostics query to the current tenant and does not select payload', async () => {
    const { prisma, outboxEvent } = createDiagnosticsClient();
    const oldestCreatedAt = new Date('2026-05-18T09:00:00.000Z');

    outboxEvent.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(9)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    outboxEvent.findFirst.mockResolvedValueOnce({
      id: 42,
      createdAt: oldestCreatedAt,
      eventType: 'ZATCA_REPORT_JOB',
    });

    const result = await OutboxService.getDiagnostics(prisma, 'tenant-a');

    expect(result).toEqual({
      pendingCount: 3,
      processingCount: 1,
      processedCount: 9,
      failedCount: 2,
      oldestPendingEvent: {
        id: 42,
        createdAt: oldestCreatedAt,
        eventType: 'ZATCA_REPORT_JOB',
      },
      exceededRetryLimitCount: 1,
    });

    expect(outboxEvent.count).toHaveBeenNthCalledWith(1, { where: { tenantId: 'tenant-a', status: 'PENDING' } });
    expect(outboxEvent.count).toHaveBeenNthCalledWith(2, { where: { tenantId: 'tenant-a', status: 'PROCESSING' } });
    expect(outboxEvent.count).toHaveBeenNthCalledWith(3, { where: { tenantId: 'tenant-a', status: 'PROCESSED' } });
    expect(outboxEvent.count).toHaveBeenNthCalledWith(4, { where: { tenantId: 'tenant-a', status: 'FAILED' } });
    expect(outboxEvent.count).toHaveBeenNthCalledWith(5, {
      where: { tenantId: 'tenant-a', status: 'FAILED', attempts: { gte: 5 } },
    });

    expect(outboxEvent.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-a', status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      select: { id: true, createdAt: true, eventType: true },
    });
    expect(JSON.stringify(outboxEvent.findFirst.mock.calls[0][0])).not.toContain('payload');
  });

  it('rejects diagnostics without tenant context before querying', async () => {
    const { prisma, outboxEvent } = createDiagnosticsClient();

    await expect(OutboxService.getDiagnostics(prisma, '')).rejects.toThrow('TENANT_ISOLATION_VIOLATION');

    expect(outboxEvent.count).not.toHaveBeenCalled();
    expect(outboxEvent.findFirst).not.toHaveBeenCalled();
  });
});
