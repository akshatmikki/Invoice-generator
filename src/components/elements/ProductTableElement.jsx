import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getProductColumnDefinitions } from '../../data/apiClient';
import { computeLineTotal, formatCurrency } from '../../utils/calculations';
import { styleToCss } from '../../utils/textStyle';

const TEXT_COLS = ['name', 'description'];

/** A column header the user can drag left/right to reorder columns, or (if numeric) drop onto a Totals block to total it. */
function DraggableColumnHeader({ instanceId, column, className }) {
  const sortId = `col-${instanceId}-${column.key}`;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortId,
    data: { fromColumnHeader: true, instanceId, columnKey: column.key, columnLabel: column.label, numeric: column.numeric },
  });

  const thStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 1 } : null),
  };

  return (
    <th ref={setNodeRef} className={className} style={thStyle}>
      <span
        {...listeners}
        {...attributes}
        className={`col-drag-handle ${isDragging ? 'col-drag-handle--dragging' : ''}`}
        title={column.numeric ? "Drag to reorder — drop onto a Totals block to show this column's total there" : 'Drag to reorder columns'}
      >
        {column.label} <span className="col-drag-handle__icon">⠿</span>
      </span>
    </th>
  );
}

function tableStyleVars(tableStyle = {}) {
  return {
    '--tbl-header-bg': tableStyle.headerBg || undefined,
    '--tbl-header-color': tableStyle.headerColor || undefined,
    '--tbl-border-color': tableStyle.borderColor || undefined,
    '--tbl-font-size': tableStyle.fontSize ? `${tableStyle.fontSize}px` : undefined,
    '--tbl-stripe-bg': tableStyle.striped ? tableStyle.stripeColor || '#f2efe8' : 'transparent',
  };
}

export function ProductTableElement({ instanceId, data, products, currencySymbol, currencyDecimals = 2, onFieldClick }) {
  const columnDefs = getProductColumnDefinitions();
  const columnsByKey = new Map(columnDefs.map((c) => [c.key, c]));
  const visible = data.visibleColumns.map((key) => columnsByKey.get(key)).filter(Boolean);
  const selected = products.filter((p) => data.selectedProductIds.includes(p.id));
  const styleVars = tableStyleVars(data.tableStyle);

  if (selected.length === 0) {
    return (
      <div className="el el--product-table" style={styleVars}>
        <div className="empty-hint">No line items selected yet — select this block and use the panel on the right to choose which ones to include.</div>
      </div>
    );
  }

  return (
    <div className="el el--product-table" style={styleVars}>
      <table className="invoice-table">
        <thead>
          <tr>
            <th className="align-right">Sl No.</th>
            <SortableContext items={visible.map((c) => `col-${instanceId}-${c.key}`)} strategy={horizontalListSortingStrategy}>
              {visible.map((c) => (
                <DraggableColumnHeader
                  key={c.key}
                  instanceId={instanceId}
                  column={c}
                  className={numericCols.includes(c.key) ? 'align-right' : ''}
                />
              ))}
            </SortableContext>
          </tr>
        </thead>
        <tbody>
          {selected.map((p, index) => {
            const calc = computeLineTotal(p);
            return (
              <tr
                key={p.id}
                className={onFieldClick ? 'el-field--clickable' : ''}
                onClick={onFieldClick ? (e) => { e.stopPropagation(); onFieldClick(p.id); } : undefined}
              >
                <td className="align-right num">{index + 1}</td>
                {visible.map((c) => (
                  <td key={c.key} className={numericCols.includes(c.key) ? 'align-right num' : ''}>
                    {renderCell(c.key, p, calc, currencySymbol, currencyDecimals)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="el-footnote" data-html2canvas-ignore="true">
        {selected.length} of {products.length} available line items shown · Amount is auto-calculated · drag a column
        heading left/right to reorder, or drop a numeric one onto a Totals block to total it · select to edit
      </p>
    </div>
  );
}

const numericCols = ['qty', 'unitPrice', 'discountPercent', 'taxPercent', 'amount', 'lineTotal', 'weight', 'valueOfGoods'];

function renderCell(key, product, calc, currencySymbol, currencyDecimals) {
  if (TEXT_COLS.includes(key)) {
    return <span style={styleToCss(product.styles?.[key])}>{product[key]}</span>;
  }
  switch (key) {
    case 'qty':
      return product.unit ? `${product.qty} ${product.unit}` : product.qty;
    case 'unitPrice':
      return formatCurrency(product.unitPrice, currencySymbol, currencyDecimals);
    case 'amount':
      return formatCurrency(calc.afterDiscount, currencySymbol, currencyDecimals);
    case 'lineTotal':
      return formatCurrency(calc.lineTotal, currencySymbol, currencyDecimals);
    case 'discountPercent':
      return `${product.discountPercent}%`;
    case 'taxPercent':
      return `${product.taxPercent}%`;
    case 'weight':
      return product.weight != null ? `${product.weight} ${product.weightUnit || ''}`.trim() : '';
    case 'valueOfGoods':
      return formatCurrency(product.valueOfGoods, currencySymbol, currencyDecimals);
    case 'hazmat':
      return product.hazmat ? 'Yes' : 'No';
    default:
      return product[key];
  }
}
