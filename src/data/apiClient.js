import {
  mockCompany,
  mockClient,
  mockInvoiceMeta,
  mockProducts,
  mockSignatory,
  productColumnDefinitions,
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
 *       GET /api/client
 *       GET /api/invoice-meta
 *       GET /api/products
 *       GET /api/signatory
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

export async function fetchCompany() {
  return USE_STATIC_DATA ? Promise.resolve(mockCompany) : getJson('/api/company');
}

export async function fetchClient() {
  return USE_STATIC_DATA ? Promise.resolve(mockClient) : getJson('/api/client');
}

export async function fetchInvoiceMeta() {
  return USE_STATIC_DATA ? Promise.resolve(mockInvoiceMeta) : getJson('/api/invoice-meta');
}

export async function fetchProducts() {
  return USE_STATIC_DATA ? Promise.resolve(mockProducts) : getJson('/api/products');
}

export async function fetchSignatory() {
  return USE_STATIC_DATA ? Promise.resolve(mockSignatory) : getJson('/api/signatory');
}

export function getProductColumnDefinitions() {
  // Column definitions stay client-side even after API integration —
  // they describe how the designer renders data, not the data itself.
  return productColumnDefinitions;
}

export async function fetchAllInvoiceData() {
  const [company, client, invoiceMeta, products, signatory] = await Promise.all([
    fetchCompany(),
    fetchClient(),
    fetchInvoiceMeta(),
    fetchProducts(),
    fetchSignatory(),
  ]);
  return { company, client, invoiceMeta, products, signatory };
}
