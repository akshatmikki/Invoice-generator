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
 * Freight/TMS order & shipment fields — kept as their own dataset and their
 * own Order/Shipment Info Table element (see ELEMENT_TYPES) instead of being
 * crammed into the Tally-style Invoice Info box, matching how the sample
 * freight invoice PDF shows this data in its own table: order/trip
 * identifiers, dates, truck/driver/trailer/carrier, factoring company and
 * shipper/consignee. Structured exactly like mockProducts — one row per
 * item, checked on/off and edited the same way as Product Table line items —
 * so the Order/Shipment Info Table behaves like the Product Table.
 */
export const mockOrderInfoItems = [
  { id: 'oi1', label: 'Order #', value: 'MRP3349' },
  { id: 'oi2', label: 'Order Status', value: 'Delivered' },
  { id: 'oi3', label: 'Trip #', value: 'ETP4174' },
  { id: 'oi4', label: 'Ship Date', value: '07/30/2026' },
  { id: 'oi5', label: 'Delivery Date', value: '07/30/2026' },
  { id: 'oi6', label: 'Term', value: '' },
  { id: 'oi7', label: 'Amount', value: '286.00 (USD)' },
  { id: 'oi8', label: 'Cust. Order #', value: '74' },
  { id: 'oi9', label: 'Container #', value: '' },
  { id: 'oi10', label: 'Scale Ticket #', value: '' },
  { id: 'oi11', label: 'Truck No', value: '007rtrtr' },
  { id: 'oi12', label: 'Driver', value: 'Nitin khanna, Rajnish Kumar' },
  { id: 'oi13', label: 'Trailer No', value: '' },
  { id: 'oi14', label: 'Carrier', value: '' },
  { id: 'oi15', label: 'Factoring Company', value: 'ASAS' },
  { id: 'oi16', label: 'Order Notes', value: 'for test' },
  { id: 'oi17', label: 'Shipper', value: 'YAZAKI NORTH AMERICA' },
  { id: 'oi18', label: 'Shipper Address', value: '800 WILSON AVENUE, KITCHENER, ON, N2C0A2, Canada' },
  { id: 'oi19', label: 'Consignee', value: 'ZEBRA PAPER' },
  { id: 'oi20', label: 'Consignee Address', value: '5130 CREEKBANK ROAD, MISSISSAUGA, ON, L4W2G2, Canada' },
];

/** Column metadata the Order/Shipment Info Table element uses to build its column toggles — same shape as productColumnDefinitions. */
export const orderInfoColumnDefinitions = [
  { key: 'label', label: 'Field', defaultOn: true, numeric: false },
  { key: 'value', label: 'Value', defaultOn: true, numeric: false },
];

/**
 * Products / line items — this is what the "layman" checks on/off
 * inside the Product Table element and what drives the calculation
 * engine (see src/utils/calculations.js). Quantity, rate, discount and
 * tax are editable straight from the invoice table on the canvas.
 */
export const mockProducts = [
  {
    id: 'p1',
    sku: '',
    name: 'Product',
    description: '',
    category: '',
    qty: 10,
    unit: 'Nos',
    unitPrice: 350,
    discountPercent: 0,
    taxPercent: 5,
    // Commodity/shipment fields from the freight order API — one entry per line item.
    weight: null,
    weightUnit: '',
    valueOfGoods: 0,
    equipmentType: '',
    hazmat: false,
  },
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
  // Commodity/shipment columns from the freight order API's commodity details.
  { key: 'weight', label: 'Weight', defaultOn: false, numeric: true },
  { key: 'weightUnit', label: 'Weight Unit', defaultOn: false, numeric: false },
  { key: 'valueOfGoods', label: 'Value of Goods', defaultOn: false, numeric: true },
  { key: 'equipmentType', label: 'Equipment Type', defaultOn: false, numeric: false },
  { key: 'hazmat', label: 'Hazmat', defaultOn: false, numeric: false },
];
