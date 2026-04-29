const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--incognito'] });
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    
    // Login
    await page.goto('https://n11.namainvist.com/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="text"], input[name="username"]', 'admin');
    await page.type('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    
    // Wait for navigation and reports page EXACT URL without bust
    await page.waitForNavigation();
    await page.goto('https://n11.namainvist.com/reports', { waitUntil: 'networkidle0' });
    
    // Wait for cards to appear
    await page.waitForSelector('.card');
    
    const titles = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.card')).map(el => el.innerText.replace(/\\n/g, ' '));
    });
    
    console.log('--- EXACT URL CARDS ---');
    console.log(titles.join('\\n'));
    console.log('--------------');
    
    await browser.close();
})();
