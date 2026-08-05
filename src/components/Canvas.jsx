import { forwardRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useDesigner, ZONES, PAGE_WIDTH, PAGE_HEIGHT } from '../context/DesignerContext';
import { CanvasElement } from './CanvasElement';

export const Canvas = forwardRef(function Canvas(_, ref) {
  const { elements, selectElement } = useDesigner();
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-page' });

  return (
    <div className="canvas-scroll" onClick={() => selectElement(null)}>
      <div
        className={`canvas-paper ${isOver ? 'canvas-paper--over' : ''}`}
        ref={(node) => {
          ref.current = node;
          setNodeRef(node);
        }}
        id="invoice-paper"
        style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }}
      >
        {Object.values(ZONES).map((zone) => (
          <div
            key={zone.key}
            className="zone-stripe"
            data-html2canvas-ignore="true"
            style={{ top: zone.yMin, height: zone.yMax - zone.yMin }}
          >
            <span className="zone-stripe__label">{zone.label}</span>
          </div>
        ))}

        {elements.map((el) => (
          <CanvasElement key={el.instanceId} element={el} />
        ))}

        {elements.length === 0 && (
          <div className="canvas-paper__empty" data-html2canvas-ignore="true">
            Drag elements from the left panel anywhere on this page — drop two side by side to place them in the same row.
          </div>
        )}
      </div>
    </div>
  );
});
