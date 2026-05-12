const fs = require('fs');
const path = require('path');

function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findFiles(fullPath, fileList);
        } else if (fullPath.endsWith('page.tsx')) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

const allPages = findFiles('src/app/(dashboard)');

let replacedCount = 0;
for (const filePath of allPages) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('سيتوفر قريباً') && content.includes('قيد التطوير')) {
        // Try to extract title
        let titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/);
        let title = titleMatch ? titleMatch[1].trim() : 'وحدة النظام';
        
        let engMatch = content.match(/<p[^>]*>(.*?)<\/p>/);
        let engTitle = engMatch ? engMatch[1].trim() : '';
        if (engTitle.includes('قيد التطوير')) engTitle = '';

        let iconMatch = content.match(/<div[^>]*text-6xl[^>]*>(.*?)<\/div>/);
        let icon = iconMatch ? iconMatch[1].trim() : '⚙️';

        const newContent = `'use client';
import ComingSoonModule from '@/components/ui/ComingSoonModule';

export default function Page() {
  return (
    <ComingSoonModule 
        title="${title}" 
        englishTitle="${engTitle}" 
        icon="${icon}" 
    />
  );
}
`;
        fs.writeFileSync(filePath, newContent);
        replacedCount++;
    }
}

console.log(`Replaced ${replacedCount} Coming Soon pages with the new Premium Module.`);
