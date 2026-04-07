const puppeteer = require('puppeteer');
const path = require('path');

const URL = 'http://localhost:5173';

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Login via guest to get to Discover fast
  await page.goto(URL, { waitUntil: 'networkidle0' });
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
  await new Promise(r => setTimeout(r, 4000));

  // Discover
  await page.goto(`${URL}/discover`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(__dirname, 'screenshots', '10_discover.png') });
  console.log('Saved discover');

  // Profile full-page
  await page.goto(`${URL}/profile`, { waitUntil: 'networkidle0', timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(__dirname, 'screenshots', '15_profile.png'), fullPage: true });
  console.log('Saved profile (fullPage)');

  await browser.close();
}

run().catch(console.error);
