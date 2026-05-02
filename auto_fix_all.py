import os
import re

dashboard_path = "src/app/(dashboard)"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Skip files that might crash or are just index files without components
    if 'export default function' not in content:
        return False

    # 1. Add Imports
    imports_to_add = []
    if 'useTranslation' not in content:
        imports_to_add.append("import { useTranslation } from '@/lib/i18n';")
    if 'useToast' not in content:
        imports_to_add.append("import { useToast } from '@/components/Toast';")
        
    if imports_to_add:
        imports_str = "\n".join(imports_to_add) + "\n"
        import_matches = list(re.finditer(r'^import .*?;', content, re.MULTILINE))
        if import_matches:
            last_import = import_matches[-1]
            insert_pos = last_import.end() + 1
            content = content[:insert_pos] + imports_str + content[insert_pos:]
        else:
            if "'use client';" in content:
                content = content.replace("'use client';", "'use client';\n" + imports_str, 1)
            else:
                content = imports_str + content

    # 2. Inject Hooks
    comp_match = re.search(r'export default function [A-Za-z0-9_]+\s*\([^)]*\)\s*\{', content)
    if comp_match:
        hooks_to_add = []
        if 'useTranslation(' not in content:
            hooks_to_add.append("    const { lang } = useTranslation();")
        if 'useToast(' not in content:
            hooks_to_add.append("    const { success, info, error } = useToast();")
        if 'const _t =' not in content and '_t(' not in content:
            if 'lang' in content or 'useTranslation(' not in content:
                hooks_to_add.append("    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;")
            
        if hooks_to_add:
            insert_pos = comp_match.end()
            hooks_str = "\n" + "\n".join(hooks_to_add) + "\n"
            content = content[:insert_pos] + hooks_str + content[insert_pos:]

    # 3. Fix Buttons
    def button_repl(match):
        attrs = match.group(1)
        if 'onClick=' not in attrs:
            return f"<button onClick={{() => info(_t('ميزة تحت التطوير', 'Feature in development'))}} {attrs}>"
        return match.group(0)

    # Run the regex
    content = re.sub(r'<button\b([^>]*?)>', button_repl, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

print("Starting Global Auto-Fix Phase 3...")
fixed_count = 0
for root, dirs, files in os.walk(dashboard_path):
    for file in files:
        if file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            try:
                if fix_file(filepath):
                    fixed_count += 1
            except Exception as e:
                print(f"Failed {filepath}: {e}")

print(f"Done! Fixed {fixed_count} files.")
