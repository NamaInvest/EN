# 28 - الذكاء الاصطناعي (AI Features)

> Copilot + CFO + Auditor + OCR + Vision + Fraud Detection + WhatsApp + Telegram

---

## 🤖 الميزات المنفذة

| الميزة | المسار | الموديل | الحالة |
|---|---|---|---|
| **AI Copilot** | `/api/ai/copilot` | Gemini 2.0-flash | ✅ |
| **AI CFO Daily** | `/api/ai-cfo` | Gemini 2.5-flash | ✅ |
| **AI Auditor** | `/api/ai-auditor` (cron) | Gemini 2.5-flash | ✅ |
| **AI Bank Reconciliation** | `/api/ai/bank-reconciliation` | Rule + LLM | ✅ |
| **AI Fraud Monitoring** | `/api/ai/fraud-monitoring` | Gemini + Rules | ✅ |
| **AI Bank Fraud (Receipt)** | `/api/ai/bank-fraud` | Gemini Vision | 🟡 mock |
| **AI Demand Forecast** | `/api/ai/demand-forecast` | Statistical | ✅ |
| **AI Sales Coach** | `/api/ai/sales-coach` | Rule-based | ✅ |
| **AI NLQ** | `/api/ai/nlq` | Regex + LLM | ✅ |
| **AI Chat (RAG)** | `/api/ai/chat` | Gemini + pgvector | ✅ |
| **AI OCR (Purchases)** | (worker) | Gemini Vision | 🟡 |
| **AI Vision (Inventory)** | `/inventory/ai-vision` | Gemini Vision | 🟡 |
| **AI Predictive SCM** | `/api/ai/predictive-scm` | ML | 🟡 |

---

## 1️⃣ AI Copilot

### الموديل: Gemini 2.0-flash (سريع + رخيص)

### الـ Engine (`src/lib/ai-copilot-engine.ts`):
```typescript
class AICopilotEngine {
    persona: Persona;       // Copilot / Accountant / Sales / Auditor
    context: ChatContext;
    
    async ask(query: string) {
        // 1. تحديد الـ persona
        // 2. جمع السياق (المستخدم، الصلاحيات، البيانات الحالية)
        // 3. بناء system prompt
        // 4. إرسال لـ Gemini
        // 5. parse الـ response (قد يحتوي tools/actions)
        // 6. تنفيذ tools إذا applicable
        // 7. إرجاع النتيجة
    }
}
```

### الـ Personas (`src/lib/ai-personas.ts`):

```typescript
const personas = {
    copilot: {
        name: 'المساعد الذكي',
        tone: 'professional, helpful',
        tools: ['searchInvoices', 'checkInventory', 'getDailySales', 'navigate']
    },
    accountant: {
        name: 'المحاسب الآلي',
        tone: 'precise, strict, financial-focused',
        tools: ['getTrialBalance', 'getIncomeStatement', 'auditJournalEntry', 'taxCalculation']
    },
    salesRep: {
        name: 'مندوب المبيعات الذكي',
        tone: 'friendly, sales-focused',
        tools: ['searchProducts', 'checkCustomerBalance', 'createQuotation']
    },
    auditor: {
        name: 'المدقق الداخلي',
        tone: 'analytical, neutral, security-focused',
        tools: ['scanAuditLogs', 'detectAnomalies', 'flagTransaction']
    }
};
```

### السياق المُمرّر للـ Gemini:
- معلومات الشركة (الاسم، الـ VAT، الفروع)
- المستخدم الحالي (الدور، الصلاحيات)
- البيانات الحالية (آخر فاتورة، رصيد الصندوق، إلخ)
- معايير SOCPA, IFRS, ZATCA
- نظام العمل السعودي

### الـ UI:
- `AICopilotButton.tsx` (دائم في الـ Sidebar)
- Chat panel جانبي
- يدعم voice input

---

## 2️⃣ AI CFO

### المسار: `/api/ai-cfo` + Worker (`cfoReportWorker`)

### الـ Flow:
```typescript
// شهرياً (أو on-demand)
async function generateCFOReport(tenantId: string) {
    // 1. تجميع KPIs
    const kpis = {
        sales: await getSalesMetrics(),
        purchases: await getPurchaseMetrics(),
        expenses: await getExpenses(),
        treasuryBalance: await getTreasuryBalance(),
        arAging: await getARAging(),
        apAging: await getAPAging(),
        lowStock: await getLowStockItems(),
        budgetVariance: await getBudgetVariance(),
    };
    
    // 2. Privacy filter (يخفي أسماء العملاء/المنتجات)
    const filtered = privacyFilter(kpis);
    
    // 3. Render prompt template
    const prompt = renderCFOPrompt(filtered);
    
    // 4. استدعاء Gemini 2.5-flash
    const response = await gemini.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    
    // 5. Parse: alerts, insights, recommendations
    const report = parseCFOResponse(response.text);
    
    // 6. حفظ
    await prisma.aiCfoReport.create({
        data: { tenantId, content: report, generatedAt: new Date() }
    });
    
    // 7. إرسال (Email, Telegram)
    await sendCFOReport(report, tenantId);
}
```

### مثال للـ Output:
```
🟢 تنبيهات اليوم:
- المبيعات: 45,000 SAR (+12% من أمس)
- العملاء المتأخرون: 3 عملاء بمبلغ 25,000 SAR
- المخزون الناقص: 5 منتجات تحت الحد الأدنى

📊 المؤشرات:
- AR Aging: 65% within 30d, 25% 31-60d, 10% > 60d
- AP Aging: dues this week: 35,000 SAR
- Cash Position: 250,000 SAR (sufficient for 8 days)

⚠️ توصيات:
1. تواصل مع شركة X (متأخرة 45 يوم)
2. اطلب 3 منتجات قبل النفاد
3. ادفع فواتير الإيجار قبل 5 من الشهر

🎯 الأرباح المتوقعة هذا الشهر: 120,000 SAR
```

---

## 3️⃣ AI Auditor (التدقيق الآلي)

### المسار: `/api/ai-auditor` (cron يومي)
### الموديل: Gemini 2.5-flash

### الـ Flow:
```typescript
// /api/cron/daily-audit (3:00 AM يومياً)
async function dailyAudit(tenantId: string) {
    // 1. تجميع المعاملات الحساسة آخر 24 ساعة
    const transactions = await getHighRiskTransactions();
    
    // High-risk tables:
    const HIGH_RISK_TABLES = [
        'SalesInvoice',  // خاصة الـ deletes
        'JournalEntry',  // خاصة manual entries كبيرة
        'User',          // permissions, role changes
        'Settings',      // ZATCA, JWT changes
        'BankTransaction', // كبيرة بدون reference
        'EmployeeLoan',  // self-approval
    ];
    
    // 2. حساب Risk Score
    let riskScore = 0;
    const findings = [];
    
    for (const t of transactions) {
        // Delete invoice → +3
        if (t.action === 'DELETE' && t.tableName === 'SalesInvoice') {
            riskScore += 3;
            findings.push({ ...t, reason: 'Invoice deleted', severity: 'HIGH' });
        }
        
        // Large JE manual entry → +2
        if (t.tableName === 'JournalEntry' && Math.abs(t.amount) > 100000) {
            riskScore += 2;
        }
        
        // Permission elevation → +3
        if (t.tableName === 'User' && t.diff?.role) {
            riskScore += 3;
        }
        
        // Out-of-hours operations (12 AM - 6 AM) → +1
        if (isOutOfHours(t.timestamp)) {
            riskScore += 1;
        }
    }
    
    // 3. إذا score >= 7 → ينتج تقرير
    if (riskScore >= 7) {
        const prompt = buildAuditPrompt(findings);
        const aiAnalysis = await gemini.generateContent({...});
        
        // 4. إرسال Telegram
        const chatId = await getSetting('master_telegram_chat_id');
        if (chatId) {
            await sendTelegramMessage(chatId, formatAuditReport(aiAnalysis, riskScore));
        }
        
        // 5. حفظ
        await prisma.aiAuditReport.create({...});
    }
}
```

### مثال للتقرير:
```
🔴 تنبيه أمني — Risk Score: 8/10

📋 الملخص:
خلال آخر 24 ساعة، تم اكتشاف 3 أحداث عالية المخاطر:

1. 🔴 حذف فاتورة بقيمة 50,000 SAR
   - الموظف: محمد ع.
   - الوقت: 02:30 AM (خارج ساعات العمل)
   - الفاتورة: INV-2026-0345
   - المبرر: غير مذكور

2. 🟠 ترقية صلاحيات
   - من: محاسب → admin
   - تمت بواسطة: نظام (بدون موافقة)
   - الموظف: سارة م.

3. 🟡 قيد يدوي كبير
   - المبلغ: 250,000 SAR
   - الوصف: "تسوية"
   - المحاسب: أحمد ج.

⚠️ التوصيات:
- راجع فاتورة INV-2026-0345 (شُك في احتيال)
- تحقق من ترقية سارة (قد تكون خطأ تكوين)
- اطلب توضيح من أحمد عن القيد
```

---

## 4️⃣ AI Bank Reconciliation

### المسار: `/api/ai/bank-reconciliation`

### الـ Logic:
```typescript
async function aiBankMatch(statementLines: BankStatementLine[]) {
    const journalLines = await getUnreconciledJournalLines();
    
    const matches = [];
    
    for (const sLine of statementLines) {
        // 1. Reference match (exact)
        const refMatch = journalLines.find(j => j.reference === sLine.reference);
        if (refMatch) {
            matches.push({ sLine, jLine: refMatch, confidence: 1.0, type: 'EXACT' });
            continue;
        }
        
        // 2. Amount + Date (±3 days)
        const amountMatches = journalLines.filter(j => 
            Math.abs(j.amount - sLine.amount) < 0.01
        );
        
        if (amountMatches.length === 1 && Math.abs(daysBetween(amountMatches[0].date, sLine.date)) <= 3) {
            matches.push({ sLine, jLine: amountMatches[0], confidence: 0.8, type: 'AMOUNT_DATE' });
            continue;
        }
        
        // 3. AI fuzzy match (Gemini)
        if (amountMatches.length > 0) {
            const prompt = `match this bank line to one of these JEs:
                Bank: ${sLine.description} - ${sLine.amount} - ${sLine.date}
                Options: ${amountMatches.map(j => `${j.id}: ${j.description}`).join('\n')}`;
            
            const aiResponse = await gemini.generateContent({...});
            const matchedId = parseAIResponse(aiResponse);
            
            if (matchedId) {
                const jLine = amountMatches.find(j => j.id === matchedId);
                matches.push({ sLine, jLine, confidence: 0.6, type: 'AI_FUZZY' });
            }
        }
    }
    
    return matches;
}
```

---

## 5️⃣ AI Fraud Detection

### المسار: `/api/ai/fraud-monitoring`
### الـ Cron: يومي

### الـ Patterns المكتشفة:
1. **حذف فواتير بعد POSTED**
2. **خصومات > 20% غير معتمدة**
3. **سحوبات نقدية كبيرة بدون وصف**
4. **معاملات خارج ساعات العمل**
5. **مدفوعات لموردين غير معتمدين**
6. **POS sessions بـ variance كبير**
7. **عدد كبير من المرتجعات لعميل واحد**
8. **شراء/بيع لنفس المنتج بسعر يختلف 50%+**

### الـ Logic:
```typescript
async function detectFraud() {
    const suspiciousPatterns = [
        await detectDeletionPattern(),
        await detectDiscountAnomalies(),
        await detectTreasuryAnomalies(),
        await detectAfterHoursActivity(),
        // ...
    ];
    
    // إرسال لـ Gemini للتحليل العميق
    const aiAnalysis = await gemini.generateContent({
        prompt: buildFraudPrompt(suspiciousPatterns)
    });
    
    // النتائج → AlertCenter + Email/Telegram للـ Owner
}
```

---

## 6️⃣ AI Sales Coach

### المسار: `/api/ai/sales-coach`

### الـ Output:
```
لـ مندوب: أحمد العلي

📊 الأداء (الشهر الماضي):
- عدد الفواتير: 45 (متوسط)
- الإيرادات: 125,000 SAR (-15% من السابق)
- متوسط الفاتورة: 2,777 SAR
- معدل التحصيل (نقد/آجل): 60/40

💪 نقاط القوة:
- منتج X يحقق 30% من مبيعاتك (مهارة في بيعه)
- خدمة عملاء ممتازة (5 شكر من العملاء)

🎯 فرص التحسين:
1. لم تبع منتج Y رغم أنه الأعلى ربحية
2. نسبة الـ Credit مرتفعة — ركز على Cash
3. متوسط فاتورتك انخفض 8% — استكشف الـ upselling

📅 توصيات للشهر القادم:
- استهدف 50 فاتورة (+10%)
- ركز على cross-sell المنتج Y
- خفض الـ Credit إلى 30%
- متوسط الفاتورة المستهدف: 3,000 SAR
```

---

## 7️⃣ AI NLQ (Natural Language Query)

### المسار: `/api/ai/nlq`

### المثال:
```
المستخدم: "كم مبيعات اليوم؟"
النظام:
1. Regex match: "مبيعات اليوم"
2. Run query: SELECT SUM(total) FROM SalesInvoice WHERE DATE(date) = TODAY()
3. النتيجة: 5,234 SAR
4. Response:
   {
       answer: "5,234 SAR",
       chartType: 'number',
       data: { value: 5234 }
   }
```

### Patterns المدعومة:
- "مبيعات اليوم / الأسبوع / الشهر / السنة"
- "أعلى عميل / منتج / فرع"
- "المخزون الناقص / المنتهي"
- "هامش الربح"
- "الديون المستحقة / المتأخرة"
- "رواتب الشهر القادم"
- "إجمالي الضريبة"

---

## 8️⃣ AI RAG Chat

### المسار: `/api/ai/chat`, `/api/ai/rag`

### الـ Setup:
- **Vector Store:** pgvector extension
- **Embeddings:** Gemini embedding model
- **Knowledge Base:** docs, README, BUSINESS_FLOWS, SYSTEM_GUIDE

### الـ Flow:
```typescript
async function ragChat(question: string) {
    // 1. توليد embedding
    const queryEmbedding = await gemini.embed(question);
    
    // 2. البحث في pgvector
    const relevantDocs = await prisma.$queryRaw`
        SELECT id, content, 1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
        FROM knowledge_base
        ORDER BY embedding <=> ${queryEmbedding}::vector
        LIMIT 5
    `;
    
    // 3. بناء context
    const context = relevantDocs.map(d => d.content).join('\n\n');
    
    // 4. إرسال لـ Gemini
    const response = await gemini.generateContent({
        prompt: `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer in Arabic:`
    });
    
    return {
        answer: response.text,
        citations: relevantDocs.map(d => ({ id: d.id, similarity: d.similarity }))
    };
}
```

---

## 📷 9️⃣ AI Vision (OCR + Inventory)

### Use Cases:

#### Purchase Invoice OCR:
```
1. المحاسب يرفع صورة فاتورة شراء
2. Gemini Vision يستخرج:
   - اسم المورد
   - الرقم الضريبي
   - رقم الفاتورة + التاريخ
   - البنود (وصف + كمية + سعر)
   - الإجماليات
3. النظام يقترح PO المطابق (إن وجد)
4. المحاسب يراجع ويترحّل
```

#### Vision Stocktake:
```
1. الموظف يصور رفوف المنتجات
2. Gemini Vision:
   - يتعرف على المنتجات (matching بـ DB)
   - يعد الكميات
3. النظام يقارن مع DB
4. variance أكبر من tolerance → تنبيه
```

### الدقة:
- النصوص العربية: 85-95%
- العد البصري: 70-85%
- يحتاج مراجعة بشرية

---

## 💬 WhatsApp Bot

### الـ Worker (`src/workers/whatsapp.ts`):
- يستخدم `whatsapp-web.js` (Puppeteer)
- QR Code يظهر في `/whatsapp-hub` للمسح
- يستلم الرسائل من العملاء/الموظفين

### Features:
```
1. عميل يكتب: "كم رصيدي؟"
2. النظام:
   - يطابق رقم الجوال مع Customer
   - يجلب الرصيد + آخر فاتورة
   - يرسل لـ Gemini
3. الرد:
   "أهلاً أحمد!
   رصيدك الحالي: 1,500 SAR (مدين)
   آخر فاتورة: INV-1234 بقيمة 500 SAR — مستحقة بعد 7 أيام"
```

### Approval via WhatsApp:
- مدير يستلم: "موافقة على PO-456 بقيمة 25,000 SAR؟"
- يرد: "1" (Approve) / "2" (Reject) / "3" (Info)
- النظام يطبق الموافقة في `ApprovalStep`

### المسار:
- `/api/whatsapp/interactive` (Meta Cloud API webhook)

---

## 🤖 Telegram Bot

### المسار: `/api/telegram/webhook`

### Commands:
| الأمر | الإجراء |
|---|---|
| `مبيعات اليوم` | إحصاءات اليوم |
| `مبيعات الشهر` | إحصاءات الشهر |
| `مصروفات اليوم` | المصروفات |
| `رصيد الخزينة` | الرصيد الحالي |
| `المخزون الناقص` | المنتجات تحت الحد |
| `أعلى المنتجات` | Top 10 |
| `عدد المنتجات` | إحصاء |
| `عدد العملاء` | إحصاء |
| `عدد الموظفين` | إحصاء |
| `تقرير يومي` | تجميع شامل |
| `المستخدمين` | قائمة + activity |
| `مبيعات [اسم]` | لـ مندوب محدد |
| `مشتريات 10000` | إنشاء فاتورة شراء |
| `مصروف 500 إيجار` | إنشاء مصروف |

### Voice & Photo:
- **صورة فاتورة** → OCR + إنشاء فاتورة شراء
- **رسالة صوتية** → Speech-to-text → معالجة كأمر

### Daily Digest:
- يُرسل تلقائياً للـ admin chat_id
- يحتوي AI Audit Report

---

## 🎨 الـ Cost Tracking

### Per-Tenant AI Tokens:
```prisma
AITokensUsage {
    tenantId, feature, model
    inputTokens, outputTokens, cost
    requestedAt
}
```

### Aggregated في `/api/admin/llm-costs`:
- Cost per tenant
- Cost per feature
- Trends

---

## 🔮 Future AI Features

| الميزة | الوصف | الأولوية |
|---|---|---|
| **AI Customer Service** | بوت شامل يتحدث مع العملاء | 🟠 |
| **AI HR (recruitment)** | فرز السير الذاتية | 🟡 |
| **AI Marketing** | إنشاء حملات | 🟡 |
| **AI Drug Interactions** | للصيدلية | 🟠 |
| **AI Diagnosis Assistant** | للعيادة | 🟡 |
| **AI Document Generation** | عقود، رسائل | 🟠 |
| **AI Code Generation** | تخصيص النماذج | 🟢 |

---

## 🎯 Best Practices

1. ✅ **Privacy Filter** قبل إرسال البيانات لـ Gemini
2. ✅ **Audit Trail** لكل AI request
3. ✅ **Rate Limit (AI tier)** صارم
4. ✅ **Confidence Score** لكل AI suggestion
5. ✅ **Human in the Loop** للقرارات الحرجة
6. ✅ **Citations** للـ RAG answers
7. ✅ **Multi-model fallback** (Gemini → OpenAI لو فشل)
8. ❌ **لا تثق 100%** في AI للقرارات المالية
9. ❌ **لا ترسل بيانات حساسة** بدون تشفير
10. ✅ **Cost monitoring** لكل ميزة
