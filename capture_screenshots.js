const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function capture() {
    const chromePath = 'C:\\Users\\Supratim\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
    const optionsPath = 'file:///' + path.resolve(__dirname, 'options.html').replace(/\\/g, '/');
    const screenshotsDir = path.resolve(__dirname, 'docs', 'screenshots');

    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    console.log('Launching headless Chrome at:', chromePath);
    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--allow-file-access-from-files',
            '--window-size=1280,950'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1180, deviceScaleFactor: 2 });

    console.log('Navigating to options page:', optionsPath);
    await page.goto(optionsPath, { waitUntil: 'networkidle0' });

    // Wait for initial render
    await new Promise(r => setTimeout(r, 1000));

    // 1. Dark Mode - General Tab
    console.log('Capturing 01_general_dark.png...');
    await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
        const generalTab = document.querySelector('[data-tab="general"]');
        if (generalTab) generalTab.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({
        path: path.join(screenshotsDir, '01_general_dark.png'),
        fullPage: false
    });

    // 2. Light Mode - General Tab
    console.log('Capturing 05_general_light.png...');
    await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('dark');
        const generalTab = document.querySelector('[data-tab="general"]');
        if (generalTab) generalTab.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({
        path: path.join(screenshotsDir, '05_general_light.png'),
        fullPage: false
    });

    // Switch back to Dark for remaining tabs
    await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
    });

    // 3. Modes Tab
    console.log('Capturing 02_modes_liquid_glass.png...');
    await page.evaluate(() => {
        const modesTab = document.querySelector('[data-tab="modes"]');
        if (modesTab) modesTab.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({
        path: path.join(screenshotsDir, '02_modes_liquid_glass.png'),
        fullPage: false
    });

    // 4. Custom Modes Tab
    console.log('Capturing 03_custom_modes.png...');
    await page.evaluate(() => {
        const customTab = document.querySelector('[data-tab="custom"]');
        if (customTab) customTab.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({
        path: path.join(screenshotsDir, '03_custom_modes.png'),
        fullPage: false
    });

    // 5. Stats Tab
    console.log('Capturing 04_stats_analytics.png...');
    await page.evaluate(() => {
        const statsTab = document.querySelector('[data-tab="stats"]');
        if (statsTab) statsTab.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({
        path: path.join(screenshotsDir, '04_stats_analytics.png'),
        fullPage: false
    });

    console.log('All screenshots captured successfully!');
    await browser.close();
}

capture().catch(err => {
    console.error('Error capturing screenshots:', err);
    process.exit(1);
});
