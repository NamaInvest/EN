import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);

export async function POST(req: Request) {

    try {
        const { subdomain } = await req.json();
        
        if (!subdomain) return NextResponse.json({ error: "Subdomain required" }, { status: 400 });

        const dirPath = `/www/wwwroot/${subdomain}.namainvist.com`;
        const legacyDir = `/www/wwwroot/${subdomain}`;
        
        const targetDir = fs.existsSync(dirPath) ? dirPath : (fs.existsSync(legacyDir) ? legacyDir : null);
        
        if (!targetDir) {
            return NextResponse.json({ error: "Node directory not found physically on Hetzner." }, { status: 404 });
        }

        const backupTarget = `/www/backup/SaaS_Backups/${subdomain}_${Date.now()}.tar.gz`;
        
        // Ensure Backup root exists
        await execAsync(`mkdir -p /www/backup/SaaS_Backups/`);
        
        // Compress the environment variable, database, and src
        // Excluding heavy logs and node_modules
        console.log(`[ADMIN_BACKUP] Initiating archival of ${targetDir}...`);
        
        await execAsync(`tar -czvf ${backupTarget} --exclude="node_modules" --exclude=".next" --exclude="*.log" ${targetDir}`);
        
        return NextResponse.json({ success: true, message: `Backup created at ${backupTarget}` });
    } catch (error: any) {
        console.error("[ADMIN_BACKUP_ERROR]", error);
        return NextResponse.json({ error: error.message || "Failed to create physical backup archive." }, { status: 500 });
    }
}
