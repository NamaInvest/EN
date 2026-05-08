"""
fix_route_context_all.py
Fix RouteContext type errors in ALL .tsx and .ts files
"""
import os, re, glob

base = r"d:\namasoft9-3-main\src"
extensions = ["**/*.ts", "**/*.tsx"]
files = []
for ext in extensions:
    files.extend(glob.glob(os.path.join(base, ext), recursive=True))

fixed = 0

for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
    except:
        continue
    
    original = content
    
    # Fix RouteContext Union type: { params: Promise<X> } | { params: X }  -> { params: Promise<X> }
    # General pattern
    content = re.sub(
        r'(\{\s*params:\s*Promise<\{[^{}]*\}>\s*\})\s*\|\s*\{\s*params:\s*\{[^{}]*\}\s*\}',
        r'\1',
        content
    )
    
    # Fix the ternary 'then' check pattern  
    content = re.sub(
        r"const\s+params\s*=\s*'then'\s+in\s+context\.params\s*\?\s*await\s+context\.params\s*:\s*context\.params;",
        "const params = await context.params;",
        content
    )
    
    # Fix: const { id } = 'then' in context.params ? await context.params : context.params;
    content = re.sub(
        r"const\s+(\{[^}]+\})\s*=\s*'then'\s+in\s+context\.params\s*\?\s*await\s+context\.params\s*:\s*context\.params;",
        r"const \1 = await context.params;",
        content
    )
    
    # Also fix page.tsx files with similar pattern
    content = re.sub(
        r"const\s+(id|slug|[a-zA-Z]+)\s*=\s*'then'\s+in\s+params\s*\?\s*await\s+params\s*:\s*params;",
        r"const \1 = await params;",  
        content
    )
    
    if content != original:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        print(f"FIXED: {os.path.relpath(f, r'd:\namasoft9-3-main')}")
        fixed += 1

print(f"\nTotal: {fixed} files fixed")
