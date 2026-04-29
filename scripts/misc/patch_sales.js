const fs = require('fs');

let c = fs.readFileSync('src/app/(dashboard)/sales/page.tsx', 'utf8');

c = c.replace(/const addToCart = \(p: Product\) => \{/, 
`const addToCart = (p: Product) => {
        if (!allowNegativeStock && p.currentStock <= 0) {
            showToast('الكمية نافذة ولا يمكن البيع بالسالب حسب الإعدادات');
            return;
        }`);

c = c.replace(/if \(existing\) \{/,
`if (existing) {
            if (!allowNegativeStock && existing.quantity + 1 > p.currentStock) {
                showToast('الكمية المطلوبة تتجاوز المخزون المتاح');
                return;
            }`);

c = c.replace(/const updateCartItem = \(idx: number, field: string, value: number\) => \{/,
`const updateCartItem = (idx: number, field: string, value: number) => {
        if (!allowNegativeStock && field === 'quantity') {
            const item = cart[idx];
            if (value > item.stock) {
                 showToast('الكمية المطلوبة تتجاوز المخزون المتاح');
                 return;
            }
        }`);

fs.writeFileSync('src/app/(dashboard)/sales/page.tsx', c);
console.log('done');
