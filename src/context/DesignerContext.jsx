import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { fetchAllInvoiceData } from '../data/apiClient';
import { createDefaultElementData, defaultWidthFor } from '../data/elementDefinitions';
import { createDefaultTemplateElements } from '../data/defaultTemplate';

const DesignerContext = createContext(null);

// Fixed A4-at-96dpi page size in px. This never changes with window size —
// the canvas area scrolls instead of the page shrinking.
export const PAGE_WIDTH = 794;
export const PAGE_HEIGHT = 1123;

// Soft vertical zones used for organizing where element types are allowed
// to land, and for the visual header/main/footer guide stripes.
export const ZONES = {
  header: { key: 'header', label: 'Header', yMin: 0, yMax: 140 },
  main: { key: 'main', label: 'Main Area', yMin: 140, yMax: 993 },
  footer: { key: 'footer', label: 'Footer', yMin: 993, yMax: PAGE_HEIGHT },
};

export function zoneForY(y) {
  if (y < ZONES.header.yMax) return 'header';
  if (y < ZONES.main.yMax) return 'main';
  return 'footer';
}

/** Clamps a y-coordinate into the given zone's vertical range. */
function clampIntoZone(zone, y) {
  const bounds = ZONES[zone] || ZONES.main;
  return Math.min(Math.max(y, bounds.yMin + 4), bounds.yMax - 24);
}

const initialState = {
  loading: true,
  apiData: null, // { company, client, invoiceMeta, products, signatory }
  elements: [], // flat list, paint order = array order (last = on top)
  selectedElementId: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'DATA_LOADED':
      return {
        ...state,
        loading: false,
        apiData: action.payload,
        // Only seed the sample invoice on the very first load — a later
        // reload of apiData (e.g. after a "reset to sample") never happens
        // while elements already exist unless RESET_TO_SAMPLE asked for it.
        elements: state.elements.length > 0 ? state.elements : createDefaultTemplateElements(),
      };

    case 'RESET_TO_SAMPLE':
      return {
        ...state,
        apiData: action.payload,
        elements: createDefaultTemplateElements(),
        selectedElementId: null,
      };

    case 'UPDATE_COMPANY':
      return { ...state, apiData: { ...state.apiData, company: { ...state.apiData.company, ...action.payload } } };

    case 'UPDATE_CLIENT':
      return { ...state, apiData: { ...state.apiData, client: { ...state.apiData.client, ...action.payload } } };

    case 'UPDATE_INVOICE_META':
      return { ...state, apiData: { ...state.apiData, invoiceMeta: { ...state.apiData.invoiceMeta, ...action.payload } } };

    case 'UPDATE_SIGNATORY':
      return { ...state, apiData: { ...state.apiData, signatory: { ...state.apiData.signatory, ...action.payload } } };

    case 'UPDATE_PRODUCT': {
      const { productId, patch } = action.payload;
      return {
        ...state,
        apiData: {
          ...state.apiData,
          products: state.apiData.products.map((p) => (p.id === productId ? { ...p, ...patch } : p)),
        },
      };
    }

    case 'ADD_PRODUCT': {
      const newProduct = {
        id: uuid(),
        sku: '',
        name: 'New Item',
        description: '',
        category: '',
        qty: 1,
        unit: '',
        unitPrice: 0,
        discountPercent: 0,
        taxPercent: 0,
      };
      const { instanceId } = action.payload || {};
      return {
        ...state,
        apiData: { ...state.apiData, products: [...state.apiData.products, newProduct] },
        // Also tick the new item on so it actually shows up on the invoice table you were editing —
        // adding it to the catalog alone would otherwise leave it invisible until manually checked.
        elements: instanceId
          ? state.elements.map((el) =>
              el.instanceId === instanceId
                ? { ...el, data: { ...el.data, selectedProductIds: [...(el.data.selectedProductIds || []), newProduct.id] } }
                : el
            )
          : state.elements,
      };
    }

    case 'REMOVE_PRODUCT': {
      const { productId } = action.payload;
      return {
        ...state,
        apiData: { ...state.apiData, products: state.apiData.products.filter((p) => p.id !== productId) },
        // Also drop the removed product from any Product Table's selection so it disappears from the invoice too.
        elements: state.elements.map((el) =>
          el.type === 'PRODUCT_TABLE'
            ? { ...el, data: { ...el.data, selectedProductIds: (el.data.selectedProductIds || []).filter((id) => id !== productId) } }
            : el
        ),
      };
    }

    case 'ADD_ELEMENT': {
      const { elementType, zone, x, y } = action.payload;
      const newElement = {
        instanceId: uuid(),
        type: elementType,
        zone,
        x: Math.max(0, x),
        y: clampIntoZone(zone, y),
        width: defaultWidthFor(elementType),
        data: createDefaultElementData(elementType),
      };
      return {
        ...state,
        selectedElementId: newElement.instanceId,
        elements: [...state.elements, newElement],
      };
    }

    case 'REMOVE_ELEMENT':
      return {
        ...state,
        selectedElementId: state.selectedElementId === action.payload.instanceId ? null : state.selectedElementId,
        elements: state.elements.filter((el) => el.instanceId !== action.payload.instanceId),
      };

    case 'MOVE_ELEMENT': {
      const { instanceId, x, y } = action.payload;
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.instanceId === instanceId
            ? { ...el, x: Math.max(0, Math.min(x, PAGE_WIDTH - 20)), y: Math.max(0, Math.min(y, PAGE_HEIGHT - 20)), zone: zoneForY(y) }
            : el
        ),
      };
    }

    case 'RESIZE_ELEMENT': {
      const { instanceId, width } = action.payload;
      return {
        ...state,
        elements: state.elements.map((el) => (el.instanceId === instanceId ? { ...el, width } : el)),
      };
    }

    case 'UPDATE_ELEMENT_DATA': {
      const { instanceId, patch } = action.payload;
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.instanceId === instanceId ? { ...el, data: { ...el.data, ...patch } } : el
        ),
      };
    }

    case 'SELECT_ELEMENT':
      return { ...state, selectedElementId: action.payload };

    case 'BRING_TO_FRONT': {
      const { instanceId } = action.payload;
      const target = state.elements.find((el) => el.instanceId === instanceId);
      if (!target) return state;
      return {
        ...state,
        elements: [...state.elements.filter((el) => el.instanceId !== instanceId), target],
      };
    }

    case 'LOAD_TEMPLATE':
      return { ...state, elements: action.payload.elements, selectedElementId: null };

    case 'RESET_CANVAS':
      return { ...state, elements: [], selectedElementId: null };

    default:
      return state;
  }
}

export function DesignerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    fetchAllInvoiceData().then((payload) => dispatch({ type: 'DATA_LOADED', payload }));
  }, []);

  const addElement = useCallback((elementType, zone, x, y) => {
    dispatch({ type: 'ADD_ELEMENT', payload: { elementType, zone, x, y } });
  }, []);

  const removeElement = useCallback((instanceId) => {
    dispatch({ type: 'REMOVE_ELEMENT', payload: { instanceId } });
  }, []);

  const moveElement = useCallback((instanceId, x, y) => {
    dispatch({ type: 'MOVE_ELEMENT', payload: { instanceId, x, y } });
  }, []);

  const resizeElement = useCallback((instanceId, width) => {
    dispatch({ type: 'RESIZE_ELEMENT', payload: { instanceId, width } });
  }, []);

  const updateElementData = useCallback((instanceId, patch) => {
    dispatch({ type: 'UPDATE_ELEMENT_DATA', payload: { instanceId, patch } });
  }, []);

  const selectElement = useCallback((instanceId) => {
    dispatch({ type: 'SELECT_ELEMENT', payload: instanceId });
  }, []);

  const bringToFront = useCallback((instanceId) => {
    dispatch({ type: 'BRING_TO_FRONT', payload: { instanceId } });
  }, []);

  const loadTemplate = useCallback((elements) => {
    dispatch({ type: 'LOAD_TEMPLATE', payload: { elements } });
  }, []);

  const resetCanvas = useCallback(() => dispatch({ type: 'RESET_CANVAS' }), []);

  const resetToSample = useCallback(() => {
    fetchAllInvoiceData().then((payload) => dispatch({ type: 'RESET_TO_SAMPLE', payload }));
  }, []);

  const updateCompany = useCallback((patch) => dispatch({ type: 'UPDATE_COMPANY', payload: patch }), []);
  const updateClient = useCallback((patch) => dispatch({ type: 'UPDATE_CLIENT', payload: patch }), []);
  const updateInvoiceMeta = useCallback((patch) => dispatch({ type: 'UPDATE_INVOICE_META', payload: patch }), []);
  const updateSignatory = useCallback((patch) => dispatch({ type: 'UPDATE_SIGNATORY', payload: patch }), []);

  const updateProduct = useCallback((productId, patch) => {
    dispatch({ type: 'UPDATE_PRODUCT', payload: { productId, patch } });
  }, []);

  const addProduct = useCallback((instanceId) => dispatch({ type: 'ADD_PRODUCT', payload: { instanceId } }), []);

  const removeProduct = useCallback((productId) => {
    dispatch({ type: 'REMOVE_PRODUCT', payload: { productId } });
  }, []);

  const value = {
    ...state,
    addElement,
    removeElement,
    moveElement,
    resizeElement,
    updateElementData,
    selectElement,
    bringToFront,
    loadTemplate,
    resetCanvas,
    resetToSample,
    updateCompany,
    updateClient,
    updateInvoiceMeta,
    updateSignatory,
    updateProduct,
    addProduct,
    removeProduct,
  };

  return <DesignerContext.Provider value={value}>{children}</DesignerContext.Provider>;
}

export function useDesigner() {
  const ctx = useContext(DesignerContext);
  if (!ctx) throw new Error('useDesigner must be used inside <DesignerProvider>');
  return ctx;
}

export function findElement(elements, instanceId) {
  return elements.find((el) => el.instanceId === instanceId) || null;
}

/**
 * A Totals element needs to know which products were picked in the
 * Product Table element(s) elsewhere on the canvas. This gathers every
 * selected product id across all Product Table instances.
 */
export function getSelectedProductIdsAcrossCanvas(elements) {
  const ids = new Set();
  elements.forEach((el) => {
    if (el.type === 'PRODUCT_TABLE') {
      (el.data.selectedProductIds || []).forEach((id) => ids.add(id));
    }
  });
  return [...ids];
}
