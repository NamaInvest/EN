const fs = require('fs');
const path = require('path');

const BASE = 'c:/Users/1/Desktop/alfa/src/app';
const results = [];

function getModuleName(filePath) {
  const rel = filePath.replace(/\\/g, '/').replace(BASE.replace(/\\/g, '/') + '/', '');
  if (rel.includes('sales')) return 'المبيعات (Sales)';
  if (rel.includes('purchase') || rel.includes('grn') || rel.includes('rfq') || rel.includes('requisition')) return 'المشتريات (Purchases)';
  if (rel.includes('products') || rel.includes('stock') || rel.includes('warehouses') || rel.includes('barcode') || rel.includes('batches') || rel.includes('inv/')) return 'المخزون (Inventory)';
  if (rel.includes('treasury') || rel.includes('expenses') || rel.includes('finance') || rel.includes('fng') || rel.includes('receipt-vouchers')) return 'المالية (Finance)';
  if (rel.includes('employees') || rel.includes('salaries') || rel.includes('attendance') || rel.includes('vacations') || rel.includes('shifts') || rel.includes('hr/')) return 'الموارد البشرية (HR)';
  if (rel.includes('settings') || rel.includes('company')) return 'الإعدادات (Settings)';
  if (rel.includes('customers') || rel.includes('crm') || rel.includes('loyalty') || rel.includes('coupons') || rel.includes('promotions') || rel.includes('gift-cards')) return 'العملاء والتسويق (CRM)';
  if (rel.includes('reports')) return 'التقارير (Reports)';
  if (rel.includes('pos') || rel.includes('restaurant-pos')) return 'نقطة البيع (POS)';
  if (rel.includes('manufacturing') || rel.includes('mrp') || rel.includes('recipes') || rel.includes('factory')) return 'التصنيع (Manufacturing)';
  if (rel.includes('enterprise')) return 'المؤسسات (Enterprise)';
  if (rel.includes('ice') || rel.includes('admin') || rel.includes('master')) return 'الإدارة (Admin)';
  if (rel.includes('login') || rel.includes('auto-login') || rel.includes('sign-') || rel.includes('sso') || rel.includes('auth')) return 'المصادقة (Auth)';
  if (rel.includes('dashboard')) return 'لوحة التحكم (Dashboard)';
  if (rel.includes('bookings') || rel.includes('maintenance') || rel.includes('installments')) return 'الخدمات (Services)';
  if (rel.includes('pharmacy') || rel.includes('retail') || rel.includes('restaurant')) return 'الصفحات التسويقية (Marketing)';
  if (rel.includes('rem/') || rel.includes('property')) return 'العقارات (Real Estate)';
  if (rel.includes('shl/')) return 'المدارس (Schools)';
  if (rel.includes('fleet')) return 'الأسطول (Fleet)';
  if (rel.includes('sys/') || rel.includes('whatsapp')) return 'النظام (System)';
  return 'عام (General)';
}

function getPageName(filePath) {
  const rel = filePath.replace(/\\/g, '/').replace(BASE.replace(/\\/g, '/') + '/', '');
  return rel.replace('/page.tsx', '').replace('(dashboard)/', '');
}

function extractInteractiveElements(content, pageName, module) {
  const elements = [];
  
  // Extract onClick handlers with button text
  const onClickRegex = /onClick\s*=\s*\{([^}]+)\}[^>]*>([^<]*)</g;
  let match;
  while ((match = onClickRegex.exec(content)) !== null) {
    const handler = match[1].trim();
    const label = match[2].trim();
    if (label && label.length > 0 && label.length < 80) {
      elements.push({ label, page: pageName, module, handler, type: guessType(handler, content) });
    }
  }
  
  // Extract button elements
  const btnRegex = /<button[^>]*(?:onClick\s*=\s*\{([^}]*)\})?[^>]*>([^<]*(?:<[^/][^>]*>[^<]*<\/[^>]*>)*[^<]*)<\/button>/gs;
  while ((match = btnRegex.exec(content)) !== null) {
    const handler = match[1]?.trim() || '';
    let label = match[2].replace(/<[^>]*>/g, '').trim();
    if (label && label.length > 1 && label.length < 80 && !elements.find(e => e.label === label && e.handler === handler)) {
      elements.push({ label, page: pageName, module, handler, type: guessType(handler, content) });
    }
  }
  
  // Extract Link components (navigation)
  const linkRegex = /<Link\s+href\s*=\s*["']([^"']+)["'][^>]*>([^<]*(?:<[^/][^>]*>[^<]*<\/[^>]*>)*[^<]*)<\/Link>/gs;
  while ((match = linkRegex.exec(content)) !== null) {
    let label = match[2].replace(/<[^>]*>/g, '').trim();
    const href = match[1];
    if (label && label.length > 1 && label.length < 80) {
      elements.push({ label, page: pageName, module, handler: `navigate("${href}")`, type: 'Navigation', action: `Navigate to ${href}` });
    }
  }
  
  // Extract named handler functions  
  const handlerDefs = {};
  const funcRegex = /(?:const|function)\s+(handle\w+|submit\w+|save\w+|delete\w+|open\w+|close\w+|add\w+|remove\w+|toggle\w+|fetch\w+|load\w+|export\w+|import\w+|print\w+|create\w+|update\w+|cancel\w+|confirm\w+|approve\w+|reject\w+)\s*=?\s*(?:async\s*)?\(?/g;
  while ((match = funcRegex.exec(content)) !== null) {
    handlerDefs[match[1]] = true;
  }
  
  // Extract fetch/API calls
  const apiCalls = {};
  const fetchRegex = /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g;
  while ((match = fetchRegex.exec(content)) !== null) {
    apiCalls[match[1]] = true;
  }
  
  // Enrich elements with API info
  for (const el of elements) {
    if (!el.action) {
      el.action = guessAction(el.handler, el.label, content);
    }
    // Find if handler calls an API
    if (el.handler && handlerDefs[el.handler.replace(/[()]/g, '')]) {
      // Check what API this handler calls
      const funcName = el.handler.replace(/[()]/g, '').replace(/^\(\)\s*=>\s*/, '');
      const funcBlock = extractFuncBody(content, funcName);
      if (funcBlock) {
        const apiMatch = funcBlock.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/);
        if (apiMatch) el.api = apiMatch[1];
        const methodMatch = funcBlock.match(/method:\s*['"`](POST|PUT|DELETE|PATCH)['"`]/i);
        if (methodMatch) el.method = methodMatch[1];
      }
    }
  }
  
  return elements;
}

function extractFuncBody(content, funcName) {
  const idx = content.indexOf(funcName);
  if (idx === -1) return null;
  let braces = 0;
  let start = -1;
  for (let i = idx; i < content.length && i < idx + 3000; i++) {
    if (content[i] === '{') { if (start === -1) start = i; braces++; }
    if (content[i] === '}') { braces--; if (braces === 0 && start !== -1) return content.slice(start, i+1); }
  }
  return null;
}

function guessType(handler, content) {
  if (!handler) return 'Client-side';
  const h = handler.toLowerCase();
  if (h.includes('fetch') || h.includes('api') || h.includes('submit') || h.includes('save') || h.includes('delete') || h.includes('create') || h.includes('update')) {
    return 'API Call';
  }
  if (h.includes('router') || h.includes('push') || h.includes('navigate') || h.includes('href') || h.includes('window.location')) {
    return 'Navigation';  
  }
  if (h.includes('setshow') || h.includes('setopen') || h.includes('setmodal') || h.includes('toggle') || h.includes('setis')) {
    return 'Client-side State Change';
  }
  if (h.includes('print')) return 'Client-side (Print)';
  return 'Client-side State Change';
}

function guessAction(handler, label, content) {
  const l = (label || '').toLowerCase();
  const h = (handler || '').toLowerCase();
  if (l.includes('حفظ') || l.includes('save') || h.includes('save')) return 'حفظ البيانات';
  if (l.includes('إضافة') || l.includes('أضف') || l.includes('جديد') || l.includes('add') || l.includes('new')) return 'فتح نافذة إضافة';
  if (l.includes('حذف') || l.includes('delete') || h.includes('delete')) return 'حذف عنصر';
  if (l.includes('تعديل') || l.includes('edit') || h.includes('edit')) return 'تعديل عنصر';
  if (l.includes('طباعة') || l.includes('print') || h.includes('print')) return 'طباعة';
  if (l.includes('بحث') || l.includes('search')) return 'بحث';
  if (l.includes('تصدير') || l.includes('export')) return 'تصدير بيانات';
  if (l.includes('إلغاء') || l.includes('cancel') || h.includes('close')) return 'إغلاق/إلغاء';
  if (l.includes('تأكيد') || l.includes('confirm') || l.includes('موافق')) return 'تأكيد عملية';
  if (l.includes('تسجيل') || l.includes('login')) return 'تسجيل دخول';
  if (h.includes('modal') || h.includes('open')) return 'فتح نافذة';
  if (h.includes('fetch') || h.includes('load')) return 'تحميل بيانات';
  return 'تفاعل';
}

// Scan all pages
function scanDir(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      scanDir(full);
    } else if (item.name === 'page.tsx') {
      const content = fs.readFileSync(full, 'utf8');
      const pageName = getPageName(full);
      const module = getModuleName(full);
      const elements = extractInteractiveElements(content, pageName, module);
      results.push(...elements);
    }
  }
}

// Also scan components
function scanComponents(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) continue;
    if (!item.name.endsWith('.tsx')) continue;
    const content = fs.readFileSync(full, 'utf8');
    const compName = item.name.replace('.tsx', '');
    const elements = extractInteractiveElements(content, `Component: ${compName}`, 'مكونات مشتركة (Shared)');
    results.push(...elements);
  }
}

scanDir(BASE);
scanComponents('c:/Users/1/Desktop/alfa/src/components');

// Deduplicate
const seen = new Set();
const unique = results.filter(r => {
  const key = `${r.label}|${r.page}|${r.handler}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// Group by module
const byModule = {};
for (const el of unique) {
  if (!byModule[el.module]) byModule[el.module] = [];
  byModule[el.module].push(el);
}

// Output as JSON
fs.writeFileSync('c:/Users/1/Desktop/alfa/audit_results.json', JSON.stringify(byModule, null, 2), 'utf8');

console.log(`\n✅ Audit complete!`);
console.log(`   Total elements: ${unique.length}`);
console.log(`   Modules: ${Object.keys(byModule).length}`);
for (const [mod, items] of Object.entries(byModule)) {
  console.log(`   - ${mod}: ${items.length} elements`);
}
