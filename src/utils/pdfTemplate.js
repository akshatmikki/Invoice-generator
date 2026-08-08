import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

/**
 * Renders every page of an uploaded PDF to a PNG data URL sized exactly
 * targetWidth x targetHeight (the document's fixed page size), so each
 * image can be dropped straight in as a page background to trace over.
 * The source page is scaled to fit inside that box and centered on a white
 * canvas — this keeps every page the same size even when the PDF's own
 * page dimensions vary or don't match the document's aspect ratio.
 */
export async function renderPdfPagesToImages(file, targetWidth, targetHeight) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const images = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(targetWidth / baseViewport.width, targetHeight / baseViewport.height);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.translate((targetWidth - viewport.width) / 2, (targetHeight - viewport.height) / 2);

    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push(canvas.toDataURL('image/png'));
  }

  return images;
}
