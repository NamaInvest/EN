const fs = require('fs');
let c = fs.readFileSync('src/app/(dashboard)/pos/page.tsx', 'utf8');

// I want to remove the second set of showCustomerModal and showSplitModal which were inserted at the very end
// Their class name from the original restaurant-pos is "restaurant-pos" (or they just have normal classnames)
// Let's just find the second occurrence of '{showCustomerModal &&' and cut from there to the end.
const firstCustomer = c.indexOf('{showCustomerModal &&');
const secondCustomer = c.indexOf('{showCustomerModal &&', firstCustomer + 1);

if (secondCustomer !== -1) {
    c = c.substring(0, secondCustomer) + '</div>\n    );\n}';
    fs.writeFileSync('src/app/(dashboard)/pos/page.tsx', c);
    console.log('Cleaned duplicate modals successfully.');
} else {
    console.log('No duplicates found.');
}
