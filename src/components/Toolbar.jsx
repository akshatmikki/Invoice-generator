import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useDesigner } from '../context/DesignerContext';
import { renderPdfPagesToImages } from '../utils/pdfTemplate';

export function Toolbar({ canvasRef }) {
  const { pages, loadTemplateFromImages, addPage, resetToSample, apiData, selectElement, pageSettings } = useDesigner();
  const templateFileInputRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);

  const handleUploadTemplateClick = () => templateFileInputRef.current?.click();

  const handleResetToSample = () => {
    if (!window.confirm('Reset the whole document back to the sample Tax Invoice? This discards your current edits, on every page.')) return;
    resetToSample();
  };

  const handleUploadTemplateFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }
    setUploadingTemplate(true);
    try {
      // Each PDF page becomes a page background you can drag editable elements on top of.
      const images = await renderPdfPagesToImages(file, pageSettings.width, pageSettings.height);
      loadTemplateFromImages(images);
    } catch {
      alert('Could not read that PDF — try a different file.');
    } finally {
      setUploadingTemplate(false);
    }
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
        <button onClick={() => addPage(pages[pages.length - 1]?.id)} className="toolbar__ghost">+ Add Page</button>
        <button onClick={handleUploadTemplateClick} disabled={uploadingTemplate} title="Upload a PDF to trace it into an editable template">
          {uploadingTemplate ? 'Uploading…' : 'Upload Template (PDF)'}
        </button>
        <input ref={templateFileInputRef} type="file" accept="application/pdf" hidden onChange={handleUploadTemplateFile} />
        <button onClick={handleResetToSample} className="toolbar__ghost">Reset to Sample</button>
        <button onClick={handleExportPdf} className="toolbar__primary" disabled={exporting}>
          {exporting ? 'Exporting…' : `Export PDF${pages.length > 1 ? ` (${pages.length} pages)` : ''}`}
        </button>
      </div>
    </header>
  );
}
