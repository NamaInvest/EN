/**
 * Ollama Explain API
 * POST /api/explain
 * شرح أقسام ERP باستخدام Ollama/LLaMA
 */
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'explain' });

const POSTSchema = z.object({
  sectionName: z.string().min(1, 'اسم القسم مطلوب').max(200, 'اسم القسم طويل جداً'),
});

async function _POST(req: Request) {
  const rawBody = await req.json();
  const parsed = POSTSchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json(
      { error: 'بيانات غير صالحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { sectionName } = parsed.data;

  try {
    const ollama = (await import('ollama')).default;
    const response = await ollama.chat({
      model: 'llama3',
      messages: [{ role: 'user', content: `اشرح لي ببساطة دور القسم التالي في نظام Nama ERP: ${sectionName}` }],
    });
    return Response.json({ explanation: response.message.content });
  } catch (err: any) {
    log.error('Ollama explain error:', err);
    return Response.json({ error: 'فشل الاتصال بـ Ollama — تأكد أن الخدمة تعمل محلياً' }, { status: 503 });
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
