#!/bin/bash
echo "=== NAMA DATABASE BACKUP ==="
BACKUP_DIR="/var/backups/namasoft"
DATE=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/namadb_$DATE.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
chown postgres:postgres "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "Running pg_dump..."
sudo -u postgres pg_dump namadb | gzip > "$FILENAME"

if [ $? -eq 0 ]; then
    echo "✅ Backup successful: $FILENAME"
    ls -lh "$FILENAME"
    
    # Keep only last 7 days of backups
    echo "Cleaning up old backups (older than 7 days)..."
    find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -delete
else
    echo "❌ Backup failed!"
    exit 1
fi

echo "=== BACKUP COMPLETE ==="
