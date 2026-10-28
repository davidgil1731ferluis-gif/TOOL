import {normalizeComponentFields} from './componentStates.js';
import {classifier} from './classifier.js';
import {templateDetector} from './templateDetector.js';
import {recordSplitter} from './recordSplitter.js';
import {fieldExtractor} from './fieldExtractor.js';
import {confidenceEngine} from './confidenceEngine.js';
import {countEvidence as readCounts} from './countValidator.js';
export function analyze(pages,override) {
  const text=pages.map(p=>p.text).join('\n\n');const structuredTypes=[...new Set(pages.map(p=>p.structuredType).filter(Boolean))];
  const type=override||(structuredTypes.length===1?structuredTypes[0]:classifier(text));const template=templateDetector(text,type);
  const structured=pages.some(p=>p.structuredRecords?.length);
  const records=(structured?pages.flatMap(p=>(p.structuredRecords||[]).map(r=>({...r,...(p.method==='ocr'&&r.nameEvidence?{nameEvidence:{...r.nameEvidence,method:'ocr'}}:{})}))):recordSplitter(pages,type)).map(r=>({...r,template,fields:normalizeComponentFields(type,{...fieldExtractor(text,type,r),...(structured?r.cells:{})})}));
  for(const r of records) r.confidence=confidenceEngine(type,r,template);
  const rowCount=template==='SAIS_PREMIUM_HW'?Math.max(0,...[...text.matchAll(/^\s*(\d+)\s+[A-Z0-9._-]{3,}\s+\d+[.,]\d+/gm)].map(m=>+m[1])):0;
  const countEvidence=readCounts(pages,type,rowCount);const expectedCount=countEvidence[0]?.count||0;
  const sourceWarnings=pages.flatMap(p=>p.sourceWarnings||[]);
  if(records.some(r=>r.descriptionConflict))sourceWarnings.push('Un serial tiene descripciones distintas en el documento. Revisa su nombre.');
  if(structuredTypes.length>1||pages.some(p=>p.mixedTypes))sourceWarnings.push('El archivo mezcla tipos de evento. Separa los reportes antes de guardarlos.');
  if(pages.some(p=>p.method==='ocr'))sourceWarnings.push('Lectura de imagen: confirma los seriales y resultados detectados antes de guardar.');
  return {type,template,records,expectedCount,countEvidence,sourceWarnings,mixedDocumentTypes:structuredTypes.length>1||pages.some(p=>p.mixedTypes)};
}
