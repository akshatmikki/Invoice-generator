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

/** Numeric per-item fields a formula term can reference — summed across the selected products. */
export const FORMULA_PRODUCT_FIELDS = [
  { key: 'qty', label: 'Total Qty' },
  { key: 'unitPrice', label: 'Total Unit Price' },
  { key: 'discountAmt', label: 'Total Discount Amt' },
  { key: 'taxAmt', label: 'Total Tax Amt' },
  { key: 'lineTotal', label: 'Total Line Total' },
  { key: 'weight', label: 'Total Weight' },
  { key: 'valueOfGoods', label: 'Total Value of Goods' },
];

/** Already-computed invoice totals a formula term can reference (see computeInvoiceTotals' return shape). */
export const FORMULA_TOTAL_FIELDS = [
  { key: 'subtotal', label: 'Subtotal (Taxable Value)' },
  { key: 'totalLineDiscount', label: 'Item Discounts' },
  { key: 'extraDiscountAmt', label: 'Extra Discount Amount' },
  { key: 'totalLineTax', label: 'Item Tax' },
  { key: 'extraTaxAmt', label: 'Extra Tax Amount' },
  { key: 'extraLinesTotal', label: 'Extra Charges Total' },
  { key: 'grandTotal', label: 'Grand Total' },
];

/**
 * Evaluates a chain of formula terms left-to-right (no operator precedence — matches the
 * row-by-row builder UI). Each term is one of:
 *   { sourceType: 'column', field, op }   — sum of a numeric product column across selected items
 *   { sourceType: 'total', field, op }    — an already-computed invoice total
 *   { sourceType: 'constant', constant, op } — a fixed number
 * `op` ('+' | '-' | '*' | '/') combines this term with the running result; ignored on the first term.
 */
export function evaluateFormula(terms, items, totals) {
  if (!terms || terms.length === 0) return 0;
  let result = 0;
  terms.forEach((term, i) => {
    const value =
      term.sourceType === 'constant'
        ? Number(term.constant) || 0
        : term.sourceType === 'total'
        ? Number(totals?.[term.field]) || 0
        : sumColumn(items, term.field);
    if (i === 0) {
      result = value;
      return;
    }
    switch (term.op) {
      case '-':
        result -= value;
        break;
      case '*':
        result *= value;
        break;
      case '/':
        result = value ? result / value : 0;
        break;
      case '+':
      default:
        result += value;
    }
  });
  return round2(result);
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
