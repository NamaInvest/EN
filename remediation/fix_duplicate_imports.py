"""
fix_duplicate_imports.py
Remove duplicate getUserFromRequest imports from all API routes
The pattern is:
1. Line with @ts-expect-error + import getUserFromRequest
2. Line with @ts-expect-error + import getUserFromRequest again (duplicate)
"""
import os, re, glob

base = r"d:\namasoft9-3-main\src\app\api"
files = glob.glob(os.path.join(base, "**", "route.ts"), recursive=True)

fixed = 0
for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
    except:
        continue
    
    original = content
    
    # Pattern 1: Remove @ts-expect-error comment + duplicate import block at top of file
    # The guard pattern adds:
    # // @ts-expect-error [TS2300] Duplicate identifier - pending cleanup
    # import { getUserFromRequest, hasPermission } from '@/lib/auth';
    # ...
    # // @ts-expect-error [TS2300] Duplicate identifier - pending cleanup
    # import { getUserFromRequest } from '@/lib/auth';  <-- duplicate
    
    # Remove ts-expect-error guard blocks that cause duplicate imports
    # Keep only the first real import
    
    # Remove the guard-injected duplicate import block (the ts-expect-error + import lines)
    # Pattern: lines 1-8 that look like guard injection
    
    # Find all import lines for getUserFromRequest
    import_lines = []
    lines = content.split('\n')
    
    # Find lines that import getUserFromRequest
    getUserFromRequest_imports = []
    ts_expect_errors = []
    
    for i, line in enumerate(lines):
        if 'getUserFromRequest' in line and line.strip().startswith('import'):
            getUserFromRequest_imports.append(i)
        if '@ts-expect-error' in line and ('TS2300' in line or 'Duplicate' in line):
            ts_expect_errors.append(i)
    
    if len(getUserFromRequest_imports) <= 1:
        continue  # No duplicate
    
    # Remove all but the last/cleanest import
    # Strategy: keep the import that is NOT preceded by @ts-expect-error
    # Remove ts-expect-error lines and their following duplicate imports
    lines_to_remove = set()
    
    for err_line in ts_expect_errors:
        lines_to_remove.add(err_line)
        # Also remove the import line that follows it (if it's a getUserFromRequest import)
        if err_line + 1 < len(lines) and 'getUserFromRequest' in lines[err_line + 1] and lines[err_line + 1].strip().startswith('import'):
            lines_to_remove.add(err_line + 1)
    
    # Also remove the guard code block (const _guardUser = ...)
    for i, line in enumerate(lines):
        if '_guardUser' in line:
            lines_to_remove.add(i)
    
    new_lines = [line for i, line in enumerate(lines) if i not in lines_to_remove]
    new_content = '\n'.join(new_lines)
    
    # Clean up multiple blank lines
    new_content = re.sub(r'\n{3,}', '\n\n', new_content)
    
    if new_content != original:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(new_content)
        print(f"FIXED: {os.path.relpath(f, r'd:\namasoft9-3-main')}")
        fixed += 1

print(f"\nTotal fixed: {fixed} files")

# Verify no more duplicates in petty-cash specifically
test_file = r"d:\namasoft9-3-main\src\app\api\finance\petty-cash\[id]\process\route.ts"
if os.path.exists(test_file):
    with open(test_file, 'r', encoding='utf-8') as f:
        content = f.read()
    count = content.count('getUserFromRequest')
    print(f"\ngetUserFromRequest occurrences in petty-cash/process: {count}")
    if count <= 3:
        print("OK - no duplicate imports")
    else:
        print("STILL DUPLICATE!")
