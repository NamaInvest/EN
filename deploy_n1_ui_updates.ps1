$key = "C:\Users\1\.ssh\hetzner_key"
$ip = "root@46.4.188.170"
$remoteBase = "/www/wwwroot/n1.namainvist.com"
$scp = "C:\Windows\System32\OpenSSH\scp.exe"
$ssh = "C:\Windows\System32\OpenSSH\ssh.exe"

Write-Host "Deploying UI & 2026 Date updates to n1.namainvist.com (Master Template)..." -ForegroundColor Cyan

# Ensure directories exist
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/accounting/dunning'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/hr/gosi'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/hr/wps'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/purchases/three-way-match'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/settings/bpm'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/treasury/cash-flow'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/treasury/bank-recon'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/reports/zatca-vat'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/reports/zatca-vat'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/purchases/three-way-match'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/hr/gosi'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/hr/wps'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/treasury/bank-recon'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/accounting/revenue-recognition'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/api/accounting/leases'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/enterprise/quality'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/enterprise/fleet'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/accounting/revenue-recognition'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/accounting/leases'"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p '${remoteBase}/src/app/(dashboard)/sales/history'"

# Upload files
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
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/enterprise/quality/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/enterprise/quality/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/enterprise/fleet/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/enterprise/fleet/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/accounting/revenue-recognition/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/accounting/revenue-recognition/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/accounting/leases/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/accounting/leases/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/sales/history/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/sales/history/'"

Write-Host "Files Uploaded. Rebuilding n1.namainvist.com..." -ForegroundColor Yellow

# Rebuild and restart
& $ssh -o StrictHostKeyChecking=no -i $key $ip "cd ${remoteBase} && npm run build && pm2 restart n1-main"

Write-Host "Deployment to N1 completed!" -ForegroundColor Green
