const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--incognito'] });
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    
    // Disable cache entirely
    await page.setCacheEnabled(false);
    
    // Setup request interceptor to trace navigation
    page.on('framenavigated', frame => {
        if (frame === page.mainFrame()) {
            console.log('Navigated to:', frame.url());
        }
    });
    
    await page.goto('https://n11.namainvist.com/reports', { waitUntil: 'networkidle2' });
    
    // Wait an explicit 5 seconds to ensure client-side navigation fires
    await new Promise(r => setTimeout(r, 5000));
    
    const finalUrl = page.url();
    console.log('--- FINAL URL ---');
    console.log(finalUrl);
    console.log('-----------------');
    
    await page.screenshot({ path: 'auth_redirect_debug.png' });
    await browser.close();
})();
