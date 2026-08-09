import { useRef, useCallback } from 'react';
import { useDesigner } from '../context/DesignerContext';
import { ELEMENT_TYPES, findPaletteDefinition } from '../data/elementDefinitions';
import { LogoElement, ImageElement, SignatureElement } from './elements/MediaElements';
import { InfoBlockElement, InvoiceMetaElement } from './elements/InfoElements';
import { OrderInfoTableElement } from './elements/OrderInfoTableElement';
import { ProductTableElement } from './elements/ProductTableElement';
import { TotalsElement } from './elements/TotalsElement';
import { ChartElement } from './elements/ChartElement';
import { TextBlockElement, DividerElement } from './elements/TextAndDivider';
import { ShapeElement } from './elements/ShapeElement';

const MIN_WIDTH = 60;
const MIN_HEIGHT = 28;

export function CanvasElement({ element, pageElements }) {
  const {
    selectedElementId,
    selectElement,
    focusField,
    removeElement,
    moveElement,
    resizeElement,
    resizeElementHeight,
    updateElementData,
    bringToFront,
    apiData,
    pageSettings,
  } = useDesigner();

  const isSelected = selectedElementId === element.instanceId;
  const paletteDef = findPaletteDefinition(element.type);
  const dragState = useRef(null);
  const resizeState = useRef(null);
  const elRef = useRef(null);

  const onChange = (patch) => updateElementData(element.instanceId, patch);
  const onFocusField = useCallback((fieldId) => focusField(element.instanceId, fieldId), [element.instanceId, focusField]);

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

  // --- Resize (drag an edge/corner handle to change width and/or height) ---
  // 'width' = right edge, 'height' = bottom edge, 'both' = corner handle.
  const beginResize = useCallback(
    (mode) => (e) => {
      e.stopPropagation();
      // Seed from the OUTER box's rendered height — that's what element.height ends up
      // controlling, so the drag has to start from the same measurement or the box jumps.
      const currentHeight = element.height ?? elRef.current?.getBoundingClientRect().height ?? 100;
      resizeState.current = { startX: e.clientX, startY: e.clientY, origWidth: element.width, origHeight: currentHeight, mode };
      e.target.setPointerCapture(e.pointerId);
    },
    [element.width, element.height]
  );

  const handleResizeMove = useCallback(
    (e) => {
      if (!resizeState.current) return;
      const { startX, startY, origWidth, origHeight, mode } = resizeState.current;
      if (mode === 'width' || mode === 'both') {
        const maxWidth = pageSettings.width - element.x - 8;
        const newWidth = Math.min(maxWidth, Math.max(MIN_WIDTH, origWidth + (e.clientX - startX)));
        resizeElement(element.instanceId, newWidth);
      }
      if (mode === 'height' || mode === 'both') {
        const newHeight = Math.max(MIN_HEIGHT, origHeight + (e.clientY - startY));
        resizeElementHeight(element.instanceId, newHeight);
      }
    },
    [element.instanceId, element.x, pageSettings.width, resizeElement, resizeElementHeight]
  );

  const handleResizeUp = useCallback((e) => {
    resizeState.current = null;
    e.target.releasePointerCapture?.(e.pointerId);
  }, []);

  const handleResetHeight = useCallback(
    (e) => {
      e.stopPropagation();
      resizeElementHeight(element.instanceId, null);
    },
    [element.instanceId, resizeElementHeight]
  );

  return (
    <div
      ref={elRef}
      className={`canvas-el ${isSelected ? 'canvas-el--selected' : ''}`}
      style={{ left: element.x, top: element.y, width: element.width, height: element.height || undefined }}
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

      <div className="canvas-el__body" style={element.height ? { overflow: 'auto' } : undefined}>
        {renderElement(element, { onChange, apiData, elements: pageElements, onFocusField })}
      </div>

      <div
        className="canvas-el__resize-handle canvas-el__resize-handle--e"
        data-html2canvas-ignore="true"
        onPointerDown={beginResize('width')}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeUp}
        title="Drag to resize width"
      />
      <div
        className="canvas-el__resize-handle canvas-el__resize-handle--s"
        data-html2canvas-ignore="true"
        onPointerDown={beginResize('height')}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeUp}
        onDoubleClick={handleResetHeight}
        title="Drag to resize height — double-click to fit content again"
      />
      <div
        className="canvas-el__resize-handle canvas-el__resize-handle--se"
        data-html2canvas-ignore="true"
        onPointerDown={beginResize('both')}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeUp}
        onDoubleClick={handleResetHeight}
        title="Drag to resize width & height — double-click to fit content again"
      />
    </div>
  );
}

function renderElement(element, { onChange, apiData, elements, onFocusField }) {
  const { type, data, instanceId } = element;
  const currencySymbol = apiData?.invoiceMeta?.currencySymbol ?? '₹';
  const currencyDecimals = apiData?.invoiceMeta?.currencyDecimals ?? 2;

  switch (type) {
    case ELEMENT_TYPES.LOGO:
      return <LogoElement data={data} onChange={onChange} />;
    case ELEMENT_TYPES.IMAGE:
      return <ImageElement data={data} onChange={onChange} />;
    case ELEMENT_TYPES.SIGNATURE:
      return <SignatureElement data={data} onChange={onChange} />;
    case ELEMENT_TYPES.COMPANY_INFO:
      return <InfoBlockElement block={apiData?.company} onFieldClick={onFocusField} />;
    case ELEMENT_TYPES.CLIENT_INFO:
      return <InfoBlockElement block={apiData?.billTo} onFieldClick={onFocusField} />;
    case ELEMENT_TYPES.SHIP_TO:
      return <InfoBlockElement block={apiData?.shipTo} onFieldClick={onFocusField} />;
    case ELEMENT_TYPES.BUYER_TO:
      return <InfoBlockElement block={apiData?.buyerTo} onFieldClick={onFocusField} />;
    case ELEMENT_TYPES.INVOICE_META:
      return <InvoiceMetaElement invoiceMetaInfo={apiData?.invoiceMetaInfo} onFieldClick={onFocusField} />;
    case ELEMENT_TYPES.CUSTOM_BLOCK:
      return <InfoBlockElement block={{ title: data.title, items: data.items || [] }} onFieldClick={onFocusField} />;
    case ELEMENT_TYPES.ORDER_INFO_TABLE:
      return <OrderInfoTableElement data={data} items={apiData?.orderInfoItems || []} onFieldClick={onFocusField} />;
    case ELEMENT_TYPES.PRODUCT_TABLE:
      return (
        <ProductTableElement
          instanceId={instanceId}
          data={data}
          products={apiData?.products || []}
          currencySymbol={currencySymbol}
          currencyDecimals={currencyDecimals}
          onFieldClick={onFocusField}
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
          currencyDecimals={currencyDecimals}
          onFieldClick={onFocusField}
        />
      );
    }
    case ELEMENT_TYPES.TEXT_BLOCK:
      return <TextBlockElement data={data} />;
    case ELEMENT_TYPES.CHART:
      return <ChartElement data={data} products={apiData?.products || []} currencySymbol={currencySymbol} />;
    case ELEMENT_TYPES.DIVIDER:
      return <DividerElement />;
    case ELEMENT_TYPES.SHAPE:
      return <ShapeElement data={data} />;
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
