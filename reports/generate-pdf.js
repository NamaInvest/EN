const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const htmlPath = path.join(__dirname, 'benchmark-2026-05.html');
  const pdfPath  = path.join(__dirname, 'benchmark-2026-05.pdf');

  if (!fs.existsSync(htmlPath)) {
    console.error('HTML file not found:', htmlPath);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', bottom: '18mm', left: '14mm', right: '14mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate:
        '<div style="font-size:8pt; width:100%; text-align:center; color:#94a3b8; padding:0 14mm;">' +
        'Namasoft ERP Benchmark · 2026-05-02 · ' +
        '<span class="pageNumber"></span> / <span class="totalPages"></span>' +
        '</div>',
    });

    console.log('PDF generated:', pdfPath);
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
