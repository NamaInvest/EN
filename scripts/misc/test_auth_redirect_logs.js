const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--incognito'] });
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    // Disable cache entirely
    await page.setCacheEnabled(false);
    
    await page.goto('https://n11.namainvist.com/reports', { waitUntil: 'networkidle2' });
    
    await new Promise(r => setTimeout(r, 3000));
    console.log('Final URL:', page.url());
    
    await browser.close();
})();
