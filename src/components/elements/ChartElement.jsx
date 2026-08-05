import { v4 as uuid } from 'uuid';
import { QUERYABLE_FIELDS, NUMERIC_FIELDS, OPERATORS, AGGREGATIONS, fieldType, runQuery } from '../../utils/query';
import { BarChartSVG, LineChartSVG, PieChartSVG } from '../charts/SimpleCharts';

const CHART_TYPES = [
  { key: 'bar', label: 'Bar' },
  { key: 'line', label: 'Line' },
  { key: 'pie', label: 'Pie' },
  { key: 'donut', label: 'Donut' },
];

function formatMetricValue(metricField, value, currencySymbol) {
  if (metricField === 'unitPrice') return `${currencySymbol}${value.toLocaleString('en-IN')}`;
  if (metricField === 'discountPercent' || metricField === 'taxPercent') return `${value}%`;
  return `${value}`;
}

export function ChartElement({ data, products, currencySymbol, onChange, isEditing }) {
  const conditions = data.conditions || [];

  const addCondition = () => {
    const firstField = QUERYABLE_FIELDS[0];
    onChange({
      conditions: [
        ...conditions,
        { id: uuid(), field: firstField.key, operator: OPERATORS[firstField.type][0].key, value: '' },
      ],
    });
  };

  const updateCondition = (id, patch) => {
    onChange({
      conditions: conditions.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, ...patch };
        // If the field changed, reset the operator to a valid one for the new type
        if (patch.field) {
          const type = fieldType(patch.field);
          next.operator = OPERATORS[type][0].key;
          next.value = '';
        }
        return next;
      }),
    });
  };

  const removeCondition = (id) => {
    onChange({ conditions: conditions.filter((c) => c.id !== id) });
  };

  const rows = runQuery(products, {
    conditions,
    groupByField: data.groupByField,
    metricField: data.metricField,
    aggFn: data.aggFn,
  });

  const valueLabelFn = (v) => formatMetricValue(data.metricField, v, currencySymbol);
  const ChartComponent =
    data.chartType === 'line' ? LineChartSVG : data.chartType === 'pie' || data.chartType === 'donut' ? PieChartSVG : BarChartSVG;

  return (
    <div className="el el--chart">
      {isEditing && (
        <div className="query-builder">
          <label className="query-builder__title-input">
            Chart title
            <input type="text" value={data.title} onChange={(e) => onChange({ title: e.target.value })} />
          </label>

          <div className="query-builder__section-title">Filter products (optional)</div>
          <p className="product-picker__note">
            Build conditions against the API's product data. Only matching products feed the chart —
            the underlying numbers themselves are never edited here.
          </p>
          {conditions.map((cond) => {
            const type = fieldType(cond.field);
            return (
              <div key={cond.id} className="query-row">
                <select value={cond.field} onChange={(e) => updateCondition(cond.id, { field: e.target.value })}>
                  {QUERYABLE_FIELDS.map((f) => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>
                <select value={cond.operator} onChange={(e) => updateCondition(cond.id, { operator: e.target.value })}>
                  {OPERATORS[type].map((op) => (
                    <option key={op.key} value={op.key}>{op.label}</option>
                  ))}
                </select>
                <input
                  type={type === 'number' ? 'number' : 'text'}
                  value={cond.value}
                  placeholder="value…"
                  onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                />
                <button type="button" className="query-row__remove" onClick={() => removeCondition(cond.id)}>✕</button>
              </div>
            );
          })}
          <button type="button" className="query-builder__add" onClick={addCondition}>+ Add condition</button>

          <div className="query-builder__section-title">Group &amp; measure</div>
          <div className="query-builder__grid">
            <label>
              Group by
              <select value={data.groupByField} onChange={(e) => onChange({ groupByField: e.target.value })}>
                {QUERYABLE_FIELDS.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </label>
            <label>
              Measure
              <select value={data.metricField} onChange={(e) => onChange({ metricField: e.target.value })}>
                {NUMERIC_FIELDS.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </label>
            <label>
              Aggregate
              <select value={data.aggFn} onChange={(e) => onChange({ aggFn: e.target.value })}>
                {AGGREGATIONS.map((a) => (
                  <option key={a.key} value={a.key}>{a.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="query-builder__section-title">Chart type</div>
          <div className="query-builder__chips">
            {CHART_TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`chip ${data.chartType === t.key ? 'chip--active' : ''}`}
                onClick={() => onChange({ chartType: t.key })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {data.title && <div className="chart-title">{data.title}</div>}

      {rows.length === 0 ? (
        <div className="empty-hint">
          No matching products — {isEditing ? 'adjust the filter conditions above.' : 'click this block to edit the query.'}
        </div>
      ) : (
        <>
          <ChartComponent rows={rows} valueLabelFn={valueLabelFn} donut={data.chartType === 'donut'} />
          {!isEditing && (
            <p className="el-footnote" data-html2canvas-ignore="true">
              {AGGREGATIONS.find((a) => a.key === data.aggFn)?.label} of {NUMERIC_FIELDS.find((f) => f.key === data.metricField)?.label} by{' '}
              {QUERYABLE_FIELDS.find((f) => f.key === data.groupByField)?.label} · click to edit query
            </p>
          )}
        </>
      )}
    </div>
  );
}
