import os
import re

dashboard_path = "src/app/(dashboard)"
output_file = "UI_AUDIT_REPORT.md"

def audit_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            lines = f.readlines()
        except:
            return None
            
    content = "".join(lines)
    
    # 1. Check Buttons
    button_matches = re.finditer(r'<button\b([^>]*?)>', content)
    total_buttons = 0
    buttons_with_onclick = 0
    
    for match in button_matches:
        total_buttons += 1
        attrs = match.group(1)
        if 'onClick=' in attrs:
            buttons_with_onclick += 1

    # 2. Check Localization
    has_use_translation = 'useTranslation' in content
    
    # Check for hardcoded Arabic (ignoring comments roughly)
    untranslated_arabic_lines = 0
    for line in lines:
        if '//' in line or '/*' in line or '*/' in line:
            continue
        # Find arabic characters
        if re.search(r'[\u0600-\u06FF]', line):
            # Check if it's wrapped in _t(
            if '_t(' not in line and 't(' not in line:
                untranslated_arabic_lines += 1

    return {
        'total_buttons': total_buttons,
        'buttons_with_onclick': buttons_with_onclick,
        'has_use_translation': has_use_translation,
        'untranslated_arabic_lines': untranslated_arabic_lines
    }

print("Starting deep UI audit...")

report = ["# 🛡️ التقرير الشامل لفحص واجهات النظام (UI Audit Report)\n"]
report.append("هذا التقرير يعرض حالة جميع الأقسام وفروع الأقسام في النظام للتأكد من ربط الأزرار والتعريب:\n")
report.append("| القسم / الملف (Module) | 🖱️ الأزرار | 🔄 الأزرار المفعلة | 🌐 التعريب (i18n) | ⚠️ نصوص غير معربة |")
report.append("|---|---|---|---|---|")

total_files = 0
files_with_issues = 0
total_all_buttons = 0
total_active_buttons = 0

for root, dirs, files in os.walk(dashboard_path):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            result = audit_file(filepath)
            
            if result and (result['total_buttons'] > 0 or result['untranslated_arabic_lines'] > 0):
                total_files += 1
                total_all_buttons += result['total_buttons']
                total_active_buttons += result['buttons_with_onclick']
                
                module_name = filepath.replace(dashboard_path + os.sep, "").replace('\\', '/')
                
                btn_status = f"{result['total_buttons']}"
                active_btn_status = f"{result['buttons_with_onclick']}"
                if result['buttons_with_onclick'] < result['total_buttons']:
                    active_btn_status = f"🔴 {result['buttons_with_onclick']} (نقص)"
                else:
                    active_btn_status = f"✅ {result['buttons_with_onclick']} (مكتمل)"
                    
                i18n_status = "✅ مدعوم" if result['has_use_translation'] else "❌ غير مدعوم"
                
                arabic_status = f"✅ 0"
                if result['untranslated_arabic_lines'] > 0:
                    arabic_status = f"🔴 {result['untranslated_arabic_lines']} سطر"
                    files_with_issues += 1
                    
                report.append(f"| `{module_name}` | {btn_status} | {active_btn_status} | {i18n_status} | {arabic_status} |")

report.append("\n## 📊 ملخص الفحص\n")
report.append(f"- **إجمالي الملفات المفحوصة ذات الصلة:** {total_files}")
report.append(f"- **إجمالي الأزرار في النظام:** {total_all_buttons}")
report.append(f"- **الأزرار التفاعلية (المربوطة بـ onClick):** {total_active_buttons}")
percentage = (total_active_buttons / total_all_buttons * 100) if total_all_buttons > 0 else 100
report.append(f"- **نسبة التفاعل:** %{percentage:.1f}")

with open(output_file, 'w', encoding='utf-8') as f:
    f.write("\n".join(report))

print(f"Audit complete. Report saved to {output_file}")
