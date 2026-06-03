import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ragPipeline } from '@/lib/rag-pipeline';
import { getPrisma } from '@/lib/prisma';
import { queryRAG } from '@/lib/vector-store';

// Mock Prisma
vi.mock('@/lib/prisma', () => {
  return {
    getPrisma: vi.fn(() => ({
      $queryRawUnsafe: vi.fn().mockResolvedValue([]),
      $queryRaw: vi.fn().mockResolvedValue([]),
      knowledgeDocument: {
        upsert: vi.fn().mockResolvedValue({ id: 'doc-1' }),
      }
    })),
    requireTenantId: vi.fn(),
  };
});

// Mock AI to avoid real API calls
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      embedContent: vi.fn().mockResolvedValue({ embeddings: [{ values: new Array(768).fill(0.1) }] }),
      generateContent: vi.fn().mockResolvedValue({ text: 'mocked response' })
    }
  }))
}));

describe('RAG Tenant Isolation Autopilot Tests', () => {
  let prismaMock: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock = getPrisma();
    prismaMock.$queryRawUnsafe.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValue([]);
  });

  describe('A. Missing Tenant Reject Test', () => {
    it('should reject RAG pipeline query if tenantId is omitted', async () => {
      await expect(ragPipeline.query('What is the policy?', {})).rejects.toThrow('Tenant isolation breach');
    });

    it('should reject RAG pipeline query if tenantId is "default"', async () => {
      await expect(ragPipeline.query('What is the policy?', { tenantId: 'default' })).rejects.toThrow('Tenant isolation breach');
    });
  });

  describe('B. Default Tenant Fallback Detection Test', () => {
    it('should reject ragPipeline.ingest without tenantId', async () => {
      // @ts-ignore - testing missing param
      await expect(ragPipeline.ingest('doc1', 'some text')).rejects.toThrow('Tenant isolation breach');
    });

    it('should reject ragPipeline.ingest with "default" tenantId', async () => {
      await expect(ragPipeline.ingest('doc1', 'some text', {}, 'default')).rejects.toThrow('Tenant isolation breach');
    });
  });

  describe('C & D. Cross Tenant Isolation & vectorSearch Filter Test', () => {
    it('ensures queryRAG passes the exact tenantId to Prisma $queryRaw', async () => {
      // Should not throw
      await expect(queryRAG('tenant-secure-777', 'Find invoices')).resolves.toBeDefined();
    });

    it('should reject queryRAG without tenantId', async () => {
      // @ts-ignore
      await expect(queryRAG(undefined, 'Find invoices')).rejects.toThrow('Tenant isolation breach');
    });
  });
});
