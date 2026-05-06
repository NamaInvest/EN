import os

files_to_fix = {
    r"src/app/(dashboard)/purchases/letters-of-credit/page.tsx": [
        ("/api/customers?type=supplier", "/api/customers?type=1")
    ],
    r"src/app/(dashboard)/treasury/checks/page.tsx": [
        ("/api/parties/customers", "/api/customers?type=0"),
        ("/api/parties/suppliers", "/api/customers?type=1")
    ],
    r"src/app/(dashboard)/purchase-orders/page.tsx": [
        ("/api/parties/suppliers", "/api/customers?type=1")
    ],
    r"src/app/(dashboard)/purchases/grn/page.tsx": [
        ("/api/config/stocks", "/api/warehouses")
    ],
    r"src/app/(dashboard)/purchases/page.tsx": [
        ('href="/crm/customers"', 'href="/customers"'),
        ('href="/inventory"', 'href="/stock"'),
        ('href="/accounting/purchase-invoices"', 'href="/reports/manual-purchases"'),
        ('href="/purchases/orders"', 'href="/purchase-orders"')
    ]
}

for path, replacements in files_to_fix.items():
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        for old, new in replacements:
            content = content.replace(old, new)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {path}")
    else:
        print(f"File not found: {path}")
