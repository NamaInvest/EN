"""
Fix guard injection where parameter name is `req` not `request`.
Also fix TS2448/TS2300 errors from duplicate re-declarations.
"""
import re, sys, io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ROOT = Path.cwd()
API  = ROOT / 'src' / 'app' / 'api'

fixed_req = 0
fixed_dupe = 0

for rpath in API.rglob('route.ts'):
    try:
        content = rpath.read_text(encoding='utf-8', errors='ignore')
        original = content

        # Fix 1: getUserFromRequest(request) where param is actually `req`
        # Pattern: function GET(req: ...) { \n  const _guardUser = getUserFromRequest(request);
        if 'getUserFromRequest(request)' in content and '(req:' in content:
            content = content.replace(
                'getUserFromRequest(request)',
                'getUserFromRequest(req as any)'
            )
            fixed_req += 1

        # Fix 2: remove duplicate getUserFromRequest import lines
        import_line = "import { getUserFromRequest } from '@/lib/auth';"
        lines = content.split('\n')
        seen_import = False
        new_lines = []
        for line in lines:
            if import_line in line:
                if seen_import:
                    continue  # skip duplicate
                seen_import = True
            new_lines.append(line)
        new_content = '\n'.join(new_lines)

        if new_content != content:
            content = new_content
            fixed_dupe += 1

        if content != original:
            rpath.write_text(content, encoding='utf-8')

    except Exception as e:
        print(f'Error processing {rpath}: {e}')

print(f'Fixed req->request mismatch : {fixed_req} files')
print(f'Removed duplicate imports   : {fixed_dupe} files')
