const fs = require('fs');
const file = 'c:/Users/1/Desktop/alfa/src/app/(dashboard)/sales/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Ensure couponsEnabled is available in state block
if (!content.includes('const couponsEnabled')) {
    content = content.replace("const discountEnabled = getSetting('POS_DISCOUNT_ENABLED', 'true') === 'true';", "const discountEnabled = getSetting('POS_DISCOUNT_ENABLED', 'true') === 'true';\n    const couponsEnabled = getSetting('POS_COUPONS_ENABLED', 'true') === 'true';");
}

// 2. We need to wrap the first pos-total-row that contains 'sys.str_769' (discount)
const lines = content.split('\n');

const discountStartIdx = lines.findIndex(l => l.includes("t('sys.str_769')")) - 1;
// Find the end of this div which is before the coupon div ('sys.str_772')
const couponStartIdx = lines.findIndex(l => l.includes("t('sys.str_772')")) - 1;
const couponEndIdx = lines.findIndex(l => l.includes("t('sys.str_773')")) - 1;

if (discountStartIdx > 0 && couponStartIdx > discountStartIdx && couponEndIdx > couponStartIdx) {
    // Only wrap if not already wrapped
    if (!lines[discountStartIdx - 1].includes('discountEnabled &&')) {
        lines.splice(discountStartIdx, 0, '                                {discountEnabled && (');
        lines.splice(couponStartIdx + 1, 0, '                                )}');
    }
    
    // Recalculate indexes because we added lines
    const newCouponStartIdx = lines.findIndex(l => l.includes("t('sys.str_772')")) - 1;
    const newCouponEndIdx = lines.findIndex(l => l.includes("t('sys.str_773')")) - 1;

    if (!lines[newCouponStartIdx - 1].includes('couponsEnabled &&')) {
        lines.splice(newCouponStartIdx, 0, '                                {couponsEnabled && (');
        lines.splice(newCouponEndIdx + 1, 0, '                                )}');
    }
    
    fs.writeFileSync(file, lines.join('\n'));
    console.log("Successfully wrapped footers!");
} else {
    console.error("Could not find indexes!");
}
