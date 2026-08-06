import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  const { elements, loadTemplate, resetCanvas, resetToSample, apiData, selectElement } = useDesigner();
  const fileInputRef = useRef(null);
  const templatesDirRef = useRef(null); // remembers the folder the user picked, for the rest of this session
  const [exporting, setExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const flashStatus = (text) => {
    setSaveStatus(text);
    setTimeout(() => setSaveStatus(''), 4500);
  };

  const handleSaveTemplate = async () => {
    const json = JSON.stringify({ elements }, null, 2);
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
    if (!window.confirm('Reset the page back to the sample Tax Invoice? This discards your current edits.')) return;
    resetToSample();
  };

  const handleLoadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      if (parsed.elements) loadTemplate(parsed.elements);
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
      // Deselect any element first: this closes editing panels (product/column
      // pickers, totals controls, text editors) so only the finished invoice —
      // not the design-time controls — gets captured.
      selectElement(null);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const node = canvasRef.current;
      const canvasImg = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvasImg.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvasImg.height * imgWidth) / canvasImg.width;

      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        // Slice the tall image across multiple pages
        let renderedHeight = 0;
        const pageCanvas = document.createElement('canvas');
        const scaleFactor = canvasImg.width / imgWidth;
        pageCanvas.width = canvasImg.width;
        pageCanvas.height = pageHeight * scaleFactor;
        const ctx = pageCanvas.getContext('2d');

        while (renderedHeight < canvasImg.height) {
          ctx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(canvasImg, 0, -renderedHeight);
          const pageData = pageCanvas.toDataURL('image/png');
          if (renderedHeight > 0) pdf.addPage();
          pdf.addImage(pageData, 'PNG', 0, 0, imgWidth, pageHeight);
          renderedHeight += pageCanvas.height;
        }
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
        <button onClick={handleSaveTemplate}>Save Template</button>
        <button onClick={handleLoadClick}>Load Template</button>
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleLoadFile} />
        <button onClick={handleResetToSample} className="toolbar__ghost">Reset to Sample</button>
        <button onClick={resetCanvas} className="toolbar__danger">Clear Page</button>
        <button onClick={handleExportPdf} className="toolbar__primary" disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export PDF'}
        </button>
      </div>
    </header>
  );
}
