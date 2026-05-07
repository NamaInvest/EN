import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { message, audience = 'all' } = body;

        if (!message) {
            return NextResponse.json({ error: 'محتوى الرسالة التسويقية مطلوب' }, { status: 400 });
        }

        // Fetch WhatsApp Settings from Prisma
        const settings = await prisma.setting.findMany({
            take: 100,
            where: { key: { in: ['whatsapp_enabled', 'whatsapp_token', 'whatsapp_phone_id'] } }
        });

        const enabled = settings.find(s => s.key === 'whatsapp_enabled')?.value === '1';
        const token = settings.find(s => s.key === 'whatsapp_token')?.value;
        const phoneId = settings.find(s => s.key === 'whatsapp_phone_id')?.value;

        if (!enabled || !token || !phoneId) {
            return NextResponse.json({ error: 'WhatsApp API is not configured.' }, { status: 400 });
        }

        // Fetch target audience (Customers or Merchants)
        // We fetch clients from the 'customer' table.
        let targetPhones = [];
        try {
            const customers = await prisma.customer.findMany({
            take: 100,
                where: { phone: { not: null } },
                select: { phone: true, name: true }
            });
            targetPhones = customers.map(c => ({ phone: c.phone, name: c.name }));
        } catch (e) {
            // Fallback to Users table if customer table is isolated
            const users = await prisma.user.findMany({
            take: 100,
                where: { phone: { not: null } },
                select: { phone: true, fullName: true }
            });
            targetPhones = users.map(u => ({ phone: u.phone, name: u.fullName }));
        }

        if (targetPhones.length === 0) {
            return NextResponse.json({ error: 'No valid customer phone numbers found in the database.' }, { status: 404 });
        }

        let successCount = 0;
        let failCount = 0;

        // Broadcast Loop
        for (const target of targetPhones) {
            let formattedPhone = (target.phone ?? '').replace(/\\D/g, ''); 
            if (formattedPhone.startsWith('05')) formattedPhone = '966' + formattedPhone.substring(1);
            else if (formattedPhone.startsWith('5')) formattedPhone = '966' + formattedPhone;

            const waPayload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: formattedPhone,
                type: 'text',
                text: { body: `مرحباً ${target.name}،\n\n${message}` }
            };

            const waUrl = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
            try {
                const res = await fetch(waUrl, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(waPayload)
                });
                if (res.ok) successCount++;
                else failCount++;
            } catch (err) {
                failCount++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Broadcasting completed.`, 
            stats: { 
                total: targetPhones.length, 
                success: successCount, 
                failed: failCount 
            } 
        });

    } catch (error) {
        console.error('WhatsApp Broadcast Error:', error);
        return NextResponse.json({ error: 'فشل في تهيئة حملة البث التسويقي' }, { status: 500 });
    }
}
