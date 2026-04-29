
const fs = require('fs');

function patch(file, keys, vals) {
    if (!fs.existsSync(file)) return;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (let i = 0; i < keys.length; i++) {
        data[keys[i]] = vals[i];
    }
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    console.log('Patched ' + file);
}

patch('/www/wwwroot/n11.namainvist.com/src/locales/ar.json', 
    [
        'manage_warehouses', 'add_warehouse', 'edit_warehouse', 'delete_warehouse',
        'warehouse_name', 'link_to_branch', 'none', 'address', 'active', 'inactive',
        'cancel', 'save', 'are_you_sure_delete', 'loading', 'id', 'name', 'branch',
        'status', 'actions', 'no_warehouses_found', 'optional'
    ], 
    [
        'إدارة المستودعات', 'إضافة مستودع', 'تعديل مستودع', 'حذف المستودع',
        'اسم المستودع', 'ربط بفرع', 'لا يوجد', 'العنوان', 'نشط', 'غير نشط',
        'إلغاء', 'حفظ', 'هل أنت متأكد من الحذف؟', 'جاري التحميل...', 'المعرف', 'الاسم', 'الفرع',
        'الحالة', 'العمليات', 'لا توجد مستودعات', 'اختياري'
    ]);
    
patch('/www/wwwroot/n11.namainvist.com/src/locales/en.json', 
    [
        'manage_warehouses', 'add_warehouse', 'edit_warehouse', 'delete_warehouse',
        'warehouse_name', 'link_to_branch', 'none', 'address', 'active', 'inactive',
        'cancel', 'save', 'are_you_sure_delete', 'loading', 'id', 'name', 'branch',
        'status', 'actions', 'no_warehouses_found', 'optional'
    ], 
    [
        'Manage Warehouses', 'Add Warehouse', 'Edit Warehouse', 'Delete Warehouse',
        'Warehouse Name', 'Link to Branch', 'None', 'Address', 'Active', 'Inactive',
        'Cancel', 'Save', 'Are you sure you want to delete?', 'Loading...', 'ID', 'Name', 'Branch',
        'Status', 'Actions', 'No warehouses found', 'Optional'
    ]);

// Build Next.js
const { execSync } = require('child_process');
console.log('Building Next.js... (this takes ~30 seconds)');
execSync('cd /www/wwwroot/n11.namainvist.com && npm run build', { stdio: 'inherit' });
console.log('Restarting PM2...');
execSync('pm2 restart n11', { stdio: 'inherit' });
