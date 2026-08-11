const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(String(err)));

  await page.goto('http://localhost:5176/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Find a Product Table element on canvas and click it to select it.
  const productTableEl = page.locator('.el--product-table, [class*="product-table"]').first();
  const count = await productTableEl.count();
  console.log('product table elements found on canvas:', count);
  if (count > 0) {
    await productTableEl.click({ position: { x: 10, y: 10 } });
  } else {
    // fall back: click any canvas element
    const anyEl = page.locator('.canvas-el').first();
    await anyEl.click();
  }
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'C:/Users/AKSHAT~1/AppData/Local/Temp/claude/d--Document-Designer/572fb1b1-0343-4da1-b780-1a53b8521c7c/scratchpad/full.png' });

  // If a product item row exists in properties panel, open it
  const firstAccordionHead = page.locator('.properties .pf-product__head').first();
  if (await firstAccordionHead.count() > 0) {
    await firstAccordionHead.click();
    await page.waitForTimeout(400);
  }

  const propertiesPanel = page.locator('.properties');
  await propertiesPanel.screenshot({ path: 'C:/Users/AKSHAT~1/AppData/Local/Temp/claude/d--Document-Designer/572fb1b1-0343-4da1-b780-1a53b8521c7c/scratchpad/panel.png' });

  console.log('console errors:', errors);
  await browser.close();
})();
