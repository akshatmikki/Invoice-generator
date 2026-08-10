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

/**
 * "Info block" shape shared by Company Info, Bill To, Ship To, Buyer To
 * and Invoice Info: a title plus a freely add/remove-able list of
 * { id, label, value } fields — same row shape as mockOrderInfoItems, so
 * every one of these blocks supports the same +/✕ editing in the panel.
 */
export const mockCompanyInfo = {
  title: '',
  items: [
    { id: 'ci1', label: 'Name', value: 'Ali & Co' },
    { id: 'ci2', label: 'Address Line 1', value: 'West Gate, High Street' },
    { id: 'ci3', label: 'Address Line 2', value: 'Muscat' },
    { id: 'ci4', label: 'Email', value: '' },
    { id: 'ci5', label: 'Phone', value: '' },
    { id: 'ci6', label: 'Tax ID / VATIN', value: 'VATIN : AA1234567890' },
  ],
};

export const mockBillTo = {
  title: 'Buyer',
  items: [
    { id: 'bt1', label: 'Name', value: 'Max Enterprises' },
    { id: 'bt2', label: 'Billing Address', value: 'Centre Point Mall, New Street, Muscat' },
    { id: 'bt3', label: 'Email', value: '' },
    { id: 'bt4', label: 'Phone', value: '' },
    { id: 'bt5', label: 'Country', value: 'Sultanate of Oman' },
    { id: 'bt6', label: 'VATIN', value: 'AS0987654321' },
    { id: 'bt7', label: 'Place of Supply', value: 'Sultanate of Oman' },
  ],
};

/** Same shape as Bill To — seeded from the client's shipping address. */
export const mockShipTo = {
  title: 'Ship To',
  items: [
    { id: 'st1', label: 'Name', value: 'Max Enterprises' },
    { id: 'st2', label: 'Shipping Address', value: 'Centre Point Mall, New Street, Muscat' },
    { id: 'st3', label: 'Email', value: '' },
    { id: 'st4', label: 'Phone', value: '' },
    { id: 'st5', label: 'Country', value: 'Sultanate of Oman' },
  ],
};

/** Same shape as Bill To — a distinct buyer entity, blank by default until filled in. */
export const mockBuyerTo = {
  title: 'Buyer To',
  items: [
    { id: 'by1', label: 'Name', value: '' },
    { id: 'by2', label: 'Address', value: '' },
    { id: 'by3', label: 'Email', value: '' },
    { id: 'by4', label: 'Phone', value: '' },
  ],
};

/** Tally-style tax invoice header fields — rendered two-per-row. Add/remove-able like the other info blocks. */
export const mockInvoiceMetaInfo = {
  title: 'Invoice Info',
  items: [
    { id: 'im1', label: 'Invoice No.', value: '1' },
    { id: 'im2', label: 'Dated', value: '11-Nov-21' },
    { id: 'im3', label: 'Delivery Note', value: '' },
    { id: 'im4', label: 'Mode/Terms of Payment', value: '' },
    { id: 'im5', label: "Supplier's Ref.", value: '' },
    { id: 'im6', label: 'Other Reference(s)', value: '' },
    { id: 'im7', label: "Buyer's Order No.", value: '' },
    { id: 'im8', label: 'Dated', value: '' },
    { id: 'im9', label: 'Despatch Document No.', value: '' },
    { id: 'im10', label: 'Delivery Note Date', value: '' },
    { id: 'im11', label: 'Despatched through', value: '' },
    { id: 'im12', label: 'Destination', value: '' },
    { id: 'im13', label: 'Terms of Delivery', value: '' },
  ],
};

/** Currency settings the calculation engine relies on — not part of the add/remove field list. */
export const mockInvoiceMeta = {
  currency: 'OMR',
  currencySymbol: '',
  currencyDecimals: 3,
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

/**
 * Flat list of fields pulled from the freight/order + invoice API payload (order header, customer,
 * pickup/delivery locations, carrier/driver, invoice totals). Offered as "Insert from data" options
 * next to each Info block's Value field, so a field can be filled from real order data instead of
 * typed by hand. `group` controls which optgroup a field is listed under in that dropdown.
 */
export const mockOrderSourceFields = [
  { key: 'customername', label: 'Customer Name', value: 'ALLIANCE TRANSPORT LTD.', group: 'Order & Invoice' },
  { key: 'customerphone', label: 'Customer Phone', value: '(999) 999-9999', group: 'Order & Invoice' },
  { key: 'customerordernumber', label: "Customer's Order No.", value: 'fgr546', group: 'Order & Invoice' },
  { key: 'ordernumber', label: 'Order #', value: 'MRP3349', group: 'Order & Invoice' },
  { key: 'invoicenumber', label: 'Invoice Number', value: 'AIN12101', group: 'Order & Invoice' },
  { key: 'invoicedate', label: 'Invoice Date', value: '8/8/2026', group: 'Order & Invoice' },
  { key: 'duedate', label: 'Due Date', value: '8/8/2026', group: 'Order & Invoice' },
  { key: 'currencycode', label: 'Currency', value: 'CAD', group: 'Order & Invoice' },
  { key: 'totalamount', label: 'Total Amount', value: '6567.0000', group: 'Order & Invoice' },
  { key: 'trucknumbers', label: 'Truck Number', value: '007rtrtr', group: 'Order & Invoice' },
  { key: 'trailernumbers', label: 'Trailer Number', value: '33243', group: 'Order & Invoice' },
  { key: 'drivernames', label: 'Driver Name(s)', value: 'Nitin khanna, Rajnish Kumar', group: 'Order & Invoice' },
  { key: 'carriername', label: 'Carrier Name', value: 'Ontoria', group: 'Order & Invoice' },
  { key: 'factoringcompanyname', label: 'Factoring Company', value: 'Avaal technology', group: 'Order & Invoice' },
  { key: 'pickuplocationname', label: 'Pickup Location', value: 'YAZAKI NORTH AMERICA', group: 'Locations' },
  { key: 'pickupfulladdress', label: 'Pickup Full Address', value: '800 WILSON AVENUE, KITCHENER, ON, N2C0A2, Canada', group: 'Locations' },
  { key: 'deliverylocationname', label: 'Delivery Location', value: 'ZEBRA PAPER', group: 'Locations' },
  { key: 'deliveryfulladdress', label: 'Delivery Full Address', value: '5130 CREEKBANK ROAD, MISSISSAUGA, ON, L4W2G2, Canada', group: 'Locations' },
];

/**
 * Shipment/commodity records pulled from the freight order API's commodity details. Offered as
 * "Insert from data" options on a Product Table line item — picking one fills that row's name,
 * description, qty, weight, weight unit, equipment type, value of goods and hazmat flag at once.
 */
export const mockProductSourceRecords = [
  {
    key: 'mrp3354-shipment',
    label: 'MRP3354 — Shipment (LONDON DRUGS LTD, Reefer)',
    fields: {
      name: 'Shipment',
      description: 'Reefer shipment, Annacis Whse → London Drugs Ltd (Order MRP3354)',
      qty: 15,
      unit: '',
      weight: 26507,
      weightUnit: '',
      valueOfGoods: 0,
      equipmentType: 'Reefer',
      hazmat: false,
    },
  },
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
