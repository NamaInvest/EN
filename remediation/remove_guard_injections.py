"""
NUCLEAR OPTION: Remove ALL guard injections we added (they're causing TS chaos).
The correct security approach is via Next.js middleware.ts which runs before ANY route.
We will instead write a proper middleware.ts that blocks all non-public API routes.
"""
import re, sys, io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ROOT = Path.cwd()
API  = ROOT / 'src' / 'app' / 'api'

# Remove all injected guard code
GUARD_PATTERNS = [
    # Inline header check we added
    r'\n  const _authHeader = \((?:request|req) as any\)\?\.headers\?\.get\?\("authorization"\) \?\? null;\n  const _token = _authHeader\?\.startsWith\("Bearer "\) \? _authHeader\.slice\(7\) : null;\n  if \(!_token\) return new Response\(JSON\.stringify\(\{error:"Unauthorized"\}\),\{status:401,headers:\{"Content-Type":"application\/json"\}\}\);',
    # Original getUserFromRequest pattern
    r'\n  const _guardUser = getUserFromRequest\(request\);\n  if \(!_guardUser\) return new Response\(JSON\.stringify\(\{error:\'Unauthorized\'\}\),\{status:401,headers:\{\'Content-Type\':\'application\/json\'\}\}\);',
    # req as any version
    r'\n  const _guardUser = getUserFromRequest\(req as any\);\n  if \(!_guardUser\) return new Response\(JSON\.stringify\(\{error:\'Unauthorized\'\}\),\{status:401,headers:\{\'Content-Type\':\'application\/json\'\}\}\);',
]

IMPORT_PATTERNS = [
    "import { getUserFromRequest } from '@/lib/auth';\n",
    'import { getUserFromRequest } from "@/lib/auth";\n',
]

cleaned = 0
for rpath in API.rglob('route.ts'):
    try:
        content = rpath.read_text(encoding='utf-8', errors='ignore')
        original = content

        for pat in GUARD_PATTERNS:
            content = re.sub(pat, '', content)

        for imp in IMPORT_PATTERNS:
            # Only remove if getUserFromRequest not used elsewhere
            if imp.strip() in content and 'getUserFromRequest' not in content.replace(imp.strip(), ''):
                content = content.replace(imp, '')

        if content != original:
            rpath.write_text(content, encoding='utf-8')
            cleaned += 1

    except Exception as e:
        print(f'Error: {rpath.name}: {e}')

print(f'Cleaned {cleaned} files of all guard injections')
print()
print('Next: write proper middleware.ts for route-level auth...')
