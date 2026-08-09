import { useDesigner, findElementAcrossPages } from '../context/DesignerContext';
import { ELEMENT_TYPES, findPaletteDefinition } from '../data/elementDefinitions';
import {
  InfoBlockForm,
  CustomBlockForm,
  OrderInfoTableForm,
  TextBlockForm,
  CaptionForm,
  ProductTableForm,
  TotalsForm,
  ChartForm,
  PageSetupForm,
  ShapeForm,
} from './PropertiesForms';

export function PropertiesPanel() {
  const {
    pages,
    selectedElementId,
    focusedFieldId,
    updateElementData,
    resizeElement,
    resizeElementHeight,
    removeElement,
    apiData,
    pageSettings,
    updatePageSettings,
    updateInfoBlockTitle,
    addInfoItem,
    updateInfoItem,
    removeInfoItem,
    updateProduct,
    addProduct,
    removeProduct,
    updateOrderInfoItem,
    addOrderInfoItem,
    removeOrderInfoItem,
  } = useDesigner();

  const infoBlockProps = (blockKey, block, opts = {}) => ({
    title: block?.title,
    items: block?.items || [],
    onChangeTitle: (v) => updateInfoBlockTitle(blockKey, v),
    onUpdateItem: (id, patch) => updateInfoItem(blockKey, id, patch),
    onAddItem: () => addInfoItem(blockKey),
    onRemoveItem: (id) => removeInfoItem(blockKey, id),
    focusedFieldId,
    ...opts,
  });

  if (!selectedElementId) {
    return (
      <aside className="properties">
        <div className="properties__title">Properties</div>
        <p className="properties__empty">Select an element on the page to customize it here, or drag its edges to resize. Nothing selected — configure the page itself below.</p>
        <div className="properties__section">
          <PageSetupForm pageSettings={pageSettings} onChange={updatePageSettings} />
        </div>
      </aside>
    );
  }

  const element = findElementAcrossPages(pages, selectedElementId);
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
        <label>
          Height ({element.height ? `${Math.round(element.height)}px` : 'Auto'})
          <input
            type="range"
            min="28"
            max="1000"
            value={element.height || 100}
            onChange={(e) => resizeElementHeight(element.instanceId, Number(e.target.value))}
          />
        </label>
        {element.height && (
          <button type="button" className="pf-reset-btn" onClick={() => resizeElementHeight(element.instanceId, null)}>
            Reset to auto height
          </button>
        )}
        <p className="properties__hint">
          Drag its top bar on the page to move it, or drag its right/bottom/corner edge to resize width and height.
        </p>
      </div>

      <div className="properties__section">
        {element.type === ELEMENT_TYPES.COMPANY_INFO && <InfoBlockForm {...infoBlockProps('company', apiData?.company)} />}
        {element.type === ELEMENT_TYPES.CLIENT_INFO && <InfoBlockForm {...infoBlockProps('billTo', apiData?.billTo)} />}
        {element.type === ELEMENT_TYPES.SHIP_TO && <InfoBlockForm {...infoBlockProps('shipTo', apiData?.shipTo)} />}
        {element.type === ELEMENT_TYPES.BUYER_TO && <InfoBlockForm {...infoBlockProps('buyerTo', apiData?.buyerTo)} />}
        {element.type === ELEMENT_TYPES.INVOICE_META && <InfoBlockForm {...infoBlockProps('invoiceMetaInfo', apiData?.invoiceMetaInfo)} />}
        {element.type === ELEMENT_TYPES.CUSTOM_BLOCK && <CustomBlockForm data={element.data} onChange={onChange} focusedFieldId={focusedFieldId} />}
        {element.type === ELEMENT_TYPES.ORDER_INFO_TABLE && (
          <OrderInfoTableForm
            elementData={element.data}
            onChange={onChange}
            items={apiData?.orderInfoItems || []}
            onUpdateItem={updateOrderInfoItem}
            onAddItem={() => addOrderInfoItem(element.instanceId)}
            onRemoveItem={removeOrderInfoItem}
            focusedFieldId={focusedFieldId}
          />
        )}
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
            onAddProduct={() => addProduct(element.instanceId)}
            onRemoveProduct={removeProduct}
            focusedFieldId={focusedFieldId}
          />
        )}
        {element.type === ELEMENT_TYPES.TOTALS && <TotalsForm data={element.data} onChange={onChange} focusedFieldId={focusedFieldId} />}
        {element.type === ELEMENT_TYPES.CHART && <ChartForm data={element.data} onChange={onChange} />}
        {element.type === ELEMENT_TYPES.SHAPE && <ShapeForm data={element.data} onChange={onChange} />}
      </div>

      <button className="properties__delete" onClick={() => removeElement(element.instanceId)}>
        Delete this element
      </button>
    </aside>
  );
}
