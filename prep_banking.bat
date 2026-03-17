mkdir staging_banks

copy "src\app\api\banks\route.ts" "staging_banks\api_banks_route.ts"
copy "src\app\api\banks\[id]\route.ts" "staging_banks\api_banks_id_route.ts"
copy "src\app\api\banks\[id]\transactions\route.ts" "staging_banks\api_banks_id_tx_route.ts"

copy "src\app\(dashboard)\accounting\banks\page.tsx" "staging_banks\ui_banks_page.tsx"
copy "src\app\(dashboard)\accounting\banks\[id]\page.tsx" "staging_banks\ui_banks_id_page.tsx"

copy "src\components\Sidebar.tsx" "staging_banks\Sidebar.tsx"
copy "src\lib\i18n.tsx" "staging_banks\i18n.tsx"
copy "schema_final_ready.prisma" "staging_banks\schema_final_ready.prisma"
copy "prisma\schema.prisma" "staging_banks\schema.prisma"
