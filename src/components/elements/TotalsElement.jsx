import { useDroppable } from '@dnd-kit/core';
import { computeInvoiceTotals, formatCurrency, sumColumn, percentOf } from '../../utils/calculations';
import { getProductColumnDefinitions } from '../../data/apiClient';

// Which table columns can have a "column total" row shown, and how to compute + label each.
// (SKU/Item/Description/Category are text, so they're excluded — only numeric columns make sense to total.)
const COLUMN_TOTAL_DEFS = [
  { key: 'qty', label: 'Total Qty', compute: (items) => sumColumn(items, 'qty'), isCurrency: false },
  { key: 'unitPrice', label: 'Total Unit Price', compute: (items) => sumColumn(items, 'unitPrice'), isCurrency: true },
  { key: 'discountPercent', label: 'Total Discount Amt', compute: (items) => sumColumn(items, 'discountAmt'), isCurrency: true },
  { key: 'taxPercent', label: 'Total Tax Amt', compute: (items) => sumColumn(items, 'taxAmt'), isCurrency: true },
  { key: 'lineTotal', label: 'Total Line Total', compute: (items) => sumColumn(items, 'lineTotal'), isCurrency: true },
];

export function TotalsElement({ instanceId, data, products, selectedProductIds, currencySymbol, onChange, isEditing }) {
  const totals = computeInvoiceTotals(products, selectedProductIds, data.extraDiscountPercent, data.extraTaxPercent);
  const hasProducts = selectedProductIds.length > 0;
  const totalColumns = data.totalColumns || [];
  const tableColumns = getProductColumnDefinitions().filter((c) => c.numeric);
  const { isOver, setNodeRef } = useDroppable({ id: `totals-drop-${instanceId}` });

  const toggleColumnTotal = (key) => {
    const next = totalColumns.includes(key) ? totalColumns.filter((k) => k !== key) : [...totalColumns, key];
    onChange({ totalColumns: next });
  };

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
      {isEditing && (
        <div className="totals-controls">
          <label>
            Extra invoice discount
            <div className="totals-controls__input">
              <input
                type="number"
                min="0"
                max="100"
                value={data.extraDiscountPercent}
                onChange={(e) => onChange({ extraDiscountPercent: Number(e.target.value) })}
              />
              <span>%</span>
            </div>
          </label>
          <label>
            Extra invoice tax
            <div className="totals-controls__input">
              <input
                type="number"
                min="0"
                max="100"
                value={data.extraTaxPercent}
                onChange={(e) => onChange({ extraTaxPercent: Number(e.target.value) })}
              />
              <span>%</span>
            </div>
          </label>
          <label className="totals-controls__checkbox">
            <input type="checkbox" checked={data.showBreakdown} onChange={(e) => onChange({ showBreakdown: e.target.checked })} />
            Show full breakdown
          </label>

          <div className="totals-controls__columns">
            <div className="query-builder__section-title">Also show a total row for these table columns</div>
            <div className="query-builder__chips">
              {tableColumns.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={`chip ${totalColumns.includes(c.key) ? 'chip--active' : ''}`}
                  onClick={() => toggleColumnTotal(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p className="properties__hint" style={{ marginTop: 6 }}>
              Tip: you can also drag a numeric column heading straight from the Product Table onto this box.
            </p>
          </div>
        </div>
      )}

      {!hasProducts ? (
        <div className="empty-hint">
          Totals will appear here once you select products in a Product Table block —{' '}
          {isEditing ? 'add one if you haven\u2019t, and tick items in it.' : 'click a Product Table block above and tick items to include.'}
        </div>
      ) : (
        <div className="totals-box">
          {data.showBreakdown && (
            <>
              <div className="totals-row">
                <span>Subtotal</span>
                <span className="num">{formatCurrency(totals.subtotal, currencySymbol)}</span>
              </div>
              <div className="totals-row">
                <span>Item Discounts <em className="totals-row__pct">({itemDiscountPct}%)</em></span>
                <span className="num">− {formatCurrency(totals.totalLineDiscount, currencySymbol)}</span>
              </div>
              {data.extraDiscountPercent > 0 && (
                <div className="totals-row">
                  <span>Extra Discount ({data.extraDiscountPercent}%) <em className="totals-row__pct">({extraDiscountAmtPct}% of subtotal)</em></span>
                  <span className="num">− {formatCurrency(totals.extraDiscountAmt, currencySymbol)}</span>
                </div>
              )}
              <div className="totals-row">
                <span>Item Tax <em className="totals-row__pct">({itemTaxPct}%)</em></span>
                <span className="num">+ {formatCurrency(totals.totalLineTax, currencySymbol)}</span>
              </div>
              {data.extraTaxPercent > 0 && (
                <div className="totals-row">
                  <span>Extra Tax ({data.extraTaxPercent}%) <em className="totals-row__pct">({extraTaxAmtPct}% of subtotal)</em></span>
                  <span className="num">+ {formatCurrency(totals.extraTaxAmt, currencySymbol)}</span>
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
                    <span className="num">{def.isCurrency ? formatCurrency(value, currencySymbol) : value}</span>
                  </div>
                );
              })}
            </>
          )}
          <div className="totals-row totals-row--grand">
            <span>Grand Total</span>
            <span className="num">{formatCurrency(totals.grandTotal, currencySymbol)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
