import { styleToCss } from '../../utils/textStyle';

function Styled({ styles, field, children }) {
  return <span style={styleToCss(styles?.[field])}>{children}</span>;
}

/** Renders a field value safely — booleans, null, and array/object values don't render as JSX children on their own. */
export function metaDisplayValue(raw) {
  if (raw === null || raw === undefined || raw === '') return '';
  if (typeof raw === 'boolean') return String(raw);
  if (Array.isArray(raw)) return raw.length ? JSON.stringify(raw) : '';
  if (typeof raw === 'object') return JSON.stringify(raw);
  return raw;
}

/**
 * Shared renderer for every "title + add/remove list of fields" block:
 * Company Info, Bill To, Ship To, Buyer To, and Custom Block. A row whose
 * label is exactly "Name" renders as a prominent heading (matching the
 * previous bespoke Company/Client layouts); every other row renders as a
 * "Label : value" line. Rows with an empty value are skipped, same as the
 * old fixed-field components did.
 */
export function InfoBlockElement({ block }) {
  if (!block) return null;
  return (
    <div className="el el--info">
      {block.title && <div className="el-info__label">{block.title}</div>}
      {(block.items || []).map((item) => {
        const value = metaDisplayValue(item.value);
        if (!value) return null;
        const isName = item.label?.trim().toLowerCase() === 'name';
        return isName ? (
          <div className="el-info__name" key={item.id}>
            <Styled styles={item.styles} field="value">{value}</Styled>
          </div>
        ) : (
          <div className="el-info__line" key={item.id}>
            <span className="el-info__field-label">{item.label}</span> : <Styled styles={item.styles} field="value">{value}</Styled>
          </div>
        );
      })}
    </div>
  );
}

/** Invoice Info — same add/remove list as InfoBlockElement, but laid out two-per-row like a Tally-style tax invoice header. */
export function InvoiceMetaElement({ invoiceMetaInfo }) {
  if (!invoiceMetaInfo) return null;
  const items = invoiceMetaInfo.items || [];
  const rows = [];
  for (let i = 0; i < items.length; i += 2) rows.push([items[i], items[i + 1]]);
  return (
    <div className="el el--meta-grid">
      {rows.map(([a, b]) => (
        <div className="el-meta-grid__row" key={a.id}>
          <div className="el-meta-grid__cell">
            <span className="el-meta-grid__label">{a.label}</span>
            <span className="el-meta-grid__value"><Styled styles={a.styles} field="value">{metaDisplayValue(a.value)}</Styled></span>
          </div>
          {b && (
            <div className="el-meta-grid__cell">
              <span className="el-meta-grid__label">{b.label}</span>
              <span className="el-meta-grid__value"><Styled styles={b.styles} field="value">{metaDisplayValue(b.value)}</Styled></span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
