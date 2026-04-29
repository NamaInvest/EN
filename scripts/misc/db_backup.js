const { exec } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Nama Invest 4.0: Military-grade Encrypted Database Backup
// This script runs pg_dump, compresses it, and encrypts it via AES-256 for disaster recovery

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:password123@localhost:5432/namasoft";
const BACKUP_DIR = path.join(__dirname, 'backups');
const ENCRYPTION_KEY = crypto.scryptSync(process.env.BACKUP_SECRET_KEY || 'NAMA_SUPER_SECRET_2026', 'salt', 32);
const IV = crypto.randomBytes(16);

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function runBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rawSqlFile = path.join(BACKUP_DIR, `nama_dump_${timestamp}.sql`);
    const encryptedFile = path.join(BACKUP_DIR, `nama_secure_${timestamp}.enc`);

    console.log(`[Backup Agent] Starting Database Dump -> ${rawSqlFile}`);
    
    // 1. Dump Database
    // Note: requires `pg_dump` accessible on the server or container
    exec(`pg_dump "${DB_URL}" > "${rawSqlFile}"`, (err, stdout, stderr) => {
        if (err) {
            console.error('[Backup Agent] Error dumping database. Make sure pg_dump is installed.', err.message);
            return;
        }

        console.log(`[Backup Agent] Dump successful. Encrypting with AES-256-CBC...`);

        // 2. Encrypt
        try {
            const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
            const input = fs.createReadStream(rawSqlFile);
            const output = fs.createWriteStream(encryptedFile);

            // Write IV at the beginning of the file for decryption later
            output.write(IV);

            input.pipe(cipher).pipe(output).on('finish', () => {
                console.log(`[Backup Agent] Encryption complete -> ${encryptedFile}`);
                
                // 3. Cleanup raw vulnerable SQL
                fs.unlinkSync(rawSqlFile);
                console.log(`[Backup Agent] Raw SQL file destroyed. Backup secured.`);
                
                // 4. Cleanup old backups (Keep only last 7 days)
                cleanupOldBackups();
            });
        } catch(e) {
            console.error('[Backup Agent] Encryption failed', e);
        }
    });
}

function cleanupOldBackups() {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    let deletedCount = 0;
    files.forEach(file => {
        if (file.endsWith('.enc')) {
            const filePath = path.join(BACKUP_DIR, file);
            const stat = fs.statSync(filePath);
            if (now - stat.mtimeMs > SEVEN_DAYS) {
                fs.unlinkSync(filePath);
                deletedCount++;
            }
        }
    });
    if (deletedCount > 0) {
       console.log(`[Backup Agent] Deleted ${deletedCount} old backups.`);
    }
}

// Check if running directly
if (require.main === module) {
    runBackup();
}

module.exports = { runBackup };
