"""
Cleanup guard injections using simple string matching (no regex issues with CRLF).
"""
import sys, io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ROOT = Path.cwd()
API  = ROOT / 'src' / 'app' / 'api'

REMOVE_STRINGS = [
    # Inline header check (LF version)
    '\n  const _authHeader = (request as any)?.headers?.get?.("authorization") ?? null;\n  const _token = _authHeader?.startsWith("Bearer ") ? _authHeader.slice(7) : null;\n  if (!_token) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});\n',
    # req version
    '\n  const _authHeader = (req as any)?.headers?.get?.("authorization") ?? null;\n  const _token = _authHeader?.startsWith("Bearer ") ? _authHeader.slice(7) : null;\n  if (!_token) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});\n',
    # CRLF versions
    '\r\n  const _authHeader = (request as any)?.headers?.get?.("authorization") ?? null;\r\n  const _token = _authHeader?.startsWith("Bearer ") ? _authHeader.slice(7) : null;\r\n  if (!_token) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});\r\n',
    '\r\n  const _authHeader = (req as any)?.headers?.get?.("authorization") ?? null;\r\n  const _token = _authHeader?.startsWith("Bearer ") ? _authHeader.slice(7) : null;\r\n  if (!_token) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});\r\n',
    # getUserFromRequest versions
    '\n  const _guardUser = getUserFromRequest(request);\n  if (!_guardUser) return new Response(JSON.stringify({error:\'Unauthorized\'}),{status:401,headers:{\'Content-Type\':\'application/json\'}});\n',
    '\n  const _guardUser = getUserFromRequest(req as any);\n  if (!_guardUser) return new Response(JSON.stringify({error:\'Unauthorized\'}),{status:401,headers:{\'Content-Type\':\'application/json\'}});\n',
]

IMPORT_REMOVE = [
    "import { getUserFromRequest } from '@/lib/auth';\n",
    "import { getUserFromRequest } from '@/lib/auth';\r\n",
    'import { getUserFromRequest } from "@/lib/auth";\n',
    'import { getUserFromRequest } from "@/lib/auth";\r\n',
]

cleaned = 0
for rpath in API.rglob('route.ts'):
    try:
        raw = rpath.read_bytes()
        content = raw.decode('utf-8', errors='ignore')
        original = content

        for s in REMOVE_STRINGS:
            content = content.replace(s, '\n')

        # Remove unused import
        for imp in IMPORT_REMOVE:
            if imp in content:
                remaining = content.replace(imp, '')
                if 'getUserFromRequest' not in remaining:
                    content = remaining

        if content != original:
            rpath.write_bytes(content.encode('utf-8'))
            cleaned += 1

    except Exception as e:
        print(f'Error {rpath.name}: {e}')

print(f'Cleaned {cleaned} files')
