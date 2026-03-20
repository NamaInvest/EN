import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const key = 'gemini_api_key';
    const value = 'AIzaSyCY2NBRvTazcdUnqqv1roMFGGX3LQ1qJkA';

    try {
        const existing = await prisma.setting.findUnique({ where: { key } });
        
        if (existing) {
            await prisma.setting.update({
                where: { key },
                data: { value }
            });
            console.log('✅ Updated existing Gemini API Key in Database.');
        } else {
            await prisma.setting.create({
                data: {
                    key,
                    value,
                    group: 'general'
                }
            });
            console.log('✅ Created new Gemini API Key in Database.');
        }
    } catch (e) {
        console.error('❌ Error updating DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
