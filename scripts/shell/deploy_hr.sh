#!/bin/bash
cd /var/www/namasoft
mv src/app/page_emp.tsx "src/app/(dashboard)/employees/page.tsx"
mv src/app/api/employees/route_id.ts "src/app/api/employees/[id]/route.ts"
npx prisma db push --schema=schema_final_ready.prisma
npm run build > /tmp/next_build_hr.log 2>&1
pm2 restart namasoft
