import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, '../public/nonograms.svg');
const OUTPUT_DIR = path.join(__dirname, '../public');

async function generateIcons() {
  console.log('Generating icons from ' + INPUT_FILE);

  try {
    // 192x192
    await sharp(INPUT_FILE)
      .resize(192, 192)
      .png()
      .toFile(path.join(OUTPUT_DIR, 'pwa-192x192.png'));
    console.log('Created pwa-192x192.png');

    // 512x512
    await sharp(INPUT_FILE)
      .resize(512, 512)
      .png()
      .toFile(path.join(OUTPUT_DIR, 'pwa-512x512.png'));
    console.log('Created pwa-512x512.png');

    // Apple Touch Icon (180x180)
    await sharp(INPUT_FILE)
      .resize(180, 180)
      .png()
      .toFile(path.join(OUTPUT_DIR, 'apple-touch-icon.png'));
    console.log('Created apple-touch-icon.png');
    
  } catch (err) {
    console.error('Error generating icons:', err);
    process.exit(1);
  }
}

generateIcons();
