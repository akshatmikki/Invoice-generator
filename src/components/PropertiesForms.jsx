import { getProductColumnDefinitions, getOrderInfoColumnDefinitions } from '../data/apiClient';
import { formatCurrency } from '../utils/calculations';
import { QUERYABLE_FIELDS, NUMERIC_FIELDS, OPERATORS, AGGREGATIONS, fieldType } from '../utils/query';
import { makeStyleSetter } from '../utils/textStyle';
import { TextField } from './TextField';
import { PAGE_SIZE_PRESETS } from '../context/DesignerContext';
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

function ColorField({ label, value, fallback, onChange, onReset }) {
  return (
    <label className="pf-field">
      <span className="pf-field__label">{label}</span>
      <div className="pf-color-row">
        <input type="color" className="pf-fmt-color" value={value || fallback} onChange={(e) => onChange(e.target.value)} />
        {onReset && (
          <button type="button" className="pf-reset-btn" onClick={onReset}>Default</button>
        )}
      </div>
    </label>
  );
}

export function PageSetupForm({ pageSettings, onChange }) {
  const isLandscape = pageSettings.width > pageSettings.height;

  const applyPreset = (name) => {
    if (name === 'Custom') {
      onChange({ preset: 'Custom' });
      return;
    }
    const size = PAGE_SIZE_PRESETS[name];
    const oriented = isLandscape ? { width: size.height, height: size.width } : { width: size.width, height: size.height };
    onChange({ preset: name, ...oriented });
  };

  const setOrientation = (wantLandscape) => {
    if (wantLandscape === isLandscape) return;
    onChange({ width: pageSettings.height, height: pageSettings.width });
  };

  return (
    <div className="pf">
      <div className="pf-section-title">Page size</div>
      <label className="pf-field">
        <span className="pf-field__label">Preset</span>
        <select className="pf-input" value={pageSettings.preset} onChange={(e) => applyPreset(e.target.value)}>
          {Object.keys(PAGE_SIZE_PRESETS).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
          <option value="Custom">Custom</option>
        </select>
      </label>
      <div className="pf-product__grid">
        <Field label="Width (px)" type="number" value={pageSettings.width} onChange={(v) => onChange({ width: Math.max(200, v), preset: 'Custom' })} />
        <Field label="Height (px)" type="number" value={pageSettings.height} onChange={(v) => onChange({ height: Math.max(200, v), preset: 'Custom' })} />
      </div>
      <div className="pf-chips">
        <button type="button" className={`chip ${!isLandscape ? 'chip--active' : ''}`} onClick={() => setOrientation(false)}>Portrait</button>
        <button type="button" className={`chip ${isLandscape ? 'chip--active' : ''}`} onClick={() => setOrientation(true)}>Landscape</button>
      </div>

      <div className="pf-section-title">Page design</div>
      <ColorField
        label="Background color"
        value={pageSettings.background}
        fallback="#fbfaf7"
        onChange={(v) => onChange({ background: v })}
        onReset={() => onChange({ background: '' })}
      />
    </div>
  );
}

/** Shared "list of label/value rows with ✕ remove + + Add field" body, used by InfoBlockForm and CustomBlockForm. */
function InfoBlockFields({ items, onUpdateItem, onAddItem, onRemoveItem }) {
  return (
    <>
      <div className="pf-product-list">
        {items.map((item) => {
          const setItemStyle = (key) => makeStyleSetter(item, key, (patch) => onUpdateItem(item.id, patch));
          return (
            <div className="pf-product" key={item.id}>
              <div className="pf-product__head">
                <button type="button" className="pf-icon-btn" title="Remove field" onClick={() => onRemoveItem(item.id)}>✕</button>
              </div>
              <TextField label="Field label" value={item.label} placeholder="Field label" onChange={(v) => onUpdateItem(item.id, { label: v })} style={item.styles?.label} onStyleChange={setItemStyle('label')} />
              <TextField label="Value" value={item.value} placeholder="Value" onChange={(v) => onUpdateItem(item.id, { value: v })} style={item.styles?.value} onStyleChange={setItemStyle('value')} />
            </div>
          );
        })}
      </div>
      <button type="button" className="pf-add-btn" onClick={onAddItem}>+ Add field</button>
    </>
  );
}

/** Company Info, Bill To, Ship To, Buyer To, Invoice Info — all backed by an apiData { title, items } catalog. */
export function InfoBlockForm({ title, items, onChangeTitle, onUpdateItem, onAddItem, onRemoveItem, titleEditable = true }) {
  return (
    <div className="pf">
      {titleEditable && <Field label="Section title" value={title} placeholder="(no title shown)" onChange={onChangeTitle} />}
      <InfoBlockFields items={items} onUpdateItem={onUpdateItem} onAddItem={onAddItem} onRemoveItem={onRemoveItem} />
    </div>
  );
}

/** Custom Block — a blank, per-instance info block with its own title + freeform fields, stored directly in element.data. */
export function CustomBlockForm({ data, onChange }) {
  const items = data.items || [];
  const addItem = () => onChange({ items: [...items, { id: uuid(), label: 'New Field', value: '' }] });
  const updateItem = (id, patch) => onChange({ items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const removeItem = (id) => onChange({ items: items.filter((i) => i.id !== id) });

  return (
    <div className="pf">
      <Field label="Block title" value={data.title} onChange={(v) => onChange({ title: v })} />
      <InfoBlockFields items={items} onUpdateItem={updateItem} onAddItem={addItem} onRemoveItem={removeItem} />
    </div>
  );
}

export function OrderInfoTableForm({ elementData, onChange, items, onUpdateItem, onAddItem, onRemoveItem }) {
  const columnDefs = getOrderInfoColumnDefinitions();
  const tableStyle = elementData.tableStyle || {};
  const setTableStyle = (patch) => onChange({ tableStyle: { ...tableStyle, ...patch } });

  const toggleRow = (id) => {
    const next = elementData.selectedRowIds.includes(id)
      ? elementData.selectedRowIds.filter((x) => x !== id)
      : [...elementData.selectedRowIds, id];
    onChange({ selectedRowIds: next });
  };

  const toggleColumn = (key) => {
    const next = elementData.visibleColumns.includes(key)
      ? elementData.visibleColumns.filter((x) => x !== key)
      : [...elementData.visibleColumns, key];
    onChange({ visibleColumns: next });
  };

  return (
    <div className="pf">
      <div className="pf-section-title">Order / shipment rows</div>
      <p className="pf-hint">Tick to include on the invoice. Edit any field below — order #, dates, truck/driver/trailer/carrier, factoring company, shipper/consignee.</p>
      <div className="pf-product-list">
        {items.map((item) => {
          const setItemStyle = (key) => makeStyleSetter(item, key, (patch) => onUpdateItem(item.id, patch));
          return (
            <div className="pf-product" key={item.id}>
              <div className="pf-product__head">
                <input type="checkbox" checked={elementData.selectedRowIds.includes(item.id)} onChange={() => toggleRow(item.id)} />
                <button type="button" className="pf-icon-btn" title="Remove row" onClick={() => onRemoveItem(item.id)}>✕</button>
              </div>
              <TextField label="Field" value={item.label} placeholder="Field name" onChange={(v) => onUpdateItem(item.id, { label: v })} style={item.styles?.label} onStyleChange={setItemStyle('label')} />
              <TextField label="Value" value={item.value} placeholder="Value" onChange={(v) => onUpdateItem(item.id, { value: v })} style={item.styles?.value} onStyleChange={setItemStyle('value')} />
            </div>
          );
        })}
      </div>
      <button type="button" className="pf-add-btn" onClick={onAddItem}>+ Add row</button>

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

      <div className="pf-section-title">Table style</div>
      <ColorField
        label="Header background"
        value={tableStyle.headerBg}
        fallback={TABLE_STYLE_DEFAULTS.headerBg}
        onChange={(v) => setTableStyle({ headerBg: v })}
        onReset={() => setTableStyle({ headerBg: undefined })}
      />
      <ColorField
        label="Header text"
        value={tableStyle.headerColor}
        fallback={TABLE_STYLE_DEFAULTS.headerColor}
        onChange={(v) => setTableStyle({ headerColor: v })}
        onReset={() => setTableStyle({ headerColor: undefined })}
      />
      <ColorField
        label="Border color"
        value={tableStyle.borderColor}
        fallback={TABLE_STYLE_DEFAULTS.borderColor}
        onChange={(v) => setTableStyle({ borderColor: v })}
        onReset={() => setTableStyle({ borderColor: undefined })}
      />
      <Field
        label="Cell font size (px)"
        type="number"
        value={tableStyle.fontSize || TABLE_STYLE_DEFAULTS.fontSize}
        onChange={(v) => setTableStyle({ fontSize: v })}
      />
      <label className="pf-checkbox">
        <input type="checkbox" checked={!!tableStyle.striped} onChange={(e) => setTableStyle({ striped: e.target.checked })} />
        Striped rows
      </label>
      {tableStyle.striped && (
        <ColorField
          label="Stripe color"
          value={tableStyle.stripeColor}
          fallback={TABLE_STYLE_DEFAULTS.stripeColor}
          onChange={(v) => setTableStyle({ stripeColor: v })}
          onReset={() => setTableStyle({ stripeColor: undefined })}
        />
      )}
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

const TABLE_STYLE_DEFAULTS = {
  headerBg: '#1f2733',
  headerColor: '#fbfaf7',
  borderColor: '#e2dfd6',
  stripeColor: '#f2efe8',
  fontSize: 12.5,
};

export function ProductTableForm({ elementData, onChange, products, currencySymbol, currencyDecimals, onUpdateProduct, onAddProduct, onRemoveProduct }) {
  const columnDefs = getProductColumnDefinitions();
  const tableStyle = elementData.tableStyle || {};
  const setTableStyle = (patch) => onChange({ tableStyle: { ...tableStyle, ...patch } });

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
              <div className="pf-product__grid">
                <Field label="Weight" type="number" value={p.weight} onChange={(v) => onUpdateProduct(p.id, { weight: v })} />
                <Field label="Weight Unit" value={p.weightUnit} onChange={(v) => onUpdateProduct(p.id, { weightUnit: v })} />
                <Field label="Value of Goods" type="number" value={p.valueOfGoods} onChange={(v) => onUpdateProduct(p.id, { valueOfGoods: v })} />
                <Field label="Equipment Type" value={p.equipmentType} onChange={(v) => onUpdateProduct(p.id, { equipmentType: v })} />
              </div>
              <label className="pf-checkbox">
                <input type="checkbox" checked={!!p.hazmat} onChange={(e) => onUpdateProduct(p.id, { hazmat: e.target.checked })} />
                Hazmat
              </label>
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

      <div className="pf-section-title">Table style</div>
      <ColorField
        label="Header background"
        value={tableStyle.headerBg}
        fallback={TABLE_STYLE_DEFAULTS.headerBg}
        onChange={(v) => setTableStyle({ headerBg: v })}
        onReset={() => setTableStyle({ headerBg: undefined })}
      />
      <ColorField
        label="Header text"
        value={tableStyle.headerColor}
        fallback={TABLE_STYLE_DEFAULTS.headerColor}
        onChange={(v) => setTableStyle({ headerColor: v })}
        onReset={() => setTableStyle({ headerColor: undefined })}
      />
      <ColorField
        label="Border color"
        value={tableStyle.borderColor}
        fallback={TABLE_STYLE_DEFAULTS.borderColor}
        onChange={(v) => setTableStyle({ borderColor: v })}
        onReset={() => setTableStyle({ borderColor: undefined })}
      />
      <Field
        label="Cell font size (px)"
        type="number"
        value={tableStyle.fontSize || TABLE_STYLE_DEFAULTS.fontSize}
        onChange={(v) => setTableStyle({ fontSize: v })}
      />
      <label className="pf-checkbox">
        <input type="checkbox" checked={!!tableStyle.striped} onChange={(e) => setTableStyle({ striped: e.target.checked })} />
        Striped rows
      </label>
      {tableStyle.striped && (
        <ColorField
          label="Stripe color"
          value={tableStyle.stripeColor}
          fallback={TABLE_STYLE_DEFAULTS.stripeColor}
          onChange={(v) => setTableStyle({ stripeColor: v })}
          onReset={() => setTableStyle({ stripeColor: undefined })}
        />
      )}
    </div>
  );
}

export function TotalsForm({ data, onChange }) {
  const tableColumns = getProductColumnDefinitions().filter((c) => c.numeric);
  const totalColumns = data.totalColumns || [];
  const extraLines = data.extraLines || [];

  const toggleColumnTotal = (key) => {
    const next = totalColumns.includes(key) ? totalColumns.filter((k) => k !== key) : [...totalColumns, key];
    onChange({ totalColumns: next });
  };

  const addExtraLine = () => onChange({ extraLines: [...extraLines, { id: uuid(), label: 'New Charge', amount: 0 }] });
  const updateExtraLine = (id, patch) => onChange({ extraLines: extraLines.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const removeExtraLine = (id) => onChange({ extraLines: extraLines.filter((l) => l.id !== id) });

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

      <div className="pf-section-title">Extra charges</div>
      <p className="pf-hint">Freeform lines (e.g. Shipping Fee) added to the grand total.</p>
      <div className="pf-product-list">
        {extraLines.map((line) => (
          <div className="pf-product" key={line.id}>
            <div className="pf-product__head">
              <button type="button" className="pf-icon-btn" title="Remove charge" onClick={() => removeExtraLine(line.id)}>✕</button>
            </div>
            <Field label="Label" value={line.label} onChange={(v) => updateExtraLine(line.id, { label: v })} />
            <Field label="Amount" type="number" value={line.amount} onChange={(v) => updateExtraLine(line.id, { amount: v })} />
          </div>
        ))}
      </div>
      <button type="button" className="pf-add-btn" onClick={addExtraLine}>+ Add charge</button>
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
