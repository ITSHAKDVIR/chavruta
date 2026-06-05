/**
 * Generate all app icon PNG files from the SVG sources in `assets-source/`.
 *
 * Required outputs (overwrites the existing assets):
 *   assets/icon.png                       (1024x1024) - main app icon
 *   assets/android-icon-foreground.png    (1024x1024) - adaptive icon foreground
 *   assets/android-icon-background.png    (1024x1024) - adaptive icon background (solid navy)
 *   assets/android-icon-monochrome.png    (1024x1024) - themed icon (Android 13+)
 *   assets/splash-icon.png                (1024x1024) - splash screen icon
 *   assets/favicon.png                    (48x48)     - web favicon
 *
 * Usage: node scripts/generate-app-icons.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'assets-source');
const OUT = path.join(ROOT, 'assets');

async function svgToPng(svgPath, outPath, size) {
  const svgBuffer = fs.readFileSync(svgPath);
  await sharp(svgBuffer)
    .resize(size, size)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outPath);
  const stat = fs.statSync(outPath);
  console.log(`  ${path.basename(outPath)}  (${size}x${size}, ${(stat.size / 1024).toFixed(1)} KB)`);
}

async function makeBackground(outPath, size) {
  // Adaptive icon BACKGROUND: solid navy gradient (we use a simple flat color
  // because Android's adaptive system layers foreground on top with parallax).
  // A gradient SVG would be re-rasterized; flat fill is cleaner.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a1f3d"/>
        <stop offset="100%" stop-color="#2c5282"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#g)"/>
  </svg>`;
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  const stat = fs.statSync(outPath);
  console.log(`  ${path.basename(outPath)}  (${size}x${size}, ${(stat.size / 1024).toFixed(1)} KB)`);
}

(async () => {
  console.log('Generating app icons from SVG sources...\n');

  console.log('Main app icon:');
  await svgToPng(path.join(SRC, 'logo.svg'), path.join(OUT, 'icon.png'), 1024);

  console.log('\nAdaptive icon (Android):');
  await svgToPng(
    path.join(SRC, 'adaptive-foreground.svg'),
    path.join(OUT, 'android-icon-foreground.png'),
    1024,
  );
  await makeBackground(path.join(OUT, 'android-icon-background.png'), 1024);
  await svgToPng(
    path.join(SRC, 'adaptive-monochrome.svg'),
    path.join(OUT, 'android-icon-monochrome.png'),
    1024,
  );

  console.log('\nSplash + favicon:');
  await svgToPng(path.join(SRC, 'splash.svg'), path.join(OUT, 'splash-icon.png'), 1024);
  await svgToPng(path.join(SRC, 'logo.svg'), path.join(OUT, 'favicon.png'), 48);

  console.log('\nDone. Run `npx expo prebuild --clean` to apply to native projects.');
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
