/**
 * Prompt Registry
 * ──────────────────────────────────────────────────────────
 * Centralized system prompt management for all AI features.
 * Replaces hardcoded prompts scattered across the codebase.
 *
 * Features:
 * - Named prompt templates with variable substitution
 * - Version history
 * - A/B testing support (variants)
 * - Usage tracking
 */

import { logger } from '@/lib/logger';

const log = logger.child({ route: 'PromptRegistry' });

interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  version: number;
  variables: string[];
  category: string;
  metadata?: Record<string, unknown>;
}

interface PromptUsage {
  promptId: string;
  version: number;
  timestamp: Date;
  tokens?: number;
  latencyMs?: number;
}

// ── Registry Store ──
const registry = new Map<string, PromptTemplate>();
const usageLogs: PromptUsage[] = [];
const MAX_USAGE_LOGS = 5000;

// ── Built-in Prompts ──

const BUILTIN_PROMPTS: PromptTemplate[] = [
  {
    id: 'ai-cfo-system',
    name: 'المدير المالي الذكي',
    category: 'finance',
    version: 1,
    variables: ['companyName', 'language', 'dateRange'],
    template: `أنت المدير المالي الذكي لشركة {{companyName}}.
مهمتك تحليل البيانات المالية وتقديم تقارير دقيقة بالعربية.

القواعد:
- استخدم أرقام دقيقة من البيانات المتاحة
- قدم توصيات عملية مع أولويات واضحة
- استخدم جداول لعرض البيانات المالية
- اذكر المصدر عند الاستشهاد ببيانات
- الفترة الزمنية: {{dateRange}}
- اللغة: {{language}}`,
  },
  {
    id: 'ai-assistant-system',
    name: 'مساعد نما',
    category: 'general',
    version: 1,
    variables: ['modules', 'userRole'],
    template: `أنت مساعد نما الذكي — مساعد ERP ذكي يساعد المستخدمين في إدارة أعمالهم.

الوحدات المتاحة: {{modules}}
دور المستخدم: {{userRole}}

القواعد:
- أجب بالعربية دائماً
- كن مختصراً ودقيقاً
- إذا طُلب إجراء عملية، أكد مع المستخدم قبل التنفيذ
- لا تخترع بيانات — اعتمد فقط على البيانات المتاحة`,
  },
  {
    id: 'ocr-invoice',
    name: 'OCR فاتورة',
    category: 'ocr',
    version: 1,
    variables: ['documentType'],
    template: `استخرج بيانات {{documentType}} من الصورة المرفقة.

المطلوب استخراج:
- رقم الفاتورة
- التاريخ
- اسم المورد/العميل
- الأصناف (الاسم، الكمية، السعر)
- الإجمالي والضريبة

أعد النتيجة بصيغة JSON صالحة.`,
  },
  {
    id: 'product-description',
    name: 'وصف المنتج',
    category: 'content',
    version: 1,
    variables: ['productName', 'category', 'features'],
    template: `اكتب وصفاً احترافياً للمنتج التالي:

المنتج: {{productName}}
التصنيف: {{category}}
الميزات: {{features}}

اكتب وصفاً بـ 2-3 جمل يكون جذاباً ويحتوي على الكلمات المفتاحية المناسبة.`,
  },
  {
    id: 'report-summary',
    name: 'ملخص التقرير',
    category: 'reports',
    version: 1,
    variables: ['reportType', 'data'],
    template: `حلل البيانات التالية وقدم ملخصاً تنفيذياً:

نوع التقرير: {{reportType}}
البيانات: {{data}}

قدم:
1. النقاط الرئيسية (3-5 نقاط)
2. التوجه العام (إيجابي/سلبي/محايد)
3. توصية واحدة قابلة للتنفيذ`,
  },
  {
    id: 'chat-context',
    name: 'سياق المحادثة',
    category: 'chat',
    version: 1,
    variables: ['userName', 'conversationHistory'],
    template: `أنت مساعد ذكي في نظام نما ERP.

المستخدم: {{userName}}
المحادثة السابقة:
{{conversationHistory}}

أجب بشكل طبيعي ومفيد. استخدم العربية.`,
  },
];

// Initialize with built-in prompts
BUILTIN_PROMPTS.forEach(p => registry.set(p.id, p));

export const promptRegistry = {
  /** Get a prompt by ID and substitute variables */
  render(id: string, variables: Record<string, string> = {}): string {
    const prompt = registry.get(id);
    if (!prompt) throw new Error(`Prompt not found: ${id}`);

    let rendered = prompt.template;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    // Log usage
    usageLogs.push({ promptId: id, version: prompt.version, timestamp: new Date() });
    if (usageLogs.length > MAX_USAGE_LOGS) usageLogs.splice(0, usageLogs.length - MAX_USAGE_LOGS);

    return rendered;
  },

  /** Get raw prompt template */
  get(id: string): PromptTemplate | undefined {
    return registry.get(id);
  },

  /** Register or update a prompt */
  register(prompt: Omit<PromptTemplate, 'version'> & { version?: number }): void {
    const existing = registry.get(prompt.id);
    const version = (existing?.version || 0) + 1;
    registry.set(prompt.id, { ...prompt, version } as PromptTemplate);
    log.info(`Prompt registered: ${prompt.id} v${version}`);
  },

  /** List all prompts */
  list(): PromptTemplate[] {
    return [...registry.values()];
  },

  /** List by category */
  listByCategory(category: string): PromptTemplate[] {
    return [...registry.values()].filter(p => p.category === category);
  },

  /** Get usage stats */
  stats(): Record<string, number> {
    const counts: Record<string, number> = {};
    usageLogs.forEach(u => { counts[u.promptId] = (counts[u.promptId] || 0) + 1; });
    return counts;
  },
};
