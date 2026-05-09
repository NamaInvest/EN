import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
async function _POST(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const user = getUserFromRequest(req as any);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const image = formData.get('image') as File;

        if (!image) {
            return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
        }

        // Fetch Gemini API Key
        const setting = await prisma.setting.findUnique({ where: { key: 'gemini_api_key' } });
        const geminiKey = setting?.value;

        if (!geminiKey) {
            return NextResponse.json({ error: 'Gemini API Key is missing in settings' }, { status: 400 });
        }

        // Convert image to base64
        const buffer = await image.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString('base64');
        const mimeType = image.type || 'image/jpeg';

        const promptText = `
أنت خبير في الجرد وإدارة المستودعات.
المهمة:
يوجد في هذه الصورة رف مستودع أو مجموعة من المنتجات/الصناديق.
1. قم بتمييز و قراءة أسماء المنتجات أو العلامات التجارية المكتوبة على العلب بقدر الإمكان.
2. قم بحساب عدد القطع (الكمية) لكل منتج اكتشفته.
3. الرد يجب أن يكون حصراً بصيغة JSON Array كما يلي، بدون أي نص إضافي:
[
  {
    "name": "اسم المنتج أو العلامة التجارية المكتشفة بوضوح",
    "count": 5
  }
]
إذا لم تتعرف على أي شيء، قم بإرجاع مصفوفة فارغة [].
`;

        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey.replace(/[\"\'\\]/g, '').trim()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: promptText },
                            {
                                inlineData: {
                                    mimeType,
                                    data: base64Data
                                }
                            }
                        ]
                    }
                ],
                generationConfig: { temperature: 0.1 }
            })
        });

        if (!aiRes.ok) {
            console.error('Gemini Vision Error:', await aiRes.text());
            return NextResponse.json({ error: 'Failed to process image with Vision AI' }, { status: 500 });
        }

        const aiData = await aiRes.json();
        let text = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        
        text = text.replace(/^\\s*\`\`\`json/i, '').replace(/\`\`\`\\s*$/i, '').trim();
        
        let detectedItems: { name: string, count: number }[] = [];
        try {
            detectedItems = JSON.parse(text);
        } catch (e: any) {
            console.error('JSON Parse error from Vision AI:', text);
            return NextResponse.json({ error: 'Vision AI returned invalid data formatting' }, { status: 500 });
        }

        if (!Array.isArray(detectedItems)) {
            detectedItems = [];
        }

        // Match detected items with database products
        // For simplicity, we just fetch a random matching product or report it as unknown.
        const enrichedResults = [];

        for (const item of detectedItems) {
            if (!item.name || typeof item.count !== 'number') continue;
            
            // Search product by partial name matches
            const dbProduct = await prisma.product.findFirst({
                where: {
                    name: {
                        contains: item.name,
                        mode: 'insensitive'
                    },
                    active: true
                },
                select: { id: true, name: true, currentStock: true, barcode: true }
            });

            if (dbProduct) {
                enrichedResults.push({
                    productId: dbProduct.id,
                    productName: dbProduct.name,
                    barcode: dbProduct.barcode,
                    systemStock: dbProduct.currentStock,
                    visionCount: item.count,
                    difference: item.count - n(dbProduct.currentStock),
                    matched: true,
                    originalAiName: item.name
                });
            } else {
                enrichedResults.push({
                    productId: null,
                    productName: item.name + ' (غير مسجل)',
                    barcode: null,
                    systemStock: 0,
                    visionCount: item.count,
                    difference: item.count,
                    matched: false,
                    originalAiName: item.name
                });
            }
        }

        return NextResponse.json({ results: enrichedResults });

    } catch (err: any) {
        console.error('Vision API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
