const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 3200 }, deviceScaleFactor: 3 });
  await page.goto('http://localhost:5176/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const productTableEl = page.locator('.canvas-el').filter({ hasText: 'PRODUCT TABLE' }).first();
  await productTableEl.click({ position: { x: 10, y: 10 } });
  await page.waitForTimeout(500);

  const firstAccordionHead = page.locator('.properties .pf-product__head').first();
  await firstAccordionHead.click();
  await page.waitForTimeout(500);

  const card = page.locator('.properties .pf-product').first();
  await card.screenshot({ path: 'C:/Users/AKSHAT~1/AppData/Local/Temp/claude/d--Document-Designer/572fb1b1-0343-4da1-b780-1a53b8521c7c/scratchpad/card_zoom.png' });

  const html = await card.evaluate((el) => el.outerHTML.slice(0, 3000));
  console.log(html);

  await browser.close();
})();
