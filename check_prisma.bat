@echo off
set DISPLAY=dummy
set SSH_ASKPASS=d:\namasoft9-3-main\askpass.bat
set SSH_ASKPASS_REQUIRE=force
ssh -o StrictHostKeyChecking=no root@185.197.195.202 "cd /var/www/namasoft && npx prisma validate --schema=prisma/schema_new.prisma"
