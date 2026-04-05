$key = "C:\Users\1\.ssh\hetzner_key"
$ip = "root@46.4.188.170"
$remoteBase = "/www/wwwroot/n1.namainvist.com"
$scp = "C:\Windows\System32\OpenSSH\scp.exe"
$ssh = "C:\Windows\System32\OpenSSH\ssh.exe"

& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p ${remoteBase}/src/app/api/units"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p ${remoteBase}/src/app/kiosk/attendance"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p ${remoteBase}/src/app/(dashboard)/hr/evaluations"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p ${remoteBase}/src/app/(dashboard)/hr/training"

& $scp -o StrictHostKeyChecking=no -i $key "prisma/schema.prisma" "${ip}:${remoteBase}/prisma/schema.prisma"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/products/page.tsx" "${ip}:${remoteBase}/src/app/(dashboard)/products/"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/pos/products/route.ts" "${ip}:${remoteBase}/src/app/api/pos/products/"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/products/[id]/route.ts" "${ip}:${remoteBase}/src/app/api/products/[id]/"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/products/route.ts" "${ip}:${remoteBase}/src/app/api/products/"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/pos/checkout/route.ts" "${ip}:${remoteBase}/src/app/api/pos/checkout/"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/units/route.ts" "${ip}:${remoteBase}/src/app/api/units/"

# HR & Kiosk Updates
& $scp -o StrictHostKeyChecking=no -i $key "package.json" "${ip}:${remoteBase}/package.json"
& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p ${remoteBase}/src/app/(dashboard)/hr/ai-enrollment"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/hr/ai-enrollment/page.tsx" "${ip}:${remoteBase}/src/app/(dashboard)/hr/ai-enrollment/"

& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/hr/evaluations/page.tsx" "${ip}:${remoteBase}/src/app/(dashboard)/hr/evaluations/"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/hr/training/page.tsx" "${ip}:${remoteBase}/src/app/(dashboard)/hr/training/"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/kiosk/attendance/page.tsx" "${ip}:${remoteBase}/src/app/kiosk/attendance/"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/employees/route.ts" "${ip}:${remoteBase}/src/app/api/employees/"
& $scp -o StrictHostKeyChecking=no -i $key "src/components/Sidebar.tsx" "${ip}:${remoteBase}/src/components/"

Write-Host "Files Uploaded. Syncing DB and Building..."

& $ssh -o StrictHostKeyChecking=no -i $key $ip "cd ${remoteBase} && npx prisma db push && npm run build && pm2 restart n1.namainvist.com || pm2 restart all"

Write-Host "Deployment to N1 completed."
