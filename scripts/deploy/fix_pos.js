const fs = require('fs');

let css = fs.readFileSync('src/app/globals.css', 'utf8');
css = css.replace('background: var(--bg-primary, #0a0a0a);', 'background: var(--bg-dark);');
css = css.replace('background: var(--card-bg, #111111);', 'background: var(--bg-sidebar);');
css = css.replace('background: #f0f2f5;', 'background: var(--bg-dark);');
// Replace category pane hardcoded colors
css = css.replace(/background: #ffffff;/g, 'background: var(--bg-sidebar); border-color: var(--border);');
css = css.replace(/color: #333;/g, 'color: var(--text);');

fs.writeFileSync('src/app/globals.css', css);
