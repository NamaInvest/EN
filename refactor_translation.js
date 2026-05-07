const fs = require('fs');

const pages = [
  { f: 'src/app/(dashboard)/admin/knowledge/page.tsx', find: 'إدارة قاعدة المعرفة (VectorMine RAG)', key: 'ai.knowledge_title' },
  { f: 'src/app/(dashboard)/admin/llm-costs/page.tsx', find: 'مراقبة استهلاك الذكاء الاصطناعي (AI Observability)', key: 'ai.llm_costs_title' },
  { f: 'src/app/(dashboard)/admin/prompts/page.tsx', find: 'إدارة الـ Prompts (Prompt Engineering)', key: 'ai.prompts_title' },
  { f: 'src/app/(dashboard)/ap/capture/page.tsx', find: 'صندوق وارد الفواتير (AP Invoice Capture)', key: 'ap.capture_title' },
  { f: 'src/app/(dashboard)/finance/budget-planning/page.tsx', find: 'التخطيط والميزانية (xP&A)', key: 'finance.budget_title' },
  { f: 'src/app/(dashboard)/sales/atp-simulator/page.tsx', find: 'محاكي وعود التسليم (ATP Simulator)', key: 'sales.atp_title' },
  { f: 'src/app/(dashboard)/shopfloor/page.tsx', find: 'محطة التصنيع (Shop Floor Terminal)', key: 'mfg.shopfloor_title' },
  { f: 'src/app/(dashboard)/treasury/cash-position/page.tsx', find: 'مركز النقد (Cash Position)', key: 'treasury.cash_title' },
  { f: 'src/app/(dashboard)/treasury/liquidity/page.tsx', find: 'التنبؤ بالسيولة 13-Week Forecast', key: 'treasury.liquidity_title' }
];

pages.forEach(p => {
  let c = fs.readFileSync(p.f, 'utf8');
  
  if (!c.includes('useTranslation')) {
    // Add import
    c = c.replace(/(import.*?\n)/, `$1import { useTranslation } from '@/lib/i18n';\n`);
    // Add hook
    c = c.replace(/(export default function [a-zA-Z]+\(\)\s*{)/, `$1\n  const { t } = useTranslation();\n`);
  }
  
  // Replace string
  c = c.replace(p.find, `{t('${p.key}')}`);
  
  fs.writeFileSync(p.f, c);
  console.log('Fixed', p.f);
});
