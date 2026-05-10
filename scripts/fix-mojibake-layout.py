#!/usr/bin/env python3
"""
Fix mojibake Arabic text in layout.tsx metadata + migrate console.log to logger
in high-traffic API route files.
"""
import re, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def fix_file(path, replacements):
    full = os.path.join(ROOT, path)
    if not os.path.exists(full):
        print(f"  SKIP (not found): {path}")
        return
    with open(full, 'r', encoding='utf-8') as f:
        content = f.read()
    changed = 0
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
            changed += 1
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✅ {path} ({changed} replacements)")

# ── 1. layout.tsx metadata mojibake ─────────────────────────────────────────
fix_file('src/app/layout.tsx', [
    ('ظ†ظ…ط§ ط§ظ†ظپط³طھ (Nama Invest) - ط£ظپط¶ظ„ ظ†ط¸ط§ظ… ERP ظˆظ†ظ‚ط§ط· ط¨ظٹط¹ ظپظٹ ط§ظ„ط³ط¹ظˆط¯ظٹط©',
     'نما انفست (Nama Invest) — أفضل نظام ERP ونقاط بيع في المملكة العربية السعودية'),
    ('ط£ظپط¶ظ„ ظ†ط¸ط§ظ… ظ…ط­ط§ط³ط¨ظٹ ط³ط­ط§ط¨ظٹ ظˆظ†ظ‚ط§ط· ط¨ظٹط¹ (POS) ظ…طھظˆط§ظپظ‚ ظ…ط¹ ظ‡ظٹط¦ط© ط§ظ„ط²ظƒط§ط© ظˆط§ظ„ط¶ط±ظٹط¨ط© ظˆط§ظ„ط¬ظ…ط§ط±ظƒ (ط§ظ„ظ…ط±ط­ظ„ط© ط§ظ„ط«ط§ظ†ظٹط©). ظٹط´ظ…ظ„ 104 ظˆط­ط¯ط© ط¨ط±ظ…ط¬ظٹط©طŒ ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط®ط²ظˆظ†طŒ ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©طŒ ظˆط§ظ„ظ…ط¨ظٹط¹ط§طھ.',
     'أفضل نظام محاسبي سحابي ونقاط بيع (POS) متوافق مع هيئة الزكاة والضريبة والجمارك (المرحلة الثانية). يشمل 104 وحدة برمجية، إدارة المخزون، الموارد البشرية، والمبيعات.'),
    ('"ظ†ط¸ط§ظ… ظ…ط­ط§ط³ط¨ظٹ"', '"نظام محاسبي"'),
    ('"ظ†ظ‚ط§ط· ط¨ظٹط¹"', '"نقاط بيع"'),
    ('"ظƒط§ط´ظٹط±"', '"كاشير"'),
    ('"ط§ظ„ظپط§طھظˆط±ط© ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹط©"', '"الفاتورة الإلكترونية"'),
    ('"طھطµط±ظٹط­ ظ‡ظٹط¦ط© ط§ظ„ط²ظƒط§ط©"', '"تصريح هيئة الزكاة"'),
    ('"ERP ط³ط¹ظˆط¯ظٹ"', '"ERP سعودي"'),
    ('ظ†ظ…ط§ ط§ظ†ظپط³طھ - ط£ظ‚ظˆظ‰ ظ†ط¸ط§ظ… ERP ظˆظ†ظ‚ط§ط· ط¨ظٹط¹ \u2013 104 ظˆط­ط¯ط© ط¨ط±ظ…ط¬ظٹط©',
     'نما انفست — أقوى نظام ERP ونقاط بيع — 104 وحدة برمجية'),
    ('ظ†ط¸ط§ظ… ظ…طھظˆط§ظپظ‚ ظ…ط¹ ط§ظ„ظ…ط±ط­ظ„ط© ط§ظ„ط«ط§ظ†ظٹط© ظ„ظ‡ظٹط¦ط© ط§ظ„ط²ظƒط§ط© ظˆط§ظ„ط¯ط®ظ„طŒ ط£طھظ…طھط© ظƒط§ظ…ظ„ط© ظ„ظ„ظ…ط®ط²ظˆظ† ظˆط§ظ„ظ…ط­ط§ط³ط¨ط©.',
     'نظام متوافق مع المرحلة الثانية لهيئة الزكاة والدخل، أتمتة كاملة للمخزون والمحاسبة.'),
    ('ظ†ط¸ط§ظ… طھط®ط·ظٹط· ظ…ظˆط§ط±ط¯ ط§ظ„ظ…ط¤ط³ط³ط§طھ ط§ظ„ط¹ط§ظ„ظ…ظٹ (Global ERP) ظˆظ†ظ‚ط§ط·',
     'نظام تخطيط موارد المؤسسات العالمي (Global ERP) ونقاط'),
    ('طھط¬ط±ط¨ط© ظ…ط¬ط§', 'تجربة مجا'),
    ('"ط³ط¹ط± ط§ظ„ط§ط´طھط±ط§ظƒ"', '"سعر الاشتراك"'),
])

# ── 2. Bulk console.log → log.xxx in key route files ─────────────────────────
LOGGER_IMPORT = "import { logger } from '@/lib/logger';\n"

def migrate_console_in_route(rel_path, service_name, replacements):
    full = os.path.join(ROOT, rel_path)
    if not os.path.exists(full):
        print(f"  SKIP: {rel_path}")
        return
    with open(full, 'r', encoding='utf-8') as f:
        content = f.read()
    if LOGGER_IMPORT not in content:
        # inject after last import block
        content = content.replace(
            "import { z } from 'zod';",
            f"import {{ z }} from 'zod';\n{LOGGER_IMPORT}\nconst log = logger.child({{ route: '{service_name}' }});",
            1
        )
        if LOGGER_IMPORT not in content:
            # fallback: prepend
            content = f"{LOGGER_IMPORT}\nconst log = logger.child({{ route: '{service_name}' }});\n\n" + content
    changed = 0
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
            changed += 1
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✅ {rel_path} ({changed} console replacements)")

# purchases
migrate_console_in_route('src/app/api/purchases/route.ts', 'purchases', [
    ("console.error('Purchases GET error:", "log.error('Purchases GET error',"),
    ("console.error('Purchases POST error:", "log.error('Purchases POST error',"),
    ("console.error('Purchases PUT error:", "log.error('Purchases PUT error',"),
    ("console.error('Purchases DELETE error:", "log.error('Purchases DELETE error',"),
    ("console.log('Purchase", "log.debug('Purchase"),
    ("console.warn('Purchase", "log.warn('Purchase"),
])

# branches
migrate_console_in_route('src/app/api/branches/route.ts', 'branches', [
    ("console.error(", "log.error("),
    ("console.log(", "log.info("),
    ("console.warn(", "log.warn("),
])

# users
migrate_console_in_route('src/app/api/users/route.ts', 'users', [
    ("console.error(", "log.error("),
    ("console.log(", "log.info("),
    ("console.warn(", "log.warn("),
])

# attendance/face-id
migrate_console_in_route('src/app/api/attendance/face-id/route.ts', 'attendance/face-id', [
    ("console.error(", "log.error("),
    ("console.log(", "log.info("),
    ("console.warn(", "log.warn("),
])

# webhooks/zid
migrate_console_in_route('src/app/api/webhooks/zid/route.ts', 'webhooks/zid', [
    ("console.error(", "log.error("),
    ("console.log(", "log.info("),
    ("console.warn(", "log.warn("),
])

# webhooks/salla
migrate_console_in_route('src/app/api/webhooks/salla/route.ts', 'webhooks/salla', [
    ("console.error(", "log.error("),
    ("console.log(", "log.info("),
    ("console.warn(", "log.warn("),
])

# crm/whatsapp/webhook
migrate_console_in_route('src/app/api/crm/whatsapp/webhook/route.ts', 'whatsapp/webhook', [
    ("console.error(", "log.error("),
    ("console.log(", "log.info("),
    ("console.warn(", "log.warn("),
])

# whatsapp/interactive
migrate_console_in_route('src/app/api/whatsapp/interactive/route.ts', 'whatsapp/interactive', [
    ("console.error(", "log.error("),
    ("console.log(", "log.info("),
    ("console.warn(", "log.warn("),
])

# auth/sso-redirect
migrate_console_in_route('src/app/api/auth/sso-redirect/route.ts', 'auth/sso-redirect', [
    ("console.error(", "log.error("),
    ("console.log(", "log.info("),
    ("console.warn(", "log.warn("),
])

print("\n✅ All fixes applied.")
