import { getProductColumnDefinitions } from '../data/apiClient';
import { formatCurrency } from '../utils/calculations';
import { META_ROWS } from './elements/InfoElements';
import { QUERYABLE_FIELDS, NUMERIC_FIELDS, OPERATORS, AGGREGATIONS, fieldType } from '../utils/query';
import { makeStyleSetter } from '../utils/textStyle';
import { TextField } from './TextField';
import { v4 as uuid } from 'uuid';

function Field({ label, value, placeholder, onChange, type = 'text' }) {
  return (
    <label className="pf-field">
      <span className="pf-field__label">{label}</span>
      <input
        type={type}
        className="pf-input"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      />
    </label>
  );
}

export function CompanyInfoForm({ company, onChange }) {
  if (!company) return null;
  const setStyle = (key) => makeStyleSetter(company, key, onChange);
  return (
    <div className="pf">
      <TextField label="Company name" value={company.name} onChange={(v) => onChange({ name: v })} style={company.styles?.name} onStyleChange={setStyle('name')} />
      <TextField label="Address line 1" value={company.addressLine1} onChange={(v) => onChange({ addressLine1: v })} style={company.styles?.addressLine1} onStyleChange={setStyle('addressLine1')} />
      <TextField label="Address line 2" value={company.addressLine2} onChange={(v) => onChange({ addressLine2: v })} style={company.styles?.addressLine2} onStyleChange={setStyle('addressLine2')} />
      <TextField label="Email" value={company.email} onChange={(v) => onChange({ email: v })} style={company.styles?.email} onStyleChange={setStyle('email')} />
      <TextField label="Phone" value={company.phone} onChange={(v) => onChange({ phone: v })} style={company.styles?.phone} onStyleChange={setStyle('phone')} />
      <TextField label="Tax ID / VATIN" value={company.taxId} onChange={(v) => onChange({ taxId: v })} style={company.styles?.taxId} onStyleChange={setStyle('taxId')} />
    </div>
  );
}

export function ClientInfoForm({ client, onChange }) {
  if (!client) return null;
  const setStyle = (key) => makeStyleSetter(client, key, onChange);
  return (
    <div className="pf">
      <TextField label="Buyer / client name" value={client.name} onChange={(v) => onChange({ name: v })} style={client.styles?.name} onStyleChange={setStyle('name')} />
      <TextField label="Billing address" value={client.billingAddress} onChange={(v) => onChange({ billingAddress: v })} style={client.styles?.billingAddress} onStyleChange={setStyle('billingAddress')} />
      <TextField label="Email" value={client.email} onChange={(v) => onChange({ email: v })} style={client.styles?.email} onStyleChange={setStyle('email')} />
      <TextField label="Phone" value={client.phone} onChange={(v) => onChange({ phone: v })} style={client.styles?.phone} onStyleChange={setStyle('phone')} />
      <TextField label="Country" value={client.country} onChange={(v) => onChange({ country: v })} style={client.styles?.country} onStyleChange={setStyle('country')} />
      <TextField label="VATIN" value={client.taxId} onChange={(v) => onChange({ taxId: v })} style={client.styles?.taxId} onStyleChange={setStyle('taxId')} />
      <TextField label="Place of supply" value={client.placeOfSupply} onChange={(v) => onChange({ placeOfSupply: v })} style={client.styles?.placeOfSupply} onStyleChange={setStyle('placeOfSupply')} />
    </div>
  );
}

export function InvoiceMetaForm({ invoiceMeta, onChange }) {
  if (!invoiceMeta) return null;
  const setStyle = (key) => makeStyleSetter(invoiceMeta, key, onChange);
  return (
    <div className="pf">
      {META_ROWS.flatMap(([labelA, keyA, labelB, keyB]) => [
        <TextField key={keyA} label={labelA} value={invoiceMeta[keyA]} onChange={(v) => onChange({ [keyA]: v })} style={invoiceMeta.styles?.[keyA]} onStyleChange={setStyle(keyA)} />,
        <TextField key={keyB} label={labelB} value={invoiceMeta[keyB]} onChange={(v) => onChange({ [keyB]: v })} style={invoiceMeta.styles?.[keyB]} onStyleChange={setStyle(keyB)} />,
      ])}
      <TextField
        label="Terms of Delivery"
        value={invoiceMeta.termsOfDelivery}
        onChange={(v) => onChange({ termsOfDelivery: v })}
        style={invoiceMeta.styles?.termsOfDelivery}
        onStyleChange={setStyle('termsOfDelivery')}
      />
    </div>
  );
}

export function TextBlockForm({ data, onChange }) {
  const setStyle = makeStyleSetter(data, 'text', onChange);
  return (
    <div className="pf">
      <TextField
        label="Text"
        multiline
        rows={4}
        value={data.text}
        onChange={(v) => onChange({ text: v })}
        style={data.styles?.text}
        onStyleChange={setStyle}
      />
      <label className="pf-field">
        <span className="pf-field__label">Alignment</span>
        <select className="pf-input" value={data.align} onChange={(e) => onChange({ align: e.target.value })}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </label>
    </div>
  );
}

export function CaptionForm({ label, value, onChange, fieldKey, data }) {
  const setStyle = makeStyleSetter(data, fieldKey, onChange);
  return (
    <div className="pf">
      <TextField label={label} value={value} onChange={(v) => onChange({ [fieldKey]: v })} style={data.styles?.[fieldKey]} onStyleChange={setStyle} />
    </div>
  );
}

export function ProductTableForm({ elementData, onChange, products, currencySymbol, currencyDecimals, onUpdateProduct, onAddProduct, onRemoveProduct }) {
  const columnDefs = getProductColumnDefinitions();

  const toggleProduct = (id) => {
    const next = elementData.selectedProductIds.includes(id)
      ? elementData.selectedProductIds.filter((x) => x !== id)
      : [...elementData.selectedProductIds, id];
    onChange({ selectedProductIds: next });
  };

  const toggleColumn = (key) => {
    const next = elementData.visibleColumns.includes(key)
      ? elementData.visibleColumns.filter((x) => x !== key)
      : [...elementData.visibleColumns, key];
    onChange({ visibleColumns: next });
  };

  return (
    <div className="pf">
      <div className="pf-section-title">Line items</div>
      <p className="pf-hint">Tick to include on the invoice. Edit any field below.</p>
      <div className="pf-product-list">
        {products.map((p) => {
          const setProductStyle = (key) => makeStyleSetter(p, key, (patch) => onUpdateProduct(p.id, patch));
          return (
            <div className="pf-product" key={p.id}>
              <div className="pf-product__head">
                <input type="checkbox" checked={elementData.selectedProductIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                <button type="button" className="pf-icon-btn" title="Remove from catalog" onClick={() => onRemoveProduct(p.id)}>✕</button>
              </div>
              <TextField label="Item name" value={p.name} placeholder="Item name" onChange={(v) => onUpdateProduct(p.id, { name: v })} style={p.styles?.name} onStyleChange={setProductStyle('name')} />
              <TextField label="Description" value={p.description} placeholder="Optional description" onChange={(v) => onUpdateProduct(p.id, { description: v })} style={p.styles?.description} onStyleChange={setProductStyle('description')} />
              <div className="pf-product__grid">
                <Field label="Qty" type="number" value={p.qty} onChange={(v) => onUpdateProduct(p.id, { qty: v })} />
                <Field label="Per" value={p.unit} onChange={(v) => onUpdateProduct(p.id, { unit: v })} />
                <Field label="Rate" type="number" value={p.unitPrice} onChange={(v) => onUpdateProduct(p.id, { unitPrice: v })} />
                <Field label="Discount %" type="number" value={p.discountPercent} onChange={(v) => onUpdateProduct(p.id, { discountPercent: v })} />
                <Field label="VAT %" type="number" value={p.taxPercent} onChange={(v) => onUpdateProduct(p.id, { taxPercent: v })} />
              </div>
              <div className="pf-product__amount">{formatCurrency(p.qty * p.unitPrice, currencySymbol, currencyDecimals)}</div>
            </div>
          );
        })}
      </div>
      <button type="button" className="pf-add-btn" onClick={onAddProduct}>+ Add line item</button>

      <div className="pf-section-title">Columns shown</div>
      <div className="pf-chips">
        {columnDefs.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`chip ${elementData.visibleColumns.includes(c.key) ? 'chip--active' : ''}`}
            onClick={() => toggleColumn(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TotalsForm({ data, onChange }) {
  const tableColumns = getProductColumnDefinitions().filter((c) => c.numeric);
  const totalColumns = data.totalColumns || [];

  const toggleColumnTotal = (key) => {
    const next = totalColumns.includes(key) ? totalColumns.filter((k) => k !== key) : [...totalColumns, key];
    onChange({ totalColumns: next });
  };

  return (
    <div className="pf">
      <Field label="Extra invoice discount (%)" type="number" value={data.extraDiscountPercent} onChange={(v) => onChange({ extraDiscountPercent: v })} />
      <Field label="Extra invoice tax (%)" type="number" value={data.extraTaxPercent} onChange={(v) => onChange({ extraTaxPercent: v })} />
      <label className="pf-checkbox">
        <input type="checkbox" checked={data.showBreakdown} onChange={(e) => onChange({ showBreakdown: e.target.checked })} />
        Show full breakdown
      </label>

      <div className="pf-section-title">Also total these columns</div>
      <div className="pf-chips">
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
      <p className="pf-hint">Tip: you can also drag a numeric column heading straight from the Product Table onto the Totals block on the page.</p>
    </div>
  );
}

const CHART_TYPES = [
  { key: 'bar', label: 'Bar' },
  { key: 'line', label: 'Line' },
  { key: 'pie', label: 'Pie' },
  { key: 'donut', label: 'Donut' },
];

export function ChartForm({ data, onChange }) {
  const conditions = data.conditions || [];

  const addCondition = () => {
    const firstField = QUERYABLE_FIELDS[0];
    onChange({
      conditions: [
        ...conditions,
        { id: uuid(), field: firstField.key, operator: OPERATORS[firstField.type][0].key, value: '' },
      ],
    });
  };

  const updateCondition = (id, patch) => {
    onChange({
      conditions: conditions.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, ...patch };
        if (patch.field) {
          const type = fieldType(patch.field);
          next.operator = OPERATORS[type][0].key;
          next.value = '';
        }
        return next;
      }),
    });
  };

  const removeCondition = (id) => onChange({ conditions: conditions.filter((c) => c.id !== id) });

  return (
    <div className="pf">
      <Field label="Chart title" value={data.title} onChange={(v) => onChange({ title: v })} />

      <div className="pf-section-title">Filter products (optional)</div>
      {conditions.map((cond) => {
        const type = fieldType(cond.field);
        return (
          <div key={cond.id} className="pf-query-row">
            <select className="pf-input" value={cond.field} onChange={(e) => updateCondition(cond.id, { field: e.target.value })}>
              {QUERYABLE_FIELDS.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
            <select className="pf-input" value={cond.operator} onChange={(e) => updateCondition(cond.id, { operator: e.target.value })}>
              {OPERATORS[type].map((op) => (
                <option key={op.key} value={op.key}>{op.label}</option>
              ))}
            </select>
            <input
              className="pf-input"
              type={type === 'number' ? 'number' : 'text'}
              value={cond.value}
              placeholder="value…"
              onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
            />
            <button type="button" className="pf-icon-btn" onClick={() => removeCondition(cond.id)}>✕</button>
          </div>
        );
      })}
      <button type="button" className="pf-add-btn" onClick={addCondition}>+ Add condition</button>

      <div className="pf-section-title">Group &amp; measure</div>
      <label className="pf-field">
        <span className="pf-field__label">Group by</span>
        <select className="pf-input" value={data.groupByField} onChange={(e) => onChange({ groupByField: e.target.value })}>
          {QUERYABLE_FIELDS.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
      </label>
      <label className="pf-field">
        <span className="pf-field__label">Measure</span>
        <select className="pf-input" value={data.metricField} onChange={(e) => onChange({ metricField: e.target.value })}>
          {NUMERIC_FIELDS.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
      </label>
      <label className="pf-field">
        <span className="pf-field__label">Aggregate</span>
        <select className="pf-input" value={data.aggFn} onChange={(e) => onChange({ aggFn: e.target.value })}>
          {AGGREGATIONS.map((a) => (
            <option key={a.key} value={a.key}>{a.label}</option>
          ))}
        </select>
      </label>

      <div className="pf-section-title">Chart type</div>
      <div className="pf-chips">
        {CHART_TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`chip ${data.chartType === t.key ? 'chip--active' : ''}`}
            onClick={() => onChange({ chartType: t.key })}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
