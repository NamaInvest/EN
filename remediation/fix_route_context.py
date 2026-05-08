"""
fix_route_context.py
Fix RouteContext type errors in API routes.
Replace:
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
with:
  context: { params: Promise<{ id: string }> }

And fix:
  const params = 'then' in context.params ? await context.params : context.params;
with:
  const params = await context.params;
"""
import os, re, glob

base = r"d:\namasoft9-3-main\src\app\api"
files = glob.glob(os.path.join(base, "**", "route.ts"), recursive=True)

# Also check the petty-cash and other files we know have issues
fixed = 0

for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
    except:
        continue
    
    original = content
    
    # Pattern 1: Fix Union type context parameter
    # { params: Promise<{ id: string }> } | { params: { id: string } }
    content = re.sub(
        r'\{\s*params:\s*Promise<\{[^}]+\}>\s*\}\s*\|\s*\{\s*params:\s*\{[^}]+\}\s*\}',
        lambda m: re.sub(r'\}\s*\|\s*\{[^}]+\}\s*\}$', '}', m.group(0)),
        content
    )
    
    # More specific patterns
    # Remove the Union type completely
    content = re.sub(
        r'(\{\s*params:\s*Promise<\{[^}]*\}>\s*\})\s*\|\s*\{\s*params:\s*\{[^}]*\}\s*\}',
        r'\1',
        content
    )
    
    # Pattern 2: Fix the 'then' in context.params check
    content = re.sub(
        r"const params = 'then' in context\.params \? await context\.params : context\.params;",
        "const params = await context.params;",
        content
    )
    
    # Also fix: const { id } = 'then' in context.params ? await context.params : context.params;
    content = re.sub(
        r"const (\{[^}]+\}) = 'then' in context\.params \? await context\.params : context\.params;",
        r"const \1 = await context.params;",
        content
    )
    
    if content != original:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        print(f"FIXED: {os.path.relpath(f, r'd:\namasoft9-3-main')}")
        fixed += 1

print(f"\nTotal: {fixed} files fixed")

# Verify a known file
test_file = r"d:\namasoft9-3-main\src\app\api\finance\petty-cash\[id]\process\route.ts"
if os.path.exists(test_file):
    with open(test_file, 'r') as f:
        content = f.read()
    if 'then' in content:
        print(f"WARNING: {test_file} still has 'then' in context.params")
    else:
        print(f"OK: petty-cash/process route context fixed")
