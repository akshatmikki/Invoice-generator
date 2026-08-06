import { useDesigner, findElement } from '../context/DesignerContext';
import { ELEMENT_TYPES, findPaletteDefinition } from '../data/elementDefinitions';
import {
  CompanyInfoForm,
  ClientInfoForm,
  InvoiceMetaForm,
  TextBlockForm,
  CaptionForm,
  ProductTableForm,
  TotalsForm,
  ChartForm,
} from './PropertiesForms';

export function PropertiesPanel() {
  const {
    elements,
    selectedElementId,
    updateElementData,
    resizeElement,
    removeElement,
    apiData,
    updateCompany,
    updateClient,
    updateInvoiceMeta,
    updateProduct,
    addProduct,
    removeProduct,
  } = useDesigner();

  if (!selectedElementId) {
    return (
      <aside className="properties">
        <div className="properties__title">Properties</div>
        <p className="properties__empty">Select an element on the page to customize it here, or drag its right edge to resize.</p>
      </aside>
    );
  }

  const element = findElement(elements, selectedElementId);
  if (!element) return null;
  const paletteDef = findPaletteDefinition(element.type);
  const onChange = (patch) => updateElementData(element.instanceId, patch);
  const currencySymbol = apiData?.invoiceMeta?.currencySymbol ?? '₹';
  const currencyDecimals = apiData?.invoiceMeta?.currencyDecimals ?? 2;

  return (
    <aside className="properties">
      <div className="properties__title">Properties</div>
      <div className="properties__type">{paletteDef?.label || element.type}</div>

      <div className="properties__controls">
        <label>
          Width ({Math.round(element.width)}px)
          <input
            type="range"
            min="60"
            max="760"
            value={element.width}
            onChange={(e) => resizeElement(element.instanceId, Number(e.target.value))}
          />
        </label>
        <p className="properties__hint">
          Drag its top bar on the page to move it anywhere — including next to another element in the same row.
        </p>
      </div>

      <div className="properties__section">
        {element.type === ELEMENT_TYPES.COMPANY_INFO && <CompanyInfoForm company={apiData?.company} onChange={updateCompany} />}
        {element.type === ELEMENT_TYPES.CLIENT_INFO && <ClientInfoForm client={apiData?.client} onChange={updateClient} />}
        {element.type === ELEMENT_TYPES.INVOICE_META && <InvoiceMetaForm invoiceMeta={apiData?.invoiceMeta} onChange={updateInvoiceMeta} />}
        {element.type === ELEMENT_TYPES.TEXT_BLOCK && <TextBlockForm data={element.data} onChange={onChange} />}
        {element.type === ELEMENT_TYPES.IMAGE && (
          <CaptionForm label="Caption" value={element.data.caption} fieldKey="caption" data={element.data} onChange={onChange} />
        )}
        {element.type === ELEMENT_TYPES.SIGNATURE && (
          <CaptionForm label="Label" value={element.data.label} fieldKey="label" data={element.data} onChange={onChange} />
        )}
        {element.type === ELEMENT_TYPES.PRODUCT_TABLE && (
          <ProductTableForm
            elementData={element.data}
            onChange={onChange}
            products={apiData?.products || []}
            currencySymbol={currencySymbol}
            currencyDecimals={currencyDecimals}
            onUpdateProduct={updateProduct}
            onAddProduct={addProduct}
            onRemoveProduct={removeProduct}
          />
        )}
        {element.type === ELEMENT_TYPES.TOTALS && <TotalsForm data={element.data} onChange={onChange} />}
        {element.type === ELEMENT_TYPES.CHART && <ChartForm data={element.data} onChange={onChange} />}
      </div>

      <button className="properties__delete" onClick={() => removeElement(element.instanceId)}>
        Delete this element
      </button>
    </aside>
  );
}
