const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto('http://localhost:5176/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const productTableEl = page.locator('.canvas-el').filter({ hasText: 'PRODUCT TABLE' }).first();
  await productTableEl.click({ position: { x: 10, y: 10 } });
  await page.waitForTimeout(500);

  const firstAccordionHead = page.locator('.properties .pf-product__head').first();
  await firstAccordionHead.click();
  await page.waitForTimeout(500);

  const info = await page.evaluate(() => {
    const card = document.querySelector('.properties .pf-product');
    const head = card.querySelector('.pf-product__head');
    const rectOf = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
    const kids = [...head.children].map((c) => ({ tag: c.tagName, cls: c.className, text: c.textContent, rect: rectOf(c) }));
    const cardRect = rectOf(card);
    const headRect = rectOf(head);
    const body = card.querySelector('.pf-product__body');
    const bodyFirstKids = body ? [...body.children].slice(0, 4).map((c) => ({ tag: c.tagName, cls: c.className, text: c.textContent.slice(0, 40), rect: rectOf(c) })) : null;
    return { cardRect, headRect, kids, bodyFirstKids };
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})();
