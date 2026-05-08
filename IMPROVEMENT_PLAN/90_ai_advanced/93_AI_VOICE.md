# 93 — AI Voice | الصوت

## 🟡 الأولوية: متوسط

## 🎯 Use Cases
- POS بدون يدين (للمشغول)
- CFO في السيارة
- Field workers (warehouse, delivery)
- Accessibility (للذين لديهم صعوبة في القراءة)

## 🎯 الخطة

### 93.1 — STT (Speech-to-Text) (5 أيام)
**Options:**
- **OpenAI Whisper** (open source، عربي ممتاز)
- **Google Speech-to-Text** (مدفوع)
- **Azure Speech** (مدفوع)
- **AWS Transcribe**

**التوصية:** Whisper (large-v3) for Arabic

```typescript
export class STTService {
  async transcribe(audio: Buffer, options: { language?: string }): Promise<string> {
    // Saudi Arabic dialect handling
    return await whisper.transcribe(audio, { language: options.language || 'ar' });
  }
}
```

### 93.2 — TTS (Text-to-Speech) (5 أيام)
**Options:**
- **ElevenLabs** (الأفضل صوتياً، عربي ممتاز)
- **Google TTS**
- **Azure Neural Voices**
- **AWS Polly**
- **Coqui TTS** (open source)

**التوصية:** ElevenLabs (Arabic male + female voices)

### 93.3 — Voice POS (10 أيام)
**Workflow:**
```
"أضف 3 برجر دجاج وكولا"
   ↓
STT → "أضف 3 برجر دجاج وكولا"
   ↓
NLU → { items: [
  { sku: 'BURGER-001', qty: 3 },
  { sku: 'COLA', qty: 1 }
]}
   ↓
Add to cart
   ↓
TTS → "تمت إضافة 3 برجر دجاج وكولا. الإجمالي 75 ريال"
```

### 93.4 — Voice CFO Assistant (8 أيام)
- "كيف الكاش الشهر هذا؟"
- "أعطني أعلى 5 موردين"
- "هل عندنا متأخرات قبل 60 يوم؟"
- بصوت طبيعي + تقرير مرئي مرافق

### 93.5 — Voice Commands (5 أيام)
- "افتح فاتورة عميل أحمد"
- "أضف منتج جديد"
- "أنشئ قيد محاسبي"
- مع تأكيد قبل التنفيذ الحرج

### 93.6 — Mobile Integration (5 أيام)
- "Hey Namasoft" wake word
- Push-to-talk button
- Background audio capture
- Battery optimization

### 93.7 — Voice Authentication (4 أيام)
- Voiceprint
- Anti-spoofing
- 2FA via voice
- Compliance considerations

### 93.8 — Multilingual (4 أيام)
- Arabic (Saudi dialect)
- English
- Urdu (للموظفين)
- Hindi
- Auto-detect

### 93.9 — Privacy (3 أيام)
- Audio not stored (transcribed + deleted)
- Or stored encrypted with consent
- PDPL compliance
- User control

### 93.10 — Cost Management (3 أيام)
- STT costs (per minute)
- TTS costs (per character)
- Caching common phrases
- Local processing where possible

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Voice features | لا | 10+ |
| STT accuracy (Saudi) | غير مقاس | > 95% |
| Response time | غير مقاس | < 2s |
| Voice POS adoption | لا | trial |

## ⏱️ المدة: 52 يوم عمل
