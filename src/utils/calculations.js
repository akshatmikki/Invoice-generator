import { v4 as uuid } from 'uuid';

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
 * Invoice-level math for whichever products the layman selected in the Product Table element,
 * plus any extra invoice-wide discount/tax set on the Totals element. The core breakdown
 * (Taxable Value -> Item Discounts -> Extra Discount -> Item Tax -> Extra Tax -> Invoice Total)
 * runs as an ordered `pipeline` of formulas (see TOTALS_PIPELINE_STAGES/createDefaultTotalsPipeline)
 * so a customized pipeline changes the real grand total, not just a display row.
 */
export function computeInvoiceTotals(products, selectedProductIds, extraDiscountPercent = 0, extraTaxPercent = 0, extraLines = [], pipeline) {
  const items = products
    .filter((p) => selectedProductIds.includes(p.id))
    .map((p) => ({ ...p, ...computeLineTotal(p) }));

  const stages = pipeline || createDefaultTotalsPipeline();
  const extraLinesTotal = round2(extraLines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0));

  // Running scope each pipeline stage's formula can reference via a sourceType:'total' term —
  // seeded with the raw % inputs and the (always-fixed) extra charges total, then filled in one
  // stage at a time so later stages can build on earlier ones without ever seeing their own or a
  // later stage's still-unset value.
  const acc = { extraDiscountPercent, extraTaxPercent, extraLinesTotal };
  for (const stage of TOTALS_PIPELINE_STAGES) {
    acc[stage.id] = evaluateFormula(stages[stage.id], items, acc);
  }

  return {
    items,
    subtotal: acc.subtotal,
    totalLineDiscount: acc.totalLineDiscount,
    totalLineTax: acc.totalLineTax,
    extraDiscountAmt: acc.extraDiscountAmt,
    extraTaxAmt: acc.extraTaxAmt,
    taxableBase: round2(acc.subtotal - acc.totalLineDiscount - acc.extraDiscountAmt),
    extraLinesTotal,
    grandTotal: acc.grandTotal,
  };
}

/** Sums a numeric column (e.g. gross, discountAmt, taxAmt, lineTotal) across the computed items. */
export function sumColumn(items, key) {
  return round2(items.reduce((sum, i) => sum + (Number(i[key]) || 0), 0));
}

/** Numeric per-item fields a formula term can reference — summed across the selected products. */
export const FORMULA_PRODUCT_FIELDS = [
  { key: 'gross', label: 'Total Gross (before discount/tax)' },
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

/** Builds one blank formula term (used both for ad-hoc Totals formulas and predefined-total terms). */
export function newFormulaTerm(op = '+') {
  return { id: uuid(), op, sourceType: 'column', field: FORMULA_PRODUCT_FIELDS[0].key, constant: 0 };
}

/**
 * The invoice-level calculation pipeline behind the Totals block's core breakdown rows. Lives in
 * global designer state (DesignerContext's `totalsPipeline`) and is shared by every Totals block —
 * same as predefinedTotals — because it defines *how the invoice is calculated*, not a per-block
 * display choice. Stages run in this order; each stage's formula may only reference stages that
 * already ran (listed in `availableTotalFields`, alongside the two % inputs and the extra charges
 * total), so the pipeline can never reference its own output or a later one.
 */
export const TOTALS_PIPELINE_STAGES = [
  { id: 'subtotal', label: 'Taxable Value', availableTotalFields: [] },
  { id: 'totalLineDiscount', label: 'Item Discounts', availableTotalFields: ['subtotal'] },
  { id: 'extraDiscountAmt', label: 'Extra Discount Amount', availableTotalFields: ['subtotal', 'totalLineDiscount', 'extraDiscountPercent'] },
  { id: 'totalLineTax', label: 'Item Tax', availableTotalFields: ['subtotal', 'totalLineDiscount', 'extraDiscountAmt'] },
  { id: 'extraTaxAmt', label: 'Extra Tax Amount', availableTotalFields: ['subtotal', 'totalLineDiscount', 'extraDiscountAmt', 'totalLineTax', 'extraTaxPercent'] },
  { id: 'grandTotal', label: 'Invoice Total', availableTotalFields: ['subtotal', 'totalLineDiscount', 'extraDiscountAmt', 'totalLineTax', 'extraTaxAmt', 'extraLinesTotal'] },
];

/** Labels for the pipeline's reference-only fields — the raw % inputs and the fixed extra-charges total. */
export const TOTALS_PIPELINE_EXTRA_FIELD_LABELS = {
  extraDiscountPercent: 'Extra Discount %',
  extraTaxPercent: 'Extra Tax %',
  extraLinesTotal: 'Extra Charges Total',
};

function pipelineTerm(op, sourceType, field, constant = 0) {
  return { id: uuid(), op, sourceType, field, constant };
}

/** Default pipeline terms — reproduces the invoice's original fixed math, expressed as editable formulas. */
export function createDefaultTotalsPipeline() {
  return {
    subtotal: [pipelineTerm('+', 'column', 'gross')],
    totalLineDiscount: [pipelineTerm('+', 'column', 'discountAmt')],
    extraDiscountAmt: [
      pipelineTerm('+', 'total', 'subtotal'),
      pipelineTerm('-', 'total', 'totalLineDiscount'),
      pipelineTerm('*', 'total', 'extraDiscountPercent'),
      pipelineTerm('/', 'constant', undefined, 100),
    ],
    totalLineTax: [pipelineTerm('+', 'column', 'taxAmt')],
    extraTaxAmt: [
      pipelineTerm('+', 'total', 'subtotal'),
      pipelineTerm('-', 'total', 'totalLineDiscount'),
      pipelineTerm('-', 'total', 'extraDiscountAmt'),
      pipelineTerm('*', 'total', 'extraTaxPercent'),
      pipelineTerm('/', 'constant', undefined, 100),
    ],
    grandTotal: [
      pipelineTerm('+', 'total', 'subtotal'),
      pipelineTerm('-', 'total', 'totalLineDiscount'),
      pipelineTerm('-', 'total', 'extraDiscountAmt'),
      pipelineTerm('+', 'total', 'totalLineTax'),
      pipelineTerm('+', 'total', 'extraTaxAmt'),
      pipelineTerm('+', 'total', 'extraLinesTotal'),
    ],
  };
}

/**
 * Seed set of predefined column totals, shared across every Totals block on the document (lives in
 * global designer state — see DesignerContext's `predefinedTotals` — not per-block data). Each is a
 * formula line just like a custom Totals formula, so it can be relabeled/redefined from the
 * Properties panel; `key` additionally matches a Product Table column so dragging that column
 * heading onto a Totals block toggles this def on (see App.jsx's totals-drop handling).
 */
export function createDefaultPredefinedTotals() {
  return [
    { id: 'qty', key: 'qty', label: 'Total Qty', isCurrency: false, terms: [{ id: uuid(), op: '+', sourceType: 'column', field: 'qty', constant: 0 }] },
    { id: 'unitPrice', key: 'unitPrice', label: 'Total Unit Price', isCurrency: true, terms: [{ id: uuid(), op: '+', sourceType: 'column', field: 'unitPrice', constant: 0 }] },
    { id: 'discountPercent', key: 'discountPercent', label: 'Total Discount Amt', isCurrency: true, terms: [{ id: uuid(), op: '+', sourceType: 'column', field: 'discountAmt', constant: 0 }] },
    { id: 'taxPercent', key: 'taxPercent', label: 'Total Tax Amt', isCurrency: true, terms: [{ id: uuid(), op: '+', sourceType: 'column', field: 'taxAmt', constant: 0 }] },
    { id: 'lineTotal', key: 'lineTotal', label: 'Total Line Total', isCurrency: true, terms: [{ id: uuid(), op: '+', sourceType: 'column', field: 'lineTotal', constant: 0 }] },
  ];
}

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
