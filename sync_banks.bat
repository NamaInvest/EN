@echo off
set DISPLAY=dummy
set SSH_ASKPASS=d:\namasoft9-3-main\askpass.bat
set SSH_ASKPASS_REQUIRE=force

echo Syncing Staged Bank Files to VPS...
scp -o StrictHostKeyChecking=no -r "d:\namasoft9-3-main\staging_banks" root@185.197.195.202:/var/www/namasoft/staging_banks

echo Running Deployment Script on Server...
ssh -o StrictHostKeyChecking=no root@185.197.195.202 "chmod +x /var/www/namasoft/staging_banks/deploy_banking_vps.sh && dos2unix /var/www/namasoft/staging_banks/deploy_banking_vps.sh && /var/www/namasoft/staging_banks/deploy_banking_vps.sh"

echo Done!
