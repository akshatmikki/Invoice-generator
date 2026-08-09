/**
 * Calculation engine for the invoice designer.
 * Pure functions only — no React, no state — so they're easy to unit test
 * and easy to swap out later if pricing rules change.
 */

/** Per-line math: gross -> discount -> tax -> line total */
export function computeLineTotal(product) {
  const gross = round2(product.qty * product.unitPrice);
  const discountAmt = round2(gross * ((product.discountPercent || 0) / 100));
  const afterDiscount = round2(gross - discountAmt);
  const taxAmt = round2(afterDiscount * ((product.taxPercent || 0) / 100));
  const lineTotal = round2(afterDiscount + taxAmt);
  return { gross, discountAmt, afterDiscount, taxAmt, lineTotal };
}

/**
 * Invoice-level math for whichever products the layman selected in the
 * Product Table element, plus any extra invoice-wide discount/tax set on
 * the Totals element.
 */
export function computeInvoiceTotals(products, selectedProductIds, extraDiscountPercent = 0, extraTaxPercent = 0, extraLines = []) {
  const items = products
    .filter((p) => selectedProductIds.includes(p.id))
    .map((p) => ({ ...p, ...computeLineTotal(p) }));

  const subtotal = round2(items.reduce((sum, i) => sum + i.gross, 0));
  const totalLineDiscount = round2(items.reduce((sum, i) => sum + i.discountAmt, 0));
  const totalLineTax = round2(items.reduce((sum, i) => sum + i.taxAmt, 0));

  const afterLineDiscount = round2(subtotal - totalLineDiscount);
  const extraDiscountAmt = round2(afterLineDiscount * (extraDiscountPercent / 100));
  const taxableBase = round2(afterLineDiscount - extraDiscountAmt);
  const extraTaxAmt = round2(taxableBase * (extraTaxPercent / 100));
  const extraLinesTotal = round2(extraLines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0));

  const grandTotal = round2(taxableBase + totalLineTax + extraTaxAmt + extraLinesTotal);

  return {
    items,
    subtotal,
    totalLineDiscount,
    totalLineTax,
    extraDiscountAmt,
    extraTaxAmt,
    taxableBase,
    extraLinesTotal,
    grandTotal,
  };
}

/** Sums a numeric column (e.g. qty, unitPrice, discountAmt, taxAmt, lineTotal) across the computed items. */
export function sumColumn(items, key) {
  return round2(items.reduce((sum, i) => sum + (Number(i[key]) || 0), 0));
}

/** Safe percentage: amount as a % of base, 0 if base is 0. */
export function percentOf(amount, base) {
  if (!base) return 0;
  return round2((amount / base) * 100);
}

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(amount, symbol = '₹', decimals = 2) {
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}
