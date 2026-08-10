import {
  mockCompanyInfo,
  mockBillTo,
  mockShipTo,
  mockBuyerTo,
  mockInvoiceMeta,
  mockInvoiceMetaInfo,
  mockOrderInfoItems,
  mockProducts,
  mockSignatory,
  mockOrderSourceFields,
  mockProductSourceRecords,
  productColumnDefinitions,
  orderInfoColumnDefinitions,
} from './mockApiData';

/**
 * ------------------------------------------------------------------
 *  SWITCHING TO THE REAL .NET API — read this when that day comes
 * ------------------------------------------------------------------
 *  1. Set USE_STATIC_DATA to false.
 *  2. Set API_BASE_URL to your .NET API's base URL
 *     (e.g. "https://api.yourcompany.com").
 *  3. Make sure the .NET API exposes these routes returning the same
 *     JSON shape as src/data/mockApiData.js:
 *       GET /api/company
 *       GET /api/bill-to
 *       GET /api/ship-to
 *       GET /api/buyer-to
 *       GET /api/invoice-meta
 *       GET /api/invoice-meta-info
 *       GET /api/order-info
 *       GET /api/products
 *       GET /api/signatory
 *       GET /api/order-source-fields
 *  Every component in this app calls the functions below — nothing
 *  else in the codebase needs to change.
 * ------------------------------------------------------------------
 */
const USE_STATIC_DATA = true;
const API_BASE_URL = 'http://localhost:5000';

async function getJson(path) {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API request failed: ${path} (${res.status})`);
  return res.json();
}

export async function fetchCompanyInfo() {
  return USE_STATIC_DATA ? Promise.resolve(mockCompanyInfo) : getJson('/api/company');
}

export async function fetchBillTo() {
  return USE_STATIC_DATA ? Promise.resolve(mockBillTo) : getJson('/api/bill-to');
}

export async function fetchShipTo() {
  return USE_STATIC_DATA ? Promise.resolve(mockShipTo) : getJson('/api/ship-to');
}

export async function fetchBuyerTo() {
  return USE_STATIC_DATA ? Promise.resolve(mockBuyerTo) : getJson('/api/buyer-to');
}

/** Currency settings only (symbol/decimals) — consumed by the calculation engine, not an editable field list. */
export async function fetchInvoiceMeta() {
  return USE_STATIC_DATA ? Promise.resolve(mockInvoiceMeta) : getJson('/api/invoice-meta');
}

export async function fetchInvoiceMetaInfo() {
  return USE_STATIC_DATA ? Promise.resolve(mockInvoiceMetaInfo) : getJson('/api/invoice-meta-info');
}

/** Freight order & shipment rows shown in the Order/Shipment Info Table element (see OrderInfoTableElement.jsx) — same list/row shape as products. */
export async function fetchOrderInfoItems() {
  return USE_STATIC_DATA ? Promise.resolve(mockOrderInfoItems) : getJson('/api/order-info');
}

export function getOrderInfoColumnDefinitions() {
  return orderInfoColumnDefinitions;
}

export async function fetchProducts() {
  return USE_STATIC_DATA ? Promise.resolve(mockProducts) : getJson('/api/products');
}

export async function fetchSignatory() {
  return USE_STATIC_DATA ? Promise.resolve(mockSignatory) : getJson('/api/signatory');
}

/** Flat order/customer/location fields offered as "Insert from data" options on Info block Value fields. */
export async function fetchOrderSourceFields() {
  return USE_STATIC_DATA ? Promise.resolve(mockOrderSourceFields) : getJson('/api/order-source-fields');
}

/** Shipment/commodity records offered as "Insert from data" options on a Product Table line item. */
export async function fetchProductSourceRecords() {
  return USE_STATIC_DATA ? Promise.resolve(mockProductSourceRecords) : getJson('/api/product-source-records');
}

export function getProductColumnDefinitions() {
  // Column definitions stay client-side even after API integration —
  // they describe how the designer renders data, not the data itself.
  return productColumnDefinitions;
}

export async function fetchAllInvoiceData() {
  const [company, billTo, shipTo, buyerTo, invoiceMeta, invoiceMetaInfo, orderInfoItems, products, signatory, orderSourceFields, productSourceRecords] = await Promise.all([
    fetchCompanyInfo(),
    fetchBillTo(),
    fetchShipTo(),
    fetchBuyerTo(),
    fetchInvoiceMeta(),
    fetchInvoiceMetaInfo(),
    fetchOrderInfoItems(),
    fetchProducts(),
    fetchSignatory(),
    fetchOrderSourceFields(),
    fetchProductSourceRecords(),
  ]);
  return { company, billTo, shipTo, buyerTo, invoiceMeta, invoiceMetaInfo, orderInfoItems, products, signatory, orderSourceFields, productSourceRecords };
}
