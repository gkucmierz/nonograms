import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function takeScreenshot() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set viewport to a nice desktop size
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

  console.log('Navigating to app...');
  try {
    // Try local network IP if localhost fails, but localhost should work in this env
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 10000 });
  } catch (e) {
    console.log('Retrying with networkidle2...');
    try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 10000 });
    } catch (e2) {
        console.error('Could not load page:', e2.message);
        await browser.close();
        process.exit(1);
    }
  }

  // Wait for animations/rendering
  await new Promise(r => setTimeout(r, 2000));

  const screenshotPath = path.join(__dirname, '../public/screenshot.png');
  console.log(`Taking screenshot to ${screenshotPath}...`);
  
  await page.screenshot({ path: screenshotPath });
  
  await browser.close();
  console.log('Done.');
}

takeScreenshot();
