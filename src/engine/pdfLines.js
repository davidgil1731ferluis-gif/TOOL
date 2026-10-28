import {serialNormalizer,validSerial} from './serialNormalizer.js';
import {pdfRows} from './pdfRows.js';
export function coalescePdfItems(items){
 const text=items.filter(i=>i.str?.trim());if(text.length<80||text.filter(i=>i.str.trim().length===1).length/text.length<.55)return items;
 const rows=[],vertical=[];
 for(const item of text){if(Math.abs(item.transform[1])>Math.abs(item.transform[0])){vertical.push(item);continue;}const y=item.transform[5],tolerance=Math.max(.35,item.height*.15);let row=rows.find(r=>Math.abs(r.y-y)<tolerance);if(!row){row={y,items:[]};rows.push(row);}row.items.push(item);}
 return [...rows.sort((a,b)=>b.y-a.y).flatMap(row=>{const result=[];for(const item of row.items.sort((a,b)=>a.transform[4]-b.transform[4])){const previous=result.at(-1),gap=previous?item.transform[4]-(previous.transform[4]+previous.width):Infinity,limit=Math.max(.12,Math.min(previous?.height||item.height,item.height)*.18);if(previous&&gap<=limit&&gap>=-item.height*.35){previous.str+=item.str;previous.width=item.transform[4]+item.width-previous.transform[4];}else result.push({...item,transform:[...item.transform]});}return result;}),...vertical];
}
export function pdfLines(items) {
  items=coalescePdfItems(items);
  return pdfRows(items).map(l=>l.items.map(i=>i.str).join(' ')).join('\n');
}
export function bhaColumnCandidates(items) {
  items=coalescePdfItems(items);
  if(!items.some(i=>/COMPONENTES BHA/i.test(i.str))) return null;
  const header=items.find(i=>i.str.trim()==='Serial');
  const exterior=items.find(i=>i.str.trim()==='Externo'&&header&&Math.abs(i.transform[5]-header.transform[5])<20);
  if(!header||!exterior) return null;
  const center=header.transform[4]+header.width/2;
  const right=(center+exterior.transform[4])/2;
  const left=center-(right-center);
  const footer=items.find(i=>/JETS BROCA|LONGITUD TOTAL BHA/i.test(i.str));
  const bottom=footer?.transform[5]||0;
  const names=[['owner','Propietario'],['serial','Serial'],['outerDiameter','Externo'],['innerDiameter','Interno'],['fishingNeck','Fishing'],['length','Efectiva'],['unused','Long Parcial']];
  const columns=names.map(([key,label])=>({key,item:items.find(i=>i.str.trim()===label&&Math.abs(i.transform[5]-header.transform[5])<header.height*3)})).filter(c=>c.item).map(c=>({...c,x:c.item.transform[4]+c.item.width/2})).sort((a,b)=>a.x-b.x);
  const cells=row=>Object.fromEntries(columns.filter(c=>!['serial','unused'].includes(c.key)).flatMap(col=>{
    const index=columns.indexOf(col);if(index===0||index===columns.length-1)return [];
    const start=(columns[index-1].x+col.x)/2,end=(col.x+columns[index+1].x)/2;
    const values=items.filter(i=>i.str.trim()&&i.transform[4]+i.width/2>start&&i.transform[4]+i.width/2<end&&Math.abs(i.transform[5]-row.transform[5])<header.height*.55).sort((a,b)=>a.transform[4]-b.transform[4]).map(i=>i.str.trim());
    const value=values.join(' ');
    return value&&/^\d+(?:[.,]\d+|\s+\d+\/\d+)?"?$/.test(value)?[[col.key,value]]:[];
  }));
  const rows=items.filter(i=>{const x=i.transform[4]+i.width/2;return i.str&&x>=left&&x<right&&i.transform[5]<header.transform[5]-8&&i.transform[5]>bottom+8&&validSerial(serialNormalizer(i.str));}).sort((a,b)=>b.transform[5]-a.transform[5]);
  const descriptions=bhaDescriptions(items,rows,header,bottom);
  return rows.map(i=>({serial:serialNormalizer(i.str),rawSerial:i.str.trim(),cells:{...cells(i),...(descriptions.get(i)?{description:descriptions.get(i)}:{})},...(descriptions.get(i)?{nameEvidence:{serial:serialNormalizer(i.str),value:descriptions.get(i),method:'pdf-columns'}}:{}),line:items.filter(other=>other.str&&Math.abs(other.transform[5]-i.transform[5])<3).sort((a,b)=>a.transform[4]-b.transform[4]).map(t=>t.str).join(' ')}));
}
function bhaDescriptions(items,rows,header,bottom){
 const result=new Map(),label=items.find(i=>/Descripci[oó]n/i.test(i.str)&&Math.abs(i.transform[5]-header.transform[5])<25),connection=items.find(i=>/Conexi[oó]n/i.test(i.str)&&Math.abs(i.transform[5]-header.transform[5])<25);
 if(!label||!connection||!rows.length)return result;
 const center=label.transform[4]+label.width/2,end=connection.transform[4]-2,start=center-(end-center);
 const words=items.filter(i=>i.str?.trim()&&i.transform[4]+i.width/2>start&&i.transform[4]+i.width/2<end&&i.transform[5]<header.transform[5]-8&&i.transform[5]>bottom+8),used=new Set();
 // Los bloques combinados que indican cantidad se asocian solo si el centro
 // coincide con exactamente esa cantidad de filas contiguas.
 for(const item of words){const count=Number(item.str.match(/^\((\d+)\)\s/)?.[1]);if(!(count>1&&count<=rows.length))continue;
  const choices=rows.slice(0,rows.length-count+1).map((_,index)=>rows.slice(index,index+count)).map(block=>({block,distance:Math.abs(block.reduce((n,r)=>n+r.transform[5],0)/count-item.transform[5])})).sort((a,b)=>a.distance-b.distance);
  if(choices[0].distance>header.height*.6||choices[1]?.distance<choices[0].distance+header.height*.5)continue;
  for(const row of choices[0].block)result.set(row,item.str.trim().replace(/^\(\d+\)\s*/,''));used.add(item);
 }
 for(let index=0;index<rows.length;index++){const row=rows[index];if(result.has(row))continue;
  const top=index?(rows[index-1].transform[5]+row.transform[5])/2:header.transform[5]-8,low=index<rows.length-1?(row.transform[5]+rows[index+1].transform[5])/2:bottom+8;
  const parts=words.filter(i=>!used.has(i)&&!(Number(i.str.match(/^\((\d+)\)\s/)?.[1])>1)&&i.transform[5]<top&&i.transform[5]>=low).sort((a,b)=>b.transform[5]-a.transform[5]||a.transform[4]-b.transform[4]);
  const text=parts.map(i=>i.str.trim()).join(' ').replace(/^\(1\)\s*/,'');if(text&&text.length<=160)result.set(row,text);
 }
 return result;
}
