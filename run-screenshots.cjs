const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const URL = 'http://localhost:5173';
const OUTPUT_DIR = path.join(__dirname, 'screenshots-mobile');

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Force light mode via media feature emulation
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  
  // Mobile viewport parameters (iPhone 13-ish)
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  
  // Set a mobile User Agent to ensure any mobile logic triggers
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');

  console.log('Navigating to landing page...');
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_landing.png'), fullPage: true });

  console.log('Attempting to log in...');
  try {
    // 1. Click Sign In button on landing page
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const signInBtn = buttons.find(b => b.textContent && b.textContent.trim().includes('Sign In'));
      if (signInBtn) signInBtn.click();
      else console.log('Sign In button not found, buttons:', buttons.map(b => b.textContent?.trim()));
    });
    await new Promise(r => setTimeout(r, 1500));

    // 2. Click "Continue with Email"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const emailBtn = buttons.find(b => b.textContent && b.textContent.includes('Continue with Email'));
      if (emailBtn) emailBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // 3. Wait for email input and type credentials
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'shubh3@gmail.com');
    await page.type('input[type="password"]', 'qwerty');

    // 4. Submit
    await page.keyboard.press('Enter');

    console.log('Credentials entered, waiting for navigation...');
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 8000 });
    } catch {
      console.log('No navigation event, waiting longer...');
    }
    await new Promise(r => setTimeout(r, 4000));
    console.log('Current URL:', page.url());
  } catch (err) {
    console.error('Login error:', err.message);
  }

  const routes = [
    '/discover',
    '/news',
    '/schedule',
    '/results',
    '/circles',
    '/profile',
    '/notifications',
    '/settings'
  ];

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    console.log(`Navigating to ${route}...`);
    try {
      await page.goto(`${URL}${route}`, { waitUntil: 'networkidle0', timeout: 10000 });
      await new Promise(r => setTimeout(r, 2500)); // wait for animations/data fetch
      // Force light theme on every navigation
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light');
      });
      await new Promise(r => setTimeout(r, 300));
      const filename = `1${i}_${route.substring(1)}.png`;
      await page.screenshot({ path: path.join(OUTPUT_DIR, filename), fullPage: true });
      console.log(`Saved screenshot ${filename}`);
    } catch (err) {
      console.error(`Error capturing ${route}:`, err.message);
    }
  }

  await browser.close();
  console.log('Done!');
}

run().catch(console.error);
