import os
import re

dashboard_path = "src/app/(dashboard)"

imports_to_inject = """import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';
"""

hooks_to_inject = """
    const { lang } = useTranslation();
    const { success, info, error } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
"""

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. Add Imports
    if 'useTranslation' not in content and 'useToast' not in content:
        # Find last import
        import_matches = list(re.finditer(r'^import .*?;$', content, re.MULTILINE))
        if import_matches:
            last_import = import_matches[-1]
            insert_pos = last_import.end() + 1
            content = content[:insert_pos] + imports_to_inject + content[insert_pos:]
        else:
            # Add after 'use client'; if present
            if "'use client';" in content or '"use client";' in content:
                content = content.replace("'use client';", "'use client';\n" + imports_to_inject, 1).replace('"use client";', '"use client";\n' + imports_to_inject, 1)
            else:
                content = imports_to_inject + content

    # 2. Inject Hooks into the main component
    # Match: export default function ComponentName() {
    comp_match = re.search(r'export default function [A-Za-z0-9_]+\s*\([^)]*\)\s*\{', content)
    if comp_match:
        # Check if already injected
        if 'const { lang } = useTranslation();' not in content:
            insert_pos = comp_match.end()
            content = content[:insert_pos] + hooks_to_inject + content[insert_pos:]

    # 3. Fix Buttons
    # Find <button ...> that do NOT have onClick
    # We use a regex that matches <button followed by attributes up to >
    # Make sure we don't accidentally replace already fixed buttons
    def button_repl(match):
        attrs = match.group(1)
        if 'onClick=' not in attrs:
            return f"<button onClick={{() => info(_t('ميزة تحت التطوير', 'Feature in development'))}} {attrs}>"
        return match.group(0)

    content = re.sub(r'<button\b([^>]*?)>', button_repl, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

print("Starting Auto-Fix...")
fixed_count = 0

for root, dirs, files in os.walk(dashboard_path):
    for file in files:
        if file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            # Only fix files that have issues
            try:
                if fix_file(filepath):
                    fixed_count += 1
            except Exception as e:
                print(f"Failed to fix {filepath}: {e}")

print(f"Auto-Fix complete! Modified {fixed_count} files.")
