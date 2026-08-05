import { useDesigner, findElement } from '../context/DesignerContext';
import { ELEMENT_TYPES, findPaletteDefinition } from '../data/elementDefinitions';

export function PropertiesPanel() {
  const { elements, selectedElementId, updateElementData, resizeElement, removeElement } = useDesigner();

  if (!selectedElementId) {
    return (
      <aside className="properties">
        <div className="properties__title">Properties</div>
        <p className="properties__empty">Select an element on the page to edit its style, or drag its right edge to resize.</p>
      </aside>
    );
  }

  const element = findElement(elements, selectedElementId);
  if (!element) return null;
  const paletteDef = findPaletteDefinition(element.type);
  const onChange = (patch) => updateElementData(element.instanceId, patch);

  return (
    <aside className="properties">
      <div className="properties__title">Properties</div>
      <div className="properties__type">{paletteDef?.label || element.type}</div>

      <div className="properties__controls">
        <label>
          Width ({Math.round(element.width)}px)
          <input
            type="range"
            min="60"
            max="760"
            value={element.width}
            onChange={(e) => resizeElement(element.instanceId, Number(e.target.value))}
          />
        </label>
        <p className="properties__hint">
          You can also drag the handle on the element's right edge directly on the page, or grab its top
          bar to move it anywhere — including next to another element in the same row.
        </p>
      </div>

      {element.type === ELEMENT_TYPES.TEXT_BLOCK && (
        <div className="properties__controls">
          <label>
            Alignment
            <select value={element.data.align} onChange={(e) => onChange({ align: e.target.value })}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label>
            Font size
            <input
              type="range"
              min="10"
              max="28"
              value={element.data.fontSize}
              onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            />
          </label>
          <label className="properties__checkbox">
            <input type="checkbox" checked={element.data.bold} onChange={(e) => onChange({ bold: e.target.checked })} />
            Bold
          </label>
        </div>
      )}

      {element.type === ELEMENT_TYPES.PRODUCT_TABLE && (
        <p className="properties__hint">Tip: click the table on the page to pick products and columns.</p>
      )}

      {element.type === ELEMENT_TYPES.TOTALS && (
        <p className="properties__hint">Tip: click the totals block on the page to set extra discount/tax.</p>
      )}

      {element.type === ELEMENT_TYPES.CHART && (
        <p className="properties__hint">Tip: click the chart on the page to edit filters, grouping, measure and chart type.</p>
      )}

      <button className="properties__delete" onClick={() => removeElement(element.instanceId)}>
        Delete this element
      </button>
    </aside>
  );
}
