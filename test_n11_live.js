const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--incognito'] });
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    
    // Disable cache entirely
    await page.setCacheEnabled(false);
    
    // Login
    await page.goto('https://n11.namainvist.com/login?bust=' + Date.now(), { waitUntil: 'networkidle0' });
    await page.type('input[type="text"], input[name="username"]', 'admin');
    await page.type('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    
    // Wait for navigation and reports page
    await page.waitForNavigation();
    await page.goto('https://n11.namainvist.com/reports?bust=' + Date.now(), { waitUntil: 'networkidle0' });
    
    // Unregister service workers just in case
    await page.evaluate(async () => {
        if (navigator.serviceWorker) {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (let r of regs) await r.unregister();
        }
    });
    
    // Reload forcefully without cache
    await page.reload({ waitUntil: 'networkidle0' });
    
    // Wait for cards to appear
    await page.waitForSelector('.card');
    
    const titles = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.card')).map(el => el.innerText.replace(/\\n/g, ' '));
    });
    
    console.log('--- CARDS ---');
    console.log(titles.join('\\n'));
    console.log('--------------');
    
    await browser.close();
})();
