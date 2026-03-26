import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const execAsync = promisify(exec);
const prismaMaster = new PrismaClient();
const BASE_DOMAIN = "namainvist.com";

export async function POST(req: Request) {
    try {
        console.log("[SYNC_ENGINE] Starting Reverse Database ETL...");

        const { stdout: lsOutput } = await execAsync("ls /www/wwwroot");
        const dirs = lsOutput.split("\n").filter(d => d.startsWith("n") && d.endsWith("." + BASE_DOMAIN));

        let syncedCount = 0;

        for (const dirName of dirs) {
            const subdomain = dirName.split(".")[0];
            const dbPath = "/www/wwwroot/" + dirName + "/prisma/data.db";

            let companyName = "Unknown Company";
            let vatNumber = "000000000000000";
            let adminEmail = "admin@" + subdomain + "." + BASE_DOMAIN;
            let isPostgres = false;
            let dbUrl = "";

            try {
                const envPath = "/www/wwwroot/" + dirName + "/.env";
                if (fs.existsSync(envPath)) {
                    const envFile = fs.readFileSync(envPath, 'utf8');
                    const dbMatch = envFile.match(/DATABASE_URL="?([^"\n]+)"?/);
                    if (dbMatch && dbMatch[1]) {
                        dbUrl = dbMatch[1];
                        isPostgres = dbUrl.startsWith('postgres');
                    }
                }
            } catch (e) {
                console.warn("[SYNC_ENGINE] Failed to read .env for " + subdomain);
            }

            if (!isPostgres && !fs.existsSync(dbPath)) {
                console.log("[SYNC_ENGINE] Skipping " + subdomain + " - Missing SQLite data.db and no Postgres URL");
                continue;
            }

            console.log("[SYNC_ENGINE] Extracting Payload from " + subdomain + " (" + (isPostgres ? 'Postgres' : 'SQLite') + ")...");
            
            try {
                const queryName = "SELECT value FROM settings WHERE key='company_name' LIMIT 1;";
                const queryVat = "SELECT value FROM settings WHERE key='vat_number' LIMIT 1;";
                const queryUser = "SELECT username FROM users ORDER BY id ASC LIMIT 1;";
                
                let cmdName, cmdVat, cmdUser;
                
                if (isPostgres) {
                    cmdName = `psql "${dbUrl}" -t -c "${queryName}"`;
                    cmdVat = `psql "${dbUrl}" -t -c "${queryVat}"`;
                    cmdUser = `psql "${dbUrl}" -t -c "${queryUser}"`;
                } else {
                    cmdName = `sqlite3 ${dbPath} "${queryName}"`;
                    cmdVat = `sqlite3 ${dbPath} "${queryVat}"`;
                    cmdUser = `sqlite3 ${dbPath} "${queryUser}"`;
                }

                const { stdout: nameOut } = await execAsync(cmdName);
                if (nameOut.trim()) companyName = nameOut.trim();

                const { stdout: vatOut } = await execAsync(cmdVat);
                if (vatOut.trim()) vatNumber = vatOut.trim();

                const { stdout: userOut } = await execAsync(cmdUser);
                if (userOut.trim() && userOut.includes("@")) {
                    adminEmail = userOut.trim();
                }
            } catch (dbErr) {
                console.warn("[SYNC_ENGINE] Database Parsing Error on " + subdomain + ":", dbErr);
            }

            await prismaMaster.tenantAccount.upsert({
                where: { subdomain },
                update: {
                    orgName: companyName,
                    vatNumber: vatNumber,
                    status: "active"
                },
                create: {
                    userEmail: adminEmail,
                    orgName: companyName,
                    vatNumber: vatNumber,
                    subdomain: subdomain,
                    status: "active"
                }
            });

            syncedCount++;
        }

        console.log("[SYNC_ENGINE] Reverse ETL Successful. Resynced " + syncedCount + " nodes.");
        return NextResponse.json({ success: true, count: syncedCount });

    } catch (error) {
        console.error("[SYNC_ENGINE_ERROR]", error);
        return NextResponse.json({ error: "Failed to run Reverse Database Sync." }, { status: 500 });
    }
}
