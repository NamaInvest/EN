/**
 * AI-driven natural-language explanation for anomaly findings.
 * Wraps llm-client and produces Arabic explanation + suggested action.
 */

import type { AnomalyFinding } from './anomaly-detection-engine';

export interface AnomalyExplanation {
  detector: string;
  whyItsSuspicious: string;
  suggestedAction: 'review' | 'reverse' | 'accept' | 'escalate' | 'investigate';
  reasoning: string;
  similarCases?: string[];
}

const STATIC_EXPLANATIONS: Record<string, AnomalyExplanation> = {
  BENFORD_LAW: {
    detector: 'BENFORD_LAW',
    whyItsSuspicious:
      'قانون بنفورد ينص على أن الرقم الأول في الأرقام المالية الطبيعية يتوزع بنمط ثابت (1 يظهر 30%، 9 يظهر 5%). انحراف كبير عن هذا التوزيع قد يشير إلى أرقام مفبركة.',
    suggestedAction: 'investigate',
    reasoning: 'هذا الكشف لا يثبت تلاعباً بل يثير سؤالاً. ابحث في الفئة الأكثر انحرافاً.',
    similarCases: ['قضية WorldCom 2002', 'حالات تلاعب فواتير شائعة في القطاع الإنشائي'],
  },
  DUPLICATE_VENDOR_INVOICE: {
    detector: 'DUPLICATE_VENDOR_INVOICE',
    whyItsSuspicious:
      'فاتورتان من نفس المورد بمبلغ وتاريخ متقاربين هما نمط كلاسيكي لـ double-payment fraud أو duplicate billing من المورد.',
    suggestedAction: 'review',
    reasoning: 'تحقق من PO و GRN لكل فاتورة. إذا كانت لنفس الـ PO/GRN — احتمال احتيال أو خطأ.',
  },
  ROUND_NUMBER_BIAS: {
    detector: 'ROUND_NUMBER_BIAS',
    whyItsSuspicious:
      'المعاملات الحقيقية نادراً ما تكون أرقاماً مستديرة (1000، 5000، 25000...). انحياز للأرقام المستديرة يدل على fabricated entries.',
    suggestedAction: 'investigate',
    reasoning: 'احصر القيود على فترة 30 يوم وراجع المستندات المؤيدة.',
  },
  AFTER_HOURS_POSTING: {
    detector: 'AFTER_HOURS_POSTING',
    whyItsSuspicious:
      'القيود اليدوية في ساعات متأخرة أو في عطلة الأسبوع تتعارض مع نمط العمل العادي. كثيراً ما تستخدم لتجنب المراقبة.',
    suggestedAction: 'review',
    reasoning: 'تحقق من هوية المستخدم، الـ IP، والمستندات المؤيدة. اطلب تبريراً.',
  },
  SOD_VIOLATION: {
    detector: 'SOD_VIOLATION',
    whyItsSuspicious:
      'فصل المهام (Segregation of Duties) مبدأ رقابي رئيسي. إنشاء وإقفال قيد بنفس المستخدم يلغي طبقة المراجعة.',
    suggestedAction: 'escalate',
    reasoning: 'هذا خرق مباشر. حدّث صلاحيات النظام لمنع التكرار، وراجع كل القيود التي مرت بهذا النمط.',
    similarCases: ['Société Générale (Kerviel 2008) — تجاوز SoD أنتج خسارة 4.9 مليار يورو'],
  },
  MANUAL_TO_CONTROL_ACCOUNT: {
    detector: 'MANUAL_TO_CONTROL_ACCOUNT',
    whyItsSuspicious:
      'الحسابات الرقابية (RECEIVABLES, PAYABLES, INVENTORY) تُحدّث آلياً عبر sub-ledgers. القيد اليدوي عليها يكسر التطابق بين الـ GL و الـ sub-ledger.',
    suggestedAction: 'escalate',
    reasoning: 'اعكس القيد فوراً واستخدم الأداة المناسبة (sales/purchase/payment). راجع لماذا سمح النظام بذلك.',
  },
  VENDOR_VELOCITY_SPIKE: {
    detector: 'VENDOR_VELOCITY_SPIKE',
    whyItsSuspicious:
      'زيادة مفاجئة في عدد فواتير مورد قد تشير إلى: علاقة فاسدة مع المورد، تجاوز ميزانية، أو احتيال shell-vendor.',
    suggestedAction: 'review',
    reasoning: 'تحقق من PO/GRN، ابحث عن دلائل جودة، وقارن الأسعار بالسوق.',
  },
  GHOST_EMPLOYEE: {
    detector: 'GHOST_EMPLOYEE',
    whyItsSuspicious:
      'موظف يتلقى راتب لكن لا يحضر للعمل — احتيال payroll كلاسيكي قد يكون: موظف زائف، أو موظف غادر لكنه لا يزال في النظام.',
    suggestedAction: 'investigate',
    reasoning: 'تحقق من بصمة الحضور، الـ HR records، وصورة الموظف. اتصل به مباشرة.',
  },
  VENDOR_BANK_CHANGE: {
    detector: 'VENDOR_BANK_CHANGE',
    whyItsSuspicious:
      'تغيير IBAN مورد مرتين أو أكثر خلال فترة قصيرة هو نمط هجوم Business Email Compromise (BEC) شائع.',
    suggestedAction: 'escalate',
    reasoning: 'جمّد الدفع للمورد. تواصل معه عبر قناة موثقة (هاتف معروف، لا إيميل). تحقق من المتغيرات.',
    similarCases: ['Facebook+Google تم تحويل 100 مليون دولار عبر BEC في 2017'],
  },
  NEGATIVE_INVENTORY_MONTH_END: {
    detector: 'NEGATIVE_INVENTORY_MONTH_END',
    whyItsSuspicious:
      'المخزون السالب يدل على: إصدار قبل استلام (خلل تسلسل)، خطأ ترحيل، أو سرقة مغطاة.',
    suggestedAction: 'investigate',
    reasoning: 'راجع stock movements للمنتج. تأكد من تطابق الـ GL مع الـ sub-ledger.',
  },
};

/**
 * Build a natural-language explanation for a finding.
 * In production, replace static map with LLM call (llm-client.ts) for context-rich responses.
 */
export function explainAnomaly(finding: AnomalyFinding): AnomalyExplanation {
  const base = STATIC_EXPLANATIONS[finding.detector];
  if (!base) {
    return {
      detector: finding.detector,
      whyItsSuspicious: 'نمط غير اعتيادي يستحق المراجعة.',
      suggestedAction: 'review',
      reasoning: 'لا توجد قاعدة مفصلة لهذا النوع — يتطلب تحليل بشري.',
    };
  }
  return base;
}

/**
 * Async variant that calls LLM for richer explanations.
 * Use when llm-client is available and budget allows.
 */
export async function explainAnomalyWithLLM(
  finding: AnomalyFinding,
  llm: { generate: (p: string) => Promise<string> }
): Promise<AnomalyExplanation> {
  const prompt = `
أنت مدقق مالي معتمد. تم اكتشاف نمط مشبوه في نظام المحاسبة.

النوع: ${finding.detector}
الوصف: ${finding.description}
الدرجة: ${finding.score}/100
الشدة: ${finding.severity}
الدليل: ${JSON.stringify(finding.evidence)}

اشرح بالعربية:
1. لماذا هذا النمط مشبوه؟
2. ما الإجراء الموصى به؟ (review | reverse | accept | escalate | investigate)
3. ما هو السبب الجذري المحتمل؟

أعد الإجابة JSON بالشكل: {"whyItsSuspicious": "...", "suggestedAction": "...", "reasoning": "..."}
`.trim();
  try {
    const response = await llm.generate(prompt);
    const parsed = JSON.parse(response) as Partial<AnomalyExplanation>;
    return {
      detector: finding.detector,
      whyItsSuspicious: parsed.whyItsSuspicious ?? '',
      suggestedAction: (parsed.suggestedAction as AnomalyExplanation['suggestedAction']) ?? 'review',
      reasoning: parsed.reasoning ?? '',
    };
  } catch {
    return explainAnomaly(finding);
  }
}
