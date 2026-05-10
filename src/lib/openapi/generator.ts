import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { writeFileSync } from 'fs';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'OpenAPIGen' });

export const registry = new OpenAPIRegistry();

// Stub generation script for OpenAPI
export function generateOpenAPI() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  const document = generator.generateDocument({
    openapi: '3.1.0',
    info: { title: 'Namasoft ERP API', version: '1.0.0' },
    servers: [{ url: 'https://api.namasoft.com' }],
  });

  try {
    writeFileSync('public/openapi.json', JSON.stringify(document, null, 2));
    log.info('[OpenAPI] Successfully generated openapi.json');
  } catch (err) {
    log.error('[OpenAPI] Failed to write openapi.json', err);
  }
}
