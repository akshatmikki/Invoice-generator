/**
 * STATIC MOCK DATA
 * ------------------------------------------------------------------
 * This file stands in for the .NET API described in the BRD.
 * Every field here is shaped exactly the way the real API response
 * is expected to look (see BRD section 6.2 "API Contract").
 *
 * WHEN THE REAL API IS READY:
 *   1. Open src/data/apiClient.js
 *   2. Flip USE_STATIC_DATA to false and set API_BASE_URL
 *   3. Nothing else in the app needs to change — every component
 *      reads data through apiClient.js, never from this file directly.
 * ------------------------------------------------------------------
 */

export const mockCompany = {
  id: 'company-001',
  name: 'Northwind Traders Pvt. Ltd.',
  addressLine1: '221B Commerce Street',
  addressLine2: 'Andheri East, Mumbai, MH 400069',
  email: 'billing@northwindtraders.com',
  phone: '+91 98765 43210',
  website: 'www.northwindtraders.com',
  taxId: 'GSTIN: 27ABCDE1234F1Z5',
  logoUrl: null, // layman uploads this via the Image Upload panel
};

export const mockClient = {
  id: 'client-001',
  name: 'Bluepeak Retail Group',
  billingAddress: '48 Harbor View Road, Pune, MH 411001',
  shippingAddress: '48 Harbor View Road, Pune, MH 411001',
  email: 'accounts@bluepeakretail.com',
  phone: '+91 91234 56789',
};

export const mockInvoiceMeta = {
  invoiceNumber: 'INV-2026-0142',
  invoiceDate: '2026-08-02',
  dueDate: '2026-08-16',
  poNumber: 'PO-7734',
  paymentTerms: 'Net 14 days',
  currency: 'INR',
  currencySymbol: '₹',
};

/**
 * Products / line items — this is what the "layman" checks on/off
 * inside the Product Table element and what drives the calculation
 * engine (see src/utils/calculations.js).
 */
export const mockProducts = [
  { id: 'p1', sku: 'NW-1001', name: 'Wireless Barcode Scanner', description: 'Handheld 2D scanner, USB dock included', category: 'Hardware', qty: 4, unitPrice: 2450, discountPercent: 5, taxPercent: 18 },
  { id: 'p2', sku: 'NW-1002', name: 'Thermal Receipt Printer', description: '80mm, USB + Bluetooth', category: 'Hardware', qty: 2, unitPrice: 5200, discountPercent: 0, taxPercent: 18 },
  { id: 'p3', sku: 'NW-1003', name: 'POS Cash Drawer', description: '5-bill / 8-coin tray, RJ11', category: 'Hardware', qty: 2, unitPrice: 3100, discountPercent: 0, taxPercent: 18 },
  { id: 'p4', sku: 'NW-1004', name: 'Label Roll (Pack of 10)', description: '40x25mm direct thermal labels', category: 'Consumables', qty: 10, unitPrice: 180, discountPercent: 10, taxPercent: 12 },
  { id: 'p5', sku: 'NW-1005', name: 'Annual Support Plan', description: 'On-site service, 4 visits/year', category: 'Services', qty: 1, unitPrice: 12000, discountPercent: 0, taxPercent: 18 },
  { id: 'p6', sku: 'NW-1006', name: 'Cash Register Ribbon', description: 'Pack of 5, purple ink', category: 'Consumables', qty: 6, unitPrice: 95, discountPercent: 0, taxPercent: 12 },
];

export const mockSignatory = {
  name: 'Aarav Mehta',
  designation: 'Accounts Manager',
  stampUrl: null, // layman uploads this via the Signature/Stamp element
};

/** Column metadata the Product Table element uses to build its column toggles. */
export const productColumnDefinitions = [
  { key: 'sku', label: 'SKU', defaultOn: false, numeric: false },
  { key: 'name', label: 'Item', defaultOn: true, numeric: false },
  { key: 'description', label: 'Description', defaultOn: true, numeric: false },
  { key: 'category', label: 'Category', defaultOn: false, numeric: false },
  { key: 'qty', label: 'Qty', defaultOn: true, numeric: true },
  { key: 'unitPrice', label: 'Unit Price', defaultOn: true, numeric: true },
  { key: 'discountPercent', label: 'Discount %', defaultOn: false, numeric: true },
  { key: 'taxPercent', label: 'Tax %', defaultOn: false, numeric: true },
  { key: 'lineTotal', label: 'Line Total', defaultOn: true, computed: true, numeric: true },
];
