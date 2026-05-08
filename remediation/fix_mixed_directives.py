"""
fix_mixed_directives.py
Remove 'import { _t } from @/lib/server-t' from client components
that already define their own _t function.
"""
import os, glob, re

BASE = r"d:\namasoft9-3-main\src\app\(dashboard)"

# Find all tsx files with both server-t import and 'use client'
files = glob.glob(os.path.join(BASE, "**", "*.tsx"), recursive=True)
fixed = 0

for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
    except:
        continue
    
    has_server_t  = "from '@/lib/server-t'" in content
    has_use_client = "'use client'" in content or '"use client"' in content
    
    if not (has_server_t and has_use_client):
        continue
    
    original = content
    
    # Remove server-t import lines
    content = re.sub(r"import \{ _t \} from '@/lib/server-t';\r?\n", "", content)
    content = re.sub(r'import \{ _t \} from "@/lib/server-t";\r?\n', "", content)
    
    # Fix duplicate use client directives (keep only first occurrence)
    # Pattern: 'use client';\n"use client";  or reversed
    content = re.sub(r"'use client';\r?\n\"use client\";\r?\n", "'use client'\n", content)
    content = re.sub(r'"use client";\r?\n\'use client\';\r?\n', "'use client'\n", content)
    
    if content != original:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        print(f"  FIXED: {os.path.relpath(f, r'd:\namasoft9-3-main')}")
        fixed += 1

print(f"\nTotal fixed: {fixed} files")

# Also scan all .tsx for 'use client' conflicts
print("\nScanning for remaining import { _t } from server-t in client components...")
remaining = []
for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
        if "from '@/lib/server-t'" in content and ("'use client'" in content or '"use client"' in content):
            remaining.append(f)
    except:
        pass

if remaining:
    print(f"Still mixed: {len(remaining)} files")
    for f in remaining[:10]:
        print(f"  {os.path.relpath(f, r'd:\namasoft9-3-main')}")
else:
    print("✅ All clear!")
