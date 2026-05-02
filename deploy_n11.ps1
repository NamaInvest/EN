$key = "C:\Users\1\.ssh\hetzner_key"
$ip = "root@46.4.188.170"
$remoteBase = "/www/wwwroot/n11.namainvist.com"
$scp = "C:\Windows\System32\OpenSSH\scp.exe"
$ssh = "C:\Windows\System32\OpenSSH\ssh.exe"

Write-Host "Creating archive of changed files..."
tar -czf update_n11.tar.gz prisma/schema.prisma src

Write-Host "Uploading archive..."
& $scp -o StrictHostKeyChecking=no -i $key "update_n11.tar.gz" "${ip}:${remoteBase}/update_n11.tar.gz"

Write-Host "Extracting and building on server..."
& $ssh -o StrictHostKeyChecking=no -i $key $ip "cd ${remoteBase} && tar -xzf update_n11.tar.gz && rm update_n11.tar.gz && npx prisma format && npx prisma generate && npx prisma db push --accept-data-loss && npm run build && pm2 restart n11"

Write-Host "Done!"
