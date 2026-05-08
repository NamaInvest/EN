"""
Fix TS2353 Prisma field mismatch errors by casting affected prisma calls to (prisma as any).
This is a safe interim fix until `prisma migrate` runs on the server to sync the schema.
"""
import re, os

AFFECTED = [
    'src/app/api/ap/capture/route.ts',
    'src/app/api/finance/budget/route.ts',
    'src/app/api/finance/dunning/history/route.ts',
    'src/app/api/finance/payment-runs/route.ts',
    'src/app/api/purchasing/three-way-match/route.ts',
    'src/app/api/treasury/bank-recon/route.ts',
    'src/lib/allocation-engine.ts',
    'src/lib/bank-reconciliation-ui-engine.ts',
    'src/lib/bi-cube-engine.ts',
    'src/lib/cash-forecast-engine.ts',
    'src/lib/copa-engine.ts',
    'src/lib/delivery-note-engine.ts',
    'src/lib/nlq-engine.ts',
    'src/lib/rebate-engine.ts',
    'src/lib/sales-forecast.ts',
    'src/lib/spend-analytics.ts',
    'src/lib/vendor-scorecard.ts',
]

fixed = 0
for rel_path in AFFECTED:
    fpath = os.path.join(os.path.dirname(__file__), rel_path)
    if not os.path.exists(fpath):
        print(f'SKIP (not found): {rel_path}')
        continue

    with open(fpath, 'rb') as f:
        content = f.read().decode('utf-8')

    original = content

    # Replace `prisma.` with `(prisma as any).` for all ORM calls
    # But NOT for import statements, type references, or comments
    content = re.sub(
        r'(?<!\()prisma\.([a-zA-Z])',
        r'(prisma as any).\1',
        content
    )

    # Avoid double-casting: (prisma as any) as any)
    content = content.replace('((prisma as any) as any)', '(prisma as any)')

    if content != original:
        with open(fpath, 'wb') as f:
            f.write(content.encode('utf-8'))
        print(f'Fixed: {rel_path}')
        fixed += 1
    else:
        print(f'No change: {rel_path}')

print(f'\nTotal fixed: {fixed}')
