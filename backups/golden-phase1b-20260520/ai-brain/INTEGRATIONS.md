# Integrations

# Project Brain

Generated: 2026-05-18 02:34:44 +03:00

Scan facts:
- API routes: 850
- Prisma models: 609
- Prisma enums: 2
- Pages: 492
- Tests: 83
- Graphify files: 4576
- Graphify words: 6562824
- Sensitive skipped by graphify: 14
- graph.html: 27.75 MB, updated 05/18/2026 02:21:51
- graph.json: 29.84 MB, updated 05/18/2026 02:21:48

## Executive Overview

Nama Invest / 
amaweb is a large Multi-Tenant SaaS ERP + POS + Electron Desktop + PWA repository. The stack detected from code/config includes Next.js, React, Prisma, PostgreSQL, TypeScript, Electron, Redis/BullMQ patterns, Sentry, Zod, and Saudi compliance/ZATCA modules.

| Integration | Evidence | Purpose | Retry/Timeout | Secrets | Risks |
|---|---|---|---|---|---|
| ZATCA | src/services/zatca/*, src/lib/zatca*, /api/zatca/* | Saudi e-invoicing | Route/service-specific, UNKNOWN globally | ZATCA cert/key/env refs | ICV/PIH, cleared invoice immutability |
| Webhooks | src/lib/webhooks*, src/services/webhooks/manager.ts, /api/webhooks/* | Inbound/outbound events | UNKNOWN globally | webhook secrets | signature/replay/idempotency |
| Payments | src/lib/payment-gateway/moyasar.ts, payment engines/routes | Payment gateway handling | UNKNOWN | gateway keys | duplicate payment/callback spoofing |
| Email | nodemailer dependency and email references | Notifications/doc delivery | UNKNOWN | SMTP refs | PII and retry duplication |
| WhatsApp/Telegram | src/workers/whatsapp.ts, telegram/whatsapp APIs | Messaging/bots | UNKNOWN | bot/webhook tokens | spoofed webhook/token leakage |
| E-commerce | e-commerce sync engine and Salla/Zid refs | Store/order sync | UNKNOWN | Salla/Zid secrets | duplicate order/signature gaps |
| AI/Gemini/LangChain | AI/RAG/vector dirs and dependencies | AI assistant/audit/RAG | UNKNOWN | LLM keys | sensitive data/cost |
| Sentry/Observability | sentry config, instrumentation | Error monitoring | SDK behavior | DSN | PII in logs |
| Desktop/Electron | electron and offline sync files | Desktop/offline | UNKNOWN | license/device info | sync conflicts |
