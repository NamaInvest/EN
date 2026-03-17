-- Insert users (without branch_id)
INSERT INTO users (id, username, password_hash, full_name, role, phone, active, session_token, created_at) VALUES
(1, 'admin', '\\\.BPhvo8i2w/qOJc9Mtv67AMpF5T1TiL1kqyW1D5AoXTq', 'مدير النظام', 'admin', '', true, NULL, '2026-03-09 00:13:43.604'),
(2, '1', '\\\.kdLvbR3YIx5fnuodc57nHIl0wMCHrFIWKeNyT.v8gPOPe', '1', 'cashier', '', true, NULL, '2026-03-09 01:28:14.868'),
(3, '2', '\\\.y1DFDn2wYlf3xjkJydAmv2rm', '2', 'cashier', '', true, NULL, '2026-03-09 01:28:48.051')
ON CONFLICT (id) DO NOTHING;
SELECT setval('users_id_seq', 3);

-- Insert stocks (without branch_id)
DELETE FROM stocks;
INSERT INTO stocks (id, name, address) VALUES (1, 'المستودع الرئيسي', '');
SELECT setval('stocks_id_seq', 1);

-- Insert expenses (without branch_id)
INSERT INTO expenses (id, date, category, description, amount) VALUES
(2, '2026-03-10 23:03:33.463', NULL, 'حسين', 2000),
(3, '2026-03-11 13:44:16.241', NULL, 'إيجار ناصر', 1000),
(4, '2026-03-11 18:29:16.394', NULL, 'تسجيل ات  ابراهي', 6000)
ON CONFLICT (id) DO NOTHING;
SELECT setval('expenses_id_seq', 4);

-- Insert treasury (without branch_id)
INSERT INTO treasury (id, date, type, amount, description, reference_type) VALUES
(2, '2026-03-10 23:03:33.468', 'out', 2000, 'مصروف: حسين (تلجرام)', 'expense'),
(3, '2026-03-11 13:44:16.245', 'out', 1000, 'مصروف: إيجار ناصر (تلجرام)', 'expense'),
(4, '2026-03-11 18:29:16.398', 'out', 6000, 'مصروف: تسجيل ات  ابراهي (تلجرام)', 'expense')
ON CONFLICT (id) DO NOTHING;
SELECT setval('treasury_id_seq', 4);

-- Now insert user_permissions for all 3 users
-- Get permissions from seed
INSERT INTO user_permissions (user_id, module, can_view, can_add, can_edit, can_delete, can_print)
SELECT u.id, m.module, true, true, true, true, true
FROM users u
CROSS JOIN (VALUES ('sales'), ('purchases'), ('products'), ('customers'), ('stock'), ('treasury'), ('expenses'), ('reports'), ('employees'), ('settings'), ('accounting'), ('promotions'), ('sales-returns'), ('purchase-returns'), ('stock-transfers'), ('maintenance'), ('installments'), ('barcode'), ('bookings'), ('price-quotes')) AS m(module)
WHERE u.role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO user_permissions (user_id, module, can_view, can_add, can_edit, can_delete, can_print)
SELECT u.id, m.module, true, true, true, true, true
FROM users u
CROSS JOIN (VALUES ('sales'), ('purchases'), ('products'), ('customers'), ('stock'), ('treasury'), ('expenses'), ('reports'), ('employees'), ('settings'), ('accounting'), ('promotions'), ('sales-returns'), ('purchase-returns'), ('stock-transfers'), ('maintenance'), ('installments'), ('barcode'), ('bookings'), ('price-quotes')) AS m(module)
WHERE u.role = 'cashier'
ON CONFLICT DO NOTHING;
