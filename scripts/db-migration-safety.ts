import fs from 'fs';
import path from 'path';

// Check Prisma migration files for destructive operations
function checkMigrationSafety() {
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found. Skipping.');
    return;
  }

  const migrations = fs.readdirSync(migrationsDir).filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory());
  
  // We only check the most recent migration to avoid failing on old historical migrations
  if (migrations.length === 0) return;
  
  migrations.sort();
  const latestMigration = migrations[migrations.length - 1];
  const sqlFile = path.join(migrationsDir, latestMigration, 'migration.sql');

  if (fs.existsSync(sqlFile)) {
    const sql = fs.readFileSync(sqlFile, 'utf8').toUpperCase();
    
    let isUnsafe = false;
    const errors: string[] = [];

    if (sql.includes('DROP TABLE')) {
      isUnsafe = true;
      errors.push('DROP TABLE detected. This is destructive and requires manual intervention.');
    }

    if (sql.includes('DROP COLUMN')) {
      isUnsafe = true;
      errors.push('DROP COLUMN detected. Please use the expand/contract zero-downtime migration pattern instead.');
    }

    if (sql.includes('ALTER COLUMN') && sql.includes('SET NOT NULL') && !sql.includes('DEFAULT')) {
      isUnsafe = true;
      errors.push('Adding NOT NULL constraint without DEFAULT value can cause deployment failure if table has data.');
    }

    if (isUnsafe) {
      console.error(`🚨 UNSAFE MIGRATION DETECTED in ${latestMigration} 🚨`);
      errors.forEach(e => console.error(`- ${e}`));
      process.exit(1);
    } else {
      console.log(`✅ Migration ${latestMigration} passed safety checks.`);
    }
  }
}

checkMigrationSafety();
