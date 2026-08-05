import { useRef, useCallback } from 'react';
import { useDesigner, PAGE_WIDTH } from '../context/DesignerContext';
import { ELEMENT_TYPES, findPaletteDefinition } from '../data/elementDefinitions';
import { LogoElement, ImageElement, SignatureElement } from './elements/MediaElements';
import { CompanyInfoElement, ClientInfoElement, InvoiceMetaElement } from './elements/InfoElements';
import { ProductTableElement } from './elements/ProductTableElement';
import { TotalsElement } from './elements/TotalsElement';
import { ChartElement } from './elements/ChartElement';
import { TextBlockElement, DividerElement } from './elements/TextAndDivider';

const MIN_WIDTH = 60;

export function CanvasElement({ element }) {
  const {
    selectedElementId,
    selectElement,
    removeElement,
    moveElement,
    resizeElement,
    updateElementData,
    bringToFront,
    apiData,
    elements,
  } = useDesigner();

  const isSelected = selectedElementId === element.instanceId;
  const paletteDef = findPaletteDefinition(element.type);
  const dragState = useRef(null);
  const resizeState = useRef(null);

  const onChange = (patch) => updateElementData(element.instanceId, patch);

  const handleSelect = (e) => {
    e.stopPropagation();
    selectElement(element.instanceId);
  };

  // --- Move (drag the toolbar strip to reposition the element anywhere on the page) ---
  const handleMovePointerDown = useCallback(
    (e) => {
      e.stopPropagation();
      selectElement(element.instanceId);
      bringToFront(element.instanceId);
      dragState.current = { startX: e.clientX, startY: e.clientY, origX: element.x, origY: element.y };
      e.target.setPointerCapture(e.pointerId);
    },
    [element.instanceId, element.x, element.y, selectElement, bringToFront]
  );

  const handleMovePointerMove = useCallback(
    (e) => {
      if (!dragState.current) return;
      const { startX, startY, origX, origY } = dragState.current;
      const newX = origX + (e.clientX - startX);
      const newY = origY + (e.clientY - startY);
      moveElement(element.instanceId, newX, newY);
    },
    [element.instanceId, moveElement]
  );

  const handleMovePointerUp = useCallback((e) => {
    dragState.current = null;
    e.target.releasePointerCapture?.(e.pointerId);
  }, []);

  // --- Resize (drag the right-edge handle to change the box's width) ---
  const handleResizePointerDown = useCallback(
    (e) => {
      e.stopPropagation();
      resizeState.current = { startX: e.clientX, origWidth: element.width };
      e.target.setPointerCapture(e.pointerId);
    },
    [element.width]
  );

  const handleResizePointerMove = useCallback(
    (e) => {
      if (!resizeState.current) return;
      const { startX, origWidth } = resizeState.current;
      const maxWidth = PAGE_WIDTH - element.x - 8;
      const newWidth = Math.min(maxWidth, Math.max(MIN_WIDTH, origWidth + (e.clientX - startX)));
      resizeElement(element.instanceId, newWidth);
    },
    [element.instanceId, element.x, resizeElement]
  );

  const handleResizePointerUp = useCallback((e) => {
    resizeState.current = null;
    e.target.releasePointerCapture?.(e.pointerId);
  }, []);

  return (
    <div
      className={`canvas-el ${isSelected ? 'canvas-el--selected' : ''}`}
      style={{ left: element.x, top: element.y, width: element.width }}
      onClick={handleSelect}
    >
      <div
        className="canvas-el__toolbar"
        data-html2canvas-ignore="true"
        onPointerDown={handleMovePointerDown}
        onPointerMove={handleMovePointerMove}
        onPointerUp={handleMovePointerUp}
      >
        <span className="canvas-el__label">
          <span className="canvas-el__drag-icon">⠿</span> {paletteDef?.label || element.type}
        </span>
        <div className="canvas-el__actions">
          <button
            title="Delete"
            className="canvas-el__delete"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); removeElement(element.instanceId); }}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="canvas-el__body">
        {renderElement(element, { onChange, isEditing: isSelected, apiData, elements })}
      </div>

      <div
        className="canvas-el__resize-handle"
        data-html2canvas-ignore="true"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        title="Drag to resize width"
      />
    </div>
  );
}

function renderElement(element, { onChange, isEditing, apiData, elements }) {
  const { type, data, instanceId } = element;
  const currencySymbol = apiData?.invoiceMeta?.currencySymbol || '₹';

  switch (type) {
    case ELEMENT_TYPES.LOGO:
      return <LogoElement data={data} onChange={onChange} />;
    case ELEMENT_TYPES.IMAGE:
      return <ImageElement data={data} onChange={onChange} />;
    case ELEMENT_TYPES.SIGNATURE:
      return <SignatureElement data={data} onChange={onChange} />;
    case ELEMENT_TYPES.COMPANY_INFO:
      return <CompanyInfoElement company={apiData?.company} />;
    case ELEMENT_TYPES.CLIENT_INFO:
      return <ClientInfoElement client={apiData?.client} />;
    case ELEMENT_TYPES.INVOICE_META:
      return <InvoiceMetaElement invoiceMeta={apiData?.invoiceMeta} />;
    case ELEMENT_TYPES.PRODUCT_TABLE:
      return (
        <ProductTableElement
          instanceId={instanceId}
          data={data}
          products={apiData?.products || []}
          currencySymbol={currencySymbol}
          onChange={onChange}
          isEditing={isEditing}
        />
      );
    case ELEMENT_TYPES.TOTALS: {
      const selectedProductIds = getSelectedProductIdsAcrossCanvas(elements);
      return (
        <TotalsElement
          instanceId={instanceId}
          data={data}
          products={apiData?.products || []}
          selectedProductIds={selectedProductIds}
          currencySymbol={currencySymbol}
          onChange={onChange}
          isEditing={isEditing}
        />
      );
    }
    case ELEMENT_TYPES.TEXT_BLOCK:
      return <TextBlockElement data={data} onChange={onChange} isEditing={isEditing} />;
    case ELEMENT_TYPES.CHART:
      return (
        <ChartElement
          data={data}
          products={apiData?.products || []}
          currencySymbol={currencySymbol}
          onChange={onChange}
          isEditing={isEditing}
        />
      );
    case ELEMENT_TYPES.DIVIDER:
      return <DividerElement />;
    default:
      return <div className="el">Unknown element</div>;
  }
}

function getSelectedProductIdsAcrossCanvas(elements) {
  const ids = new Set();
  elements.forEach((el) => {
    if (el.type === ELEMENT_TYPES.PRODUCT_TABLE) {
      (el.data.selectedProductIds || []).forEach((id) => ids.add(id));
    }
  });
  return [...ids];
}
