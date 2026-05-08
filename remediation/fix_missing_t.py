"""
fix_missing_t.py
Add local _t helper to client components that use _t but have no definition
"""
import subprocess, re, os

# Get all files with _t errors
result = subprocess.run(
    ['npx', 'tsc', '--noEmit'],
    capture_output=True, text=True, cwd=r'd:\namasoft9-3-main'
)

# Parse affected files
affected = set()
for line in (result.stdout + result.stderr).splitlines():
    if "Cannot find name '_t'" in line or "Cannot find name \"_t\"" in line:
        match = re.match(r'(.+\.tsx)\(', line)
        if match:
            path = match.group(1).replace('/', '\\')
            affected.add(path)

print(f"Files needing _t helper: {len(affected)}")

# Local _t helper to inject (after 'use client' line)
T_HELPER = "\nconst _t = (ar: string, en: string) => ar;\n"

fixed = 0
for f in sorted(affected):
    full = os.path.join(r'd:\namasoft9-3-main', f)
    if not os.path.exists(full):
        full = f  # already absolute
    
    try:
        with open(full, 'r', encoding='utf-8') as fh:
            content = fh.read()
    except:
        print(f"  SKIP (read error): {f}")
        continue
    
    # Don't add if already has _t defined
    if re.search(r'const _t\s*=', content):
        print(f"  SKIP (has _t): {f}")
        continue
    
    # Don't add if still imports _t from server-t
    if "from '@/lib/server-t'" in content:
        print(f"  SKIP (server-t): {f}")
        continue
    
    # Insert _t helper after the last import statement
    # Find the last import line
    lines = content.split('\n')
    last_import_idx = 0
    for i, line in enumerate(lines):
        if line.strip().startswith('import ') or line.strip().startswith("'use client'") or line.strip().startswith('"use client"'):
            last_import_idx = i
    
    # Insert after last import
    lines.insert(last_import_idx + 1, "\nconst _t = (ar: string, en: string) => ar; // i18n helper\n")
    new_content = '\n'.join(lines)
    
    try:
        with open(full, 'w', encoding='utf-8') as fh:
            fh.write(new_content)
        print(f"  FIXED: {f}")
        fixed += 1
    except Exception as e:
        print(f"  ERROR: {f} — {e}")

print(f"\nTotal fixed: {fixed}")
