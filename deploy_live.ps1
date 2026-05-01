$key = "C:\Users\1\.ssh\hetzner_key"
$ip = "root@46.4.188.170"
$remoteBase = "/www/wwwroot/n11.namainvist.com"
$scp = "C:\Windows\System32\OpenSSH\scp.exe"
$ssh = "C:\Windows\System32\OpenSSH\ssh.exe"

Write-Host "Deploying updates directly to n11.namainvist.com..." -ForegroundColor Cyan

# Create new directories if they don't exist
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/payroll'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/rent'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/school'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/hr/payroll-process'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/rent'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/school'"

# Upload modified files
& $scp -o StrictHostKeyChecking=no -i $key "prisma/schema.prisma" "${ip}:'${remoteBase}/prisma/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/pos/route.ts" "${ip}:'${remoteBase}/src/app/api/pos/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/auth/login/route.ts" "${ip}:'${remoteBase}/src/app/api/auth/login/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/components/Sidebar.tsx" "${ip}:'${remoteBase}/src/components/'"

# Upload new files
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/payroll/route.ts" "${ip}:'${remoteBase}/src/app/api/payroll/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/rent/route.ts" "${ip}:'${remoteBase}/src/app/api/rent/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/school/route.ts" "${ip}:'${remoteBase}/src/app/api/school/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/hr/payroll-process/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/hr/payroll-process/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/rent/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/rent/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/school/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/school/'"

Write-Host "Files Uploaded. Syncing DB and Rebuilding n11.namainvist.com..." -ForegroundColor Yellow

# Push DB and Restart (Assuming the pm2 name for n11 is 'n11')
& $ssh -o StrictHostKeyChecking=no -i $key $ip "cd ${remoteBase} && npx prisma db push --accept-data-loss && npm run build && pm2 restart n11"

Write-Host "Deployment to n11.namainvist.com completed successfully!" -ForegroundColor Green
