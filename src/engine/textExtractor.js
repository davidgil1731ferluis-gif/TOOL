import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {pdfLines,bhaColumnCandidates} from './pdfLines.js';
import {inspectionCells} from './inspectionCells.js';
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
export async function textExtractor(file) {
  if (file.size > 25 * 1024 * 1024) throw new Error('El PDF supera 25 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!new TextDecoder().decode(bytes.slice(0,1024)).includes('%PDF-')) throw new Error('El archivo no tiene una cabecera PDF válida.');
  const task = pdfjs.getDocument({data: bytes});
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 200) throw new Error('Máximo 200 páginas por PDF.');
    const pages=[];
    for(let n=1;n<=pdf.numPages;n++) {
      const content = await (await pdf.getPage(n)).getTextContent();
      // Agrupar por coordenada vertical; conserva filas aunque PDF.js no emita saltos.
      pages.push({page:n,text:pdfLines(content.items),bhaCandidates:bhaColumnCandidates(content.items),inspectionCandidates:inspectionCells(content.items)});
    }
    const text=pages.map(p=>p.text).join('\n\n');
    if(text.trim().length<40) throw new Error('PDF sin texto utilizable. Esta versión requiere texto seleccionable; OCR está pendiente.');
    return {text,pages};
  } finally { await task.destroy(); }
}
