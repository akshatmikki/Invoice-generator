export function CompanyInfoElement({ company }) {
  if (!company) return null;
  return (
    <div className="el el--info">
      <div className="el-info__name">{company.name}</div>
      <div className="el-info__line">{company.addressLine1}</div>
      <div className="el-info__line">{company.addressLine2}</div>
      <div className="el-info__line">{company.email} · {company.phone}</div>
      <div className="el-info__line el-info__muted">{company.taxId}</div>
    </div>
  );
}

export function ClientInfoElement({ client }) {
  if (!client) return null;
  return (
    <div className="el el--info">
      <div className="el-info__label">Bill To</div>
      <div className="el-info__name">{client.name}</div>
      <div className="el-info__line">{client.billingAddress}</div>
      <div className="el-info__line">{client.email} · {client.phone}</div>
    </div>
  );
}

export function InvoiceMetaElement({ invoiceMeta }) {
  if (!invoiceMeta) return null;
  const rows = [
    ['Invoice #', invoiceMeta.invoiceNumber],
    ['Invoice Date', invoiceMeta.invoiceDate],
    ['Due Date', invoiceMeta.dueDate],
    ['PO #', invoiceMeta.poNumber],
    ['Terms', invoiceMeta.paymentTerms],
  ];
  return (
    <table className="el el--meta-table">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td className="el-meta__label">{label}</td>
            <td className="el-meta__value">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
