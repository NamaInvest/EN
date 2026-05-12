const fs = require('fs');

function injectAddCustomer(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Add import if not present
    if (!content.includes('AddCustomerModal')) {
        content = content.replace(/(import .* from ['"]react['"];?)/, `$1\nimport AddCustomerModal from '@/components/pos/AddCustomerModal';`);
    }

    // Add state variable
    if (!content.includes('showAddCustomerModal')) {
        content = content.replace(/const \[showCustomerModal, setShowCustomerModal\] = useState\(false\);/, 
            `const [showCustomerModal, setShowCustomerModal] = useState(false);\n    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);`);
    }

    // Fix the button that I incorrectly mapped to setShowCustomerModal(true)
    content = content.replace(/onClick=\{\(\) => setShowCustomerModal\(true\)\} className="w-full py-5 bg-orange-50 text-orange-600/g, 
        `onClick={() => setShowAddCustomerModal(true)} className="w-full py-5 bg-orange-50 text-orange-600`);

    // Add the modal to the bottom of the JSX return
    if (!content.includes('<AddCustomerModal')) {
        // Find the last </div> before the end of the return statement.
        // It's safer to just put it right before the last </div> of the file.
        const parts = content.split('</div');
        if (parts.length > 2) {
            const lastPart = parts.pop();
            const secondLastPart = parts.pop();
            content = parts.join('</div') + '</div' + secondLastPart + 
            `\n            {showAddCustomerModal && (\n                <AddCustomerModal \n                    onClose={() => setShowAddCustomerModal(false)} \n                    onSuccess={(newCustomer) => {\n                        setShowAddCustomerModal(false);\n                        setSelectedCustomer(newCustomer);\n                        setShowCustomerModal(false);\n                    }}\n                />\n            )}\n        </div` + lastPart;
        }
    }

    fs.writeFileSync(filePath, content);
}

injectAddCustomer('src/app/(dashboard)/pos/page.tsx');
injectAddCustomer('src/app/(dashboard)/restaurant-pos/page.tsx');
