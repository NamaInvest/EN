const { Client } = require('ssh2');
const conn = new Client();
const CLERK_SECRET = 'sk_live_btdBcZHEiJ4Et53T81Kb1dVz2TWmYFCMPQ8ClStM6R';

async function run() {
    // 1. تسجيل Clerk جديد لاختبار provision
    console.log('Testing provision API directly on main-site...');
    
    // اختبار الـ provision API مباشرة
    const res = await fetch('https://namainvist.com/api/tenant/provision', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-provision-secret': 'namainvest-provision-2024'
        },
        body: JSON.stringify({
            companyNameAr: 'اختبار نظام',
            companyNameEn: 'SystemTest',
            businessDomain: 'Retail',
            branchName: 'الفرع الرئيسي',
            mobile: '0500000000',
            city: 'الرياض',
            address: 'شارع الاختبار',
            buildingNo: '1234',
            district: 'العليا',
            postalCode: '12345',
            vatNumber: '300000000000001',
            crnNumber: '7000000001',
            clerkUserId: 'test_user_id',
            clerkEmail: 'test@systemtest.com'
        })
    });
    
    const data = await res.json();
    console.log('Provision response:', JSON.stringify(data, null, 2));
}

run().catch(console.error);
