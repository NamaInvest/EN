import os
import re

def walk_ts(root):
    out = []
    for dirpath, _, files in os.walk(root):
        for f in files:
            if f.endswith('.ts') or f.endswith('.tsx'):
                out.append(os.path.join(dirpath, f))
    return out

files = walk_ts(os.path.join(os.path.dirname(__file__), 'src'))
fixed = 0

for fpath in files:
    with open(fpath, 'rb') as f:
        raw = f.read()

    content = raw.decode('utf-8')
    original = content

    # Fix 1: process.env.JWT_SECRET || 'any_fallback'  →  (process.env.JWT_SECRET as string)
    content = re.sub(
        r"process\.env\.JWT_SECRET\s*\|\|\s*'[^']*'",
        "(process.env.JWT_SECRET as string)",
        content
    )
    content = re.sub(
        r'process\.env\.JWT_SECRET\s*\|\|\s*"[^"]*"',
        '(process.env.JWT_SECRET as string)',
        content
    )

    # Fix 2: const JWT_SECRET = (process.env.JWT_SECRET as string)  →  properly typed
    # (already done by fix 1 when the line started with const JWT_SECRET = ...)
    # But if there's a bare: const JWT_SECRET = process.env.JWT_SECRET  (no fallback, no cast)
    content = re.sub(
        r'const JWT_SECRET\s*=\s*process\.env\.JWT_SECRET;',
        'const JWT_SECRET: string = process.env.JWT_SECRET as string;',
        content
    )

    if content != original:
        with open(fpath, 'wb') as f:
            f.write(content.encode('utf-8'))
        print('Fixed:', os.path.relpath(fpath))
        fixed += 1

print(f'\nTotal fixed: {fixed}')
