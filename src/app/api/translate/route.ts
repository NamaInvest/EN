import { NextResponse } from 'next/server';

// Fallback Transliteration for Arabic letters
const ARABIC_TO_EN_MAP: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
    'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h', 'ؤ': 'o', 'ئ': 'e',
    ' ': ' '
};

function transliterate(text: string): string {
    let result = '';
    for (const char of text) {
        result += ARABIC_TO_EN_MAP[char] || char;
    }
    // Capitalize first letter of each word
    return result.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    
    if (!text) {
        return NextResponse.json({ translated: '' });
    }

    try {
        // 1. Try Google Translate
        const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(googleUrl, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
            const data = await res.json();
            const translated = (data?.[0]?.[0]?.[0] || '').trim();
            if (translated && translated !== text) return NextResponse.json({ translated });
        }
    } catch (e) {
        console.warn('Google Translate API failed, trying fallback...');
    }

    try {
        // 2. Try MyMemory Translation API
        const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|en`;
        const res2 = await fetch(myMemoryUrl, { signal: AbortSignal.timeout(3000) });
        if (res2.ok) {
            const data2 = await res2.json();
            const translated2 = data2?.responseData?.translatedText;
            if (translated2 && translated2 !== text) return NextResponse.json({ translated: translated2.trim() });
        }
    } catch (e) {
        console.warn('MyMemory Translate API failed, using transliteration fallback...');
    }

    // 3. Fallback to basic transliteration if all APIs fail (e.g. Server IP blocked)
    const fallbackText = transliterate(text);
    return NextResponse.json({ translated: fallbackText });
}
