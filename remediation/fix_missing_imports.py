"""
fix_missing_imports.py
Restore missing imports for getUserFromRequest/hasPermission
in files where the import was accidentally removed
"""
import os, re, glob

base = r"d:\namasoft9-3-main\src\app\api"
files = glob.glob(os.path.join(base, "**", "route.ts"), recursive=True)

AUTH_IMPORT = "import { getUserFromRequest, hasPermission } from '@/lib/auth';"
GET_USER_IMPORT = "import { getUserFromRequest } from '@/lib/auth';"

fixed = 0
for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
    except:
        continue
    
    uses_getUserFromRequest = 'getUserFromRequest' in content
    uses_hasPermission = 'hasPermission' in content
    has_auth_import = "from '@/lib/auth'" in content and 'getUserFromRequest' in content and content.index("getUserFromRequest") <= content.index("getUserFromRequest", content.index("getUserFromRequest") + 1) if content.count("getUserFromRequest") > 1 else False
    
    has_import = bool(re.search(r"^import\s*\{[^}]*getUserFromRequest", content, re.MULTILINE))
    
    if not (uses_getUserFromRequest or uses_hasPermission):
        continue
    if has_import:
        continue
    
    # Determine what import to add
    if uses_getUserFromRequest and uses_hasPermission:
        import_line = AUTH_IMPORT
    elif uses_getUserFromRequest:
        import_line = GET_USER_IMPORT
    else:
        import_line = AUTH_IMPORT
    
    # Add import after the first existing import or at top
    lines = content.split('\n')
    insert_pos = 0
    for i, line in enumerate(lines):
        if line.strip().startswith('import ') or line.strip().startswith("from "):
            insert_pos = i + 1
        elif line.strip() == '' and insert_pos > 0:
            break
    
    if insert_pos == 0:
        # No imports found, add at top
        lines.insert(0, import_line)
    else:
        lines.insert(insert_pos, import_line)
    
    new_content = '\n'.join(lines)
    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(new_content)
    print(f"FIXED (added import): {os.path.relpath(f, r'd:\namasoft9-3-main')}")
    fixed += 1

print(f"\nTotal: {fixed} imports restored")
