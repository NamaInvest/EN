/**
 * Swagger UI Page — /api/docs
 * Interactive API documentation for NamaInvest ERP
 * Loads spec from /api/docs/openapi.json
 */
import { NextResponse } from 'next/server';

const HTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NamaInvest ERP — API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0f0f0f; color: #f0f0f0; font-family: 'Inter', sans-serif; }
    #swagger-ui { max-width: 1400px; margin: 0 auto; padding: 24px; }
    .swagger-ui .topbar { background: #1a1a2e; padding: 12px 24px; }
    .swagger-ui .topbar-wrapper .link { display: flex; align-items: center; gap: 12px; }
    .swagger-ui .topbar-wrapper .link::before {
      content: '🏢 NamaInvest ERP';
      font-size: 18px; font-weight: 700; color: #fff;
    }
    .swagger-ui .topbar-wrapper img { display: none; }
    .swagger-ui .info .title { color: #60a5fa; }
    .swagger-ui .scheme-container { background: #1e1e2e; padding: 16px; border-radius: 8px; }
    .api-badge {
      position: fixed; top: 16px; right: 16px; z-index: 9999;
      background: #10b981; color: white; padding: 6px 16px;
      border-radius: 999px; font-size: 12px; font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="api-badge">v2.4.6 — Live</div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      layout: 'StandaloneLayout',
      tryItOutEnabled: true,
      persistAuthorization: true,
      filter: true,
      displayRequestDuration: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      docExpansion: 'list',
    });
  </script>
</body>
</html>`;

export async function GET() {
  return new NextResponse(HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
