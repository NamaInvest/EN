"""
Float → Decimal Migration Executor
====================================
Runs on the production server to safely migrate financial fields
from Float to Decimal(20,4) precision.

Usage (on production server):
  python3 migrate_decimal.py --dry-run    # preview only
  python3 migrate_decimal.py --execute    # run migration

Requires: psycopg2, DATABASE_URL in environment
"""

import os, sys, argparse
import subprocess

def run(cmd, capture=True):
    result = subprocess.run(cmd, shell=True, capture_output=capture, text=True)
    if result.returncode != 0 and not capture:
        print(f"ERROR: {result.stderr}")
        sys.exit(1)
    return result.stdout.strip() if capture else None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true', help='Show migration SQL only')
    parser.add_argument('--execute', action='store_true', help='Execute migration on DB')
    args = parser.parse_args()

    if not args.dry_run and not args.execute:
        print("Usage: python3 migrate_decimal.py [--dry-run | --execute]")
        sys.exit(1)

    # Financial fields requiring Decimal(20,4) precision
    migrations = [
        # SalesInvoice
        ("SalesInvoice", "subtotal",       "DECIMAL(20,4)"),
        ("SalesInvoice", "tax_amount",     "DECIMAL(20,4)"),
        ("SalesInvoice", "discount",       "DECIMAL(20,4)"),
        ("SalesInvoice", "total",          "DECIMAL(20,4)"),
        ("SalesInvoice", "paid_amount",    "DECIMAL(20,4)"),
        # SalesInvoiceItem
        ("SalesInvoiceItem", "quantity",   "DECIMAL(20,4)"),
        ("SalesInvoiceItem", "unit_price", "DECIMAL(20,4)"),
        ("SalesInvoiceItem", "discount",   "DECIMAL(20,4)"),
        ("SalesInvoiceItem", "tax_amount", "DECIMAL(20,4)"),
        ("SalesInvoiceItem", "subtotal",   "DECIMAL(20,4)"),
        # PurchaseInvoice
        ("PurchaseInvoice", "subtotal",    "DECIMAL(20,4)"),
        ("PurchaseInvoice", "tax_amount",  "DECIMAL(20,4)"),
        ("PurchaseInvoice", "discount",    "DECIMAL(20,4)"),
        ("PurchaseInvoice", "total",       "DECIMAL(20,4)"),
        ("PurchaseInvoice", "paid_amount", "DECIMAL(20,4)"),
        # Product / Inventory
        ("Product", "cost_price",          "DECIMAL(20,4)"),
        ("Product", "sale_price",          "DECIMAL(20,4)"),
        ("Product", "min_price",           "DECIMAL(20,4)"),
        ("StockMovement", "quantity",      "DECIMAL(20,4)"),
        ("StockMovement", "unit_cost",     "DECIMAL(20,4)"),
        # Accounting
        ("JournalLine", "debit",           "DECIMAL(20,4)"),
        ("JournalLine", "credit",          "DECIMAL(20,4)"),
        ("JournalEntry", "total_debit",    "DECIMAL(20,4)"),
        ("JournalEntry", "total_credit",   "DECIMAL(20,4)"),
        # Expenses
        ("Expense", "amount",              "DECIMAL(20,4)"),
        # Treasury
        ("Treasury", "amount",             "DECIMAL(20,4)"),
        ("Treasury", "balance_after",      "DECIMAL(20,4)"),
        # Payroll
        ("PayrollRecord", "basic_salary",  "DECIMAL(20,4)"),
        ("PayrollRecord", "net_salary",    "DECIMAL(20,4)"),
        ("PayrollRecord", "total_deductions", "DECIMAL(20,4)"),
        ("PayrollRecord", "total_additions",  "DECIMAL(20,4)"),
    ]

    sqls = []
    for (table, col, dtype) in migrations:
        sql = f'ALTER TABLE "{table}" ALTER COLUMN "{col}" TYPE {dtype} USING "{col}"::{dtype};'
        sqls.append(sql)

    if args.dry_run:
        print("=== DRY RUN — Migration SQL Preview ===")
        print(f"Total: {len(sqls)} column alterations")
        print()
        for sql in sqls:
            print(sql)
        print()
        print("Run with --execute to apply.")
        return

    if args.execute:
        db_url = os.environ.get('DATABASE_URL')
        if not db_url:
            print("ERROR: DATABASE_URL not set in environment")
            sys.exit(1)

        print(f"Executing {len(sqls)} migrations...")
        
        try:
            import psycopg2
            conn = psycopg2.connect(db_url)
            conn.autocommit = False
            cur = conn.cursor()

            for i, sql in enumerate(sqls, 1):
                try:
                    cur.execute(sql)
                    print(f"  [{i}/{len(sqls)}] ✓ {sql[:70]}...")
                except Exception as e:
                    # Column might already be DECIMAL or not exist — skip
                    conn.rollback()
                    print(f"  [{i}/{len(sqls)}] SKIP: {e}")
                    conn.autocommit = False

            conn.commit()
            cur.close()
            conn.close()
            print()
            print("✅ Migration complete!")
            print("   Run: npx prisma db pull && npx prisma generate")

        except ImportError:
            print("ERROR: psycopg2 not installed. Run: pip3 install psycopg2-binary")
            sys.exit(1)

if __name__ == '__main__':
    main()
