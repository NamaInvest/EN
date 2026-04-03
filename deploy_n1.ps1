$key = "C:\Users\1\.ssh\hetzner_key"
$ip = "root@46.4.188.170"
$remoteBase = "/www/wwwroot/n1.namainvist.com"
$scp = "C:\Windows\System32\OpenSSH\scp.exe"
$ssh = "C:\Windows\System32\OpenSSH\ssh.exe"

& $ssh -o StrictHostKeyChecking=no -i $key $ip "mkdir -p ${remoteBase}/src/app/api/units"

& $scp -o StrictHostKeyChecking=no -i $key "prisma/schema.prisma" "${ip}:${remoteBase}/prisma/schema.prisma"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/(dashboard)/products/page.tsx" "${ip}:${remoteBase}/src/app/(dashboard)/products/"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/pos/products/route.ts" "${ip}:${remoteBase}/src/app/api/pos/products/"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/products/[id]/route.ts" "${ip}:${remoteBase}/src/app/api/products/[id]/"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/products/route.ts" "${ip}:${remoteBase}/src/app/api/products/"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/pos/checkout/route.ts" "${ip}:${remoteBase}/src/app/api/pos/checkout/"
& $scp -o StrictHostKeyChecking=no -i $key "src/app/api/units/route.ts" "${ip}:${remoteBase}/src/app/api/units/"

Write-Host "Files Uploaded. Syncing DB and Building..."

& $ssh -o StrictHostKeyChecking=no -i $key $ip "cd ${remoteBase} && npx prisma db push && npm run build && pm2 restart n1.namainvist.com || pm2 restart all"

Write-Host "Deployment to N1 completed."
