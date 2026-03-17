@echo off
set DISPLAY=dummy
set SSH_ASKPASS=d:\namasoft9-3-main\askpass.bat
set SSH_ASKPASS_REQUIRE=force

echo Syncing Sidebar...
scp -o StrictHostKeyChecking=no "d:\namasoft9-3-main\src\components\Sidebar.tsx" root@185.197.195.202:/var/www/namasoft/src/components/Sidebar.tsx

echo Syncing i18n...
scp -o StrictHostKeyChecking=no "d:\namasoft9-3-main\src\lib\i18n.tsx" root@185.197.195.202:/var/www/namasoft/src/lib/i18n.tsx

echo Syncing API route...
ssh -o StrictHostKeyChecking=no root@185.197.195.202 "mkdir -p /var/www/namasoft/src/app/api/shifts"
scp -o StrictHostKeyChecking=no "d:\namasoft9-3-main\src\app\api\shifts\route.ts" root@185.197.195.202:/var/www/namasoft/src/app/api/shifts/route.ts

echo Syncing UI Page...
ssh -o StrictHostKeyChecking=no root@185.197.195.202 "mkdir -p /var/www/namasoft/src/app/\(dashboard\)/shifts"
scp -o StrictHostKeyChecking=no "d:\namasoft9-3-main\src\app\(dashboard)\shifts\page.tsx" root@185.197.195.202:/var/www/namasoft/src/app/\(dashboard\)/shifts/page.tsx

echo Rebuilding Next.js and Restarting PM2 on Server...
ssh -o StrictHostKeyChecking=no root@185.197.195.202 "cd /var/www/namasoft && npm run build && pm2 restart namasoft"

echo Done!
