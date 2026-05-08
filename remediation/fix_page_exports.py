"""
fix_page_exports.py
Remove invalid 'export' keywords from Next.js page files.
Pages can only export: default, metadata, config, runtime, dynamic, viewport, 
generateStaticParams, revalidate, generateViewport
"""
import os, re, glob

VALID_PAGE_EXPORTS = {
    'default', 'metadata', 'config', 'runtime', 'dynamic', 
    'viewport', 'generateStaticParams', 'revalidate', 'generateViewport',
    'unstable_prefetch', 'generateMetadata',
    'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'  # For route.ts
}

base = r"d:\namasoft9-3-main\src\app"
pages = glob.glob(os.path.join(base, "**", "page.tsx"), recursive=True)
layouts = glob.glob(os.path.join(base, "**", "layout.tsx"), recursive=True)
files = pages + layouts

fixed_total = 0

for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
    except:
        continue
    
    original = content
    
    # Find all exported const/function/class/let/var
    # Pattern: ^export (const|function|class|let|var|async function) NAME
    def remove_invalid_export(m):
        keyword = m.group(1)  # const/function etc
        name = m.group(2)     # the identifier name
        if name in VALID_PAGE_EXPORTS:
            return m.group(0)  # keep as is
        # Remove the 'export ' prefix
        return f'{keyword} {name}'
    
    # Match: export const NAME or export function NAME or export async function NAME
    content = re.sub(
        r'\bexport\s+(const|let|var|function|async function|class)\s+([A-Z_][A-Za-z0-9_]*)',
        remove_invalid_export,
        content
    )
    
    if content != original:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        print(f"FIXED: {os.path.relpath(f, r'd:\namasoft9-3-main')}")
        fixed_total += 1

print(f"\nTotal: {fixed_total} page files fixed")
