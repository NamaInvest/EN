import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-electron/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local agent/plugin caches and archived/generated project copies.
    ".agent/**",
    ".agents/**",
    ".claude/**",
    ".gemini/**",
    ".legacy-ui/**",
    ".stitch/**",
    ".tmp-prisma-cli/**",
    ".venv/**",
    "AUDIT_*/**",
    "BUILD_PACK/**",
    "IMPROVEMENT_PLAN/**",
    "artifacts/**",
    "backups/**",
    "coverage/**",
    "dist/**",
    "dist-electron/**",
    "dist_temp/**",
    "electron-protected/**",
    "extracted_asar/**",
    "graphify-out/**",
    "node_modules/**",
    "out_test/**",
    "reports/**",
    "schema-backups/**",
    "temp_test_prisma/**",
    "tmp/**",
    "zatca_tmp_local/**",
    // Generated/bulk data files and non-source artifacts at the repo root.
    "*.json",
    "*.log",
    "*.txt",
    "*.html",
    "*.sql",
    "*.zip",
    "*.tar",
    "*.gz",
  ]),
  {
    files: [
      "src/app/api/pos/**/*.ts",
      "src/app/api/pos/**/*.tsx",
      "src/app/api/purchases/**/*.ts",
      "src/app/api/purchases/**/*.tsx",
      "src/app/api/manufacturing/**/*.ts",
      "src/app/api/manufacturing/**/*.tsx",
      "src/app/api/finance/**/*.ts",
      "src/app/api/finance/**/*.tsx",
      "src/app/api/treasury/**/*.ts",
      "src/app/api/treasury/**/*.tsx",
      "src/app/api/sales/delivery-notes/**/*.ts",
      "src/app/api/sales/delivery-notes/**/*.tsx",
      "src/app/api/inventory/stocktake/**/*.ts",
      "src/app/api/inventory/stocktake/**/*.tsx"
    ],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "@/lib/prisma",
              message: "Direct Prisma import is discouraged in financial routes. Use Service/Repository layer instead to enforce transaction boundaries."
            },
            {
              name: "@prisma/client",
              message: "Direct PrismaClient import is discouraged. Use Service/Repository layer."
            }
          ]
        }
      ],
      "no-restricted-syntax": [
        "warn",
        {
          selector: "CallExpression[callee.object.property.name='productStock'][callee.property.name=/^(update|upsert|create|delete|updateMany|deleteMany)$/]",
          message: "Direct modification of productStock in API routes is dangerous. Use Inventory Engine/Service to ensure StockMovement atomicity."
        },
        {
          selector: "CallExpression[callee.object.property.name='treasury'][callee.property.name=/^(create|update|upsert|delete|createMany)$/]",
          message: "Direct modification of treasury records in API routes is dangerous. Use Treasury Engine to ensure JournalEntry is recorded atomically."
        },
        {
          selector: "CallExpression[callee.object.property.name='journalEntry'][callee.property.name=/^(create|update|upsert|delete|createMany)$/]",
          message: "Direct creation of journal entries is discouraged. Use accounting/auto-journal engines to guarantee compliance."
        }
      ]
    }
  }
]);

export default eslintConfig;
