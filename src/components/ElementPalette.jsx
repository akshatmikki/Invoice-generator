import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { elementPalette } from '../data/elementDefinitions';
import { useDesigner } from '../context/DesignerContext';

function PaletteCard({ item }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { fromPalette: true, elementType: item.type },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`palette-card ${isDragging ? 'palette-card--dragging' : ''}`}
    >
      <div className="palette-card__label">{item.label}</div>
      <div className="palette-card__hint">{item.hint}</div>
    </div>
  );
}

function ElementsTab() {
  return (
    <>
      <p className="palette__subtitle">Drag a block anywhere onto the page — drop two side by side to place them in the same row.</p>
      {elementPalette.map((group) => (
        <div key={group.group} className="palette__group">
          <div className="palette__group-title">{group.group}</div>
          {group.items.map((item) => (
            <PaletteCard key={item.type} item={item} />
          ))}
        </div>
      ))}
    </>
  );
}

function JsonBlock({ title, value }) {
  return (
    <div className="palette__group">
      <div className="palette__group-title">{title}</div>
      <pre className="json-block">{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}

function DataTab() {
  const { apiData } = useDesigner();
  if (!apiData) return null;

  return (
    <>
      <p className="palette__subtitle">
        This is the live JSON data currently powering your invoice — static in Phase 1, and it will come
        straight from the .NET API in Phase 2 with no other changes needed. It updates as you edit fields
        on the page; this panel is just a read-only preview of the current values.
      </p>
      <JsonBlock title="company" value={apiData.company} />
      <JsonBlock title="billTo" value={apiData.billTo} />
      <JsonBlock title="shipTo" value={apiData.shipTo} />
      <JsonBlock title="buyerTo" value={apiData.buyerTo} />
      <JsonBlock title="invoiceMeta" value={apiData.invoiceMeta} />
      <JsonBlock title="invoiceMetaInfo" value={apiData.invoiceMetaInfo} />
      <JsonBlock title={`products (${apiData.products.length})`} value={apiData.products} />
      <JsonBlock title="signatory" value={apiData.signatory} />
    </>
  );
}

export function ElementPalette() {
  const [tab, setTab] = useState('elements');

  return (
    <aside className="palette">
      <div className="palette__tabs">
        <button className={`palette__tab ${tab === 'elements' ? 'palette__tab--active' : ''}`} onClick={() => setTab('elements')}>
          Elements
        </button>
        <button className={`palette__tab ${tab === 'data' ? 'palette__tab--active' : ''}`} onClick={() => setTab('data')}>
          Data (JSON)
        </button>
      </div>
      {tab === 'elements' ? <ElementsTab /> : <DataTab />}
    </aside>
  );
}
