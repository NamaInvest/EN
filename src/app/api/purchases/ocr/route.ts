import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
    let tempPath = '';
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'لم يتم رفع ملف' }, { status: 400 });
        }

        // Save to temp file (Tesseract needs file path in Node.js)
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.split('.').pop() || 'png';
        tempPath = join(tmpdir(), `ocr-${randomUUID()}.${ext}`);
        await writeFile(tempPath, buffer);

        // Run OCR with Tesseract
        const Tesseract = await import('tesseract.js');
        const result = await Tesseract.recognize(tempPath, 'ara+eng', {
            logger: (m: { status: string }) => {
                if (m.status) console.log('OCR:', m.status);
            },
        });

        const rawText = result.data.text;
        console.log('OCR Raw Text:', rawText);

        // Parse the text to extract items
        const items: { name: string; price: number; quantity: number }[] = [];
        const lines = rawText.split('\n').filter((l: string) => l.trim().length > 3);

        for (const line of lines) {
            const numRegex = /(\d[\d,]*\.?\d*)/g;
            const numbers: number[] = [];
            let m;
            while ((m = numRegex.exec(line)) !== null) {
                const num = parseFloat(m[1].replace(/,/g, ''));
                if (num > 0) numbers.push(num);
            }
            if (numbers.length === 0) continue;

            // Remove numbers to get product name
            let name = line.replace(/[\d,]+\.?\d*/g, '').replace(/ر\.?س|ريال|SR|SAR|×|x|\*/gi, '').trim();
            name = name.replace(/[\-\|\.\_\#\@\:\;]+/g, ' ').replace(/\s+/g, ' ').trim();
            if (name.length < 2) continue;

            let price = 0, quantity = 1;
            if (numbers.length >= 3) {
                quantity = numbers[0];
                price = numbers[1];
            } else if (numbers.length === 2) {
                if (numbers[0] < 100 && numbers[1] > numbers[0]) {
                    quantity = numbers[0];
                    price = numbers[1];
                } else {
                    price = numbers[0];
                }
            } else {
                price = numbers[0];
            }

            if (price > 0 && price < 1000000) {
                items.push({ name, price, quantity: quantity || 1 });
            }
        }

        return NextResponse.json({
            success: true,
            rawText,
            items,
            message: items.length > 0
                ? `تم استخراج ${items.length} صنف`
                : 'لم يتم العثور على أصناف',
        });
    } catch (error) {
        console.error('OCR Error:', error);
        return NextResponse.json({ error: 'فشل في قراءة الملف' }, { status: 500 });
    } finally {
        // Cleanup temp file
        if (tempPath) {
            try { await unlink(tempPath); } catch { }
        }
    }
}
