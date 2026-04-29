const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--incognito'] });
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    
    // Disable cache entirely
    await page.setCacheEnabled(false);
    
    // Set a fake invalid token
    await page.goto('https://n11.namainvist.com/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
        localStorage.setItem('token', 'fake.invalid.token');
    });
    
    await page.goto('https://n11.namainvist.com/reports', { waitUntil: 'networkidle2' });
    
    await new Promise(r => setTimeout(r, 3000));
    
    const finalUrl = page.url();
    console.log('--- FINAL URL WITH INVALID TOKEN ---');
    console.log(finalUrl);
    console.log('-----------------');
    
    await browser.close();
})();
