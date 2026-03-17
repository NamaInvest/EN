// Test all possible CSR formats against ZATCA API
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';

async function main() {
    const prisma = new PrismaClient();

    // 1. Read CSR from DB (base64 body, no PEM headers)
    const csrSetting = await prisma.setting.findUnique({ where: { key: 'zatca_certificate' } });
    const csrBase64 = csrSetting?.value || '';
    console.log(`\n📋 CSR from DB: length=${csrBase64.length}`);

    if (!csrBase64) { console.log('❌ Empty!'); await prisma.$disconnect(); return; }

    // 2. Verify CSR
    const derBuffer = Buffer.from(csrBase64, 'base64');
    fs.writeFileSync('/tmp/test_csr.der', derBuffer);
    try {
        const csrText = execSync('openssl req -inform der -in /tmp/test_csr.der -noout -subject -text 2>&1', { encoding: 'utf-8' });
        console.log('\n✅ CSR valid:');
        // Show just Subject and SAN lines
        csrText.split('\n').forEach(l => {
            if (l.includes('Subject:') || l.includes('registeredAddress') || l.includes('DirName'))
                console.log('  ', l.trim());
        });
    } catch (e: any) { console.log('❌ CSR invalid:', e.stdout); }

    // Build PEM string
    const pemContent = `-----BEGIN CERTIFICATE REQUEST-----\n${csrBase64.match(/.{1,64}/g)?.join('\n')}\n-----END CERTIFICATE REQUEST-----`;

    const OTP = '123456';
    const URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation/compliance';

    // === FORMAT 1: Pure base64 body (no PEM headers) - current approach ===
    console.log('\n📡 Test 1: { csr: base64Body }');
    await tryZatca(URL, OTP, { csr: csrBase64 });

    // === FORMAT 2: Raw PEM text (with headers) ===
    console.log('\n📡 Test 2: { csr: fullPemText }');
    await tryZatca(URL, OTP, { csr: pemContent });

    // === FORMAT 3: base64(PEM text) ===
    console.log('\n📡 Test 3: { csr: base64(pemText) }');
    await tryZatca(URL, OTP, { csr: Buffer.from(pemContent).toString('base64') });

    // === FORMAT 4: Just base64 body WITH line breaks (64-char wrapped) ===
    console.log('\n📡 Test 4: { csr: base64BodyWithLineBreaks }');
    await tryZatca(URL, OTP, { csr: csrBase64.match(/.{1,64}/g)?.join('\n') });

    await prisma.$disconnect();
}

async function tryZatca(url: string, otp: string, body: object) {
    try {
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept-Version': 'V2', 'OTP': otp },
            body: JSON.stringify(body),
        });
        const text = await resp.text();
        console.log(`   Status: ${resp.status}`);
        console.log(`   Response: ${text.substring(0, 300)}`);
    } catch (e: any) {
        console.log('   Error:', e.message);
    }
}

main().catch(console.error);
