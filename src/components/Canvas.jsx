import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useDesigner, getZones } from '../context/DesignerContext';
import { CanvasElement } from './CanvasElement';

function Page({ page, index, pageSettings, zones, registerNode, isOnly }) {
  const { selectElement, duplicatePage, removePage, clearPage } = useDesigner();
  const { setNodeRef, isOver } = useDroppable({ id: `canvas-page-${page.id}` });

  return (
    <div className="page-wrap">
      <div className="page-toolbar" data-html2canvas-ignore="true">
        <span className="page-toolbar__label">Page {index + 1}</span>
        <div className="page-toolbar__actions">
          <button onClick={() => duplicatePage(page.id)} title="Duplicate this page">⧉ Duplicate</button>
          <button onClick={() => { if (window.confirm('Clear all elements on this page?')) clearPage(page.id); }} title="Clear this page">Clear</button>
          <button
            onClick={() => { if (window.confirm('Delete this page? This cannot be undone.')) removePage(page.id); }}
            disabled={isOnly}
            title={isOnly ? "Can't delete the only page" : 'Delete this page'}
            className="page-toolbar__delete"
          >
            ✕ Delete
          </button>
        </div>
      </div>

      <div
        className={`canvas-paper ${isOver ? 'canvas-paper--over' : ''}`}
        ref={(node) => {
          registerNode(page.id, node);
          setNodeRef(node);
        }}
        style={{ width: pageSettings.width, height: pageSettings.height, backgroundColor: pageSettings.background || undefined }}
        onClick={() => selectElement(null)}
      >
        {Object.values(zones).map((zone) => (
          <div key={zone.key} className="zone-stripe" data-html2canvas-ignore="true" style={{ top: zone.yMin, height: zone.yMax - zone.yMin }}>
            <span className="zone-stripe__label">{zone.label}</span>
          </div>
        ))}

        {page.elements.map((el) => (
          <CanvasElement key={el.instanceId} element={el} pageElements={page.elements} />
        ))}

        {page.elements.length === 0 && (
          <div className="canvas-paper__empty" data-html2canvas-ignore="true">
            Drag elements from the left panel anywhere on this page — drop two side by side to place them in the same row.
          </div>
        )}
      </div>
    </div>
  );
}

export const Canvas = forwardRef(function Canvas(_, ref) {
  const { pages, pageSettings, addPage } = useDesigner();
  const nodeMap = useRef(new Map());

  useImperativeHandle(ref, () => ({
    getPageNode: (pageId) => nodeMap.current.get(pageId),
  }));

  const zones = getZones(pageSettings.height);

  return (
    <div className="canvas-scroll">
      <div className="page-stack">
        {pages.map((page, index) => (
          <Page
            key={page.id}
            page={page}
            index={index}
            pageSettings={pageSettings}
            zones={zones}
            isOnly={pages.length === 1}
            registerNode={(id, node) => {
              if (node) nodeMap.current.set(id, node);
              else nodeMap.current.delete(id);
            }}
          />
        ))}

        <button className="add-page-btn" onClick={() => addPage(pages[pages.length - 1]?.id)}>
          + Add Page
        </button>
      </div>
    </div>
  );
});
