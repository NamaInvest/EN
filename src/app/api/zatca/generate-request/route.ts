import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { getUserFromRequest } from '@/lib/auth';
async function _POST(req: NextRequest) {
    let tmpDir = '';
    try {
        const user = getUserFromRequest(req as any);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { signedXml } = body;

        if (!signedXml) {
            return NextResponse.json({ error: 'ملف الفاتورة الموقع غير موجود (signedXml)' }, { status: 400 });
        }

        // إنشاء مسار مؤقت آمن
        tmpDir = require('path').join(require('os').tmpdir(), `zatca_req_${Date.now()}_${Math.random().toString(36).substring(7)}`);
        fs.mkdirSync(tmpDir, { recursive: true });

        const invoicePath = `${tmpDir}/signed_invoice.xml`;
        const requestJsonPath = `${tmpDir}/api_request.json`;

        // كتابة الفاتورة الموقعة على السيرفر
        fs.writeFileSync(invoicePath, signedXml);

        // تنفيذ خطوة 4 (Generate JSON API Request)
        try {
            execSync(`fatoora -invoiceRequest -invoice ${invoicePath} -apiRequest ${requestJsonPath}`);
        } catch (fatooraErr: any) {
            console.error("Fatoora Invoice Request Error:", fatooraErr?.output?.toString());
            throw new Error("فشل في استخراج JSON الطلب من الفاتورة عبر أداة ZATCA.");
        }

        // قراءة الملف النهائي المستخرج
        const requestJsonStr = fs.readFileSync(requestJsonPath, 'utf-8');
        const requestData = JSON.parse(requestJsonStr);

        return NextResponse.json({
            success: true,
            message: 'تم استخراج طلب الـ API (الخطوة 4) بنجاح.',
            requestPayload: requestData, // يحتوي على الهاش، UUID، والـ XML (Base64)
            hash: requestData.invoiceHash,
            uuid: requestData.uuid
        });

    } catch (e: any) {
        console.error('API Request Generation Error:', e.message);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    } finally {
        if (tmpDir) {
            try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e: any) { }
        }
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
