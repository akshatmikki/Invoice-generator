import { styleToCss } from '../../utils/textStyle';

function Styled({ styles, field, children }) {
  return <span style={styleToCss(styles?.[field])}>{children}</span>;
}

export function CompanyInfoElement({ company }) {
  if (!company) return null;
  const styles = company.styles;
  return (
    <div className="el el--info">
      <div className="el-info__name"><Styled styles={styles} field="name">{company.name}</Styled></div>
      {company.addressLine1 && <div className="el-info__line"><Styled styles={styles} field="addressLine1">{company.addressLine1}</Styled></div>}
      {company.addressLine2 && <div className="el-info__line"><Styled styles={styles} field="addressLine2">{company.addressLine2}</Styled></div>}
      {company.email && <div className="el-info__line"><Styled styles={styles} field="email">{company.email}</Styled></div>}
      {company.phone && <div className="el-info__line"><Styled styles={styles} field="phone">{company.phone}</Styled></div>}
      {company.taxId && <div className="el-info__line el-info__muted"><Styled styles={styles} field="taxId">{company.taxId}</Styled></div>}
    </div>
  );
}

export function ClientInfoElement({ client }) {
  if (!client) return null;
  const styles = client.styles;
  return (
    <div className="el el--info">
      <div className="el-info__label">Buyer</div>
      <div className="el-info__name"><Styled styles={styles} field="name">{client.name}</Styled></div>
      {client.billingAddress && <div className="el-info__line"><Styled styles={styles} field="billingAddress">{client.billingAddress}</Styled></div>}
      {client.email && <div className="el-info__line"><Styled styles={styles} field="email">{client.email}</Styled></div>}
      {client.phone && <div className="el-info__line"><Styled styles={styles} field="phone">{client.phone}</Styled></div>}
      {client.country && (
        <div className="el-info__line">
          <span className="el-info__field-label">Country</span> : <Styled styles={styles} field="country">{client.country}</Styled>
        </div>
      )}
      {client.taxId && (
        <div className="el-info__line">
          <span className="el-info__field-label">VATIN</span> : <Styled styles={styles} field="taxId"><span className="el-info__muted">{client.taxId}</span></Styled>
        </div>
      )}
      {client.placeOfSupply && (
        <div className="el-info__line">
          <span className="el-info__field-label">Place of supply</span> : <Styled styles={styles} field="placeOfSupply">{client.placeOfSupply}</Styled>
        </div>
      )}
    </div>
  );
}

/** [row label, invoiceMeta field key] pairs, laid out two-per-row like a Tally-style tax invoice header. Shared with the Properties panel's edit form. */
export const META_ROWS = [
  ['Invoice No.', 'invoiceNumber', 'Dated', 'invoiceDate'],
  ['Delivery Note', 'deliveryNote', 'Mode/Terms of Payment', 'modeOfPayment'],
  ["Supplier's Ref.", 'supplierRef', 'Other Reference(s)', 'otherReference'],
  ["Buyer's Order No.", 'buyersOrderNo', 'Dated', 'buyersOrderDate'],
  ['Despatch Document No.', 'despatchDocNo', 'Delivery Note Date', 'deliveryNoteDate'],
  ['Despatched through', 'despatchedThrough', 'Destination', 'destination'],
];

export function InvoiceMetaElement({ invoiceMeta }) {
  if (!invoiceMeta) return null;
  const styles = invoiceMeta.styles;
  return (
    <div className="el el--meta-grid">
      {META_ROWS.map(([labelA, keyA, labelB, keyB]) => (
        <div className="el-meta-grid__row" key={keyA}>
          <div className="el-meta-grid__cell">
            <span className="el-meta-grid__label">{labelA}</span>
            <span className="el-meta-grid__value"><Styled styles={styles} field={keyA}>{invoiceMeta[keyA]}</Styled></span>
          </div>
          <div className="el-meta-grid__cell">
            <span className="el-meta-grid__label">{labelB}</span>
            <span className="el-meta-grid__value"><Styled styles={styles} field={keyB}>{invoiceMeta[keyB]}</Styled></span>
          </div>
        </div>
      ))}
      {invoiceMeta.termsOfDelivery && (
        <div className="el-meta-grid__row">
          <div className="el-meta-grid__cell el-meta-grid__cell--full">
            <span className="el-meta-grid__label">Terms of Delivery</span>
            <span className="el-meta-grid__value"><Styled styles={styles} field="termsOfDelivery">{invoiceMeta.termsOfDelivery}</Styled></span>
          </div>
        </div>
      )}
    </div>
  );
}
