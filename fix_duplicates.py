import os
import re

dashboard_path = "src/app/(dashboard)"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    # Remove 'error' from 'const { success, info, error } = useToast();'
    content = content.replace("const { success, info, error } = useToast();", "const { success, info } = useToast();")
    
    # Also fix lang used before declaration in ai-cfo
    if "const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;" in content:
        # if lang is declared after this, move it
        if "const { t, lang } = useTranslation();" in content:
            # remove _t
            content = content.replace("const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;\n", "")
            content = content.replace("const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;", "")
            # insert after useTranslation
            content = content.replace("const { t, lang } = useTranslation();", "const { t, lang } = useTranslation();\n    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;")
            
        elif "const { lang } = useTranslation();" in content:
            # Make sure it's in correct order
            idx1 = content.find("const _t =")
            idx2 = content.find("const { lang }")
            if idx1 < idx2 and idx1 != -1 and idx2 != -1:
                content = content.replace("const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;\n", "")
                content = content.replace("const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;", "")
                content = content.replace("const { lang } = useTranslation();", "const { lang } = useTranslation();\n    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;")

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

c = 0
for root, dirs, files in os.walk(dashboard_path):
    for f in files:
        if f.endswith('.tsx'):
            if fix_file(os.path.join(root, f)):
                c += 1
print(f"Fixed {c} files.")
