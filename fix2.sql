ALTER TABLE "desktop_licenses" DROP CONSTRAINT IF EXISTS "desktop_licenses_subdomain_key" CASCADE;
ALTER TABLE "desktop_licenses" DROP CONSTRAINT IF EXISTS "desktop_licenses_license_key_key" CASCADE;
DROP TABLE IF EXISTS "desktop_licenses" CASCADE;
DROP TABLE IF EXISTS "desktop_backups" CASCADE;
