#!/bin/bash
# Backup Automation - pgBackRest Setup Script
# Run this on the Hetzner Production VPS

echo "Setting up pgBackRest for Namasoft ERP..."

# Install pgbackrest
sudo apt-get update
sudo apt-get install -y pgbackrest awscli

# Configure pgbackrest
cat <<EOF | sudo tee /etc/pgbackrest/pgbackrest.conf
[global]
repo1-path=/var/lib/pgbackrest
repo1-retention-full=7
repo1-retention-diff=14
repo1-cipher-pass=YOUR_SECURE_CIPHER_PASS_HERE
repo1-cipher-type=aes-256-cbc
process-max=4
log-level-console=info
start-fast=y

[namasoft-prod]
pg1-path=/var/lib/postgresql/data
pg1-port=5432
pg1-user=postgres
EOF

# Initialize stanza
sudo -u postgres pgbackrest --stanza=namasoft-prod stanza-create
sudo -u postgres pgbackrest --stanza=namasoft-prod check

# Set up cron jobs for automated backups
(crontab -l 2>/dev/null; echo "0 2 * * * pgbackrest --stanza=namasoft-prod --type=full backup") | crontab -
(crontab -l 2>/dev/null; echo "0 */6 * * * pgbackrest --stanza=namasoft-prod --type=diff backup") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * * aws s3 sync /var/lib/pgbackrest s3://namasoft-backups/\$(date +\%Y\%m\%d)") | crontab -

echo "pgBackRest setup complete and cron jobs scheduled!"
