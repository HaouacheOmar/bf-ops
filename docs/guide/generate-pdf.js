const path = require('path');

async function main() {
  const { chromium } = require('playwright');

  const root = 'D:/omar/bf-ops/docs/guide';
  const htmlPath = path.join(root, 'app-guide-ar.html');
  const pdfPath = path.join(root, 'app-guide-ar.pdf');

  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge',
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 2000 },
    locale: 'ar-DZ',
  });

  const page = await context.newPage();
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', right: '12mm', bottom: '14mm', left: '12mm' },
  });

  await browser.close();
  console.log('PDF_CREATED', pdfPath);
}

main().catch((err) => {
  console.error('PDF_FAILED', err);
  process.exit(1);
});
