import {serialNormalizer,validSerial} from './serialNormalizer.js';
import {coalescePdfItems} from './pdfLines.js';
const compact=s=>s.normalize('NFD').replace(/[\u0300-\u036f\s]/g,'').toUpperCase();
const result=s=>{const n=compact(s);return /FUERA(?:DE)?SERVICIO|SCRAP/.test(n)?'Fuera de servicio':/NOCONFORME.*REPARABLE|^REPARABLE$/.test(n)?'No Conforme/Reparable':/^(OK|CONFORME(?:\/OPERATIVO)?)$/.test(n)?'Conforme':s;};

// Leer la celda completa evita confundir un «No» situado en la línea superior.
export function inspectionCells(items) {
  items=coalescePdfItems(items);
  if(!/9\.1CUERPO/.test(compact(items.map(i=>i.str).join(' ')))) return null;
  const header=items.find(i=>compact(i.str)==='SERIAL');
  if(!header) return null;
  const center=i=>i.transform[4]+i.width/2;
  const head=(text,minX=0)=>{const nearby=items.filter(i=>center(i)>minX&&Math.abs(i.transform[5]-header.transform[5])<header.height*3);const exact=nearby.find(i=>compact(i.str)===compact(text));if(exact)return exact;for(const first of nearby){const next=nearby.find(i=>i!==first&&Math.abs(i.transform[5]-first.transform[5])<1&&i.transform[4]>=first.transform[4]+first.width-.1&&i.transform[4]-(first.transform[4]+first.width)<header.height*2.5&&compact(first.str+i.str)===compact(text));if(next)return {...first,str:first.str+' '+next.str,width:next.transform[4]+next.width-first.transform[4]};}return null;};
  const columns=[];for(const [key,label] of [['body','Cuerpo'],['pin','Obs PIN'],['box','Obs BOX'],['finalConformity','Final'],['findings','Observaciones']])columns.push([key,head(label,columns.length?center(columns.at(-1)[1]||header):center(header))]);
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
      const value=items.filter(i=>i.str.trim()&&center(i)>left&&center(i)<right&&Math.abs(i.transform[5]-row.transform[5])<spacing*.46).sort((a,b)=>b.transform[5]-a.transform[5]||a.transform[4]-b.transform[4]).map(i=>i.str.trim()).join(' ');fields[key]=key==='findings'?value:result(value);
    });
    return {serial:serialNormalizer(row.str),rawSerial:row.str.trim(),cells:fields,line:items.filter(i=>i.str.trim()&&Math.abs(i.transform[5]-row.transform[5])<spacing*.46).sort((a,b)=>a.transform[4]-b.transform[4]||b.transform[5]-a.transform[5]).map(i=>i.str.trim()).join(' ')};
  });
}
