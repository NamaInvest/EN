const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function runTest() {
    try {
        console.log("Ensuring puppeteer is installed...");
        if (!fs.existsSync(path.join(__dirname, 'node_modules', 'puppeteer'))) {
            execSync('npm install puppeteer --no-save', { stdio: 'inherit' });
        }
        
        const puppeteer = require('puppeteer');
        console.log("Launching headless browser...");
        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        
        page.on('pageerror', err => {
            console.log('--- PAGE ERROR ---');
            console.log(err.message);
        });

        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('--- CONSOLE ERROR ---');
                console.log(msg.text());
            }
        });

        console.log("Navigating to http://n1.namainvist.com/master-panel");
        await page.goto('http://n1.namainvist.com/master-panel', { waitUntil: 'networkidle2', timeout: 30000 });
        
        console.log("Waiting 3 seconds for React to hydrate and crash...");
        await new Promise(r => setTimeout(r, 3000));
        
        console.log("Done checking.");
        await browser.close();
    } catch (e) {
        console.error("Test script failed:", e);
    }
}
runTest();
