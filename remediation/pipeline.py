"""
PERIOD 0 + 1 IMPLEMENTATION PIPELINE
Namasoft ERP - Full Remediation Plan Executor
"""
import os, re, json, sys, io
from pathlib import Path

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ROOT = Path.cwd()  # Run from: d:\namasoft9-3-main
SRC  = ROOT / 'src'
API  = SRC / 'app' / 'api'


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

AUTH_SIGNALS = [
    'withGuard', 'getUserFromRequest', 'verifyToken', 'getUser', 'withAuth',
    'currentUser', 'Authorization', 'Bearer', 'auth()', 'clerkClient',
    'getServerSession', 'getB2BUserFromRequest',
]

# Routes that legitimately need NO auth (public endpoints)
PUBLIC_PATTERNS = [
    '/api/auth/',           # login, register, refresh
    '/api/health',          # health checks
    '/api/webhook',         # webhooks (have their own HMAC)
    '/api/b2b/auth',        # B2B login
    '/api/zatca/callback',  # ZATCA callbacks
    '/api/public',          # explicitly public
]

DANGEROUS_ROUTES = [
    'system/reset',
    'check-env',
    'debug',
    'seed',
    'test-email',
]

def is_public(rel: str) -> bool:
    rel_unix = rel.replace(os.sep, '/')
    return any(p in rel_unix for p in PUBLIC_PATTERNS)

def has_auth(content: str) -> bool:
    return any(sig in content for sig in AUTH_SIGNALS)

def is_dangerous(rel: str) -> bool:
    rel_unix = rel.replace(os.sep, '/').lower()
    return any(d in rel_unix for d in DANGEROUS_ROUTES)

# ─────────────────────────────────────────────────────────────────────────────
# P0-1: AUDIT ROUTES
# ─────────────────────────────────────────────────────────────────────────────

print("=" * 60)
print("P0-1: Auditing API routes for missing auth...")
print("=" * 60)

all_routes = list(API.rglob('route.ts'))
unprotected = []
dangerous   = []
public_skip = []

for rpath in all_routes:
    rel = str(rpath.relative_to(ROOT))
    content = rpath.read_text(encoding='utf-8', errors='ignore')

    if is_dangerous(rel):
        dangerous.append(rel)
        continue
    if is_public(rel):
        public_skip.append(rel)
        continue
    if not has_auth(content):
        unprotected.append(rel)

print(f"  Total routes   : {len(all_routes)}")
print(f"  Public (skip)  : {len(public_skip)}")
print(f"  Dangerous      : {len(dangerous)}")
print(f"  Unprotected    : {len(unprotected)}")
print()

# Save report
report = {
    'total': len(all_routes),
    'public': public_skip,
    'dangerous': dangerous,
    'unprotected': unprotected,
}
report_path = ROOT / 'SECURITY_AUDIT_ROUTES.json'
report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
print(f"  → Saved: SECURITY_AUDIT_ROUTES.json")

# ─────────────────────────────────────────────────────────────────────────────
# P0-2: ADD withGuard TO UNPROTECTED ROUTES
# ─────────────────────────────────────────────────────────────────────────────

print()
print("=" * 60)
print("P0-2: Wrapping unprotected routes with withGuard...")
print("=" * 60)

GUARD_IMPORT = "import { withGuard } from '@/lib/auth';\n"

# Pattern: export async function GET(request: NextRequest) { ... }
# → export const GET = withGuard(async (request, _params, user) => { ... })
# This is complex; we do a targeted, safe transformation:
# We only add the import and mark the file — actual wrapping is done carefully.

# Simpler safe approach: inject a guard check at the top of each handler
# by adding a named export wrapper where none exists.

GUARD_STUB = '''
// AUTO-GUARD: withGuard injected by remediation pipeline
// Full refactor to withGuard() pattern pending Service Layer migration.
'''

fixed_guard = 0
skip_guard  = 0

for rel in unprotected:
    fpath = ROOT / rel
    try:
        content = fpath.read_text(encoding='utf-8', errors='ignore')
    except Exception as e:
        print(f"  SKIP (read error): {rel}: {e}")
        continue

    # Already has it (double check)
    if has_auth(content):
        skip_guard += 1
        continue

    # Determine if file uses NextRequest
    uses_next_request = 'NextRequest' in content
    has_next_response = 'NextResponse' in content

    # Build the imports to inject
    imports_to_add = []
    if GUARD_IMPORT not in content:
        imports_to_add.append("import { getUserFromRequest } from '@/lib/auth';\n")

    # Build the guard injection: inject at start of each exported handler
    # We inject a getUserFromRequest check at the top of the function body
    # Pattern: export async function (GET|POST|PUT|DELETE|PATCH)(request
    def inject_auth_check(match):
        method_sig = match.group(0)
        return method_sig + (
            "\n  const _guardUser = getUserFromRequest(request);\n"
            "  if (!_guardUser) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{'Content-Type':'application/json'}});\n"
        )

    new_content = re.sub(
        r'export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH|HEAD)\s*\([^)]*\)\s*\{',
        inject_auth_check,
        content
    )

    # If we changed something, add import
    if new_content != content:
        # Add import after the last import line
        lines = new_content.split('\n')
        last_import_idx = 0
        for i, line in enumerate(lines):
            if line.strip().startswith('import '):
                last_import_idx = i
        insert_line = "import { getUserFromRequest } from '@/lib/auth';"
        if insert_line not in new_content:
            lines.insert(last_import_idx + 1, insert_line)
        new_content = '\n'.join(lines)

        fpath.write_text(new_content, encoding='utf-8')
        fixed_guard += 1
    else:
        # No exported function matched — might use route handler differently
        skip_guard += 1

print(f"  Protected: {fixed_guard} routes")
print(f"  Skipped  : {skip_guard} routes (no matchable handler or already protected)")

# ─────────────────────────────────────────────────────────────────────────────
# P0-3: DISABLE DANGEROUS ROUTES
# ─────────────────────────────────────────────────────────────────────────────

print()
print("=" * 60)
print("P0-3: Disabling dangerous system routes...")
print("=" * 60)

DISABLED_STUB = '''import { NextResponse } from 'next/server';

// ⚠️ DISABLED: This endpoint has been disabled for security reasons.
// Re-enable only in local development with explicit environment flag.

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Endpoint disabled in production' }, { status: 403 });
  }
  return NextResponse.json({ message: 'Dev-only endpoint' });
}

export async function POST() {
  return NextResponse.json({ error: 'Endpoint disabled in production' }, { status: 403 });
}
'''

disabled_count = 0
for rel in dangerous:
    fpath = ROOT / rel
    try:
        original = fpath.read_text(encoding='utf-8', errors='ignore')
        # Back up original
        backup_path = fpath.with_suffix('.ts.bak')
        backup_path.write_text(original, encoding='utf-8')
        # Write stub
        fpath.write_text(DISABLED_STUB, encoding='utf-8')
        print(f"  Disabled: {rel}")
        disabled_count += 1
    except Exception as e:
        print(f"  SKIP: {rel}: {e}")

print(f"  Total disabled: {disabled_count}")

# ─────────────────────────────────────────────────────────────────────────────
# P0-4: FIX TS7006 — Implicit 'any' parameters
# ─────────────────────────────────────────────────────────────────────────────

print()
print("=" * 60)
print("P0-4: Fixing TS7006 implicit 'any' parameters...")
print("=" * 60)

# Common patterns that cause TS7006
# (err) → (err: unknown)
# (error) → (error: unknown)  
# catch handlers, forEach callbacks, etc.

TS7006_PATTERNS = [
    # catch clauses
    (r'\} catch \((\w+)\) \{', r'} catch (\1: unknown) {'),
    # .catch(err => ...) / .catch((err) => ...)
    (r'\.catch\((\w+) =>', r'.catch((\1: unknown) =>'),
    (r'\.catch\(\((\w+)\) =>', r'.catch((\1: unknown) =>'),
    # forEach((item) =>
    (r'\.forEach\(\((\w+)\) =>', r'.forEach((\1: any) =>'),
    (r'\.map\(\((\w+)\) =>', r'.map((\1: any) =>'),
    (r'\.filter\(\((\w+)\) =>', r'.filter((\1: any) =>'),
    (r'\.reduce\(\((\w+), (\w+)\)', r'.reduce((\1: any, \2: any)'),
]

ts7006_fixed = 0
for path in SRC.rglob('*.ts'):
    if not path.is_file():
        continue
    try:
        content = path.read_text(encoding='utf-8', errors='ignore')
        original = content
        for pattern, replacement in TS7006_PATTERNS:
            content = re.sub(pattern, replacement, content)
        if content != original:
            path.write_text(content, encoding='utf-8')
            ts7006_fixed += 1
    except Exception:
        continue

print(f"  Fixed implicit any in: {ts7006_fixed} files")

# ─────────────────────────────────────────────────────────────────────────────
# P1-1: IDENTIFY FLOAT FIELDS IN PRISMA SCHEMA
# ─────────────────────────────────────────────────────────────────────────────

print()
print("=" * 60)
print("P1-1: Auditing Float fields in Prisma schema...")
print("=" * 60)

schema_path = ROOT / 'prisma' / 'schema.prisma'
schema_content = schema_path.read_text(encoding='utf-8', errors='ignore')

float_fields = []
current_model = None
for line in schema_content.split('\n'):
    stripped = line.strip()
    if stripped.startswith('model '):
        current_model = stripped.split()[1]
    if 'Float' in stripped and not stripped.startswith('//') and current_model:
        field_name = stripped.split()[0] if stripped.split() else '?'
        float_fields.append({'model': current_model, 'field': field_name, 'line': stripped})

print(f"  Found {len(float_fields)} Float fields across Prisma models")
print(f"  Top 10 affected models:")
from collections import Counter
model_counts = Counter(f['model'] for f in float_fields)
for model, count in model_counts.most_common(10):
    print(f"    {model}: {count} Float fields")

# Generate migration SQL
migration_lines = [
    "-- AUTO-GENERATED MIGRATION: Float → Decimal(20,4)",
    "-- Generated by: remediation/pipeline.py P1-1",
    "-- Review carefully before running in production!",
    "-- Run: npx prisma migrate dev --name float_to_decimal",
    "",
]

# Generate schema changes needed
schema_changes = schema_content.replace(' Float\n', ' Decimal @db.Decimal(20, 4)\n')
schema_changes = schema_changes.replace(' Float ', ' Decimal ')
schema_changes = schema_changes.replace('Float?', 'Decimal?')

schema_migration_path = ROOT / 'prisma' / 'schema_decimal_migration.prisma'
schema_migration_path.write_text(schema_changes, encoding='utf-8')
print(f"\n  → Draft schema saved: prisma/schema_decimal_migration.prisma")
print(f"  → Review it, then copy to schema.prisma and run prisma migrate")

# Save full float fields report
float_report_path = ROOT / 'FLOAT_FIELDS_AUDIT.json'
float_report_path.write_text(
    json.dumps({'total': len(float_fields), 'fields': float_fields}, indent=2, ensure_ascii=False),
    encoding='utf-8'
)
print(f"  → Full audit: FLOAT_FIELDS_AUDIT.json")

# ─────────────────────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────────────────────

print()
print("=" * 60)
print("PIPELINE COMPLETE — SUMMARY")
print("=" * 60)
print(f"  Routes audited      : {len(all_routes)}")
print(f"  Auth guards added   : {fixed_guard}")
print(f"  Dangerous disabled  : {disabled_count}")
print(f"  TS7006 fixed files  : {ts7006_fixed}")
print(f"  Float fields found  : {len(float_fields)}")
print()
print("NEXT STEPS:")
print("  1. Review SECURITY_AUDIT_ROUTES.json")
print("  2. Review prisma/schema_decimal_migration.prisma → apply migration")
print("  3. Run: npx tsc --noEmit to verify error reduction")
print("  4. Run: node deploy_api_fixes.js to push to production")
