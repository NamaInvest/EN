// Test using zatca-xml-js library
// Run: npx tsx src/scripts/test-zatca-sdk.ts

async function main() {
    let EGS: any;
    try {
        const pkg = require('zatca-xml-js');
        EGS = pkg.EGS;
        console.log('✅ zatca-xml-js loaded, exports:', Object.keys(pkg).join(', '));
    } catch (e: any) {
        console.log('❌ zatca-xml-js not installed:', e.message);
        return;
    }

    const egs = new EGS({
        uuid: 'c904e867-f35a-452d-8a9d-c5f195edb5ee',
        custom_id: 'EGS1-886431145',
        model: 'IOS',
        CRN_number: '7051170095',
        VAT_name: 'nama invest',
        VAT_number: '314122115700003',
        location: {
            city: 'NAJRAN',
            city_subdivision: 'NAJRAN',
            street: 'Main',
            plot_identification: '0000',
            building: '0000',
            postal_zone: '62523',
        },
        branch_name: 'Main',
        branch_industry: 'Technology',
    });

    console.log('\n🔑 EGS methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(egs)).join(', '));

    try {
        // Generate keys - inspect the return value
        const result = await egs.generateNewKeysAndCSR('solution_name', 'V2');
        console.log('\n📋 generateNewKeysAndCSR result type:', typeof result);
        console.log('📋 Result:', JSON.stringify(result)?.substring(0, 500));

        // Check egs object for stored keys
        console.log('\n🔑 egs.private_key:', egs.private_key?.substring?.(0, 50) || 'N/A');
        console.log('🔑 egs.csr:', egs.csr?.substring?.(0, 100) || 'N/A');

        // Dump all egs properties
        const props = Object.keys(egs);
        console.log('🔑 EGS props:', props.join(', '));
        for (const p of props) {
            const v = egs[p];
            if (typeof v === 'string' && v.length > 0) {
                console.log(`   ${p}: ${v.substring(0, 80)}${v.length > 80 ? '...' : ''}`);
            }
        }

        // Try compliance
        console.log('\n📡 Trying compliance with SDK...');
        try {
            const comp = await egs.issueComplianceCertificate('123456');
            console.log('✅ SUCCESS:', JSON.stringify(comp).substring(0, 300));
        } catch (e: any) {
            console.log('❌ Compliance error:', e.message?.substring(0, 300));
        }
    } catch (e: any) {
        console.log('❌ Error:', e.message);
        console.log(e.stack?.substring(0, 500));
    }
}

main().catch(console.error);
