import {serialNormalizer,validSerial} from './serialNormalizer.js';
export function pdfLines(items) {
  const lines=[];
  for(const item of items.filter(i=>i.str)) {
    const y=item.transform[5];let line=lines.find(l=>Math.abs(l.y-y)<2.5);
    if(!line){line={y,items:[]};lines.push(line);}
    line.items.push({x:item.transform[4],str:item.str});
  }
  return lines.sort((a,b)=>b.y-a.y).map(l=>l.items.sort((a,b)=>a.x-b.x).map(i=>i.str).join(' ')).join('\n');
}
export function bhaColumnCandidates(items) {
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
  return items.filter(i=>{const x=i.transform[4]+i.width/2;return i.str&&x>=left&&x<right&&i.transform[5]<header.transform[5]-8&&i.transform[5]>bottom+8&&validSerial(serialNormalizer(i.str));}).map(i=>({serial:serialNormalizer(i.str),rawSerial:i.str.trim(),cells:cells(i),line:items.filter(other=>other.str&&Math.abs(other.transform[5]-i.transform[5])<3).sort((a,b)=>a.transform[4]-b.transform[4]).map(t=>t.str).join(' ')}));
}
