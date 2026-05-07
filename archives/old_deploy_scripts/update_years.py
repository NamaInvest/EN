import os

files = [
    "src/app/(dashboard)/treasury/cash-flow/page.tsx",
    "src/app/(dashboard)/treasury/bank-recon/page.tsx",
    "src/app/(dashboard)/reports/zatca-vat/page.tsx",
    "src/app/(dashboard)/enterprise/quality/page.tsx",
    "src/app/(dashboard)/enterprise/fleet/page.tsx",
    "src/app/(dashboard)/accounting/revenue-recognition/page.tsx",
    "src/app/(dashboard)/accounting/leases/page.tsx"
]

for file in files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        content = content.replace('2024', '2026')
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file}")
    else:
        print(f"File not found: {file}")
