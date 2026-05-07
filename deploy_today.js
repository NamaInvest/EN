const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const TARGETS = [
    { base: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { base: '/www/wwwroot/n1.namainvist.com', pm2: 'n1-main' },
    { base: '/www/wwwroot/n11.namainvist.com', pm2: 'saas-app' }
];

const LOCAL_BASE = 'd:\\namasoft9-3-main';

const FILES = [
    // === SCHEMA (CRITICAL — must deploy first) ===
    "prisma/schema.prisma",

    // === AI Stack Core Libraries ===
    "src/lib/env.ts",                         // AI-25 Secrets Management
    "src/lib/pii-mask.ts",                    // AI-06 PII Masking
    "src/lib/prompt-cache.ts",                // AI-02 Prompt Caching
    "src/lib/streaming.ts",                   // AI-03 SSE Streaming
    "src/lib/few-shot-examples.ts",           // AI-04 Few-shot + CoT
    "src/lib/token-budget.ts",                // AI-05 Token Budget
    "src/lib/ai-job-queue.ts",                // AI-09 Background Jobs
    "src/lib/rate-limiter.ts",                // AI-12 Rate Limiter
    "src/lib/logger.ts",                      // AI-13 Structured Logger
    "src/lib/observability.ts",               // AI-14 Observability
    "src/lib/document-embeddings.ts",         // AI-16 Doc Embeddings
    "src/lib/compliance-kb-seed.ts",          // AI-18 ZATCA/SOCPA KB
    "src/lib/revenue-recognition-ifrs15.ts",  // P0-07 IFRS 15
    "src/lib/llm-client.ts",                  // Unified LLM
    "src/lib/langchain-orchestrator.ts",      // AI-07/08 LangChain
    "src/lib/vector-store.ts",                // AI-15 VectorMine
    "src/lib/prompts/registry.ts",            // AI-01 Prompt Registry
    "src/lib/__tests__/ai-stack.test.ts",     // AI-28 Tests

    // === AI APIs ===
    "src/app/api/ai/copilot/chat/route.ts",   // AI-10 Copilot Chat
    "src/app/api/ai/rag/route.ts",            // RAG Pipeline
    "src/app/api/search/semantic/route.ts",    // AI-17 Semantic Search
    "src/app/api/openapi/route.ts",            // AI-11 OpenAPI Spec

    // === Admin APIs ===
    "src/app/api/admin/prompts/route.ts",
    "src/app/api/admin/knowledge/route.ts",
    "src/app/api/admin/llm-costs/route.ts",   // AI-22 Cost Dashboard

    // === Treasury (P0-01) ===
    "src/app/api/treasury/cash-position/route.ts",
    "src/app/api/treasury/cash-position/snapshot/route.ts",
    "src/app/api/treasury/liquidity/forecast/route.ts",
    "src/app/api/treasury/liquidity/forecast/generate/route.ts",
    "src/app/(dashboard)/treasury/cash-position/page.tsx",
    "src/app/(dashboard)/treasury/liquidity/page.tsx",

    // === Sales ATP (P0-03) ===
    "src/app/api/sales/atp/check/route.ts",
    "src/app/(dashboard)/sales/atp-simulator/page.tsx",

    // === AP Invoice Capture (P0-04) ===
    "src/app/api/ap/capture/route.ts",
    "src/app/(dashboard)/ap/capture/page.tsx",

    // === Manufacturing MES (P0-05) ===
    "src/app/api/manufacturing/shopfloor/route.ts",
    "src/app/(dashboard)/shopfloor/page.tsx",

    // === Budget Planning (P0-06) ===
    "src/app/api/finance/budget/route.ts",
    "src/app/(dashboard)/finance/budget-planning/page.tsx",

    // === Frontend Utilities (AI-19/20) ===
    "src/hooks/use-erp-queries.ts",
    "src/components/forms/FormWrapper.tsx",

    // === Existing critical files ===
    "src/lib/wht-engine.ts",
    "src/lib/auto-journal.ts",
    "src/app/api/purchases/route.ts",
    "src/app/api/purchase-orders/[id]/route.ts",
];

function uploadFile(sftp, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        const data = fs.readFileSync(localPath);
        sftp.writeFile(remotePath, data, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function execCommand(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; process.stdout.write(d.toString()); });
            stream.stderr.on('data', d => { stderr += d; process.stderr.write(d.toString()); });
            stream.on('close', (code) => resolve({ code, stdout, stderr }));
        });
    });
}

function mkdirRecursive(sftp, dirPath) {
    return new Promise((resolve) => {
        sftp.mkdir(dirPath, (err) => {
            resolve();
        });
    });
}

async function deploy() {
    const conn = new Client();
    
    console.log('🔌 Connecting to Fleet Server (46.4.188.170)...');
    
    conn.on('ready', async () => {
        console.log('✅ Connected!\n');
        
        try {
            const sftp = await new Promise((resolve, reject) => {
                conn.sftp((err, sftp) => err ? reject(err) : resolve(sftp));
            });

            for (const target of TARGETS) {
                console.log(`\n==================================================`);
                console.log(`🚀 DEPLOYING TO ${target.base}`);
                console.log(`==================================================\n`);

                const dirs = new Set();
                for (const file of FILES) {
                    const parts = file.split('/');
                    let current = target.base;
                    for (let i = 0; i < parts.length - 1; i++) {
                        current += '/' + parts[i];
                        dirs.add(current);
                    }
                }

                for (const dir of [...dirs].sort()) {
                    await mkdirRecursive(sftp, dir);
                }

                let uploaded = 0;
                for (const file of FILES) {
                    const localPath = path.join(LOCAL_BASE, file.replace(/\//g, '\\'));
                    const remotePath = `${target.base}/${file}`;
                    
                    if (!fs.existsSync(localPath)) {
                        console.log(`  ⚠️  SKIP (not found): ${file}`);
                        continue;
                    }
                    
                    try {
                        await uploadFile(sftp, localPath, remotePath);
                        uploaded++;
                        console.log(`  ✅ ${file}`);
                    } catch (e) {
                        console.log(`  ❌ FAIL: ${file} — ${e.message}`);
                    }
                }

                console.log(`\n📊 Uploaded ${uploaded}/${FILES.length} files to ${target.base}\n`);

                console.log('🔧 Running prisma generate...');
                await execCommand(conn, `cd ${target.base} && npx prisma generate`);

                console.log('\n🔧 Running prisma db push...');
                
                let dbUrl = "postgresql://postgres@localhost:5432/namadb?schema=public";
                if (target.base.includes("n11")) dbUrl = "postgresql://postgres@localhost:5432/n11_db?schema=public";
                else if (target.base.includes("n1.")) dbUrl = "postgresql://postgres@localhost:5432/n1_db?schema=public";

                await execCommand(conn, `cd ${target.base} && DATABASE_URL="${dbUrl}" npx prisma db push --accept-data-loss`);

                console.log('\n🗑️  Clearing Next.js cache...');
                await execCommand(conn, `cd ${target.base} && rm -rf .next`);

                console.log('\n🏗️  Building Next.js...');
                await execCommand(conn, `cd ${target.base} && npm run build`);

                console.log(`\n🔄 Restarting PM2 (${target.pm2})...`);
                await execCommand(conn, `pm2 restart ${target.pm2}`);

                console.log(`\n🎉 Deploy to ${target.base} COMPLETE!`);
            }
        } catch (err) {
            console.error('❌ Deploy error:', err.message);
        }
        
        conn.end();
    });

    conn.on('error', (err) => {
        console.error('❌ Connection error:', err.message);
    });

    conn.connect(SERVER);
}

deploy();
