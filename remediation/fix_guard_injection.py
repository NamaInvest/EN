"""
REVERT P0-2 bad injections and redo with better pattern matching.
The problem: we injected `getUserFromRequest(request)` into functions that
don't have `request` as a parameter.

Fix: only inject when the function signature includes `request`.
"""
import os, re, sys, io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ROOT = Path.cwd()
SRC  = ROOT / 'src'
API  = SRC / 'app' / 'api'

# The bad injection we need to revert
BAD_PATTERN = re.compile(
    r'\n  const _guardUser = getUserFromRequest\(request\);\n'
    r'  if \(!_guardUser\) return new Response\(JSON\.stringify\(\{error:\'Unauthorized\'\}\),\{status:401,headers:\{\'Content-Type\':\'application/json\'\}\}\);\n'
)

# Also remove the import we added if it's now unused
BAD_IMPORT = "import { getUserFromRequest } from '@/lib/auth';"

reverted = 0
reimplemented = 0

for rpath in API.rglob('route.ts'):
    rel = str(rpath.relative_to(ROOT))
    try:
        content = rpath.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        continue

    original = content

    # Step 1: Revert the bad injection
    if '_guardUser = getUserFromRequest(request)' in content:
        content = BAD_PATTERN.sub('\n', content)

        # Remove bad import only if getUserFromRequest is no longer used elsewhere
        if 'getUserFromRequest' not in content.replace(BAD_IMPORT, ''):
            # Safe to remove
            lines = content.split('\n')
            lines = [l for l in lines if BAD_IMPORT not in l]
            content = '\n'.join(lines)

        reverted += 1

    # Step 2: Re-inject CORRECTLY — only into functions that have `request` param
    # Pattern: export async function GET(request: NextRequest...) {
    # → inject guard check right after the opening brace
    if content != original or True:  # re-check all files
        def inject_correct_guard(match):
            full_sig = match.group(0)
            # Check if signature contains 'request'
            if 'request' not in full_sig.lower():
                return full_sig  # no injection
            # Already guarded?
            return full_sig + (
                '\n  const _guardUser = getUserFromRequest(request);\n'
                '  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});\n'
            )

        new_content = re.sub(
            r'export\s+async\s+function\s+(?:GET|POST|PUT|DELETE|PATCH|HEAD)\s*\([^)]*request[^)]*\)\s*(?::\s*\S+)?\s*\{',
            inject_correct_guard,
            content
        )

        # Add import if we injected guard and it's not there
        if '_guardUser = getUserFromRequest' in new_content and BAD_IMPORT not in new_content:
            lines = new_content.split('\n')
            last_import = 0
            for i, line in enumerate(lines):
                if line.strip().startswith('import '):
                    last_import = i
            lines.insert(last_import + 1, BAD_IMPORT)
            new_content = '\n'.join(lines)

        if new_content != content:
            rpath.write_text(new_content, encoding='utf-8')
            reimplemented += 1

print(f'Reverted bad injections  : {reverted}')
print(f'Re-implemented correctly : {reimplemented}')
print('Done.')
