/**
 * check-audit-logs.ts
 * ---------------------------------------------------------------------------
 * Audit Log Health-Check Script — Namasoft ERP
 * Part of: 10_DATA_STORAGE improvement plan
 *
 * Usage:
 *   npx ts-node src/scripts/check-audit-logs.ts
 *   npx ts-node src/scripts/check-audit-logs.ts --tenant=<tenantId>
 *   npx ts-node src/scripts/check-audit-logs.ts --migrate
 *
 * Checks:
 *   1. Row counts in audit_log vs field_audit_logs
 *   2. Recent activity (last 24h)
 *   3. Top 10 tables by audit volume
 *   4. Missing entries (tables with soft deletes but no audit trail)
 *   5. Optionally triggers the migration SQL
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

// ─── Helpers ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const tenantFilter = args.find(a => a.startsWith('--tenant='))?.split('=')[1];
const doMigrate    = args.includes('--migrate');

function section(title: string) {
  console.log('\n' + '─'.repeat(60));
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}

function row(label: string, value: unknown) {
  const padded = String(label).padEnd(35, '.');
  console.log(`  ${padded} ${value}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔍  Namasoft ERP — Audit Log Health Check');
  console.log(`    Tenant filter: ${tenantFilter ?? 'ALL'}`);
  console.log(`    Timestamp:     ${new Date().toISOString()}`);

  // ── 1. Row Counts ──────────────────────────────────────────────────────────
  section('1 · Row Counts');

  const [auditCount] = await prisma.$queryRaw<[{ cnt: bigint }]>`
    SELECT COUNT(*)::bigint AS cnt FROM audit_log
    ${tenantFilter ? prisma.$queryRaw`WHERE tenant_id = ${tenantFilter}` : prisma.$queryRaw``}
  `;
  const [legacyCount] = await prisma.$queryRaw<[{ cnt: bigint }]>`
    SELECT COUNT(*)::bigint AS cnt FROM field_audit_logs
  `;

  row('audit_log (unified)',    Number(auditCount.cnt).toLocaleString());
  row('field_audit_logs (legacy)', Number(legacyCount.cnt).toLocaleString());
  row('Total combined',         (Number(auditCount.cnt) + Number(legacyCount.cnt)).toLocaleString());

  // ── 2. Recent Activity (last 24h) ──────────────────────────────────────────
  section('2 · Recent Activity (last 24 hours)');

  const recent = await prisma.$queryRaw<Array<{ action: string; cnt: bigint }>>`
    SELECT action, COUNT(*)::bigint AS cnt
    FROM audit_log
    WHERE created_at >= NOW() - INTERVAL '24 hours'
    ${tenantFilter ? prisma.$queryRaw`AND tenant_id = ${tenantFilter}` : prisma.$queryRaw``}
    GROUP BY action
    ORDER BY cnt DESC
  `;

  if (recent.length === 0) {
    console.log('  ⚠️  No audit entries in the last 24 hours!');
  } else {
    for (const r of recent) {
      row(`  ${r.action}`, Number(r.cnt).toLocaleString());
    }
  }

  // ── 3. Top Tables by Volume ────────────────────────────────────────────────
  section('3 · Top 10 Tables by Audit Volume');

  const topTables = await prisma.$queryRaw<Array<{ table_name: string; cnt: bigint }>>`
    SELECT table_name, COUNT(*)::bigint AS cnt
    FROM audit_log
    ${tenantFilter ? prisma.$queryRaw`WHERE tenant_id = ${tenantFilter}` : prisma.$queryRaw``}
    GROUP BY table_name
    ORDER BY cnt DESC
    LIMIT 10
  `;

  if (topTables.length === 0) {
    console.log('  (no data)');
  } else {
    for (const t of topTables) {
      row(`  ${t.table_name ?? '(unknown)'}`, Number(t.cnt).toLocaleString());
    }
  }

  // ── 4. Tables with Soft Deletes but No Audit ───────────────────────────────
  section('4 · Soft-Delete Tables Without Audit Coverage');

  const EXPECTED_AUDITED_TABLES = [
    'sales_invoices', 'purchase_invoices', 'journal_entries',
    'customers', 'employees', 'products', 'product_units',
    'sales_returns', 'purchase_invoices',
  ];

  const auditedTables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT DISTINCT table_name FROM audit_log
    ${tenantFilter ? prisma.$queryRaw`WHERE tenant_id = ${tenantFilter}` : prisma.$queryRaw``}
  `;
  const auditedSet = new Set(auditedTables.map(t => t.table_name));

  let gapFound = false;
  for (const table of EXPECTED_AUDITED_TABLES) {
    if (!auditedSet.has(table)) {
      console.log(`  ❌  ${table} — no audit trail found!`);
      gapFound = true;
    }
  }
  if (!gapFound) {
    console.log('  ✅  All expected tables have audit coverage.');
  }

  // ── 5. Data Integrity: Journal Balance Check ───────────────────────────────
  section('5 · Journal Balance Sanity Check');

  const [imbalance] = await prisma.$queryRaw<[{ max_diff: string | null }]>`
    SELECT MAX(ABS(total_debit - total_credit))::text AS max_diff
    FROM journal_entries
    WHERE status = 'posted'
    ${tenantFilter ? prisma.$queryRaw`AND tenant_id = ${tenantFilter}` : prisma.$queryRaw``}
  `;

  const maxDiff = parseFloat(imbalance.max_diff ?? '0');
  if (maxDiff > 0.01) {
    console.log(`  🔴  IMBALANCE DETECTED! Max diff = ${maxDiff.toFixed(4)}`);
    console.log('      Run reconciliation before any financial reports.');
  } else {
    console.log(`  ✅  All posted journal entries are balanced (max diff = ${maxDiff.toFixed(4)})`);
  }

  // ── 6. Optional: Run Migration ─────────────────────────────────────────────
  if (doMigrate) {
    section('6 · Running Legacy → Unified Migration');
    console.log('  Migrating field_audit_logs → audit_log ...');

    const migrated = await prisma.$executeRaw`
      INSERT INTO "audit_log" (
        "id", "tenant_id", "user_id", "action",
        "table_name", "record_id", "diff",
        "ip_address", "user_agent", "created_at"
      )
      SELECT
        gen_random_uuid()::text,
        COALESCE(f."tenantId", 'default'),
        f."userId",
        'UPDATE',
        f."entityType",
        f."entityId"::text,
        jsonb_build_object('field', f."fieldName", 'before', f."oldValue", 'after', f."newValue"),
        f."ipAddress",
        f."userAgent",
        f."changedAt"
      FROM "field_audit_logs" f
      WHERE NOT EXISTS (
        SELECT 1 FROM "audit_log" a
        WHERE a."table_name" = f."entityType"
          AND a."record_id"  = f."entityId"::text
          AND a."created_at" = f."changedAt"
          AND (a."diff"->>'field') = f."fieldName"
      )
      ON CONFLICT DO NOTHING
    `;

    console.log(`  ✅  Migrated ${migrated} rows from field_audit_logs → audit_log`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  section('Summary');
  console.log('  Run with --migrate to backfill legacy data.');
  console.log('  Run with --tenant=<id> to scope to a specific tenant.\n');

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('\n❌ Script failed:', err.message);
  await prisma.$disconnect();
  process.exit(1);
});
