import { useEffect, useRef, useState } from 'react';
import { getProductColumnDefinitions, getOrderInfoColumnDefinitions } from '../data/apiClient';
import { formatCurrency, FORMULA_PRODUCT_FIELDS, FORMULA_TOTAL_FIELDS } from '../utils/calculations';
import { QUERYABLE_FIELDS, NUMERIC_FIELDS, OPERATORS, AGGREGATIONS, fieldType } from '../utils/query';
import { makeStyleSetter, FONT_SIZES } from '../utils/textStyle';
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

function SizeField({ label, value, fallback, onChange }) {
  return (
    <label className="pf-field">
      <span className="pf-field__label">{label}</span>
      <select className="pf-input" value={value ?? fallback} onChange={(e) => onChange(Number(e.target.value))}>
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>
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

/**
 * Tracks which single row/field is expanded in an accordion list. Opening a field on the canvas
 * (via focusedFieldId) expands that row; clicking a row's header in the panel toggles it directly;
 * and — when the caller passes its items array — appending a new item (via "+ Add") auto-opens it,
 * since new items are always appended at the end of the array.
 */
function useAccordion(focusedFieldId, items) {
  const [openId, setOpenId] = useState(focusedFieldId || null);
  const prevLengthRef = useRef(items ? items.length : 0);

  useEffect(() => {
    if (focusedFieldId) setOpenId(focusedFieldId);
  }, [focusedFieldId]);

  useEffect(() => {
    if (!items) return;
    if (items.length > prevLengthRef.current) {
      setOpenId(items[items.length - 1].id);
    }
    prevLengthRef.current = items.length;
  }, [items]);

  return [openId, setOpenId];
}

/**
 * One collapsible row/card in the Properties panel. Collapsed, it shows only its header title.
 * Clicking the header opens it — collapsing any other open row — and reveals its full
 * customization plus (when onAdd is given) an "Add" button directly below it. When its id matches
 * the field the user just clicked on the canvas, it also scrolls into view and gets a highlighted
 * border so it's easy to find among a long list of fields.
 */
function AccordionRow({ id, focusedFieldId, openId, onToggle, title, headerExtra, onRemove, removeTitle = 'Remove', addLabel, onAdd, className = 'pf-product', children }) {
  const ref = useRef(null);
  const isFocused = !!id && id === focusedFieldId;
  const isOpen = id === openId;
  useEffect(() => {
    if ((isFocused || isOpen) && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isFocused, isOpen]);
  return (
    <div ref={ref} className={`${className} ${isFocused ? `${className}--focused` : ''} ${isOpen ? `${className}--open` : `${className}--collapsed`}`}>
      <div className={`${className}__head`} onClick={() => onToggle(isOpen ? null : id)}>
        <span className={`${className}__chevron ${isOpen ? `${className}__chevron--open` : ''}`}>▸</span>
        <span className={`${className}__title`}>{title}</span>
        {headerExtra}
        {onRemove && (
          <button
            type="button"
            className="pf-icon-btn"
            title={removeTitle}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >
            ✕
          </button>
        )}
      </div>
      {isOpen && (
        <div className={`${className}__body`}>
          {children}
          {onAdd && <button type="button" className="pf-add-btn" onClick={onAdd}>{addLabel}</button>}
        </div>
      )}
    </div>
  );
}

/** "Insert from data" dropdown offered next to a Value field — picking an option copies that order/customer/location field's value in, still leaving it as free, styleable text. */
function InsertFromDataField({ sourceFields, onInsert }) {
  if (!sourceFields?.length) return null;
  const groups = [];
  for (const f of sourceFields) {
    let g = groups.find((g) => g.name === f.group);
    if (!g) { g = { name: f.group, fields: [] }; groups.push(g); }
    g.fields.push(f);
  }
  return (
    <label className="pf-field">
      <span className="pf-field__label">Insert from data</span>
      <select
        className="pf-input"
        value=""
        onChange={(e) => {
          const picked = sourceFields.find((f) => f.key === e.target.value);
          if (picked) onInsert(picked.value);
        }}
      >
        <option value="">— choose a field —</option>
        {groups.map((g) => (
          <optgroup key={g.name} label={g.name}>
            {g.fields.map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

/** "Insert from data" dropdown for a Product Table row — picking a shipment/commodity record fills every matching field on that row at once (name, description, qty, weight, etc.), instead of one field at a time. */
function InsertRecordField({ records, onInsert }) {
  if (!records?.length) return null;
  return (
    <label className="pf-field">
      <span className="pf-field__label">Insert from data</span>
      <select
        className="pf-input"
        value=""
        onChange={(e) => {
          const picked = records.find((r) => r.key === e.target.value);
          if (picked) onInsert(picked.fields);
        }}
      >
        <option value="">— choose a shipment —</option>
        {records.map((r) => (
          <option key={r.key} value={r.key}>{r.label}</option>
        ))}
      </select>
    </label>
  );
}

/** Shared "list of label/value rows with ✕ remove + + Add field" body, used by InfoBlockForm and CustomBlockForm. */
function InfoBlockFields({ items, onUpdateItem, onAddItem, onRemoveItem, focusedFieldId, sourceFields }) {
  const [openId, setOpenId] = useAccordion(focusedFieldId, items);
  return (
    <>
      <div className="pf-product-list">
        {items.map((item) => {
          const setItemStyle = (key) => makeStyleSetter(item, key, (patch) => onUpdateItem(item.id, patch));
          return (
            <AccordionRow
              key={item.id}
              id={item.id}
              focusedFieldId={focusedFieldId}
              openId={openId}
              onToggle={setOpenId}
              title={item.label || 'Untitled field'}
              onRemove={() => onRemoveItem(item.id)}
              removeTitle="Remove field"
              addLabel="+ Add field"
              onAdd={onAddItem}
            >
              <TextField label="Field label" value={item.label} placeholder="Field label" onChange={(v) => onUpdateItem(item.id, { label: v })} style={item.styles?.label} onStyleChange={setItemStyle('label')} />
              <InsertFromDataField sourceFields={sourceFields} onInsert={(v) => onUpdateItem(item.id, { value: v })} />
              <TextField label="Value" value={item.value} placeholder="Value" onChange={(v) => onUpdateItem(item.id, { value: v })} style={item.styles?.value} onStyleChange={setItemStyle('value')} />
            </AccordionRow>
          );
        })}
      </div>
      {!openId && <button type="button" className="pf-add-btn" onClick={onAddItem}>+ Add field</button>}
    </>
  );
}

/** Company Info, Bill To, Ship To, Buyer To, Invoice Info — all backed by an apiData { title, items } catalog. */
export function InfoBlockForm({ title, items, onChangeTitle, onUpdateItem, onAddItem, onRemoveItem, titleEditable = true, focusedFieldId, sourceFields }) {
  return (
    <div className="pf">
      {titleEditable && <Field label="Section title" value={title} placeholder="(no title shown)" onChange={onChangeTitle} />}
      <InfoBlockFields items={items} onUpdateItem={onUpdateItem} onAddItem={onAddItem} onRemoveItem={onRemoveItem} focusedFieldId={focusedFieldId} sourceFields={sourceFields} />
    </div>
  );
}

/** Custom Block — a blank, per-instance info block with its own title + freeform fields, stored directly in element.data. */
export function CustomBlockForm({ data, onChange, focusedFieldId, sourceFields }) {
  const items = data.items || [];
  const addItem = () => onChange({ items: [...items, { id: uuid(), label: 'New Field', value: '' }] });
  const updateItem = (id, patch) => onChange({ items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const removeItem = (id) => onChange({ items: items.filter((i) => i.id !== id) });

  return (
    <div className="pf">
      <Field label="Block title" value={data.title} onChange={(v) => onChange({ title: v })} />
      <InfoBlockFields items={items} onUpdateItem={updateItem} onAddItem={addItem} onRemoveItem={removeItem} focusedFieldId={focusedFieldId} sourceFields={sourceFields} />
    </div>
  );
}

export function OrderInfoTableForm({ elementData, onChange, items, onUpdateItem, onAddItem, onRemoveItem, focusedFieldId }) {
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

  const [openId, setOpenId] = useAccordion(focusedFieldId, items);

  return (
    <div className="pf">
      <div className="pf-section-title">Order / shipment rows</div>
      <p className="pf-hint">Tick to include on the invoice. Click a row to edit it.</p>
      <div className="pf-product-list">
        {items.map((item) => {
          const setItemStyle = (key) => makeStyleSetter(item, key, (patch) => onUpdateItem(item.id, patch));
          return (
            <AccordionRow
              key={item.id}
              id={item.id}
              focusedFieldId={focusedFieldId}
              openId={openId}
              onToggle={setOpenId}
              title={item.label || 'Untitled row'}
              headerExtra={
                <input
                  type="checkbox"
                  checked={elementData.selectedRowIds.includes(item.id)}
                  onChange={() => toggleRow(item.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              }
              onRemove={() => onRemoveItem(item.id)}
              removeTitle="Remove row"
              addLabel="+ Add row"
              onAdd={onAddItem}
            >
              <TextField label="Field" value={item.label} placeholder="Field name" onChange={(v) => onUpdateItem(item.id, { label: v })} style={item.styles?.label} onStyleChange={setItemStyle('label')} />
              <TextField label="Value" value={item.value} placeholder="Value" onChange={(v) => onUpdateItem(item.id, { value: v })} style={item.styles?.value} onStyleChange={setItemStyle('value')} />
            </AccordionRow>
          );
        })}
      </div>
      {!openId && <button type="button" className="pf-add-btn" onClick={onAddItem}>+ Add row</button>}

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
      <SizeField
        label="Cell font size (px)"
        value={tableStyle.fontSize}
        fallback={TABLE_STYLE_DEFAULTS.fontSize}
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

export function ProductTableForm({ elementData, onChange, products, currencySymbol, currencyDecimals, onUpdateProduct, onAddProduct, onRemoveProduct, focusedFieldId, sourceRecords }) {
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

  const [openId, setOpenId] = useAccordion(focusedFieldId, products);

  return (
    <div className="pf">
      <div className="pf-section-title">Line items</div>
      <p className="pf-hint">Tick to include on the invoice. Click a line item to edit it.</p>
      <div className="pf-product-list">
        {products.map((p) => {
          const setProductStyle = (key) => makeStyleSetter(p, key, (patch) => onUpdateProduct(p.id, patch));
          return (
            <AccordionRow
              key={p.id}
              id={p.id}
              focusedFieldId={focusedFieldId}
              openId={openId}
              onToggle={setOpenId}
              title={p.name || 'Untitled item'}
              headerExtra={
                <input
                  type="checkbox"
                  checked={elementData.selectedProductIds.includes(p.id)}
                  onChange={() => toggleProduct(p.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              }
              onRemove={() => onRemoveProduct(p.id)}
              removeTitle="Remove from catalog"
              addLabel="+ Add line item"
              onAdd={onAddProduct}
            >
              <InsertRecordField records={sourceRecords} onInsert={(fields) => onUpdateProduct(p.id, fields)} />
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
            </AccordionRow>
          );
        })}
      </div>
      {!openId && <button type="button" className="pf-add-btn" onClick={onAddProduct}>+ Add line item</button>}

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
      <SizeField
        label="Cell font size (px)"
        value={tableStyle.fontSize}
        fallback={TABLE_STYLE_DEFAULTS.fontSize}
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

const FORMULA_OPERATORS = [
  { key: '+', label: '+' },
  { key: '-', label: '−' },
  { key: '*', label: '×' },
  { key: '/', label: '÷' },
];

function newFormulaTerm(op = '+') {
  return { id: uuid(), op, sourceType: 'column', field: FORMULA_PRODUCT_FIELDS[0].key, constant: 0 };
}

export function TotalsForm({ data, onChange, focusedFieldId }) {
  const tableColumns = getProductColumnDefinitions().filter((c) => c.numeric);
  const totalColumns = data.totalColumns || [];
  const extraLines = data.extraLines || [];
  const formulaLines = data.formulaLines || [];

  const toggleColumnTotal = (key) => {
    const next = totalColumns.includes(key) ? totalColumns.filter((k) => k !== key) : [...totalColumns, key];
    onChange({ totalColumns: next });
  };

  const addExtraLine = () => onChange({ extraLines: [...extraLines, { id: uuid(), label: 'New Charge', amount: 0 }] });
  const updateExtraLine = (id, patch) => onChange({ extraLines: extraLines.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const removeExtraLine = (id) => onChange({ extraLines: extraLines.filter((l) => l.id !== id) });
  const [openId, setOpenId] = useAccordion(focusedFieldId, extraLines);

  const addFormulaLine = () =>
    onChange({ formulaLines: [...formulaLines, { id: uuid(), label: 'New Formula', terms: [newFormulaTerm()] }] });
  const updateFormulaLine = (id, patch) =>
    onChange({ formulaLines: formulaLines.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const removeFormulaLine = (id) => onChange({ formulaLines: formulaLines.filter((l) => l.id !== id) });
  const addFormulaTerm = (lineId) => {
    const line = formulaLines.find((l) => l.id === lineId);
    if (!line) return;
    updateFormulaLine(lineId, { terms: [...line.terms, newFormulaTerm()] });
  };
  const updateFormulaTerm = (lineId, termId, patch) => {
    const line = formulaLines.find((l) => l.id === lineId);
    if (!line) return;
    updateFormulaLine(lineId, { terms: line.terms.map((t) => (t.id === termId ? { ...t, ...patch } : t)) });
  };
  const removeFormulaTerm = (lineId, termId) => {
    const line = formulaLines.find((l) => l.id === lineId);
    if (!line) return;
    updateFormulaLine(lineId, { terms: line.terms.filter((t) => t.id !== termId) });
  };
  const [openFormulaId, setOpenFormulaId] = useAccordion(focusedFieldId, formulaLines);

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
          <AccordionRow
            key={line.id}
            id={line.id}
            focusedFieldId={focusedFieldId}
            openId={openId}
            onToggle={setOpenId}
            title={line.label || 'New charge'}
            onRemove={() => removeExtraLine(line.id)}
            removeTitle="Remove charge"
            addLabel="+ Add charge"
            onAdd={addExtraLine}
          >
            <Field label="Label" value={line.label} onChange={(v) => updateExtraLine(line.id, { label: v })} />
            <Field label="Amount" type="number" value={line.amount} onChange={(v) => updateExtraLine(line.id, { amount: v })} />
          </AccordionRow>
        ))}
      </div>
      {!openId && <button type="button" className="pf-add-btn" onClick={addExtraLine}>+ Add charge</button>}

      <div className="pf-section-title">Formulas</div>
      <p className="pf-hint">Build a custom total from any combination of fields — e.g. Total Qty × Total Unit Price, or Grand Total − Total Discount Amt.</p>
      <div className="pf-product-list">
        {formulaLines.map((line) => (
          <AccordionRow
            key={line.id}
            id={line.id}
            focusedFieldId={focusedFieldId}
            openId={openFormulaId}
            onToggle={setOpenFormulaId}
            title={line.label || 'New formula'}
            onRemove={() => removeFormulaLine(line.id)}
            removeTitle="Remove formula"
            addLabel="+ Add formula"
            onAdd={addFormulaLine}
          >
            <Field label="Label" value={line.label} onChange={(v) => updateFormulaLine(line.id, { label: v })} />
            {line.terms.map((term, i) => {
              const fieldOptions = term.sourceType === 'total' ? FORMULA_TOTAL_FIELDS : FORMULA_PRODUCT_FIELDS;
              return (
                <div className="pf-formula-term" key={term.id}>
                  {i > 0 && (
                    <select
                      className="pf-input pf-formula-op"
                      value={term.op}
                      onChange={(e) => updateFormulaTerm(line.id, term.id, { op: e.target.value })}
                    >
                      {FORMULA_OPERATORS.map((op) => (
                        <option key={op.key} value={op.key}>{op.label}</option>
                      ))}
                    </select>
                  )}
                  <select
                    className="pf-input"
                    value={term.sourceType}
                    onChange={(e) => {
                      const sourceType = e.target.value;
                      const field = sourceType === 'total' ? FORMULA_TOTAL_FIELDS[0].key : FORMULA_PRODUCT_FIELDS[0].key;
                      updateFormulaTerm(line.id, term.id, { sourceType, field });
                    }}
                  >
                    <option value="column">Product column (sum)</option>
                    <option value="total">Computed total</option>
                    <option value="constant">Number</option>
                  </select>
                  {term.sourceType === 'constant' ? (
                    <input
                      className="pf-input"
                      type="number"
                      value={term.constant ?? 0}
                      onChange={(e) => updateFormulaTerm(line.id, term.id, { constant: Number(e.target.value) })}
                    />
                  ) : (
                    <select
                      className="pf-input"
                      value={term.field}
                      onChange={(e) => updateFormulaTerm(line.id, term.id, { field: e.target.value })}
                    >
                      {fieldOptions.map((f) => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </select>
                  )}
                  {line.terms.length > 1 && (
                    <button type="button" className="pf-icon-btn" onClick={() => removeFormulaTerm(line.id, term.id)}>✕</button>
                  )}
                </div>
              );
            })}
            <button type="button" className="pf-add-btn" onClick={() => addFormulaTerm(line.id)}>+ Add term</button>
          </AccordionRow>
        ))}
      </div>
      {!openFormulaId && <button type="button" className="pf-add-btn" onClick={addFormulaLine}>+ Add formula</button>}
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

const SHAPE_TYPES = [
  { key: 'rectangle', label: 'Rectangle' },
  { key: 'circle', label: 'Circle' },
  { key: 'triangle', label: 'Triangle' },
  { key: 'line', label: 'Line' },
];

/** Full styling for the Shape element — the "draw any shape" building block: type, fill, border, corner radius, rotation, opacity, shadow. */
export function ShapeForm({ data, onChange }) {
  const shapeType = data.shapeType || 'rectangle';

  return (
    <div className="pf">
      <div className="pf-section-title">Shape</div>
      <div className="pf-chips">
        {SHAPE_TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`chip ${shapeType === t.key ? 'chip--active' : ''}`}
            onClick={() => onChange({ shapeType: t.key })}
          >
            {t.label}
          </button>
        ))}
      </div>

      {shapeType !== 'line' && (
        <ColorField
          label="Fill color"
          value={data.fill}
          fallback="#4d6bea"
          onChange={(v) => onChange({ fill: v })}
          onReset={() => onChange({ fill: undefined })}
        />
      )}

      {shapeType !== 'triangle' && (
        <>
          <ColorField
            label={shapeType === 'line' ? 'Line color' : 'Border color'}
            value={data.stroke}
            fallback="#1f2733"
            onChange={(v) => onChange({ stroke: v })}
            onReset={() => onChange({ stroke: undefined })}
          />
          <Field
            label={shapeType === 'line' ? 'Thickness (px)' : 'Border width (px)'}
            type="number"
            value={data.strokeWidth ?? 1}
            onChange={(v) => onChange({ strokeWidth: Math.max(0, v) })}
          />
        </>
      )}

      {shapeType === 'rectangle' && (
        <Field
          label="Corner radius (px)"
          type="number"
          value={data.borderRadius ?? 0}
          onChange={(v) => onChange({ borderRadius: Math.max(0, v) })}
        />
      )}

      <label className="pf-field">
        <span className="pf-field__label">Rotation ({data.rotation ?? 0}°)</span>
        <input
          type="range"
          min="0"
          max="360"
          value={data.rotation ?? 0}
          onChange={(e) => onChange({ rotation: Number(e.target.value) })}
        />
      </label>
      <label className="pf-field">
        <span className="pf-field__label">Opacity ({data.opacity ?? 100}%)</span>
        <input
          type="range"
          min="0"
          max="100"
          value={data.opacity ?? 100}
          onChange={(e) => onChange({ opacity: Number(e.target.value) })}
        />
      </label>
      <label className="pf-checkbox">
        <input type="checkbox" checked={!!data.shadow} onChange={(e) => onChange({ shadow: e.target.checked })} />
        Drop shadow
      </label>
    </div>
  );
}
