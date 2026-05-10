import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.rag.sources.' });

export const KNOWLEDGE_SOURCES = [
  {
    type: 'zatca-docs',
    sources: [
      'https://zatca.gov.sa/ar/E-Invoicing/Pages/default.aspx',
      'XML Specification PDFs',
      'API Reference',
    ],
  },
  { type: 'socpa', sources: ['SOCPA Accounting Standards', 'Saudi GAAP'] },
  { type: 'ifrs', sources: ['IFRS 9, 15, 16 Arabic'] },
  { type: 'labor-law', sources: ['Saudi Labor Law 2005 + amendments'] },
  { type: 'gosi', sources: ['GOSI Contribution Rules'] },
  { type: 'internal-policies', sources: ['Tenant-specific policies'] },
  { type: 'invoices', sources: ['Past invoices summary embeddings'] },
  { type: 'products', sources: ['Product descriptions + SKUs'] },
];
