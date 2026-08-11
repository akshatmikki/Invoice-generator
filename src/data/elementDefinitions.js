/**
 * Every draggable "block" the layman can place on the invoice.
 * `allowedZones` restricts where an element may land (e.g. the product
 * table only makes sense in the Main area) — if dropped outside its
 * allowed zone it gets nudged into the nearest valid one.
 * `defaultWidth`/`defaultHeight` (px, on the fixed A4 page) are the
 * starting box size; width is user-resizable afterward via the drag
 * handle on the element's right edge. Height grows automatically with
 * content.
 */
export const ELEMENT_TYPES = {
  LOGO: 'LOGO',
  COMPANY_INFO: 'COMPANY_INFO',
  CLIENT_INFO: 'CLIENT_INFO',
  SHIP_TO: 'SHIP_TO',
  BUYER_TO: 'BUYER_TO',
  INVOICE_META: 'INVOICE_META',
  ORDER_INFO_TABLE: 'ORDER_INFO_TABLE',
  PRODUCT_TABLE: 'PRODUCT_TABLE',
  TOTALS: 'TOTALS',
  CHART: 'CHART',
  TEXT_BLOCK: 'TEXT_BLOCK',
  IMAGE: 'IMAGE',
  SIGNATURE: 'SIGNATURE',
  DIVIDER: 'DIVIDER',
  CUSTOM_BLOCK: 'CUSTOM_BLOCK',
  SHAPE: 'SHAPE',
};

export const elementPalette = [
  {
    group: 'Branding',
    items: [
      { type: ELEMENT_TYPES.LOGO, label: 'Company Logo', hint: 'Upload your logo image', allowedZones: ['header'], defaultWidth: 150 },
      { type: ELEMENT_TYPES.IMAGE, label: 'Image', hint: 'Any image — banner, product photo, QR code', allowedZones: ['header', 'main', 'footer'], defaultWidth: 220 },
    ],
  },
  {
    group: 'Parties & Details',
    items: [
      { type: ELEMENT_TYPES.COMPANY_INFO, label: 'Your Company Details', hint: 'Name, address, email, tax ID', allowedZones: ['header', 'main'], defaultWidth: 260 },
      { type: ELEMENT_TYPES.CLIENT_INFO, label: 'Bill To (Client Details)', hint: 'Client name & billing address', allowedZones: ['header', 'main'], defaultWidth: 260 },
      { type: ELEMENT_TYPES.SHIP_TO, label: 'Ship To (Shipping Details)', hint: 'Shipping name & address', allowedZones: ['header', 'main'], defaultWidth: 260 },
      { type: ELEMENT_TYPES.BUYER_TO, label: 'Buyer To (Buyer Details)', hint: 'Buyer name & address', allowedZones: ['header', 'main'], defaultWidth: 260 },
      { type: ELEMENT_TYPES.INVOICE_META, label: 'Invoice Info', hint: 'Invoice #, date, due date, PO #', allowedZones: ['header', 'main'], defaultWidth: 240 },
      { type: ELEMENT_TYPES.ORDER_INFO_TABLE, label: 'Order / Shipment Info Table', hint: 'Order #, dates, truck/driver/trailer/carrier, shipper & consignee', allowedZones: ['main'], defaultWidth: 750 },
    ],
  },
  {
    group: 'Products & Pricing',
    items: [
      { type: ELEMENT_TYPES.PRODUCT_TABLE, label: 'Product Table', hint: 'Pick items & columns; totals calculate automatically', allowedZones: ['main'], defaultWidth: 700 },
      { type: ELEMENT_TYPES.TOTALS, label: 'Totals & Calculation', hint: 'Subtotal, discount, tax, grand total', allowedZones: ['main', 'footer'], defaultWidth: 320 },
      { type: ELEMENT_TYPES.CHART, label: 'Chart / Query Builder', hint: 'Filter, group & chart product data — bar, line, pie or donut', allowedZones: ['main', 'footer'], defaultWidth: 500 },
    ],
  },
  {
    group: 'Text & Approval',
    items: [
      { type: ELEMENT_TYPES.TEXT_BLOCK, label: 'Text Block', hint: 'Notes, terms, thank-you message', allowedZones: ['header', 'main', 'footer'], defaultWidth: 300 },
      { type: ELEMENT_TYPES.SIGNATURE, label: 'Signature / Stamp', hint: 'Upload a signature or stamp image', allowedZones: ['main', 'footer'], defaultWidth: 180 },
      { type: ELEMENT_TYPES.DIVIDER, label: 'Divider Line', hint: 'Visually separate sections', allowedZones: ['header', 'main', 'footer'], defaultWidth: 700 },
    ],
  },
  {
    group: 'Custom',
    items: [
      { type: ELEMENT_TYPES.CUSTOM_BLOCK, label: 'Custom Block', hint: 'Blank block — add your own title and fields', allowedZones: ['header', 'main', 'footer'], defaultWidth: 260 },
      { type: ELEMENT_TYPES.SHAPE, label: 'Shape', hint: 'Rectangle, circle, triangle or line — fully customizable fill, border, corners, rotation & opacity', allowedZones: ['header', 'main', 'footer'], defaultWidth: 160, defaultHeight: 120 },
    ],
  },
];

export function findPaletteDefinition(type) {
  for (const group of elementPalette) {
    const found = group.items.find((i) => i.type === type);
    if (found) return found;
  }
  return null;
}

export function defaultWidthFor(type) {
  return findPaletteDefinition(type)?.defaultWidth ?? 260;
}

/** Most elements auto-fit their height to content (null = auto); a few (like Shape) need an explicit starting height. */
export function defaultHeightFor(type) {
  return findPaletteDefinition(type)?.defaultHeight ?? null;
}

/** Default per-instance settings created when an element is dropped on the canvas. */
export function createDefaultElementData(type) {
  switch (type) {
    case ELEMENT_TYPES.PRODUCT_TABLE:
      return {
        selectedProductIds: [],
        visibleColumns: ['name', 'qty', 'unitPrice', 'unit', 'taxPercent', 'amount'],
        tableStyle: {},
      };
    case ELEMENT_TYPES.ORDER_INFO_TABLE:
      return { selectedRowIds: [], visibleColumns: ['label', 'value'], tableStyle: {} };
    case ELEMENT_TYPES.TOTALS:
      return { extraDiscountPercent: 0, extraTaxPercent: 0, showBreakdown: true, totalColumns: [], extraLines: [], formulaLines: [] };
    case ELEMENT_TYPES.CHART:
      return {
        title: 'Spend by Category',
        conditions: [],
        groupByField: 'category',
        metricField: 'unitPrice',
        aggFn: 'sum',
        chartType: 'bar',
      };
    case ELEMENT_TYPES.TEXT_BLOCK:
      return { text: 'Click to edit this text…', align: 'left', styles: { text: { fontSize: 14 } } };
    case ELEMENT_TYPES.IMAGE:
      return { imageData: null, caption: '', styles: {} };
    case ELEMENT_TYPES.LOGO:
      return { imageData: null };
    case ELEMENT_TYPES.SIGNATURE:
      return { imageData: null, label: 'Authorized Signatory', styles: {} };
    case ELEMENT_TYPES.DIVIDER:
      return { style: 'solid' };
    case ELEMENT_TYPES.CUSTOM_BLOCK:
      return { title: 'Custom Block', items: [] };
    case ELEMENT_TYPES.SHAPE:
      return { shapeType: 'rectangle', fill: '#4d6bea', stroke: '#1f2733', strokeWidth: 1, borderRadius: 6, rotation: 0, opacity: 100, shadow: false };
    default:
      return {};
  }
}
