import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {pdfLines,bhaColumnCandidates,coalescePdfItems} from './pdfLines.js';
import {inspectionCells} from './inspectionCells.js';
import {premiumInspectionCells,tuboscopeInspectionCells} from './inspectionFormats.js';
import {fileKind,decodeText} from './fileFormats.js';
import {coordinateTable} from './coordinateTable.js';
import {readSpreadsheet} from './spreadsheetReader.js';
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
export const EXTRACTION_VERSION=7;
export async function textExtractor(file,{onProgress=()=>{},cachedPages=[],onPage=async()=>{}}={}) {
  if (file.size > 25 * 1024 * 1024) throw new Error('El archivo supera 25 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind=fileKind(file.name,bytes);
  if(kind==='spreadsheet'){onProgress('Leyendo hoja de cálculo…');return readSpreadsheet(bytes,file.name);}
  if(kind==='text'){const text=decodeText(bytes);if(text.length>2000000)throw new Error('El texto supera dos millones de caracteres.');return {text,pages:[{page:1,text}]};}
  if(kind==='image'&&cachedPages[0]?.method==='ocr')return {text:cachedPages[0].text,pages:cachedPages};
  let ocr;const getOCR=async()=>ocr||(ocr=await (await import('./ocrExtractor.js')).createOCR(p=>onProgress('Leyendo texto de imagen: '+p+' %')));
  if(kind==='image')try{const {imageCanvas}=await import('./ocrExtractor.js');const page=await (await getOCR()).read(await imageCanvas(file));return {text:page.text,pages:[page]};}finally{await ocr?.close();}
  const task = pdfjs.getDocument({data: bytes});
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 200) throw new Error('Máximo 200 páginas por PDF.');
    const pages=[];
    for(let n=1;n<=pdf.numPages;n++) {
      const cached=cachedPages.find(p=>p.page===n&&p.method);if(cached){pages.push(cached);continue;}
      onProgress(`Leyendo página ${n} de ${pdf.numPages}`);
      const pdfPage=await pdf.getPage(n);const content = await pdfPage.getTextContent();content.items=coalescePdfItems(content.items);
      // Agrupar por coordenada vertical; conserva filas aunque PDF.js no emita saltos.
      const text=pdfLines(content.items);
      if(text.replace(/\s/g,'').length<80){
        const original=pdfPage.getViewport({scale:1});const scale=Math.min(2.5,2600/Math.max(original.width,original.height));const viewport=pdfPage.getViewport({scale});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await pdfPage.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
        const recognized=await (await getOCR()).read(canvas,n);pages.push({...recognized,text:[text,recognized.text].filter(Boolean).join('\n')});canvas.width=canvas.height=0;
      }else {
        const bhaCandidates=bhaColumnCandidates(content.items);
        const table=/TOTAL\s*QC|Tuboscope|SAIS-OP-F-53R/i.test(text)||bhaCandidates?.length?null:coordinateTable(content.items,n);
        pages.push({page:n,text,method:'pdf-text',...(table?{structuredRecords:table.structuredRecords,structuredType:table.structuredType,mixedTypes:table.mixedTypes,sourceWarnings:table.sourceWarnings||[]}:{}),bhaCandidates,inspectionCandidates:inspectionCells(content.items)||premiumInspectionCells(content.items,text)||tuboscopeInspectionCells(text)});
      }
      pdfPage.cleanup();await onPage([...pages]);
    }
    const text=pages.map(p=>p.text).join('\n\n');
    if(text.trim().length<10) throw new Error('No se pudo leer texto suficiente. El original queda guardado para completar sus datos.');
    return {text,pages};
  } finally { await task.destroy();await ocr?.close(); }
}
