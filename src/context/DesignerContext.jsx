import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { fetchAllInvoiceData } from '../data/apiClient';
import { createDefaultElementData, defaultWidthFor } from '../data/elementDefinitions';
import { createDefaultTemplateElements } from '../data/defaultTemplate';

const DesignerContext = createContext(null);

// A4-at-96dpi page size in px — the default page size, and the fallback used
// until the page settings load. The live size lives in state.pageSettings and
// is user-configurable (see PageSetupForm) via preset or custom width/height.
// The same size/background applies to every page in the document.
export const PAGE_WIDTH = 794;
export const PAGE_HEIGHT = 1123;
export const HEADER_ZONE_HEIGHT = 140;
export const FOOTER_ZONE_HEIGHT = 130;

// Named page-size presets (px at 96dpi), offered in the Page Setup panel.
export const PAGE_SIZE_PRESETS = {
  A4: { width: 794, height: 1123 },
  Letter: { width: 816, height: 1056 },
  Legal: { width: 816, height: 1344 },
};

// Soft vertical zones used for organizing where element types are allowed to
// land, and for the visual header/main/footer guide stripes. The header stays
// a fixed height from the top and the footer a fixed height from the bottom
// regardless of overall page height — only the main area grows/shrinks.
export function getZones(pageHeight = PAGE_HEIGHT) {
  return {
    header: { key: 'header', label: 'Header', yMin: 0, yMax: HEADER_ZONE_HEIGHT },
    main: { key: 'main', label: 'Main Area', yMin: HEADER_ZONE_HEIGHT, yMax: Math.max(HEADER_ZONE_HEIGHT, pageHeight - FOOTER_ZONE_HEIGHT) },
    footer: { key: 'footer', label: 'Footer', yMin: Math.max(HEADER_ZONE_HEIGHT, pageHeight - FOOTER_ZONE_HEIGHT), yMax: pageHeight },
  };
}

export function zoneForY(y, pageHeight = PAGE_HEIGHT) {
  const zones = getZones(pageHeight);
  if (y < zones.header.yMax) return 'header';
  if (y < zones.main.yMax) return 'main';
  return 'footer';
}

/** Clamps a y-coordinate into the given zone's vertical range. */
function clampIntoZone(zone, y, pageHeight = PAGE_HEIGHT) {
  const zones = getZones(pageHeight);
  const bounds = zones[zone] || zones.main;
  return Math.min(Math.max(y, bounds.yMin + 4), bounds.yMax - 24);
}

function makePage(elements = []) {
  return { id: uuid(), elements };
}

const initialState = {
  loading: true,
  apiData: null, // { company, client, invoiceMeta, products, signatory }
  pages: [], // [{ id, elements }] — a real multi-page document, rendered top to bottom
  selectedElementId: null,
  pageSettings: { preset: 'A4', width: PAGE_WIDTH, height: PAGE_HEIGHT, background: '' },
};

/** Applies `updater` to whichever page contains instanceId (elements ids are unique across the whole document). */
function updatePageContaining(pages, instanceId, updater) {
  return pages.map((page) => (page.elements.some((el) => el.instanceId === instanceId) ? { ...page, elements: updater(page.elements) } : page));
}

function reducer(state, action) {
  switch (action.type) {
    case 'DATA_LOADED':
      return {
        ...state,
        loading: false,
        apiData: action.payload,
        // Only seed the sample invoice on the very first load — a later
        // reload of apiData (e.g. after a "reset to sample") never happens
        // while pages already exist unless RESET_TO_SAMPLE asked for it.
        pages: state.pages.length > 0 ? state.pages : [makePage(createDefaultTemplateElements())],
      };

    case 'RESET_TO_SAMPLE':
      return {
        ...state,
        apiData: action.payload,
        pages: [makePage(createDefaultTemplateElements())],
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
        pages: instanceId
          ? updatePageContaining(state.pages, instanceId, (elements) =>
              elements.map((el) =>
                el.instanceId === instanceId
                  ? { ...el, data: { ...el.data, selectedProductIds: [...(el.data.selectedProductIds || []), newProduct.id] } }
                  : el
              )
            )
          : state.pages,
      };
    }

    case 'REMOVE_PRODUCT': {
      const { productId } = action.payload;
      return {
        ...state,
        apiData: { ...state.apiData, products: state.apiData.products.filter((p) => p.id !== productId) },
        // Also drop the removed product from any Product Table's selection, on every page, so it disappears from the invoice too.
        pages: state.pages.map((page) => ({
          ...page,
          elements: page.elements.map((el) =>
            el.type === 'PRODUCT_TABLE'
              ? { ...el, data: { ...el.data, selectedProductIds: (el.data.selectedProductIds || []).filter((id) => id !== productId) } }
              : el
          ),
        })),
      };
    }

    case 'UPDATE_PAGE_SETTINGS':
      return { ...state, pageSettings: { ...state.pageSettings, ...action.payload } };

    case 'ADD_ELEMENT': {
      const { elementType, zone, x, y, pageId } = action.payload;
      const newElement = {
        instanceId: uuid(),
        type: elementType,
        zone,
        x: Math.max(0, x),
        y: clampIntoZone(zone, y, state.pageSettings.height),
        width: defaultWidthFor(elementType),
        height: null,
        data: createDefaultElementData(elementType),
      };
      return {
        ...state,
        selectedElementId: newElement.instanceId,
        pages: state.pages.map((page) => (page.id === pageId ? { ...page, elements: [...page.elements, newElement] } : page)),
      };
    }

    case 'REMOVE_ELEMENT':
      return {
        ...state,
        selectedElementId: state.selectedElementId === action.payload.instanceId ? null : state.selectedElementId,
        pages: state.pages.map((page) => ({
          ...page,
          elements: page.elements.filter((el) => el.instanceId !== action.payload.instanceId),
        })),
      };

    case 'MOVE_ELEMENT': {
      const { instanceId, x, y } = action.payload;
      const { width: pageWidth, height: pageHeight } = state.pageSettings;
      return {
        ...state,
        pages: updatePageContaining(state.pages, instanceId, (elements) =>
          elements.map((el) =>
            el.instanceId === instanceId
              ? { ...el, x: Math.max(0, Math.min(x, pageWidth - 20)), y: Math.max(0, Math.min(y, pageHeight - 20)), zone: zoneForY(y, pageHeight) }
              : el
          )
        ),
      };
    }

    case 'RESIZE_ELEMENT': {
      const { instanceId, width, height } = action.payload;
      return {
        ...state,
        pages: updatePageContaining(state.pages, instanceId, (elements) =>
          elements.map((el) => {
            if (el.instanceId !== instanceId) return el;
            const next = { ...el };
            if (width !== undefined) next.width = width;
            if (height !== undefined) next.height = height; // height may be explicitly null to reset to auto
            return next;
          })
        ),
      };
    }

    case 'UPDATE_ELEMENT_DATA': {
      const { instanceId, patch } = action.payload;
      return {
        ...state,
        pages: updatePageContaining(state.pages, instanceId, (elements) =>
          elements.map((el) => (el.instanceId === instanceId ? { ...el, data: { ...el.data, ...patch } } : el))
        ),
      };
    }

    case 'SELECT_ELEMENT':
      return { ...state, selectedElementId: action.payload };

    case 'BRING_TO_FRONT': {
      const { instanceId } = action.payload;
      return {
        ...state,
        pages: updatePageContaining(state.pages, instanceId, (elements) => {
          const target = elements.find((el) => el.instanceId === instanceId);
          if (!target) return elements;
          return [...elements.filter((el) => el.instanceId !== instanceId), target];
        }),
      };
    }

    case 'LOAD_TEMPLATE':
      return { ...state, pages: action.payload.pages, selectedElementId: null };

    case 'ADD_PAGE': {
      const newPage = makePage(action.payload?.elements || []);
      const afterPageId = action.payload?.afterPageId;
      if (!afterPageId) return { ...state, pages: [...state.pages, newPage] };
      const index = state.pages.findIndex((p) => p.id === afterPageId);
      if (index === -1) return { ...state, pages: [...state.pages, newPage] };
      const pages = [...state.pages];
      pages.splice(index + 1, 0, newPage);
      return { ...state, pages };
    }

    case 'DUPLICATE_PAGE': {
      const { pageId } = action.payload;
      const index = state.pages.findIndex((p) => p.id === pageId);
      if (index === -1) return state;
      const source = state.pages[index];
      const copiedElements = source.elements.map((el) => ({ ...JSON.parse(JSON.stringify(el)), instanceId: uuid() }));
      const newPage = makePage(copiedElements);
      const pages = [...state.pages];
      pages.splice(index + 1, 0, newPage);
      return { ...state, pages };
    }

    case 'REMOVE_PAGE': {
      if (state.pages.length <= 1) return state; // always keep at least one page
      const { pageId } = action.payload;
      const removed = state.pages.find((p) => p.id === pageId);
      const stillSelected = removed?.elements.some((el) => el.instanceId === state.selectedElementId);
      return {
        ...state,
        pages: state.pages.filter((p) => p.id !== pageId),
        selectedElementId: stillSelected ? null : state.selectedElementId,
      };
    }

    case 'CLEAR_PAGE': {
      const { pageId } = action.payload;
      const cleared = state.pages.find((p) => p.id === pageId);
      const stillSelected = cleared?.elements.some((el) => el.instanceId === state.selectedElementId);
      return {
        ...state,
        pages: state.pages.map((p) => (p.id === pageId ? { ...p, elements: [] } : p)),
        selectedElementId: stillSelected ? null : state.selectedElementId,
      };
    }

    default:
      return state;
  }
}

export function DesignerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    fetchAllInvoiceData().then((payload) => dispatch({ type: 'DATA_LOADED', payload }));
  }, []);

  const addElement = useCallback((elementType, zone, x, y, pageId) => {
    dispatch({ type: 'ADD_ELEMENT', payload: { elementType, zone, x, y, pageId } });
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

  // height may be a number (fixed height, content clipped/scrolled beyond it) or null (auto-fit content).
  const resizeElementHeight = useCallback((instanceId, height) => {
    dispatch({ type: 'RESIZE_ELEMENT', payload: { instanceId, height } });
  }, []);

  const updatePageSettings = useCallback((patch) => dispatch({ type: 'UPDATE_PAGE_SETTINGS', payload: patch }), []);

  const updateElementData = useCallback((instanceId, patch) => {
    dispatch({ type: 'UPDATE_ELEMENT_DATA', payload: { instanceId, patch } });
  }, []);

  const selectElement = useCallback((instanceId) => {
    dispatch({ type: 'SELECT_ELEMENT', payload: instanceId });
  }, []);

  const bringToFront = useCallback((instanceId) => {
    dispatch({ type: 'BRING_TO_FRONT', payload: { instanceId } });
  }, []);

  const loadTemplate = useCallback((pages) => {
    dispatch({ type: 'LOAD_TEMPLATE', payload: { pages } });
  }, []);

  const addPage = useCallback((afterPageId) => dispatch({ type: 'ADD_PAGE', payload: { afterPageId } }), []);
  const duplicatePage = useCallback((pageId) => dispatch({ type: 'DUPLICATE_PAGE', payload: { pageId } }), []);
  const removePage = useCallback((pageId) => dispatch({ type: 'REMOVE_PAGE', payload: { pageId } }), []);
  const clearPage = useCallback((pageId) => dispatch({ type: 'CLEAR_PAGE', payload: { pageId } }), []);

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
    resizeElementHeight,
    updatePageSettings,
    updateElementData,
    selectElement,
    bringToFront,
    loadTemplate,
    addPage,
    duplicatePage,
    removePage,
    clearPage,
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

/** Finds an element by instanceId across every page of the document. */
export function findElementAcrossPages(pages, instanceId) {
  for (const page of pages) {
    const found = page.elements.find((el) => el.instanceId === instanceId);
    if (found) return found;
  }
  return null;
}

/**
 * A Totals element needs to know which products were picked in the Product
 * Table element(s) elsewhere on its page. This gathers every selected
 * product id across all Product Table instances on that one page — pages
 * are independent documents, so a page's totals never pull in another
 * page's line items.
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
