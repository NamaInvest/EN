const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { machineIdSync } = require('node-machine-id');

let db;
let encryptionKey;

// Encryption helpers
const algorithm = 'aes-256-gcm';

function getEncryptionKey() {
    if (encryptionKey) return encryptionKey;
    try {
        const id = machineIdSync(true); // original machine id
        // Derive a 32-byte key from the machine id
        encryptionKey = crypto.scryptSync(id, 'NamasoftOfflineSalt2026!', 32);
        return encryptionKey;
    } catch (e) {
        console.error('Failed to generate machine-id key, using fallback');
        return crypto.scryptSync('fallback-id-123', 'NamasoftOfflineSalt2026!', 32);
    }
}

function encryptPayload(text) {
    const iv = crypto.randomBytes(16);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptPayload(encryptedText) {
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) return null;
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        const key = getEncryptionKey();
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        console.error('Decryption failed:', e.message);
        return null;
    }
}

function initDB(userDataPath) {
    try {
        const dbDir = path.join(userDataPath, 'NamasoftDB');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        const dbPath = path.join(dbDir, 'offline.sqlite');
        db = new Database(dbPath, { verbose: null }); // Set verbose: console.log for debugging

        // Initialize tables
        db.pragma('journal_mode = WAL');

        db.exec(`
            CREATE TABLE IF NOT EXISTS LocalProducts (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                barcode TEXT,
                sellPrice REAL,
                categoryId TEXT,
                categoryName TEXT,
                isTaxable INTEGER,
                taxRate REAL,
                dataPayload TEXT
            );

            CREATE TABLE IF NOT EXISTS PendingInvoices (
                uuid TEXT PRIMARY KEY,
                createdAt TEXT NOT NULL,
                total REAL NOT NULL,
                encryptedPayload TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                retryCount INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS OfflineSettings (
                key TEXT PRIMARY KEY,
                value TEXT
            );
        `);

        console.log('✅ Offline SQLite DB initialized at:', dbPath);
        return true;
    } catch (e) {
        console.error('❌ Failed to init SQLite DB:', e);
        return false;
    }
}

// --- Product Caching Methods ---
function saveLocalProducts(products) {
    if (!db) return false;
    try {
        const insert = db.prepare(`
            INSERT OR REPLACE INTO LocalProducts 
            (id, name, barcode, sellPrice, categoryId, categoryName, isTaxable, taxRate, dataPayload)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertMany = db.transaction((items) => {
            for (const item of items) {
                insert.run(
                    item.id, item.name, item.barcode || null, item.sellPrice || 0,
                    item.categoryId || null, item.categoryName || null,
                    item.isTaxable ? 1 : 0, item.taxRate || 15,
                    JSON.stringify(item)
                );
            }
        });

        insertMany(products);
        return true;
    } catch (e) {
        console.error('Failed to save local products:', e);
        return false;
    }
}

function searchLocalProducts(query) {
    if (!db) return [];
    try {
        let stmt;
        if (!query) {
            stmt = db.prepare(`SELECT dataPayload FROM LocalProducts LIMIT 100`);
            return stmt.all().map(r => JSON.parse(r.dataPayload));
        } else {
            // Search by barcode exact or name like
            stmt = db.prepare(`SELECT dataPayload FROM LocalProducts WHERE barcode = ? OR name LIKE ? LIMIT 50`);
            return stmt.all(query, `%${query}%`).map(r => JSON.parse(r.dataPayload));
        }
    } catch (e) {
        console.error('Search local products failed:', e);
        return [];
    }
}

function clearLocalProducts() {
    if (!db) return;
    db.exec(`DELETE FROM LocalProducts`);
}

// --- Invoice Sync Methods ---
function savePendingInvoice(invoiceData) {
    if (!db) return false;
    try {
        const uuid = crypto.randomUUID();
        const payloadString = JSON.stringify(invoiceData);
        const encrypted = encryptPayload(payloadString);

        const stmt = db.prepare(`
            INSERT INTO PendingInvoices (uuid, createdAt, total, encryptedPayload, status)
            VALUES (?, ?, ?, ?, 'pending')
        `);
        stmt.run(uuid, new Date().toISOString(), invoiceData.total || 0, encrypted);
        return uuid;
    } catch (e) {
        console.error('Failed to save pending invoice:', e);
        return false;
    }
}

function getPendingInvoices() {
    if (!db) return [];
    try {
        const stmt = db.prepare(`SELECT * FROM PendingInvoices WHERE status = 'pending'`);
        const rows = stmt.all();
        const results = [];
        for (const row of rows) {
            const decrypted = decryptPayload(row.encryptedPayload);
            if (decrypted) {
                results.push({
                    uuid: row.uuid,
                    createdAt: row.createdAt,
                    total: row.total,
                    retryCount: row.retryCount,
                    data: JSON.parse(decrypted)
                });
            }
        }
        return results;
    } catch (e) {
        console.error('Get pending invoices failed:', e);
        return [];
    }
}

function markInvoiceSynced(uuid) {
    if (!db) return false;
    try {
        const stmt = db.prepare(`UPDATE PendingInvoices SET status = 'synced' WHERE uuid = ?`);
        stmt.run(uuid);
        return true;
    } catch (e) {
        console.error('Mark invoice synced failed:', e);
        return false;
    }
}

function incrementInvoiceRetry(uuid) {
    if (!db) return false;
    try {
        const stmt = db.prepare(`UPDATE PendingInvoices SET retryCount = retryCount + 1 WHERE uuid = ?`);
        stmt.run(uuid);
        return true;
    } catch (e) {
        return false;
    }
}

function deleteSyncedInvoices() {
    if (!db) return;
    try {
        db.exec(`DELETE FROM PendingInvoices WHERE status = 'synced'`);
    } catch (e) {}
}

module.exports = {
    initDB,
    saveLocalProducts,
    searchLocalProducts,
    clearLocalProducts,
    savePendingInvoice,
    getPendingInvoices,
    markInvoiceSynced,
    incrementInvoiceRetry,
    deleteSyncedInvoices
};
