$env:DISPLAY="dummy"
$env:SSH_ASKPASS="d:\namasoft9-3-main\askpass.bat"
$env:SSH_ASKPASS_REQUIRE="force"

Write-Output "Syncing Staged Bank Files to VPS..."
scp -o StrictHostKeyChecking=no -r "d:\namasoft9-3-main\staging_banks" root@185.197.195.202:/var/www/namasoft/staging_banks

Write-Output "Running Deployment Script on Server..."
ssh -o StrictHostKeyChecking=no root@185.197.195.202 "sed -i 's/\r//' /var/www/namasoft/staging_banks/deploy_banking_vps.sh && chmod +x /var/www/namasoft/staging_banks/deploy_banking_vps.sh && /var/www/namasoft/staging_banks/deploy_banking_vps.sh"

Write-Output "Done!"
