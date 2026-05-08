import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting AuditLog data migration...');

  try {
    try {
      const result = await prisma.$executeRawUnsafe(`
        INSERT INTO audit_log (id, tenant_id, user_id, table_name, record_id, action, diff, created_at)
        SELECT 
          gen_random_uuid(), 
          tenant_id, 
          changed_by, 
          table_name, 
          record_id, 
          'UPDATE',
          jsonb_build_object('field', field_name, 'before', old_value, 'after', new_value),
          changed_at
        FROM "field_audit_trails"
        ON CONFLICT DO NOTHING;
      `);
      console.log(`Migrated ${result} records from FieldAuditTrail.`);
    } catch (err: any) {
      console.log('Error migrating FieldAuditTrail:', err.message);
    }

    try {
      const result2 = await prisma.$executeRawUnsafe(`
        INSERT INTO audit_log (id, tenant_id, user_id, table_name, record_id, action, diff, created_at)
        SELECT 
          id, 
          tenant_id, 
          user_id, 
          table_name, 
          record_id, 
          action, 
          diff, 
          created_at
        FROM "field_audit_logs"
        ON CONFLICT DO NOTHING;
      `);
      console.log(`Migrated ${result2} records from FieldAuditLog.`);
    } catch (err: any) {
      console.log('Error migrating FieldAuditLog:', err.message);
    }

    console.log('Migration completed.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
