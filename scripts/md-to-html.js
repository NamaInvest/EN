const fs = require('fs');
const path = require('path');

const inputFile = path.resolve(__dirname, '..', process.argv[2] || 'GLOBAL_ERP_GAP_ANALYSIS.md');
const outputFile = inputFile.replace(/\.md$/i, '.html');

const md = fs.readFileSync(inputFile, 'utf8');

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inline(s) {
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${escapeHtml(c)}</code>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return s;
}

const lines = md.split(/\r?\n/);
const out = [];
let inCode = false;
let codeLang = '';
let codeBuf = [];
let inTable = false;
let tableHeader = null;
let listStack = [];

function closeLists() {
  while (listStack.length) {
    out.push(`</${listStack.pop()}>`);
  }
}

function flushTable() {
  if (!inTable) return;
  inTable = false;
  out.push('</tbody></table>');
  tableHeader = null;
}

for (let i = 0; i < lines.length; i++) {
  const raw = lines[i];
  const line = raw;

  if (line.startsWith('```')) {
    if (inCode) {
      if (codeLang === 'mermaid') {
        out.push(`<pre class="mermaid">${escapeHtml(codeBuf.join('\n'))}</pre>`);
      } else {
        out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
      }
      codeBuf = [];
      codeLang = '';
      inCode = false;
    } else {
      closeLists();
      flushTable();
      inCode = true;
      codeLang = line.slice(3).trim();
    }
    continue;
  }
  if (inCode) { codeBuf.push(raw); continue; }

  // Table detection
  if (/^\s*\|.*\|\s*$/.test(line)) {
    const cells = line.trim().slice(1, -1).split('|').map(c => c.trim());
    if (!inTable) {
      const next = lines[i + 1] || '';
      if (/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(next)) {
        closeLists();
        out.push('<table><thead><tr>' + cells.map(c => `<th>${inline(escapeHtml(c))}</th>`).join('') + '</tr></thead><tbody>');
        inTable = true;
        tableHeader = cells;
        i++; // skip separator
        continue;
      }
    } else {
      out.push('<tr>' + cells.map(c => `<td>${inline(escapeHtml(c))}</td>`).join('') + '</tr>');
      continue;
    }
  } else if (inTable) {
    flushTable();
  }

  // Headings
  const h = line.match(/^(#{1,6})\s+(.*)$/);
  if (h) {
    closeLists();
    flushTable();
    out.push(`<h${h[1].length}>${inline(escapeHtml(h[2]))}</h${h[1].length}>`);
    continue;
  }

  // HR
  if (/^---+\s*$/.test(line)) {
    closeLists();
    flushTable();
    out.push('<hr>');
    continue;
  }

  // Blockquote
  const bq = line.match(/^>\s*(.*)$/);
  if (bq) {
    closeLists();
    out.push(`<blockquote>${inline(escapeHtml(bq[1]))}</blockquote>`);
    continue;
  }

  // Lists
  const ul = line.match(/^(\s*)[-*]\s+(.*)$/);
  const ol = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
  if (ul) {
    flushTable();
    if (!listStack.length || listStack[listStack.length - 1] !== 'ul') {
      closeLists();
      out.push('<ul>');
      listStack.push('ul');
    }
    out.push(`<li>${inline(escapeHtml(ul[2]))}</li>`);
    continue;
  }
  if (ol) {
    flushTable();
    if (!listStack.length || listStack[listStack.length - 1] !== 'ol') {
      closeLists();
      out.push('<ol>');
      listStack.push('ol');
    }
    out.push(`<li>${inline(escapeHtml(ol[3]))}</li>`);
    continue;
  }

  // Empty line
  if (/^\s*$/.test(line)) {
    closeLists();
    continue;
  }

  // Paragraph
  closeLists();
  out.push(`<p>${inline(escapeHtml(line))}</p>`);
}

closeLists();
flushTable();
if (inCode) {
  out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
}

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>تحليل الفجوات الشامل ومقارنة بالأنظمة العالمية</title>
<style>
@page { size: A4; margin: 18mm 15mm; }
* { box-sizing: border-box; }
html, body {
  font-family: 'Segoe UI', 'Tahoma', 'Arial', 'Cairo', sans-serif;
  direction: rtl;
  text-align: right;
  line-height: 1.85;
  font-size: 13px;
  color: #1f2937;
  background: #fff;
  margin: 0;
  padding: 0;
}
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 30px 40px;
}
h1 {
  font-size: 26px;
  color: #0f172a;
  border-bottom: 4px solid #2563eb;
  padding-bottom: 8px;
  margin-top: 0;
  page-break-before: auto;
}
h2 {
  font-size: 20px;
  color: #1e3a8a;
  border-bottom: 2px solid #cbd5e1;
  padding-bottom: 6px;
  margin-top: 32px;
  page-break-after: avoid;
}
h3 {
  font-size: 16px;
  color: #1e40af;
  margin-top: 24px;
  page-break-after: avoid;
}
h4 {
  font-size: 14px;
  color: #1e293b;
  margin-top: 18px;
  page-break-after: avoid;
}
p { margin: 10px 0; }
ul, ol { margin: 8px 0; padding-right: 26px; padding-left: 0; }
li { margin: 4px 0; }
table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  direction: rtl;
  font-size: 12px;
  page-break-inside: auto;
}
thead {
  background: #1e40af;
  color: #fff;
}
th, td {
  border: 1px solid #cbd5e1;
  padding: 7px 10px;
  text-align: right;
  vertical-align: top;
}
tbody tr:nth-child(even) { background: #f8fafc; }
tbody tr:hover { background: #eff6ff; }
code {
  background: #f1f5f9;
  color: #be123c;
  padding: 2px 5px;
  border-radius: 3px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  direction: ltr;
  display: inline-block;
}
pre {
  background: #0f172a;
  color: #e2e8f0;
  padding: 14px 18px;
  border-radius: 6px;
  overflow-x: auto;
  direction: ltr;
  text-align: left;
  font-size: 11.5px;
  line-height: 1.55;
  page-break-inside: avoid;
  margin: 12px 0;
}
pre code {
  background: transparent;
  color: inherit;
  padding: 0;
  font-size: inherit;
}
blockquote {
  border-right: 4px solid #2563eb;
  background: #eff6ff;
  margin: 12px 0;
  padding: 10px 14px;
  color: #1e3a8a;
}
hr {
  border: none;
  border-top: 2px dashed #cbd5e1;
  margin: 28px 0;
}
a { color: #2563eb; text-decoration: none; }
a:hover { text-decoration: underline; }
strong { color: #0f172a; }

/* رموز الحالة */
p:has(> code) { line-height: 2; }

/* طباعة */
@media print {
  body { font-size: 11.5px; }
  h1 { font-size: 22px; }
  h2 { font-size: 17px; page-break-before: auto; }
  h3 { font-size: 14px; }
  table { font-size: 10.5px; }
  pre { font-size: 10px; }
  .no-print { display: none; }
}
.print-banner {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: #2563eb;
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  font-size: 13px;
  z-index: 999;
}
.print-banner button {
  background: #fff;
  color: #2563eb;
  border: none;
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-right: 10px;
}
@media print { .print-banner { display: none; } }
.mermaid {
  background: #fff;
  padding: 16px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  margin: 16px 0;
  text-align: center;
  page-break-inside: avoid;
  direction: ltr;
  overflow-x: auto;
}
</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js"></script>
<script>
window.addEventListener('DOMContentLoaded', function() {
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({ startOnLoad: true, theme: 'default', flowchart: { useMaxWidth: true, htmlLabels: true }, securityLevel: 'loose' });
  }
});
</script>
</head>
<body>
<div class="container">
${out.join('\n')}
</div>
<div class="print-banner no-print">
  <button onclick="window.print()">🖨️ احفظ كـ PDF (اضغط هنا أو Ctrl+P)</button>
  اختر "Save as PDF" من قائمة الطابعة
</div>
</body>
</html>`;

fs.writeFileSync(outputFile, html, 'utf8');
console.log('✓ Created:', outputFile);
console.log('  Size:', (html.length / 1024).toFixed(1), 'KB');
