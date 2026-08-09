import { chromium } from 'playwright';

const SHOT_DIR = 'C:\\Users\\AKSHAT~1\\AppData\\Local\\Temp\\claude\\d--Document-Designer\\765e4dad-64c6-41ff-8b72-11be79da04e6\\scratchpad';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));

await page.goto('http://localhost:5173');
await page.waitForSelector('text=Bill To (Client Details)', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1500);
await page.screenshot({ path: `${SHOT_DIR}/1-initial.png`, fullPage: true });

// 1. Click the "Buyer" (Bill To) block on canvas — find canvas element containing "Buyer" label
const buyerBlock = page.locator('.canvas-el', { hasText: 'Buyer' }).first();
await buyerBlock.click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOT_DIR}/2-billto-selected.png`, fullPage: true });

// Add a field via properties panel
const addFieldBtn = page.locator('.properties button.pf-add-btn', { hasText: '+ Add field' }).first();
await addFieldBtn.click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOT_DIR}/3-billto-field-added.png`, fullPage: true });

// Fill the new field's label/value
const lastLabelInput = page.locator('.properties .pf-product').last().locator('input.pf-input').first();
await lastLabelInput.fill('Partner Name');
const lastValueInput = page.locator('.properties .pf-product').last().locator('input.pf-input').nth(1);
await lastValueInput.fill('Test Partner Co');
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOT_DIR}/4-billto-field-filled.png`, fullPage: true });

// Remove the first field (email, usually blank) via the ✕ button
const removeBtn = page.locator('.properties .pf-product .pf-icon-btn').nth(2);
await removeBtn.click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOT_DIR}/5-billto-field-removed.png`, fullPage: true });

// 2. Drag "Ship To" from palette onto canvas using pointer events (dnd-kit uses PointerSensor)
const shipToCard = page.locator('.palette-card', { hasText: 'Ship To (Shipping Details)' });
const canvasArea = page.locator('.canvas-el, .page-canvas, .canvas').first();
const cardBox = await shipToCard.boundingBox();
const canvasBox = await page.locator('body').boundingBox();

await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
await page.mouse.down();
await page.mouse.move(cardBox.x + cardBox.width / 2 + 50, cardBox.y + cardBox.height / 2 + 20, { steps: 5 });
await page.mouse.move(900, 300, { steps: 10 });
await page.mouse.move(900, 320, { steps: 5 });
await page.mouse.up();
await page.waitForTimeout(500);
await page.screenshot({ path: `${SHOT_DIR}/6-shipto-dropped.png`, fullPage: true });

// 3. Drag "Custom Block" from palette onto canvas
const customCard = page.locator('.palette-card', { hasText: 'Custom Block' });
const customBox = await customCard.boundingBox();
if (customBox) {
  await page.mouse.move(customBox.x + customBox.width / 2, customBox.y + customBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(customBox.x + customBox.width / 2 + 50, customBox.y + customBox.height / 2 + 20, { steps: 5 });
  await page.mouse.move(900, 500, { steps: 10 });
  await page.mouse.move(900, 520, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOT_DIR}/7-custom-dropped.png`, fullPage: true });
}

// Click the custom block and set title + add fields
const customBlockOnCanvas = page.locator('.canvas-el', { hasText: 'Custom Block' }).last();
await customBlockOnCanvas.click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOT_DIR}/8-custom-selected.png`, fullPage: true });

const titleInput = page.locator('.properties input.pf-input').first();
await titleInput.fill('My Custom Section');
const customAddBtn = page.locator('.properties button.pf-add-btn', { hasText: '+ Add field' }).first();
await customAddBtn.click();
await page.waitForTimeout(200);
const cLabel = page.locator('.properties .pf-product').last().locator('input.pf-input').first();
await cLabel.fill('Reference Code');
const cValue = page.locator('.properties .pf-product').last().locator('input.pf-input').nth(1);
await cValue.fill('REF-001');
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOT_DIR}/9-custom-filled.png`, fullPage: true });

// 4. Totals — add extra charge
const totalsBlock = page.locator('.canvas-el', { hasText: 'Invoice Total' }).first();
await totalsBlock.click();
await page.waitForTimeout(300);
const grandTotalBefore = await page.locator('.totals-row--grand .num').first().innerText();
const addChargeBtn = page.locator('.properties button.pf-add-btn', { hasText: '+ Add charge' }).first();
await addChargeBtn.click();
await page.waitForTimeout(200);
const chargeInputs = page.locator('.properties .pf-product').last().locator('input.pf-input');
await chargeInputs.nth(0).fill('Shipping Fee');
await chargeInputs.nth(1).fill('25');
await page.waitForTimeout(300);
const grandTotalAfter = await page.locator('.totals-row--grand .num').first().innerText();
await page.screenshot({ path: `${SHOT_DIR}/10-totals-extra-charge.png`, fullPage: true });

console.log('GRAND_TOTAL_BEFORE:', grandTotalBefore);
console.log('GRAND_TOTAL_AFTER:', grandTotalAfter);
console.log('CONSOLE_ERRORS:', JSON.stringify(errors, null, 2));

await browser.close();
