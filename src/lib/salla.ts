import prisma from './prisma';

/**
 * Fetches Salla configuration from the database.
 */
async function getSallaConfig() {
    const settings = await prisma.setting.findMany({
        where: { key: { in: ['salla_enabled', 'salla_access_token', 'salla_client_secret'] } }
    });
    const config: Record<string, string> = {};
    settings.forEach(s => config[s.key] = s.value || '');
    return config;
}

/**
 * Creates or updates a product on Salla.
 */
export async function syncProductToSalla(product: any) {
    try {
        const config = await getSallaConfig();
        if (config['salla_enabled'] !== '1' || !config['salla_access_token']) {
            return; // Salla sync is disabled or not configured
        }

        const sallaPayload = {
            name: product.name,
            price: product.sellPrice,
            sale_price: product.sellPrice,
            quantity: product.currentStock,
            sku: product.barcode || product.id.toString(),
            description: product.description || product.name,
            weight: product.sellByWeight ? 1 : 0,
            status: product.active ? 'sale' : 'out',
            product_type: 'product'
        };

        // If the product has a Salla ID stored (we'll use barcode as SKU for matching, but ideally we need Salla's exact ID for PUT)
        // For this streamlined integration, we will try to find it by SKU first.
        const token = config['salla_access_token'];
        
        // 1. Check if product exists in Salla via SKU
        const searchRes = await fetch(`https://api.salla.dev/admin/v2/products?keyword=${sallaPayload.sku}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });

        if (searchRes.ok) {
            const searchData = await searchRes.json();
            const existingProduct = searchData.data?.find((p: any) => p.sku === sallaPayload.sku);

            if (existingProduct) {
                // Update
                await fetch(`https://api.salla.dev/admin/v2/products/${existingProduct.id}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(sallaPayload)
                });
                console.log(`✅ Salla Sync: Updated product ${product.name}`);
                return;
            }
        }

        // 2. Create New
        const createRes = await fetch('https://api.salla.dev/admin/v2/products', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(sallaPayload)
        });
        
        if (createRes.ok) {
            console.log(`✅ Salla Sync: Created product ${product.name}`);
        } else {
            console.error('❌ Salla Sync Error:', await createRes.text());
        }

    } catch (e) {
        console.error('Salla Sync Exception:', e);
    }
}

/**
 * Syncs ONLY the stock level of a product to Salla (useful for fast checkout deductions)
 */
export async function syncStockToSalla(sku: string, newQuantity: number) {
    try {
        const config = await getSallaConfig();
        if (config['salla_enabled'] !== '1' || !config['salla_access_token']) {
            return;
        }

        const token = config['salla_access_token'];

        // Find product by SKU
        const searchRes = await fetch(`https://api.salla.dev/admin/v2/products?keyword=${sku}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });

        if (searchRes.ok) {
            const searchData = await searchRes.json();
            const existingProduct = searchData.data?.find((p: any) => p.sku === sku);

            if (existingProduct) {
                // Update Quantities
                await fetch(`https://api.salla.dev/admin/v2/products/${existingProduct.id}/quantities`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quantity: newQuantity })
                });
                console.log(`✅ Salla Sync: Updated stock for SKU ${sku} to ${newQuantity}`);
            }
        }
    } catch (e) {
        console.error('Salla Stock Sync Exception:', e);
    }
}
