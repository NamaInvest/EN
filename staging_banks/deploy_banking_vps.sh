#!/bin/bash
cd /var/www/namasoft

mkdir -p src/app/api/banks/\[id\]/transactions
mkdir -p src/app/\(dashboard\)/accounting/banks/\[id\]

mv api_banks_route.ts src/app/api/banks/route.ts
mv api_banks_id_route.ts src/app/api/banks/\[id\]/route.ts
mv api_banks_id_tx_route.ts src/app/api/banks/\[id\]/transactions/route.ts

mv ui_banks_page.tsx src/app/\(dashboard\)/accounting/banks/page.tsx
mv ui_banks_id_page.tsx src/app/\(dashboard\)/accounting/banks/\[id\]/page.tsx

mv Sidebar.tsx src/components/Sidebar.tsx
mv i18n.tsx src/lib/i18n.tsx
mv schema.prisma prisma/schema.prisma
mv schema_final_ready.prisma schema_final_ready.prisma

npx prisma db push --schema=prisma/schema.prisma
npx prisma generate
npm run build
pm2 restart namasoft
