import os
import re

files_with_alerts = [
r"src\app\(dashboard)\accounting\banks\page.tsx",
r"src\app\(dashboard)\accounting\banks\[id]\page.tsx",
r"src\app\(dashboard)\accounting\customer-statements\bulk\page.tsx",
r"src\app\(dashboard)\accounting\customer-statements\templates\page.tsx",
r"src\app\(dashboard)\accounting\lc\page.tsx",
r"src\app\(dashboard)\accounting\payment-runs\create\page.tsx",
r"src\app\(dashboard)\admin\bi-builder\page.tsx",
r"src\app\(dashboard)\affiliates\page.tsx",
r"src\app\(dashboard)\approvals\inbox\page.tsx",
r"src\app\(dashboard)\approvals\page.tsx",
r"src\app\(dashboard)\assets\page.tsx",
r"src\app\(dashboard)\batches\page.tsx",
r"src\app\(dashboard)\bookings\page.tsx",
r"src\app\(dashboard)\clinic\appointments\page.tsx",
r"src\app\(dashboard)\clinic\erx\page.tsx",
r"src\app\(dashboard)\clinic\lab\page.tsx",
r"src\app\(dashboard)\coupons\page.tsx",
r"src\app\(dashboard)\customers\page.tsx",
r"src\app\(dashboard)\customers\[id]\page.tsx",
r"src\app\(dashboard)\enterprise\legal\page.tsx",
r"src\app\(dashboard)\enterprise\mrp\page.tsx",
r"src\app\(dashboard)\enterprise\mrp\recipes\page.tsx",
r"src\app\(dashboard)\enterprise\projects\page.tsx",
r"src\app\(dashboard)\enterprise\projects\[id]\page.tsx",
r"src\app\(dashboard)\enterprise\wms\page.tsx",
r"src\app\(dashboard)\fixed-assets\page.tsx",
r"src\app\(dashboard)\fng\petty-cash-funds\page.tsx",
r"src\app\(dashboard)\fsm\tasks\page.tsx",
r"src\app\(dashboard)\hr\evaluations\page.tsx",
r"src\app\(dashboard)\hr\jobs\page.tsx",
r"src\app\(dashboard)\hr\payroll\config\page.tsx",
r"src\app\(dashboard)\hr\payroll\run\page.tsx",
r"src\app\(dashboard)\hr\performance\page.tsx",
r"src\app\(dashboard)\hr\training\page.tsx",
r"src\app\(dashboard)\inventory\abc-analysis\page.tsx",
r"src\app\(dashboard)\inventory\picking\[id]\page.tsx",
r"src\app\(dashboard)\inventory\stocktake\cycle\page.tsx",
r"src\app\(dashboard)\loyalty\page.tsx",
r"src\app\(dashboard)\manufacturing\boms\[id]\versions\page.tsx",
r"src\app\(dashboard)\manufacturing\capacity\page.tsx",
r"src\app\(dashboard)\manufacturing\routing\page.tsx",
r"src\app\(dashboard)\manufacturing\scrap\page.tsx",
r"src\app\(dashboard)\payroll\wps\page.tsx",
r"src\app\(dashboard)\price-quotes\page.tsx",
r"src\app\(dashboard)\procurement\contracts\page.tsx",
r"src\app\(dashboard)\procurement\rfq\[id]\page.tsx",
r"src\app\(dashboard)\procurement\vendors\scorecard\page.tsx",
r"src\app\(dashboard)\purchase-orders\[id]\landed-costs\page.tsx",
r"src\app\(dashboard)\rem\installments\page.tsx",
r"src\app\(dashboard)\rem\leases\page.tsx",
r"src\app\(dashboard)\settings\page.tsx",
r"src\app\(dashboard)\settings\permissions\fields\page.tsx",
r"src\app\(dashboard)\settings\security\SecuritySettingsClient.tsx",
r"src\app\(dashboard)\settings\workflow-builder\page.tsx"
]

def replace_alerts_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return
        
    if 'alert(' not in content:
        return

    # Add import if missing
    if "import { useToast }" not in content and "import {useToast}" not in content:
        # find last import
        import_match = list(re.finditer(r'^import .*?;$', content, re.MULTILINE))
        if import_match:
            last_import = import_match[-1]
            content = content[:last_import.end()] + "\nimport { useToast } from '@/components/Toast';" + content[last_import.end():]
        else:
            content = "import { useToast } from '@/components/Toast';\n" + content
            
    # Add destructuring if missing
    if "toastSuccess" not in content and "toastError" not in content and "toastWarning" not in content:
        # find the main function or default export
        func_match = re.search(r'export default function [a-zA-Z0-9_]+\s*\([^)]*\)\s*\{', content)
        if func_match:
            content = content[:func_match.end()] + "\n  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();" + content[func_match.end():]

    def alert_replacer(match):
        arg = match.group(1)
        # determine success/error based on heuristic
        success_words = ['نجاح', 'تم', 'success', '✅']
        error_words = ['خطأ', 'فشل', 'error', '❌', 'تنبيه']
        
        is_success = any(w in arg for w in success_words)
        is_error = any(w in arg for w in error_words)
        
        if is_success and not is_error:
            return f'toastSuccess({arg})'
        elif is_error:
            return f'toastError({arg})'
        else:
            # fallback
            return f'toastWarning({arg})'

    content = re.sub(r'alert\((.*?)\)', alert_replacer, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for f in files_with_alerts:
    replace_alerts_in_file(f)
