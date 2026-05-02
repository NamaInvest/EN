$key = "C:\Users\1\.ssh\hetzner_key"
$ip = "root@46.4.188.170"
$remoteBase = "/www/wwwroot/n11.namainvist.com"
$scp = "C:\Windows\System32\OpenSSH\scp.exe"
$ssh = "C:\Windows\System32\OpenSSH\ssh.exe"

Write-Host "Deploying UI & 2026 Date updates to n11.namainvist.com..." -ForegroundColor Cyan

# Ensure directories exist
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

# Upload files
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/accounting/dunning/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/accounting/dunning/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/hr/gosi/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/hr/gosi/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/hr/wps/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/hr/wps/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/purchases/three-way-match/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/purchases/three-way-match/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/settings/bpm/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/settings/bpm/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/treasury/cash-flow/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/treasury/cash-flow/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/treasury/bank-recon/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/treasury/bank-recon/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/reports/zatca-vat/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/reports/zatca-vat/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/enterprise/quality/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/enterprise/quality/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/enterprise/fleet/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/enterprise/fleet/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/accounting/revenue-recognition/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/accounting/revenue-recognition/'"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/accounting/leases/page.tsx" "${ip}:'${remoteBase}/src/app/(dashboard)/accounting/leases/'"

Write-Host "Files Uploaded. Rebuilding n11.namainvist.com..." -ForegroundColor Yellow

# Rebuild and restart
& $ssh -o StrictHostKeyChecking=no -i $key $ip "cd ${remoteBase} && npm run build && pm2 restart n11"

Write-Host "Deployment completed!" -ForegroundColor Green
