const puppeteer = require('puppeteer');

(async () => {
    console.log("Launching headless diagnostic trace...");
    const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    console.log("Navigating to login...");
    await page.goto('https://n1.namainvist.com/login', { waitUntil: 'networkidle0' });

    console.log("Injecting audit scripts...");
    const auditData = await page.evaluate(async () => {
        const sw = await navigator.serviceWorker.getRegistrations();
        const hasManifest = !!document.querySelector('link[rel="manifest"]');
        return {
            serviceWorkersCount: sw.length,
            serviceWorkers: sw.map(s => s.active?.state || s.installing?.state || s.waiting?.state),
            hasManifest,
            isSecureContext: window.isSecureContext
        };
    });

    console.log("AUDIT RESULTS:", JSON.stringify(auditData, null, 2));
    await browser.close();
})();
