import {serialNormalizer,validSerial} from './serialNormalizer.js';
export function serialExtractor(text,type) {
  const result=[];
  const lines=text.split('\n');
  for(const [index,line] of lines.entries()) {
    let raw='';
    if(type==='INSPECTION'||type==='REPAIR') raw=line.match(/^\s*\d+\s+([A-Z0-9][A-Z0-9-]{2,})\s+/i)?.[1] || '';
    if((type==='INSPECTION'||type==='REPAIR')&&!raw) raw=line.match(/(?:Serial(?:\s*(?:No\.?|N[°º]))?|No\.?\s*(?:de\s*)?Serie|S\/N)\s*[:#]\s*([A-Z0-9][A-Z0-9._-]{2,63})/i)?.[1] || '';
    if(type==='BHA') {
      // Solo tabla de componentes: serial antes de OD, ID y medidas. Incluye seriales numéricos.
      const m=line.match(/(?:^|\s)([A-Z0-9][A-Z0-9-]{3,})\s+(\d+(?:\s+\d+\/\d+)?\s*")\s+(\d+(?:[.,]\d+|\s+\d+\/\d+)?\s*")/i);
      raw=m?.[1]||'';
    }
    const serial=serialNormalizer(raw);
    if(validSerial(serial)) {
      const block=[line];
      if(/(?:Serial|No\.?\s*(?:de\s*)?Serie|S\/N)\s*(?:No\.?)?\s*[:#]/i.test(line))for(const next of lines.slice(index+1,index+28)){if(!next.trim())continue;if(!/^\s*(?:Cuerpo|Body|PIN|Piñ[oó]n|BOX|Caja|Final|Conformidad final|Resultado final|Hallazgos|Observaciones|Maquinado|Machining|Fecha de reparaci[oó]n)\s*:/i.test(next))break;block.push(next);}
      result.push({serial,rawSerial:raw,line:block.join('\n')});
    }
  }
  return result;
}
