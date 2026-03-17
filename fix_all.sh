#!/bin/bash

# 1. Add missing permissions for all users
echo "=== Adding missing permissions ==="
sudo -u postgres psql -d namadb << 'SQL'
-- Add manage_users and manage_permissions for admin
INSERT INTO user_permissions (user_id, module, can_view, can_add, can_edit, can_delete, can_print)
SELECT u.id, m.module, true, true, true, true, true
FROM users u
CROSS JOIN (VALUES ('manage_users'), ('manage_permissions'), ('vacations'), ('attendance'), ('salaries'), ('stocktake'), ('purchase-orders')) AS m(module)
WHERE u.role = 'admin'
ON CONFLICT DO NOTHING;

-- Add manage_users for cashiers too (optional, up to admin later)
-- But generally cashiers shouldn't manage users, so skip

-- Check permissions
SELECT user_id, count(*) as perm_count FROM user_permissions GROUP BY user_id ORDER BY user_id;
SELECT module FROM user_permissions WHERE user_id = 1 ORDER BY module;
SQL

# 2. Create zatca_settings table if not exists
echo ""
echo "=== Creating zatca_settings table ==="
sudo -u postgres psql -d namadb << 'SQL'
CREATE TABLE IF NOT EXISTS zatca_settings (
    id SERIAL PRIMARY KEY,
    company_name TEXT,
    company_name_en TEXT,
    vat_number TEXT,
    building_number TEXT,
    street TEXT,
    district TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'SA',
    otp TEXT,
    csr TEXT,
    private_key TEXT,
    compliance_request_id TEXT,
    compliance_certificate TEXT,
    compliance_secret TEXT,
    production_request_id TEXT,
    production_certificate TEXT,
    production_secret TEXT,
    is_onboarded BOOLEAN DEFAULT false,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
SELECT 'zatca_settings table created' AS status;
SQL

echo ""
echo "=== Verifying ==="
sudo -u postgres psql -d namadb -c "SELECT relname AS table, n_live_tup AS rows FROM pg_stat_user_tables WHERE n_live_tup > 0 ORDER BY n_live_tup DESC;"
