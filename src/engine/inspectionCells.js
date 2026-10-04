import {serialNormalizer,validSerial} from './serialNormalizer.js';

// Leer la celda completa evita confundir un «No» situado en la línea superior.
export function inspectionCells(items) {
  if(!items.some(i=>/9\.1\s*CUERPO/i.test(i.str))) return null;
  const header=items.find(i=>i.str.trim()==='Serial');
  if(!header) return null;
  const center=i=>i.transform[4]+i.width/2;
  const head=(text)=>items.find(i=>i.str.trim()===text&&Math.abs(i.transform[5]-header.transform[5])<header.height*3);
  const columns=[['body',head('Cuerpo')],['pin',head('Obs PIN')],['box',head('Obs BOX')],['finalConformity',head('Final')],['findings',head('Observaciones')]];
  if(columns.some(([,h])=>!h)) return null;
  const serialX=center(header);
  const rows=items.filter(i=>i.str.trim()&&Math.abs(center(i)-serialX)<header.width*1.6&&i.transform[5]<header.transform[5]-header.height*2&&(validSerial(serialNormalizer(i.str))||/^-+$/.test(i.str.trim()))).sort((a,b)=>b.transform[5]-a.transform[5]);
  const spacing=rows.length>1?rows[0].transform[5]-rows[1].transform[5]:header.height*5;
  if(spacing<=0) return null;
  return rows.filter(i=>validSerial(serialNormalizer(i.str))).map(row=>{
    const fields={};
    columns.forEach(([key,h],index)=>{
      const x=center(h);
      const left=index?(center(columns[index-1][1])+x)/2:x-(center(columns[1][1])-x)/2;
      const right=index<columns.length-1?(x+center(columns[index+1][1]))/2:x+(x-center(columns[index-1][1]))/2;
      fields[key]=items.filter(i=>i.str.trim()&&center(i)>left&&center(i)<right&&Math.abs(i.transform[5]-row.transform[5])<spacing*.46).sort((a,b)=>b.transform[5]-a.transform[5]||a.transform[4]-b.transform[4]).map(i=>i.str.trim()).join(' ');
    });
    return {serial:serialNormalizer(row.str),rawSerial:row.str.trim(),cells:fields,line:items.filter(i=>i.str.trim()&&Math.abs(i.transform[5]-row.transform[5])<spacing*.46).sort((a,b)=>a.transform[4]-b.transform[4]||b.transform[5]-a.transform[5]).map(i=>i.str.trim()).join(' ')};
  });
}
