import {classifier} from './classifier.js';
import {templateDetector} from './templateDetector.js';
import {recordSplitter} from './recordSplitter.js';
import {fieldExtractor} from './fieldExtractor.js';
import {confidenceEngine} from './confidenceEngine.js';
export function analyze(pages,override) {
  const text=pages.map(p=>p.text).join('\n\n');const type=override||classifier(text);const template=templateDetector(text,type);
  const records=recordSplitter(pages,type).map(r=>({...r,fields:fieldExtractor(text,type,r)}));
  for(const r of records) r.confidence=confidenceEngine(type,r,template);
  const expectedCount=type==='INSPECTION'?Number(text.match(/Cantidad de Componentes\s*:\s*(\d+)/i)?.[1]||0):type==='REPAIR'?Number(text.match(/Tubos Inspeccionados\s*:\s*(\d+)\s*\n/i)?.[1]||0):0;
  return {type,template,records,expectedCount};
}
