const fs = require('fs');
let content = fs.readFileSync('src/app/(dashboard)/layout.tsx', 'utf8');

// Fix unclosed main tag
content = content.replace('<main className="flex-1 overflow-auto bg-(--bg-base) p-6 relative">', '<div className="flex-1 overflow-auto bg-(--bg-base) p-6 relative">');
content = content.replace('</main>\r\n  </div>\r\n  </GlobalErrorBoundary>', '</div>\r\n  </main>\r\n  </div>\r\n  </GlobalErrorBoundary>');
content = content.replace('</main>\n  </div>\n  </GlobalErrorBoundary>', '</div>\n  </main>\n  </div>\n  </GlobalErrorBoundary>');

// Fix shrink-0
content = content.replace('flex-shrink-0', 'shrink-0');

fs.writeFileSync('src/app/(dashboard)/layout.tsx', content);

let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
sidebar = sidebar.replace(/z-\[60\]/g, 'z-60');
sidebar = sidebar.replace(/z-\[40\]/g, 'z-[40]'); // wait the warning was to change z-[40] to z-40
sidebar = sidebar.replace(/z-\[40\]/g, 'z-40');
sidebar = sidebar.replace(/flex-shrink-0/g, 'shrink-0');
sidebar = sidebar.replace(/bg-gradient-to-br/g, 'bg-linear-to-br');
fs.writeFileSync('src/components/Sidebar.tsx', sidebar);

console.log('Fixed.');
