import { useDroppable } from '@dnd-kit/core';
import { computeInvoiceTotals, formatCurrency, percentOf, evaluateFormula } from '../../utils/calculations';

export function TotalsElement({ instanceId, data, products, selectedProductIds, predefinedTotals, totalsPipeline, currencySymbol, currencyDecimals = 2, onFieldClick }) {
  const totals = computeInvoiceTotals(products, selectedProductIds, data.extraDiscountPercent, data.extraTaxPercent, data.extraLines, totalsPipeline);
  const hasProducts = selectedProductIds.length > 0;
  const totalColumns = data.totalColumns || [];
  const extraLines = data.extraLines || [];
  const formulaLines = data.formulaLines || [];
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
              {totalColumns.map((id) => {
                const def = (predefinedTotals || []).find((d) => d.id === id);
                if (!def) return null;
                const value = evaluateFormula(def.terms, totals.items, totals);
                return (
                  <div className="totals-row totals-row--column" key={id}>
                    <span>{def.label}</span>
                    <span className="num">{def.isCurrency ? formatCurrency(value, currencySymbol, currencyDecimals) : value}</span>
                  </div>
                );
              })}
              {extraLines.length > 0 && <div className="totals-divider" />}
              {extraLines.map((line) => (
                <div
                  className={`totals-row ${onFieldClick ? 'el-field--clickable' : ''}`}
                  key={line.id}
                  onClick={onFieldClick ? (e) => { e.stopPropagation(); onFieldClick(line.id); } : undefined}
                >
                  <span>{line.label}</span>
                  <span className="num">{formatCurrency(Number(line.amount) || 0, currencySymbol, currencyDecimals)}</span>
                </div>
              ))}
              {formulaLines.length > 0 && <div className="totals-divider" />}
              {formulaLines.map((line) => (
                <div
                  className={`totals-row ${onFieldClick ? 'el-field--clickable' : ''}`}
                  key={line.id}
                  onClick={onFieldClick ? (e) => { e.stopPropagation(); onFieldClick(line.id); } : undefined}
                >
                  <span>{line.label}</span>
                  <span className="num">{formatCurrency(evaluateFormula(line.terms, totals.items, totals), currencySymbol, currencyDecimals)}</span>
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
