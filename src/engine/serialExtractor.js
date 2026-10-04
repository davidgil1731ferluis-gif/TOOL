import {serialNormalizer,validSerial} from './serialNormalizer.js';
export function serialExtractor(text,type) {
  const result=[];
  for(const line of text.split('\n')) {
    let raw='';
    if(type==='INSPECTION'||type==='REPAIR') raw=line.match(/^\s*\d+\s+([A-Z0-9][A-Z0-9-]{2,})\s+/i)?.[1] || '';
    if(type==='INSPECTION'&&!raw) raw=line.match(/Serial\s*:\s*([A-Z0-9-]+)/i)?.[1] || '';
    if(type==='BHA') {
      // Solo tabla de componentes: serial antes de OD, ID y medidas. Incluye seriales numéricos.
      const m=line.match(/(?:^|\s)([A-Z0-9][A-Z0-9-]{3,})\s+(\d+(?:\s+\d+\/\d+)?\s*")\s+(\d+(?:[.,]\d+|\s+\d+\/\d+)?\s*")/i);
      raw=m?.[1]||'';
    }
    const serial=serialNormalizer(raw);
    if(validSerial(serial)) result.push({serial,rawSerial:raw,line});
  }
  return result;
}
