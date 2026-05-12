const fs = require('fs');

try {
  // 1. Read Sidebar.tsx to extract ALL keys and their Arabic labels
  const sidebarContent = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
  const arLabelsMatch = sidebarContent.match(/ar:\s*\{([\s\S]*?)\}/);
  if (!arLabelsMatch) { console.error('Could not find ar labels in Sidebar'); process.exit(1); }

  const arLabelsText = arLabelsMatch[1];
  const moduleNames = {};
  const regex = /'([s,i]\.[^']+)':\s*'([^']+)'/g;
  let match;
  while ((match = regex.exec(arLabelsText)) !== null) {
    const keyStr = match[1];
    const arName = match[2];
    if (keyStr.startsWith('i.')) {
      const rawKey = keyStr.replace('i.', '');
      moduleNames[rawKey] = arName;
    }
  }

  // 2. Read roles/page.tsx
  const rolesPath = 'src/app/(dashboard)/settings/roles/page.tsx';
  let rolesContent = fs.readFileSync(rolesPath, 'utf8');

  // 3. Find current MODULES_GROUPED
  const groupedMatch = rolesContent.match(/const MODULES_GROUPED = \[([\s\S]*?)\];/);
  let existingGroupedStr = groupedMatch[1];

  // We will inject missing keys into a new category
  const existingKeysRegex = /keys:\s*\[(.*?)\]/g;
  const existingKeys = new Set();
  let keysMatch;
  while ((keysMatch = existingKeysRegex.exec(existingGroupedStr)) !== null) {
    const arr = keysMatch[1].split(',').map(s => s.replace(/'/g, '').trim()).filter(Boolean);
    arr.forEach(k => existingKeys.add(k));
  }

  const missingKeys = Object.keys(moduleNames).filter(k => !existingKeys.has(k));

  console.log('Total modules in Sidebar:', Object.keys(moduleNames).length);
  console.log('Existing in Roles:', existingKeys.size);
  console.log('Missing in Roles:', missingKeys.length);

  if (missingKeys.length > 0) {
    // Break missing keys into chunks of 15 for better UI formatting if needed, or just put them all in one category.
    let newCategoryStr = `
  {
    category: 'الوحدات الإضافية والمسارات الجديدة',
    keys: [${missingKeys.map(k => `'${k}'`).join(', ')}]
  }`;
    
    let updatedGroupedStr = existingGroupedStr + ',' + newCategoryStr;
    
    // Replace in roles/page.tsx
    rolesContent = rolesContent.replace(existingGroupedStr, updatedGroupedStr);
    
    // Now update MODULE_NAMES
    const moduleNamesMatch = rolesContent.match(/const MODULE_NAMES: Record<string, string> = \{([\s\S]*?)\};/);
    if (moduleNamesMatch) {
      let existingModuleNames = moduleNamesMatch[1];
      let newModuleNames = '\n';
      for (const k of missingKeys) {
        newModuleNames += `  '${k}': '${moduleNames[k]}',\n`;
      }
      rolesContent = rolesContent.replace(existingModuleNames, existingModuleNames + newModuleNames);
      fs.writeFileSync(rolesPath, rolesContent);
      console.log('Successfully updated roles/page.tsx with ' + missingKeys.length + ' missing modules.');
    }
  } else {
    console.log('No missing modules found.');
  }
} catch (e) {
  console.error(e);
}
