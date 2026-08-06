import { AGGREGATIONS, NUMERIC_FIELDS, QUERYABLE_FIELDS, runQuery } from '../../utils/query';
import { BarChartSVG, LineChartSVG, PieChartSVG } from '../charts/SimpleCharts';

function formatMetricValue(metricField, value, currencySymbol) {
  if (metricField === 'unitPrice') return `${currencySymbol}${value.toLocaleString('en-IN')}`;
  if (metricField === 'discountPercent' || metricField === 'taxPercent') return `${value}%`;
  return `${value}`;
}

export function ChartElement({ data, products, currencySymbol }) {
  const conditions = data.conditions || [];

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
      {data.title && <div className="chart-title">{data.title}</div>}

      {rows.length === 0 ? (
        <div className="empty-hint">No matching products — select this block and adjust the filters in the panel on the right.</div>
      ) : (
        <>
          <ChartComponent rows={rows} valueLabelFn={valueLabelFn} donut={data.chartType === 'donut'} />
          <p className="el-footnote" data-html2canvas-ignore="true">
            {AGGREGATIONS.find((a) => a.key === data.aggFn)?.label} of {NUMERIC_FIELDS.find((f) => f.key === data.metricField)?.label} by{' '}
            {QUERYABLE_FIELDS.find((f) => f.key === data.groupByField)?.label} · select to edit
          </p>
        </>
      )}
    </div>
  );
}
