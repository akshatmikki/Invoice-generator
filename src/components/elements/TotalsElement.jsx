import { useDroppable } from '@dnd-kit/core';
import { computeInvoiceTotals, formatCurrency, sumColumn, percentOf } from '../../utils/calculations';

// Which table columns can have a "column total" row shown, and how to compute + label each.
// (SKU/Item/Description/Category are text, so they're excluded — only numeric columns make sense to total.)
const COLUMN_TOTAL_DEFS = [
  { key: 'qty', label: 'Total Qty', compute: (items) => sumColumn(items, 'qty'), isCurrency: false },
  { key: 'unitPrice', label: 'Total Unit Price', compute: (items) => sumColumn(items, 'unitPrice'), isCurrency: true },
  { key: 'discountPercent', label: 'Total Discount Amt', compute: (items) => sumColumn(items, 'discountAmt'), isCurrency: true },
  { key: 'taxPercent', label: 'Total Tax Amt', compute: (items) => sumColumn(items, 'taxAmt'), isCurrency: true },
  { key: 'lineTotal', label: 'Total Line Total', compute: (items) => sumColumn(items, 'lineTotal'), isCurrency: true },
];

export function TotalsElement({ instanceId, data, products, selectedProductIds, currencySymbol, currencyDecimals = 2 }) {
  const totals = computeInvoiceTotals(products, selectedProductIds, data.extraDiscountPercent, data.extraTaxPercent, data.extraLines);
  const hasProducts = selectedProductIds.length > 0;
  const totalColumns = data.totalColumns || [];
  const extraLines = data.extraLines || [];
  const { isOver, setNodeRef } = useDroppable({ id: `totals-drop-${instanceId}` });

  // Percentages shown inline next to each row — always relative to Subtotal, so they're easy to read at a glance.
  const itemDiscountPct = percentOf(totals.totalLineDiscount, totals.subtotal);
  const itemTaxPct = percentOf(totals.totalLineTax, totals.subtotal);
  const extraDiscountAmtPct = percentOf(totals.extraDiscountAmt, totals.subtotal);
  const extraTaxAmtPct = percentOf(totals.extraTaxAmt, totals.subtotal);
  const totalDiscountCombined = totals.totalLineDiscount + totals.extraDiscountAmt;
  const totalTaxCombined = totals.totalLineTax + totals.extraTaxAmt;
  const overallDiscountPct = percentOf(totalDiscountCombined, totals.subtotal);
  const overallTaxPct = percentOf(totalTaxCombined, totals.subtotal);

  return (
    <div className={`el el--totals ${isOver ? 'el--totals-drop-active' : ''}`} ref={setNodeRef}>
      {isOver && (
        <div className="totals-drop-hint" data-html2canvas-ignore="true">
          Drop to add this column's total
        </div>
      )}

      {!hasProducts ? (
        <div className="empty-hint">
          Totals will appear here once you select line items — select a Product Table block and tick items in the panel on the right.
        </div>
      ) : (
        <div className="totals-box">
          {data.showBreakdown && (
            <>
              <div className="totals-row">
                <span>Taxable Value</span>
                <span className="num">{formatCurrency(totals.subtotal, currencySymbol, currencyDecimals)}</span>
              </div>
              {totals.totalLineDiscount > 0 && (
                <div className="totals-row">
                  <span>Item Discounts <em className="totals-row__pct">({itemDiscountPct}%)</em></span>
                  <span className="num">− {formatCurrency(totals.totalLineDiscount, currencySymbol, currencyDecimals)}</span>
                </div>
              )}
              {data.extraDiscountPercent > 0 && (
                <div className="totals-row">
                  <span>Extra Discount ({data.extraDiscountPercent}%) <em className="totals-row__pct">({extraDiscountAmtPct}% of subtotal)</em></span>
                  <span className="num">− {formatCurrency(totals.extraDiscountAmt, currencySymbol, currencyDecimals)}</span>
                </div>
              )}
              <div className="totals-row">
                <span>Tax <em className="totals-row__pct">({itemTaxPct}%)</em></span>
                <span className="num">+ {formatCurrency(totals.totalLineTax, currencySymbol, currencyDecimals)}</span>
              </div>
              {data.extraTaxPercent > 0 && (
                <div className="totals-row">
                  <span>Extra Tax ({data.extraTaxPercent}%) <em className="totals-row__pct">({extraTaxAmtPct}% of subtotal)</em></span>
                  <span className="num">+ {formatCurrency(totals.extraTaxAmt, currencySymbol, currencyDecimals)}</span>
                </div>
              )}
              {(data.extraDiscountPercent > 0 || data.extraTaxPercent > 0) && (
                <div className="totals-row totals-row--overall">
                  <span>Overall Discount / Tax</span>
                  <span className="num">
                    {overallDiscountPct}% / {overallTaxPct}%
                  </span>
                </div>
              )}

              {totalColumns.length > 0 && <div className="totals-divider" />}
              {totalColumns.map((key) => {
                const def = COLUMN_TOTAL_DEFS.find((d) => d.key === key);
                if (!def) return null;
                const value = def.compute(totals.items);
                return (
                  <div className="totals-row totals-row--column" key={key}>
                    <span>{def.label}</span>
                    <span className="num">{def.isCurrency ? formatCurrency(value, currencySymbol, currencyDecimals) : value}</span>
                  </div>
                );
              })}
              {extraLines.length > 0 && <div className="totals-divider" />}
              {extraLines.map((line) => (
                <div className="totals-row" key={line.id}>
                  <span>{line.label}</span>
                  <span className="num">{formatCurrency(Number(line.amount) || 0, currencySymbol, currencyDecimals)}</span>
                </div>
              ))}
            </>
          )}
          <div className="totals-row totals-row--grand">
            <span>Invoice Total</span>
            <span className="num">{formatCurrency(totals.grandTotal, currencySymbol, currencyDecimals)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
