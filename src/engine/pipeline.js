import {classifier} from './classifier.js';
import {templateDetector} from './templateDetector.js';
import {recordSplitter} from './recordSplitter.js';
import {fieldExtractor} from './fieldExtractor.js';
import {confidenceEngine} from './confidenceEngine.js';
export function analyze(pages,override) {
  const text=pages.map(p=>p.text).join('\n\n');const structuredTypes=[...new Set(pages.map(p=>p.structuredType).filter(Boolean))];
  const type=override||(structuredTypes.length===1?structuredTypes[0]:classifier(text));const template=templateDetector(text,type);
  const structured=pages.some(p=>p.structuredRecords?.length);
  const records=(structured?pages.flatMap(p=>p.structuredRecords||[]):recordSplitter(pages,type)).map(r=>({...r,template,fields:{...fieldExtractor(text,type,r),...(structured?r.cells:{})}}));
  for(const r of records) r.confidence=confidenceEngine(type,r,template);
  const rowCount=template==='SAIS_PREMIUM_HW'?Math.max(0,...[...text.matchAll(/^\s*(\d+)\s+[A-Z0-9._-]{3,}\s+\d+[.,]\d+/gm)].map(m=>+m[1])):0;
  const expectedCount=type==='INSPECTION'?Number(text.match(/(?:Cantidad de Componentes|Tramos Inspeccionados|Tubos Inspeccionados)\s*:\s*(\d+)/i)?.[1]||rowCount):type==='REPAIR'?Number(text.match(/Tubos Inspeccionados\s*:\s*(\d+)\s*\n/i)?.[1]||0):0;
  const sourceWarnings=[];
  if(structuredTypes.length>1||pages.some(p=>p.mixedTypes))sourceWarnings.push('El archivo mezcla tipos de evento. Separa los reportes antes de guardarlos.');
  if(pages.some(p=>p.method==='ocr'))sourceWarnings.push('Lectura de imagen: confirma los seriales y resultados detectados antes de guardar.');
  return {type,template,records,expectedCount,sourceWarnings,mixedDocumentTypes:structuredTypes.length>1||pages.some(p=>p.mixedTypes)};
}
