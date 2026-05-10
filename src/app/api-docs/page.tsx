/**
 * API Documentation Page — Swagger UI
 * Route: /api-docs
 */
import type { Metadata } from 'next';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.app.api-docs' });

export const metadata: Metadata = {
  title:       'NamaSoft ERP — API Documentation',
  description: 'توثيق واجهة برمجية NamaSoft ERP — 681 endpoint',
};

export default function ApiDocsPage() {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>NamaSoft ERP — API Docs</title>
        <link
          rel="stylesheet"
          href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
        />
        <style>{`
          body { margin: 0; font-family: 'Segoe UI', sans-serif; }
          .swagger-ui .topbar { background: linear-gradient(135deg, #1e3a5f, #2d6a9f); }
          .swagger-ui .topbar .download-url-wrapper input { direction: ltr; }
          .api-header {
            background: linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%);
            color: white;
            padding: 20px 40px;
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .api-header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; }
          .api-header .badge { 
            background: rgba(255,255,255,0.2); 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 0.8rem; 
          }
          #swagger-ui { max-width: 1400px; margin: 0 auto; }
        `}</style>
      </head>
      <body>
        <div className="api-header">
          <h1>🏢 NamaSoft ERP</h1>
          <span className="badge">API v9.3.0</span>
          <span className="badge">681 Endpoints</span>
          <span className="badge">OpenAPI 3.1</span>
        </div>
        <div id="swagger-ui" />
        <script
          src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"
          defer
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', function() {
                SwaggerUIBundle({
                  url:           '/openapi.json',
                  dom_id:        '#swagger-ui',
                  presets:       [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
                  layout:        'BaseLayout',
                  deepLinking:   true,
                  filter:        true,
                  tryItOutEnabled: true,
                  requestInterceptor: (req) => {
                    const token = localStorage.getItem('erpToken');
                    if (token) req.headers['Authorization'] = 'Bearer ' + token;
                    const tenant = localStorage.getItem('erpTenant') || 'default';
                    req.headers['x-tenant-id'] = tenant;
                    return req;
                  },
                });
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
