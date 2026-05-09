import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';

// Arabic to English transliteration map
import { getUserFromRequest } from '@/lib/auth';
const arabicToEn: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'aa', 'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'dh', 'ع': 'a',
    'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'a', 'ء': '\'',
    'َ': 'a', 'ُ': 'u', 'ِ': 'i', 'ّ': '', 'ْ': '',
};

function transliterate(arabic: string): string {
    let result = '';
    const words = arabic.split(/\s+/);
    
    for (let w = 0; w < words.length; w++) {
        const word = words[w];
        let transWord = '';
        
        // Skip if already English
        if (/^[a-zA-Z0-9]/.test(word)) {
            transWord = word;
        } else {
            // Handle "ال" (al-)
            let start = 0;
            if (word.startsWith('ال')) {
                transWord += 'al-';
                start = 2;
            }
            
            for (let i = start; i < word.length; i++) {
                const char = word[i];
                if (arabicToEn[char] !== undefined) {
                    transWord += arabicToEn[char];
                } else if (/[a-zA-Z0-9\-_.]/.test(char)) {
                    transWord += char;
                }
            }
        }
        
        // Capitalize first letter of each word
        if (transWord.length > 0) {
            transWord = transWord.charAt(0).toUpperCase() + transWord.slice(1);
        }
        
        if (transWord) {
            result += (w > 0 ? ' ' : '') + transWord;
        }
    }
    
    return result;
}

const POSTSchema = z.object({
  text: z.string().max(1000, 'النص طويل جداً'),
});

async function _POST(request: Request) {
    try {
        const rawBody = await request.json();
        const parsed = POSTSchema.safeParse(rawBody);
        if (!parsed.success) {
          return NextResponse.json({ result: '', error: parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { text } = parsed.data;
        if (!text) return NextResponse.json({ result: '' });
        const result = transliterate(text);
        return NextResponse.json({ result });
    } catch {
        return NextResponse.json({ result: '' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
