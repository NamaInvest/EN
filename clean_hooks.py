import os
import re

dashboard_path = "src/app/(dashboard)"

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Check if info is used other than in the declaration
    # declaration: const { success, info } = useToast();
    info_count = content.count("info")
    info_decl_count = content.count("const { success, info } = useToast();")
    if info_decl_count > 0 and info_count == info_decl_count:
        # Unused! Remove it.
        content = content.replace("    const { success, info } = useToast();\n", "")
        content = content.replace("    const { success, info } = useToast();", "")

    # Check if _t is used other than in the declaration
    t_count = content.count("_t(")
    t_decl_count = content.count("const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;")
    if t_decl_count > 0 and t_count == t_decl_count:
        # Unused! Remove it.
        content = content.replace("    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;\n", "")
        content = content.replace("    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;", "")

    # Check if lang is used other than in the declaration
    lang_count = len(re.findall(r'\blang\b', content))
    lang_decl_count = content.count("const { lang } = useTranslation();")
    if lang_decl_count > 0 and lang_count == lang_decl_count:
        # Unused! Remove it.
        content = content.replace("    const { lang } = useTranslation();\n", "")
        content = content.replace("    const { lang } = useTranslation();", "")

    # Now, if a file STILL has useToast() or useTranslation() being called, it MUST be a client component.
    # If it lacks 'use client', add it!
    # EXCEPT layout.tsx which should NEVER be a client component!
    if not filepath.endswith("layout.tsx"):
        if "useToast(" in content or "useTranslation(" in content:
            if "'use client'" not in content and '"use client"' not in content:
                # Add 'use client'; at the very top
                content = "'use client';\n\n" + content

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

c = 0
for root, dirs, files in os.walk(dashboard_path):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            if clean_file(os.path.join(root, f)):
                c += 1

print(f"Cleaned {c} files.")
