import { getOrderInfoColumnDefinitions } from '../../data/apiClient';
import { styleToCss } from '../../utils/textStyle';

function tableStyleVars(tableStyle = {}) {
  return {
    '--tbl-header-bg': tableStyle.headerBg || undefined,
    '--tbl-header-color': tableStyle.headerColor || undefined,
    '--tbl-border-color': tableStyle.borderColor || undefined,
    '--tbl-font-size': tableStyle.fontSize ? `${tableStyle.fontSize}px` : undefined,
    '--tbl-stripe-bg': tableStyle.striped ? tableStyle.stripeColor || '#f2efe8' : 'transparent',
  };
}

/**
 * A Field/Value table for the freight order & shipment dataset (order #,
 * dates, truck/driver/trailer/carrier, factoring company, shipper/consignee)
 * — built the same way as the Product Table element (row items checked
 * on/off, editable inline, toggleable columns) so it behaves like it,
 * instead of being crammed into the Tally-style Invoice Info box.
 */
export function OrderInfoTableElement({ data, items }) {
  const columnDefs = getOrderInfoColumnDefinitions();
  const visible = columnDefs.filter((c) => data.visibleColumns.includes(c.key));
  const selected = items.filter((item) => data.selectedRowIds.includes(item.id));
  const styleVars = tableStyleVars(data.tableStyle);

  if (selected.length === 0) {
    return (
      <div className="el el--product-table" style={styleVars}>
        <div className="empty-hint">No rows selected yet — select this block and use the panel on the right to choose which ones to include.</div>
      </div>
    );
  }

  return (
    <div className="el el--product-table" style={styleVars}>
      <table className="invoice-table">
        <thead>
          <tr>
            <th className="align-right">Sl No.</th>
            {visible.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {selected.map((item, index) => (
            <tr key={item.id}>
              <td className="align-right num">{index + 1}</td>
              {visible.map((c) => (
                <td key={c.key}>
                  <span style={styleToCss(item.styles?.[c.key])}>{item[c.key]}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="el-footnote" data-html2canvas-ignore="true">
        {selected.length} of {items.length} available rows shown · select to edit
      </p>
    </div>
  );
}
