/**
 * Query builder engine for the Chart element.
 * Pure functions only — filter -> group -> aggregate -> chart-ready rows.
 */

/** Fields the layman can build a query against. Keep this list in sync with the product shape. */
export const QUERYABLE_FIELDS = [
  { key: 'category', label: 'Category', type: 'string' },
  { key: 'name', label: 'Item Name', type: 'string' },
  { key: 'sku', label: 'SKU', type: 'string' },
  { key: 'qty', label: 'Quantity', type: 'number' },
  { key: 'unitPrice', label: 'Unit Price', type: 'number' },
  { key: 'discountPercent', label: 'Discount %', type: 'number' },
  { key: 'taxPercent', label: 'Tax %', type: 'number' },
  { key: 'weight', label: 'Weight', type: 'number' },
  { key: 'valueOfGoods', label: 'Value of Goods', type: 'number' },
  { key: 'equipmentType', label: 'Equipment Type', type: 'string' },
];

/** Only numeric fields make sense as a chart's measured value. */
export const NUMERIC_FIELDS = QUERYABLE_FIELDS.filter((f) => f.type === 'number');

export const OPERATORS = {
  string: [
    { key: 'equals', label: 'is' },
    { key: 'contains', label: 'contains' },
    { key: 'not_equals', label: 'is not' },
  ],
  number: [
    { key: 'eq', label: '=' },
    { key: 'neq', label: '≠' },
    { key: 'gt', label: '>' },
    { key: 'gte', label: '≥' },
    { key: 'lt', label: '<' },
    { key: 'lte', label: '≤' },
  ],
};

export const AGGREGATIONS = [
  { key: 'sum', label: 'Sum' },
  { key: 'avg', label: 'Average' },
  { key: 'count', label: 'Count' },
  { key: 'min', label: 'Minimum' },
  { key: 'max', label: 'Maximum' },
];

export function fieldType(key) {
  return QUERYABLE_FIELDS.find((f) => f.key === key)?.type || 'string';
}

/** Applies every condition with AND logic. A condition with an empty value is skipped (not yet complete). */
export function applyFilters(products, conditions) {
  const active = (conditions || []).filter((c) => c.field && c.operator && c.value !== '' && c.value !== undefined);
  if (active.length === 0) return products;

  return products.filter((product) =>
    active.every((cond) => {
      const raw = product[cond.field];
      const type = fieldType(cond.field);

      if (type === 'number') {
        const a = Number(raw);
        const b = Number(cond.value);
        switch (cond.operator) {
          case 'eq': return a === b;
          case 'neq': return a !== b;
          case 'gt': return a > b;
          case 'gte': return a >= b;
          case 'lt': return a < b;
          case 'lte': return a <= b;
          default: return true;
        }
      }

      const a = String(raw ?? '').toLowerCase();
      const b = String(cond.value).toLowerCase();
      switch (cond.operator) {
        case 'equals': return a === b;
        case 'not_equals': return a !== b;
        case 'contains': return a.includes(b);
        default: return true;
      }
    })
  );
}

/** Groups filtered products by groupField, then aggregates metricField within each group. */
export function groupAndAggregate(products, groupField, metricField, aggFn) {
  const groups = new Map();
  products.forEach((p) => {
    const key = String(p[groupField] ?? 'Unlabeled');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  });

  const rows = [...groups.entries()].map(([label, items]) => {
    const values = items.map((i) => Number(i[metricField]) || 0);
    let value;
    switch (aggFn) {
      case 'sum': value = values.reduce((a, b) => a + b, 0); break;
      case 'avg': value = values.reduce((a, b) => a + b, 0) / values.length; break;
      case 'count': value = values.length; break;
      case 'min': value = Math.min(...values); break;
      case 'max': value = Math.max(...values); break;
      default: value = 0;
    }
    return { label, value: Math.round(value * 100) / 100, count: items.length };
  });

  return rows.sort((a, b) => b.value - a.value);
}

/** Full pipeline: raw products -> filtered -> grouped & aggregated chart rows. */
export function runQuery(products, { conditions, groupByField, metricField, aggFn }) {
  const filtered = applyFilters(products, conditions);
  if (filtered.length === 0) return [];
  return groupAndAggregate(filtered, groupByField, metricField, aggFn);
}
