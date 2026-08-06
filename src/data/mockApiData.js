/**
 * STATIC MOCK DATA
 * ------------------------------------------------------------------
 * This file stands in for the .NET API described in the BRD.
 * Every field here is shaped exactly the way the real API response
 * is expected to look (see BRD section 6.2 "API Contract").
 *
 * This is also the app's starting sample invoice — an Oman-style Tax
 * Invoice (VATIN, OMR, "for <company> / Authorised Signatory"). Every
 * field the layman sees on the canvas (company, buyer, invoice details,
 * line items) is editable straight from the page — this file only sets
 * the values shown the first time the app opens.
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
  name: 'Ali & Co',
  addressLine1: 'West Gate, High Street',
  addressLine2: 'Muscat',
  email: '',
  phone: '',
  website: '',
  taxId: 'VATIN : AA1234567890',
  logoUrl: null, // layman uploads this via the Image Upload panel
};

export const mockClient = {
  id: 'client-001',
  name: 'Max Enterprises',
  billingAddress: 'Centre Point Mall, New Street, Muscat',
  shippingAddress: 'Centre Point Mall, New Street, Muscat',
  email: '',
  phone: '',
  country: 'Sultanate of Oman',
  taxId: 'AS0987654321',
  placeOfSupply: 'Sultanate of Oman',
};

export const mockInvoiceMeta = {
  invoiceNumber: '1',
  invoiceDate: '11-Nov-21',
  dueDate: '',
  poNumber: '',
  paymentTerms: '',
  currency: 'OMR',
  currencySymbol: '',
  currencyDecimals: 3,
  // Extra dispatch/reference fields shown on a Tally-style tax invoice header —
  // all optional, blank ones simply render an empty value the layman can fill in.
  deliveryNote: '',
  modeOfPayment: '',
  supplierRef: '',
  otherReference: '',
  buyersOrderNo: '',
  buyersOrderDate: '',
  despatchDocNo: '',
  deliveryNoteDate: '',
  despatchedThrough: '',
  destination: '',
  termsOfDelivery: '',
};

/**
 * Products / line items — this is what the "layman" checks on/off
 * inside the Product Table element and what drives the calculation
 * engine (see src/utils/calculations.js). Quantity, rate, discount and
 * tax are editable straight from the invoice table on the canvas.
 */
export const mockProducts = [
  { id: 'p1', sku: '', name: 'Product', description: '', category: '', qty: 10, unit: 'Nos', unitPrice: 350, discountPercent: 0, taxPercent: 5 },
];

export const mockSignatory = {
  name: '',
  designation: 'Authorised Signatory',
  stampUrl: null, // layman uploads this via the Signature/Stamp element
};

/** Column metadata the Product Table element uses to build its column toggles. */
export const productColumnDefinitions = [
  { key: 'sku', label: 'SKU', defaultOn: false, numeric: false },
  { key: 'name', label: 'Description of Goods', defaultOn: true, numeric: false },
  { key: 'description', label: 'Description', defaultOn: false, numeric: false },
  { key: 'category', label: 'Category', defaultOn: false, numeric: false },
  { key: 'qty', label: 'Quantity', defaultOn: true, numeric: true },
  { key: 'unitPrice', label: 'Rate', defaultOn: true, numeric: true },
  { key: 'unit', label: 'Per', defaultOn: false, numeric: false },
  { key: 'discountPercent', label: 'Discount %', defaultOn: false, numeric: true },
  { key: 'taxPercent', label: 'VAT %', defaultOn: true, numeric: true },
  { key: 'amount', label: 'Amount', defaultOn: true, computed: true, numeric: true },
  { key: 'lineTotal', label: 'Line Total (incl. tax)', defaultOn: false, computed: true, numeric: true },
];
