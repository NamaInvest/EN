/**
 * backup-databases.js
 * 
 * نسخ احتياطي شامل لجميع قواعد بيانات Nama Invest
 * يشمل: Fleet Server (46.4.188.170) + Server 1 + Server 2 + Server 3
 * 
 * الاستخدام:
 *   node backup-databases.js              — نسخة فورية لكل السيرفرات
 *   node backup-databases.js --fleet-only — Fleet Server فقط
 *   node backup-databases.js --setup-cron — تثبيت النسخ التلقائي على السيرفرات
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

// ==================== Server Configs ====================
const servers = {
  fleet: {
    name: 'Fleet Server (SaaS)',
    host: '46.4.188.170',
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
  },
  server1: {
    name: 'Server 1 (Hetzner)',
    host: '95.217.187.44',
    username: 'root',
    privateKey: 'C:\\Users\\1\\.ssh\\hetzner_key',
  },
  server2: {
    name: 'Server 2 (IONOS)',
    host: '204.168.144.74',
    username: 'root',
    privateKey: 'C:\\Users\\1\\Desktop\\namasoftkey\\namasoft_key',
  },
  server3: {
    name: 'Server 3',
    host: '185.197.195.202',
    username: 'root',
    privateKey: 'C:\\Users\\1\\.ssh\\id_ed25519_deploy',
  },
};

// ==================== SSH Helper ====================
function sshExec(server, cmd, timeout = 120000) {
  return new Promise((resolve, reject) => {
    const c = new Client();
    let output = '';
    const timer = setTimeout(() => {
      c.end();
      resolve(output || '(timeout)');
    }, timeout);

    const connOpts = {
      host: server.host,
      port: 22,
      username: server.username,
      readyTimeout: 10000,
    };

    if (server.password) {
      connOpts.password = server.password;
    } else if (server.privateKey) {
      try {
        connOpts.privateKey = fs.readFileSync(server.privateKey);
      } catch (e) {
        clearTimeout(timer);
        console.log(`  ⚠️  SSH key not found: ${server.privateKey} — skipping`);
        resolve('(key not found)');
        return;
      }
    }

    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        if (err) { clearTimeout(timer); c.end(); reject(err); return; }
        stream.on('data', d => { output += d.toString(); });
        stream.stderr.on('data', d => { output += d.toString(); });
        stream.on('close', () => { clearTimeout(timer); c.end(); resolve(output.trim()); });
      });
    });
    c.on('error', (err) => {
      clearTimeout(timer);
      console.log(`  ❌ SSH error: ${err.message}`);
      resolve('(connection error)');
    });
    c.connect(connOpts);
  });
}

// ==================== Backup Functions ====================
async function backupFleetServer() {
  const server = servers.fleet;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 بدء النسخ الاحتياطي — ${server.name} (${server.host})`);
  console.log(`${'='.repeat(60)}`);

  // 1. إنشاء مجلد النسخ الاحتياطي
  const backupDir = '/root/backups';
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = new Date().toISOString().slice(11, 16).replace(':', '');
  const backupFolder = `${backupDir}/${dateStr}_${timeStr}`;

  await sshExec(server, `mkdir -p ${backupFolder}`);
  console.log(`  📁 مجلد النسخة: ${backupFolder}`);

  // 2. اكتشاف جميع قواعد البيانات
  console.log(`  🔍 اكتشاف قواعد البيانات...`);
  const dbList = await sshExec(server, `su - postgres -c "psql -t -c \\"SELECT datname FROM pg_database WHERE datistemplate = false AND datname != 'postgres';\\""`);
  
  const databases = dbList.split('\n').map(d => d.trim()).filter(d => d && d.length > 0);
  console.log(`  📊 تم اكتشاف ${databases.length} قاعدة بيانات:`);
  databases.forEach(db => console.log(`     - ${db}`));

  // 3. نسخ كل قاعدة بيانات
  let successCount = 0;
  for (const db of databases) {
    process.stdout.write(`  💾 نسخ [${db}]... `);
    const dumpFile = `${backupFolder}/${db}.sql.gz`;
    const result = await sshExec(server, 
      `su - postgres -c "pg_dump ${db}" | gzip > ${dumpFile} && echo "OK:$(du -sh ${dumpFile} | cut -f1)" || echo "FAIL"`,
      180000
    );
    
    if (result.includes('OK:')) {
      const size = result.split('OK:')[1].trim();
      console.log(`✅ (${size})`);
      successCount++;
    } else {
      console.log(`❌ فشل`);
    }
  }

  // 4. حذف النسخ القديمة (أكثر من 7 أيام)
  console.log(`  🗑️  حذف النسخ الأقدم من 7 أيام...`);
  await sshExec(server, `find ${backupDir} -type d -mtime +7 -exec rm -rf {} + 2>/dev/null; echo "done"`);

  // 5. عرض المساحة المتبقية
  const diskSpace = await sshExec(server, `df -h / | tail -1 | awk '{print "المساحة المتبقية: " $4 " من " $2}'`);
  console.log(`  💽 ${diskSpace}`);

  console.log(`\n  ✅ اكتمل النسخ الاحتياطي: ${successCount}/${databases.length} قاعدة بيانات`);
  return { total: databases.length, success: successCount, path: backupFolder };
}

async function backupSingleServer(serverKey) {
  const server = servers[serverKey];
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 بدء النسخ الاحتياطي — ${server.name} (${server.host})`);
  console.log(`${'='.repeat(60)}`);

  const backupDir = '/root/backups';
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const backupFile = `${backupDir}/namadb_${dateStr}.sql.gz`;

  await sshExec(server, `mkdir -p ${backupDir}`);
  
  process.stdout.write(`  💾 نسخ [namadb]... `);
  const result = await sshExec(server,
    `PGPASSWORD=Nama2024secure pg_dump -U namasoft -h localhost namadb | gzip > ${backupFile} && echo "OK:$(du -sh ${backupFile} | cut -f1)" || echo "FAIL"`,
    180000
  );

  if (result.includes('OK:')) {
    const size = result.split('OK:')[1].trim();
    console.log(`✅ (${size})`);
  } else {
    console.log(`❌ فشل — ${result.slice(0, 100)}`);
  }

  // حذف القديم
  await sshExec(server, `find ${backupDir} -name "*.sql.gz" -mtime +7 -delete 2>/dev/null; echo "done"`);
  
  return { path: backupFile };
}

// ==================== Setup Auto Cron ====================
async function setupAutoCron() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`⏰ تثبيت النسخ الاحتياطي التلقائي (Cron Jobs)`);
  console.log(`${'='.repeat(60)}`);

  // -- Fleet Server --
  const server = servers.fleet;
  const cronScript = `#!/bin/bash
# Nama Invest — Automated Daily Backup
# يعمل يومياً الساعة 3 صباحاً

BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M)
FOLDER="$BACKUP_DIR/$DATE"
mkdir -p "$FOLDER"

# نسخ جميع قواعد البيانات
for DB in $(su - postgres -c "psql -t -c \\"SELECT datname FROM pg_database WHERE datistemplate = false AND datname != 'postgres';\\""); do
  DB_CLEAN=$(echo $DB | tr -d ' ')
  if [ -n "$DB_CLEAN" ]; then
    su - postgres -c "pg_dump $DB_CLEAN" | gzip > "$FOLDER/$DB_CLEAN.sql.gz"
  fi
done

# حذف النسخ الأقدم من 30 يوم
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} + 2>/dev/null

echo "[$(date)] Backup completed: $FOLDER" >> /root/backups/backup.log
`;

  console.log(`  📝 تثبيت سكربت النسخ الاحتياطي على Fleet Server...`);
  
  // كتابة السكربت
  await sshExec(server, `cat > /root/backup-all-dbs.sh << 'ENDSCRIPT'
${cronScript}
ENDSCRIPT
chmod +x /root/backup-all-dbs.sh`);

  // إضافة Cron Job (الساعة 3 صباحاً يومياً)
  const cronExists = await sshExec(server, `crontab -l 2>/dev/null | grep backup-all-dbs || echo "NOT_FOUND"`);
  
  if (cronExists.includes('NOT_FOUND')) {
    await sshExec(server, `(crontab -l 2>/dev/null; echo "0 3 * * * /root/backup-all-dbs.sh") | crontab -`);
    console.log(`  ✅ تم إضافة Cron Job — يعمل يومياً الساعة 3:00 صباحاً`);
  } else {
    console.log(`  ℹ️  Cron Job موجود مسبقاً`);
  }

  // التحقق
  const cronList = await sshExec(server, `crontab -l 2>/dev/null | grep backup`);
  console.log(`  📋 Cron: ${cronList}`);
}

// ==================== Main ====================
async function main() {
  const args = process.argv.slice(2);
  const startTime = Date.now();
  
  console.log(`\n🛡️  نظام النسخ الاحتياطي — Nama Invest ERP`);
  console.log(`📅 ${new Date().toLocaleDateString('ar-SA')} — ${new Date().toLocaleTimeString('ar-SA')}`);

  if (args.includes('--setup-cron')) {
    await setupAutoCron();
    return;
  }

  const fleetOnly = args.includes('--fleet-only');

  // 1. Fleet Server (الأهم — يحتوي SaaS + جميع المستأجرين)
  const fleetResult = await backupFleetServer();

  if (!fleetOnly) {
    // 2. Server 1
    await backupSingleServer('server1');
    
    // 3. Server 2
    await backupSingleServer('server2');
    
    // 4. Server 3
    await backupSingleServer('server3');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏆 اكتمل النسخ الاحتياطي في ${elapsed} ثانية`);
  console.log(`${'='.repeat(60)}\n`);
}

main().catch(console.error);
