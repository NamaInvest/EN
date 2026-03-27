const https = require('https');
const fs = require('fs');

// ضع مسار الفاتورة الموقعة الموجودة في جهازك (كمبيوترك) هنا
const localXmlPath = './signed_invoice.xml'; 

if (!fs.existsSync(localXmlPath)) {
    console.log('يرجى إنشاء ملف بإسم signed_invoice.xml في نفس هذا المجلد ووضع نص الفاتورة الموقعة بداخله أولاً.');
    process.exit(1);
}

const signedXml = fs.readFileSync(localXmlPath, 'utf-8');
const payload = JSON.stringify({ signedXml });

const options = {
    hostname: 'n2.namainvist.com',
    port: 443,
    path: '/api/zatca/generate-request',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
};

console.log('جاري إرسال الفاتورة الموقعة إلى سيرفر N2 لاستخراج הـ JSON...');

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('\n✅ الرد القادم من سيرفر N2:');
        try {
            const parsed = JSON.parse(data);
            console.log(JSON.stringify(parsed, null, 2));
            
            if (parsed.success) {
                fs.writeFileSync('./final_zatca_request.json', JSON.stringify(parsed.requestPayload, null, 2));
                console.log('\nتم استخراج وحفظ الملف بنجاح في جهازك باسم: final_zatca_request.json 🎉');
            }
        } catch(e) {
            console.log(data);
        }
    });
});

req.on('error', error => console.error('حدث خطأ في الاتصال:', error));
req.write(payload);
req.end();
