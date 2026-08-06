import { v4 as uuid } from 'uuid';
import { ELEMENT_TYPES } from './elementDefinitions';

/**
 * The invoice shown the moment the app opens — an Oman-style Tax Invoice
 * matching the sample data in mockApiData.js. Every block placed here is a
 * normal canvas element: click to edit, drag to move, drag the right edge
 * to resize, same as anything dragged in from the palette.
 */
export function createDefaultTemplateElements() {
  const el = (type, zone, x, y, width, data = {}) => ({
    instanceId: uuid(),
    type,
    zone,
    x,
    y,
    width,
    data,
  });

  const textBlock = (align, fontSize, bold, text) => ({ text, align, styles: { text: { fontSize, bold } } });

  return [
    el(ELEMENT_TYPES.TEXT_BLOCK, 'header', 0, 10, 794, textBlock('center', 22, true, 'Tax Invoice')),
    el(ELEMENT_TYPES.COMPANY_INFO, 'header', 24, 50, 340),
    el(ELEMENT_TYPES.INVOICE_META, 'header', 404, 50, 370),
    el(ELEMENT_TYPES.CLIENT_INFO, 'main', 24, 170, 360),
    el(ELEMENT_TYPES.PRODUCT_TABLE, 'main', 24, 430, 750, {
      selectedProductIds: ['p1'],
      visibleColumns: ['name', 'qty', 'unitPrice', 'unit', 'taxPercent', 'amount'],
    }),
    el(
      ELEMENT_TYPES.TEXT_BLOCK,
      'main',
      24,
      560,
      430,
      textBlock('left', 12, false, 'Amount Chargeable (in words)\nOmani Rial Three Thousand Six Hundred Seventy Five Only (OMR 3,675.000)')
    ),
    el(ELEMENT_TYPES.TOTALS, 'main', 474, 560, 300, {
      extraDiscountPercent: 0,
      extraTaxPercent: 0,
      showBreakdown: true,
      totalColumns: [],
    }),
    el(
      ELEMENT_TYPES.TEXT_BLOCK,
      'main',
      24,
      650,
      430,
      textBlock('left', 12, false, 'VAT Amount (in words)\nOmani Rial One Hundred Seventy Five Only (OMR 175.000)')
    ),
    el(ELEMENT_TYPES.DIVIDER, 'main', 24, 760, 750, { style: 'solid' }),
    el(
      ELEMENT_TYPES.TEXT_BLOCK,
      'main',
      24,
      780,
      460,
      textBlock('left', 10.5, false, 'Declaration\nWe declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.')
    ),
    el(ELEMENT_TYPES.TEXT_BLOCK, 'main', 560, 780, 210, textBlock('right', 12, true, 'for Ali & Co')),
    el(ELEMENT_TYPES.SIGNATURE, 'main', 560, 900, 210, {
      imageData: null,
      label: 'Authorised Signatory',
      styles: {},
    }),
    el(ELEMENT_TYPES.TEXT_BLOCK, 'footer', 0, 1085, 794, textBlock('center', 10, false, 'This is a Computer Generated Invoice')),
  ];
}
