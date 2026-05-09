#!/bin/bash
# ============================================================
# Nama Invest — Daily Automated Backup Script
# ============================================================
# يُنشئ نسخ احتياطية يومية لقواعد البيانات مع rotation تلقائي.
#
# الإعداد على السيرفر:
#   chmod +x /www/wwwroot/namainvist.com/scripts/daily-backup.sh
#   crontab -e
#   # ثم أضف:
#   0 2 * * * /www/wwwroot/namainvist.com/scripts/daily-backup.sh >> /var/log/nama-backup.log 2>&1
# ============================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
BACKUP_DIR="/var/backups/namasoft"
RETENTION_DAYS=7                    # احتفظ بنسخ 7 أيام
PG_HOST="localhost"
PG_PORT="5432"
PG_USER="postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')] [BACKUP]"

# قواعد البيانات الإنتاجية (tenant databases)
DATABASES=("n11_db" "n1_db")

# ── Functions ──────────────────────────────────────────────────────────────────
log() { echo "$LOG_PREFIX $*"; }

check_disk_space() {
    local available_mb
    available_mb=$(df -m "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    if [ "$available_mb" -lt 500 ]; then
        log "⚠️  WARNING: Low disk space (${available_mb}MB available) — skipping backup"
        exit 1
    fi
    log "✓ Disk space OK: ${available_mb}MB available"
}

backup_database() {
    local db="$1"
    local output_file="${BACKUP_DIR}/${db}_${TIMESTAMP}.sql.gz"

    log "→ Backing up: $db"
    if PGPASSWORD="" sudo -u postgres pg_dump \
        -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" \
        -Fc --compress=9 "$db" | gzip -c > "$output_file" 2>/dev/null; then
        local size_mb
        size_mb=$(du -m "$output_file" | cut -f1)
        log "  ✅ $db → $output_file (${size_mb}MB)"
    else
        log "  ❌ FAILED: $db"
        rm -f "$output_file"
        return 1
    fi
}

cleanup_old_backups() {
    log "→ Cleaning up backups older than ${RETENTION_DAYS} days..."
    local count=0
    while IFS= read -r -d '' file; do
        rm -f "$file"
        ((count++))
    done < <(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -print0)
    log "  ✓ Removed $count old backup(s)"
}

verify_backup() {
    local db="$1"
    local output_file="${BACKUP_DIR}/${db}_${TIMESTAMP}.sql.gz"
    if [ -f "$output_file" ] && [ -s "$output_file" ]; then
        log "  ✓ Verification OK: $db ($(du -h "$output_file" | cut -f1))"
        return 0
    else
        log "  ❌ Verification FAILED: $db"
        return 1
    fi
}

send_alert() {
    local message="$1"
    # إرسال تنبيه عبر Telegram إذا كان BOT_TOKEN متاحاً
    local bot_token="${TELEGRAM_BOT_TOKEN:-}"
    local chat_id="${TELEGRAM_CHAT_ID:-}"

    if [ -n "$bot_token" ] && [ -n "$chat_id" ]; then
        curl -s -X POST "https://api.telegram.org/bot${bot_token}/sendMessage" \
            -d "chat_id=${chat_id}" \
            -d "text=🔴 Nama Backup Alert: ${message}" \
            --max-time 10 > /dev/null 2>&1 || true
    fi
}

# ── Main ───────────────────────────────────────────────────────────────────────
log "======================================================="
log "🚀 Nama Invest — Backup Started"
log "======================================================="

# إنشاء مجلد النسخ الاحتياطية
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# فحص المساحة المتاحة
check_disk_space

# نسخ احتياطي لكل قاعدة بيانات
FAILED=0
for DB in "${DATABASES[@]}"; do
    if ! backup_database "$DB"; then
        FAILED=$((FAILED + 1))
        send_alert "Backup FAILED for database: $DB"
    else
        verify_backup "$DB"
    fi
done

# تنظيف النسخ القديمة
cleanup_old_backups

# التقرير النهائي
log "======================================================="
if [ "$FAILED" -eq 0 ]; then
    log "✅ Backup completed successfully (${#DATABASES[@]} databases)"
    # قائمة النسخ الحالية
    log "📦 Current backups:"
    find "$BACKUP_DIR" -name "*.sql.gz" -newer /tmp -printf "  %f (%s bytes)\n" 2>/dev/null || true
else
    log "❌ Backup completed with $FAILED failure(s)"
    send_alert "Backup job completed with $FAILED failure(s) at $TIMESTAMP"
    exit 1
fi
log "======================================================="
