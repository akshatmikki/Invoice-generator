import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { getProductColumnDefinitions } from '../../data/apiClient';
import { computeLineTotal, formatCurrency } from '../../utils/calculations';

/** A numeric column header the user can pick up and drop onto a Totals block to add its total there. */
function DraggableColumnHeader({ instanceId, column, className }) {
  const draggableId = `col-${instanceId}-${column.key}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
    data: { fromColumnHeader: true, columnKey: column.key, columnLabel: column.label },
  });

  if (!column.numeric) {
    return <th className={className}>{column.label}</th>;
  }

  return (
    <th className={className}>
      <span
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`col-drag-handle ${isDragging ? 'col-drag-handle--dragging' : ''}`}
        style={{ transform: CSS.Translate.toString(transform) }}
        title="Drag onto a Totals block to show this column's total there"
      >
        {column.label} <span className="col-drag-handle__icon">⠿</span>
      </span>
    </th>
  );
}

export function ProductTableElement({ instanceId, data, products, currencySymbol, onChange, isEditing }) {
  const columnDefs = getProductColumnDefinitions();
  const visible = columnDefs.filter((c) => data.visibleColumns.includes(c.key));

  const toggleProduct = (id) => {
    const next = data.selectedProductIds.includes(id)
      ? data.selectedProductIds.filter((x) => x !== id)
      : [...data.selectedProductIds, id];
    onChange({ selectedProductIds: next });
  };

  const toggleColumn = (key) => {
    const next = data.visibleColumns.includes(key)
      ? data.visibleColumns.filter((x) => x !== key)
      : [...data.visibleColumns, key];
    onChange({ visibleColumns: next });
  };

  const selected = products.filter((p) => data.selectedProductIds.includes(p.id));

  return (
    <div className="el el--product-table">
      {isEditing && (
        <div className="product-picker">
          <div className="product-picker__title">Choose which products appear on this invoice</div>
          <p className="product-picker__note">
            This list comes from the API (products.json in Phase 1). Quantity, price, discount and tax are
            fixed values from that data — you can only choose which rows and columns to <em>show</em>, not edit the numbers.
          </p>
          <div className="product-picker__list">
            {products.map((p) => (
              <label key={p.id} className="product-picker__row">
                <input type="checkbox" checked={data.selectedProductIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                <span className="product-picker__name">{p.name}</span>
                <span className="product-picker__meta">Qty {p.qty} · {formatCurrency(p.unitPrice, currencySymbol)} · {p.taxPercent}% tax</span>
              </label>
            ))}
          </div>

          <div className="product-picker__title">Choose which columns appear</div>
          <div className="product-picker__chips">
            {columnDefs.map((c) => (
              <button
                key={c.key}
                className={`chip ${data.visibleColumns.includes(c.key) ? 'chip--active' : ''}`}
                onClick={() => toggleColumn(c.key)}
                type="button"
              >
                {c.label}
                {c.computed ? ' · calculated' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected.length === 0 ? (
        <div className="empty-hint">
          No products selected yet — {isEditing ? 'tick items above to include them.' : 'click this block to choose which products from the API to include.'}
        </div>
      ) : (
        <>
          <table className="invoice-table">
            <thead>
              <tr>
                {visible.map((c) => (
                  <DraggableColumnHeader
                    key={c.key}
                    instanceId={instanceId}
                    column={c}
                    className={numericCols.includes(c.key) ? 'align-right' : ''}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {selected.map((p) => {
                const calc = computeLineTotal(p);
                return (
                  <tr key={p.id}>
                    {visible.map((c) => (
                      <td key={c.key} className={numericCols.includes(c.key) ? 'align-right num' : ''}>
                        {renderCell(c.key, p, calc, currencySymbol)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!isEditing && (
            <p className="el-footnote" data-html2canvas-ignore="true">
              {selected.length} of {products.length} available products shown · Line Total is auto-calculated · drag a numeric
              column heading onto a Totals block to total it · click to change selection
            </p>
          )}
        </>
      )}
    </div>
  );
}

const numericCols = ['qty', 'unitPrice', 'discountPercent', 'taxPercent', 'lineTotal'];

function renderCell(key, product, calc, currencySymbol) {
  switch (key) {
    case 'unitPrice':
      return formatCurrency(product.unitPrice, currencySymbol);
    case 'lineTotal':
      return formatCurrency(calc.lineTotal, currencySymbol);
    case 'discountPercent':
      return `${product.discountPercent}%`;
    case 'taxPercent':
      return `${product.taxPercent}%`;
    default:
      return product[key];
  }
}
