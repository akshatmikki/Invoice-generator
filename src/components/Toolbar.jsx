import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { v4 as uuid } from 'uuid';
import { useDesigner } from '../context/DesignerContext';

const SUPPORTS_FS_ACCESS = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

function downloadFallback(json, filename) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function Toolbar({ canvasRef }) {
  const { pages, loadTemplate, addPage, resetToSample, apiData, selectElement, pageSettings } = useDesigner();
  const fileInputRef = useRef(null);
  const templatesDirRef = useRef(null); // remembers the folder the user picked, for the rest of this session
  const [exporting, setExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const flashStatus = (text) => {
    setSaveStatus(text);
    setTimeout(() => setSaveStatus(''), 4500);
  };

  const handleSaveTemplate = async () => {
    const json = JSON.stringify({ pages }, null, 2);
    const filename = `invoice-template-${Date.now()}.json`;

    if (SUPPORTS_FS_ACCESS) {
      try {
        // First save this session: ask the user to pick the folder to save into
        // (point them at frontend/templates). Every save after that writes
        // straight into that same folder with no dialog.
        if (!templatesDirRef.current) {
          templatesDirRef.current = await window.showDirectoryPicker({ id: 'invoice-templates', mode: 'readwrite' });
        }
        const fileHandle = await templatesDirRef.current.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(json);
        await writable.close();
        flashStatus(`Saved "${filename}" to your chosen folder ✓`);
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return; // user closed the folder picker — do nothing
        // Any other failure (e.g. permission revoked): fall back to a normal download.
        templatesDirRef.current = null;
      }
    }

    downloadFallback(json, filename);
    flashStatus('Your browser doesn’t support folder access — saved to Downloads instead.');
  };

  const handleChangeFolder = () => {
    templatesDirRef.current = null;
    flashStatus('Folder cleared — next save will ask you to pick again.');
  };

  const handleLoadClick = () => fileInputRef.current?.click();

  const handleResetToSample = () => {
    if (!window.confirm('Reset the whole document back to the sample Tax Invoice? This discards your current edits, on every page.')) return;
    resetToSample();
  };

  const handleLoadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.pages)) loadTemplate(parsed.pages);
      // Backward compatible with single-page templates saved before multi-page support.
      else if (Array.isArray(parsed.elements)) loadTemplate([{ id: uuid(), elements: parsed.elements }]);
      else alert('This file does not look like a valid invoice template.');
    } catch {
      alert('Could not read that file — make sure it is a template JSON exported from this app.');
    }
    e.target.value = '';
  };

  const handleExportPdf = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      // Deselect any element first so the selection outline, move handle and
      // resize handle aren't visible in the captured image.
      selectElement(null);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      // Size the PDF page to match the canvas's own (possibly custom) page size and
      // orientation exactly, converting 96dpi px to pt (1px = 0.75pt), instead of
      // always forcing a fixed A4 page.
      const widthPt = pageSettings.width * 0.75;
      const heightPt = pageSettings.height * 0.75;
      const pdf = new jsPDF({ orientation: widthPt > heightPt ? 'landscape' : 'portrait', unit: 'pt', format: [widthPt, heightPt] });

      for (let i = 0; i < pages.length; i++) {
        const node = canvasRef.current.getPageNode(pages[i].id);
        if (!node) continue;
        const canvasImg = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvasImg.toDataURL('image/png');
        if (i > 0) pdf.addPage([widthPt, heightPt], widthPt > heightPt ? 'landscape' : 'portrait');
        pdf.addImage(imgData, 'PNG', 0, 0, widthPt, heightPt);
      }

      pdf.save(`${apiData?.invoiceMeta?.invoiceNumber || 'invoice'}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <span className="toolbar__mark">▤</span>
        <span>Invoice Designer</span>
      </div>
      <div className="toolbar__actions">
        {saveStatus && <span className="toolbar__status">{saveStatus}</span>}
        {SUPPORTS_FS_ACCESS && templatesDirRef.current && (
          <button onClick={handleChangeFolder} className="toolbar__ghost" title="Pick a different save folder">
            Change Folder
          </button>
        )}
        <button onClick={() => addPage(pages[pages.length - 1]?.id)} className="toolbar__ghost">+ Add Page</button>
        <button onClick={handleSaveTemplate}>Save Template</button>
        <button onClick={handleLoadClick}>Load Template</button>
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleLoadFile} />
        <button onClick={handleResetToSample} className="toolbar__ghost">Reset to Sample</button>
        <button onClick={handleExportPdf} className="toolbar__primary" disabled={exporting}>
          {exporting ? 'Exporting…' : `Export PDF${pages.length > 1 ? ` (${pages.length} pages)` : ''}`}
        </button>
      </div>
    </header>
  );
}
