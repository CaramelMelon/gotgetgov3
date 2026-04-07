const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const URL = 'http://localhost:5173';
const OUTPUT_DIR = path.join(__dirname, 'screenshots');

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_landing.png') });
  console.log('Saved 01_landing.png');

  // Login
  try {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Sign In'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Continue with Email'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.type('input[type="email"]', 'shubh6@gmail.com');
    await page.type('input[type="password"]', 'qwerty');
    await page.keyboard.press('Enter');
    try { await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }); } catch {}
    await new Promise(r => setTimeout(r, 3000));
  } catch (err) { console.error('Login error:', err.message); }

  const routes = ['/discover','/news','/schedule','/results','/circles','/profile','/notifications','/settings'];
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    try {
      await page.goto(`${URL}${route}`, { waitUntil: 'networkidle0', timeout: 8000 });
      await new Promise(r => setTimeout(r, 1500));
      const filename = `1${i}_${route.substring(1)}.png`;
      await page.screenshot({ path: path.join(OUTPUT_DIR, filename) });
      console.log(`Saved ${filename}`);
    } catch (err) { console.error(`Error ${route}:`, err.message); }
  }

  await browser.close();
  console.log('Done!');
}

run().catch(console.error);
