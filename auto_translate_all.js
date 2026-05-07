const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'app', '(dashboard)');
let modifiedCount = 0;

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (file === 'page.tsx') {
            processFile(fullPath);
        }
    }
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Check if it already has _t
    if (content.includes('_t(') && content.includes('import { _t }')) {
        return; // Already translated using server-t or client-t
    }

    const isClient = content.includes("'use client'") || content.includes('"use client"');

    // Add import if missing
    if (!content.includes('_t')) {
        if (isClient) {
            if (content.includes('useTranslation')) {
                content = content.replace(
                    /const\s+{\s*lang\s*(?:,\s*t)?\s*}\s*=\s*useTranslation\(\);/,
                    "const { lang } = useTranslation();\n    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;"
                );
            } else {
                // If it's a client component but doesn't have useTranslation
                content = content.replace(/(import React.*?;\n)/, "$1import { useTranslation } from '@/lib/i18n';\n");
                content = content.replace(/(export default function .*?\(.*?\) \{)/, "$1\n    const { lang } = useTranslation();\n    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;");
            }
        } else {
            // Server component
            if (!content.includes('@/lib/server-t')) {
                // Find last import
                const lastImportIdx = content.lastIndexOf('import ');
                if (lastImportIdx !== -1) {
                    const endOfLine = content.indexOf('\n', lastImportIdx);
                    content = content.slice(0, endOfLine + 1) + "import { _t } from '@/lib/server-t';\n" + content.slice(endOfLine + 1);
                } else {
                    content = "import { _t } from '@/lib/server-t';\n" + content;
                }
            }
        }
    }

    // Now parse and replace English strings
    const textRegex = />\s*([A-Za-z][a-zA-Z0-9\s\(\)&.,-]{2,})\s*</g;
    let match;
    let replaced = false;

    // We will need a way to mock the translation. We'll use the english text as Arabic for now, 
    // OR we can read from ar.json if available.
    const arDictStr = fs.readFileSync(path.join(__dirname, 'src', 'locales', 'ar.json'), 'utf8');
    const enDictStr = fs.readFileSync(path.join(__dirname, 'src', 'locales', 'en.json'), 'utf8');
    let arDict = {};
    let enDict = {};
    try {
        arDict = JSON.parse(arDictStr);
        enDict = JSON.parse(enDictStr);
    } catch(e) {}

    // Find english key by value
    function getArabicForEnglish(enText) {
        let key = null;
        for (const [k, v] of Object.entries(enDict)) {
            if (v.trim().toLowerCase() === enText.trim().toLowerCase()) {
                key = k; break;
            }
        }
        if (key && arDict[key]) return arDict[key];
        
        // Manual fallbacks for common unmapped words
        const map = {
            'Purchase Requisitions': 'طلبات الشراء',
            'Internal requests for goods and services.': 'الطلبات الداخلية للسلع والخدمات.',
            'View POs': 'عرض أوامر الشراء',
            'New Request': 'طلب جديد',
            'Pending Approvals': 'بانتظار الموافقة',
            'Approved (Ready for PO)': 'تمت الموافقة (جاهز لأمر الشراء)',
            'Search PRs or departments...': 'ابحث في الطلبات أو الأقسام...',
            'Req #': 'رقم الطلب',
            'Department': 'القسم',
            'Requested By': 'مقدم الطلب',
            'Date': 'التاريخ',
            'Status': 'الحالة',
            'Actions': 'إجراءات',
            'Unknown User': 'مستخدم غير معروف',
            'Convert to PO': 'تحويل لأمر شراء',
            'View': 'عرض',
            'No Purchase Requisitions': 'لا توجد طلبات شراء',
            'Create First Request': 'إنشاء أول طلب',
            'Vendor Portal & Sourcing': 'بوابة الموردين والمصادر',
            'Manage external vendor access, RFQ bidding, and supplier onboarding.': 'إدارة وصول الموردين الخارجيين، والمزايدة على طلبات عروض الأسعار، وتأهيل الموردين.',
            'Active Bids': 'العطاءات النشطة',
            'Bids submitted by vendors.': 'العطاءات المقدمة من الموردين.',
            'Open RFQs': 'طلبات عروض الأسعار المفتوحة',
            'RFQs currently open for bidding.': 'طلبات عروض الأسعار المفتوحة حالياً للمزايدة.',
            'Registered Vendors': 'الموردين المسجلين',
            'Active vendors with portal access.': 'الموردين النشطين ذوي صلاحية الدخول.',
            'Vendor Portal Initialized': 'تم تهيئة بوابة الموردين',
            'The sourcing schemas are ready. Invite vendors to start receiving bids.': 'مخططات التوريد جاهزة. قم بدعوة الموردين للبدء بتلقي العطاءات.'
        };
        if (map[enText.trim()]) return map[enText.trim()];
        
        return enText; // fallback to English if Arabic is unknown
    }

    content = content.replace(textRegex, (match, text) => {
        const trimmed = text.trim();
        // Ignore very short or mostly symbols
        if (trimmed.length < 3 || /^[^a-zA-Z]+$/.test(trimmed)) return match;
        // Ignore single numbers
        if (!isNaN(trimmed)) return match;

        replaced = true;
        const arText = getArabicForEnglish(trimmed).replace(/'/g, "\\'");
        const enText = trimmed.replace(/'/g, "\\'");
        
        return `>{_t('${arText}', '${enText}')}<`;
    });

    if (replaced && content !== originalContent) {
        fs.writeFileSync(filePath, content);
        modifiedCount++;
        console.log(`Translated: ${filePath}`);
    }
}

processDirectory(srcDir);
console.log(`Finished translating. Total files modified: ${modifiedCount}`);
