import { useRef } from 'react';
import { DndContext } from '@dnd-kit/core';
import { DesignerProvider, useDesigner, findElement, PAGE_WIDTH, PAGE_HEIGHT, ZONES, zoneForY } from './context/DesignerContext';
import { ELEMENT_TYPES, findPaletteDefinition, defaultWidthFor } from './data/elementDefinitions';
import { Toolbar } from './components/Toolbar';
import { ElementPalette } from './components/ElementPalette';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import './styles/globals.css';
import './App.css';

/** If a dropped element's type isn't allowed in the zone it landed in, nudge it into the nearest allowed zone instead of rejecting the drop. */
function resolveZoneAndY(elementType, rawY) {
  const zone = zoneForY(rawY);
  const paletteDef = findPaletteDefinition(elementType);
  const allowed = paletteDef?.allowedZones || Object.keys(ZONES);
  if (allowed.includes(zone)) return { zone, y: rawY };

  // Find the allowed zone whose range is closest to where the user dropped it
  let best = allowed[0];
  let bestDistance = Infinity;
  allowed.forEach((z) => {
    const bounds = ZONES[z];
    const distance = rawY < bounds.yMin ? bounds.yMin - rawY : rawY > bounds.yMax ? rawY - bounds.yMax : 0;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = z;
    }
  });
  return { zone: best, y: ZONES[best].yMin + 10 };
}

function Workspace() {
  const { addElement, updateElementData, elements, loading } = useDesigner();
  const canvasRef = useRef(null);

  const handleDragEnd = (event) => {
    const { over, active, delta, activatorEvent } = event;
    if (!over) return;
    const activeData = active.data.current || {};

    // Case 1: dragging a new element in from the palette, anywhere on the page
    if (activeData.fromPalette) {
      if (over.id !== 'canvas-page') return;
      if (!canvasRef.current || !activatorEvent) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const pointerX = (activatorEvent.clientX ?? 0) + delta.x;
      const pointerY = (activatorEvent.clientY ?? 0) + delta.y;

      const elementType = activeData.elementType;
      const width = defaultWidthFor(elementType);
      let x = pointerX - canvasRect.left;
      let y = pointerY - canvasRect.top;
      x = Math.max(0, Math.min(x, PAGE_WIDTH - width));
      y = Math.max(0, Math.min(y, PAGE_HEIGHT - 30));

      const { zone, y: resolvedY } = resolveZoneAndY(elementType, y);
      addElement(elementType, zone, x, resolvedY);
      return;
    }

    // Case 2: dragging a numeric column heading from a Product Table onto a Totals block
    if (activeData.fromColumnHeader) {
      const overId = String(over.id);
      if (!overId.startsWith('totals-drop-')) return;
      const totalsInstanceId = overId.replace('totals-drop-', '');
      const found = findElement(elements, totalsInstanceId);
      if (!found || found.type !== ELEMENT_TYPES.TOTALS) return;
      const current = found.data.totalColumns || [];
      const key = activeData.columnKey;
      if (current.includes(key)) return; // already added, nothing to do
      updateElementData(totalsInstanceId, { totalColumns: [...current, key] });
    }
  };

  if (loading) {
    return <div className="app-loading">Loading invoice data…</div>;
  }

  return (
    <div className="app-shell">
      <Toolbar canvasRef={canvasRef} />
      <DndContext onDragEnd={handleDragEnd}>
        <div className="workspace">
          <ElementPalette />
          <Canvas ref={canvasRef} />
          <PropertiesPanel />
        </div>
      </DndContext>
    </div>
  );
}

export default function App() {
  return (
    <DesignerProvider>
      <Workspace />
    </DesignerProvider>
  );
}
