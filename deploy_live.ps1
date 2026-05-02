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

# New Modules
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/accounting/dunning'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/hr/gosi'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/hr/wps'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/purchases/three-way-match'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/settings/bpm'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/treasury/cash-flow'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/treasury/bank-recon'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/reports/zatca-vat'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/enterprise/quality'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/enterprise/fleet'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/accounting/revenue-recognition'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/accounting/leases'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/sales/history'"

& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/reports/zatca-vat'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/purchases/three-way-match'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/hr/gosi'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/hr/wps'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/treasury/bank-recon'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/accounting/revenue-recognition'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/accounting/leases'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/enterprise/quality'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/enterprise/fleet'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/settings/bpm'"


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

# Upload New Modules
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/accounting/dunning/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/accounting/dunning/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/hr/gosi/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/hr/gosi/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/hr/wps/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/hr/wps/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/purchases/three-way-match/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/purchases/three-way-match/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/settings/bpm/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/settings/bpm/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/treasury/cash-flow/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/treasury/cash-flow/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/treasury/bank-recon/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/treasury/bank-recon/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/reports/zatca-vat/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/reports/zatca-vat/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/reports/zatca-vat/route.ts" "${ip}:'${remoteBase}/src/app/api/reports/zatca-vat/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/purchases/three-way-match/route.ts" "${ip}:'${remoteBase}/src/app/api/purchases/three-way-match/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/hr/gosi/route.ts" "${ip}:'${remoteBase}/src/app/api/hr/gosi/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/hr/wps/route.ts" "${ip}:'${remoteBase}/src/app/api/hr/wps/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/treasury/bank-recon/route.ts" "${ip}:'${remoteBase}/src/app/api/treasury/bank-recon/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/accounting/revenue-recognition/route.ts" "${ip}:'${remoteBase}/src/app/api/accounting/revenue-recognition/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/accounting/leases/route.ts" "${ip}:'${remoteBase}/src/app/api/accounting/leases/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/enterprise/quality/route.ts" "${ip}:'${remoteBase}/src/app/api/enterprise/quality/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/enterprise/fleet/route.ts" "${ip}:'${remoteBase}/src/app/api/enterprise/fleet/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/settings/bpm/route.ts" "${ip}:'${remoteBase}/src/app/api/settings/bpm/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/enterprise/quality/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/enterprise/quality/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/enterprise/fleet/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/enterprise/fleet/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/accounting/revenue-recognition/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/accounting/revenue-recognition/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/accounting/leases/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/accounting/leases/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/sales/history/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/sales/history/'"

Write-Host "Files Uploaded. Syncing DB and Rebuilding n11.namainvist.com..." -ForegroundColor Yellow

# Push DB and Restart (Assuming the pm2 name for n11 is 'n11')
& $ssh -o StrictHostKeyChecking=no -i $key $ip "cd ${remoteBase} && npx prisma db push --accept-data-loss && npm run build && pm2 restart n11"

Write-Host "Deployment to n11.namainvist.com completed successfully!" -ForegroundColor Green
