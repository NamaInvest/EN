$env:DISPLAY="dummy"
$env:SSH_ASKPASS="d:\namasoft9-3-main\askpass.bat"
$env:SSH_ASKPASS_REQUIRE="force"

$remoteScript = @"
#!/bin/bash
cd /var/www/namasoft
mv staging_banks/api_banks_route.ts src/app/api/banks/route.ts
mv staging_banks/api_banks_id_route.ts src/app/api/banks/\[id\]/route.ts
mv staging_banks/api_banks_id_tx_route.ts src/app/api/banks/\[id\]/transactions/route.ts
mv staging_banks/ui_banks_page.tsx src/app/\(dashboard\)/accounting/banks/page.tsx
mv staging_banks/ui_banks_id_page.tsx src/app/\(dashboard\)/accounting/banks/\[id\]/page.tsx
mv staging_banks/Sidebar.tsx src/components/Sidebar.tsx
mv staging_banks/i18n.tsx src/lib/i18n.tsx
mv staging_banks/schema.prisma prisma/schema.prisma
mv staging_banks/schema_final_ready.prisma schema_final_ready.prisma

npx prisma db push --schema=prisma/schema.prisma
npx prisma generate
npm run build
pm2 restart namasoft
"@

$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False
[IO.File]::WriteAllText("d:\namasoft9-3-main\remote_script.sh", $remoteScript, $Utf8NoBomEncoding)

scp -o StrictHostKeyChecking=no remote_script.sh root@185.197.195.202:/var/www/namasoft/remote_script.sh
ssh -o StrictHostKeyChecking=no root@185.197.195.202 "cd /var/www/namasoft && sed -i 's/\r$//' remote_script.sh && chmod +x remote_script.sh && ./remote_script.sh"
