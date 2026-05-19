#!/bin/bash
# Server Backup Script for Nama Invest (Production)
DATE_STR=$(date +"%Y%m%d-%H%M%S")
BACKUP_DIR="/www/wwwroot/namasoft-backups/$DATE_STR"
APP_DIR="/www/wwwroot/namainvist.com"

echo "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

echo "1. Backing up Main Site Database (n11_db)..."
sudo -u postgres pg_dump -h localhost -p 5432 -F c -d n11_db -f "$BACKUP_DIR/n11_db.backup"

echo "2. Backing up Tenant Database (n1_db)..."
sudo -u postgres pg_dump -h localhost -p 5432 -F c -d n1_db -f "$BACKUP_DIR/n1_db.backup"

echo "3. Backing up Codebase and Dashboards..."
tar --exclude="$APP_DIR/node_modules" --exclude="$APP_DIR/.next" --exclude="$APP_DIR/.git" -czf "$BACKUP_DIR/codebase_and_dashboards.tar.gz" -C /www/wwwroot namainvist.com

echo "4. Backup completed!"
echo "Files are located in: $BACKUP_DIR"
ls -lh "$BACKUP_DIR"
