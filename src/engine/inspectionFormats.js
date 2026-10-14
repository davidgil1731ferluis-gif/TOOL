import {serialNormalizer,validSerial} from './serialNormalizer.js';

export const normalizedText=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
export function inspectionFormat(text){const t=normalizedText(text);if(/SAIS-OP-F-53R/.test(t))return 'SAIS_PREMIUM_HW';if(/TUBOSCOPE/.test(t)&&/HOJA DE RECUENTO HEAVYWEIGHT/.test(t))return 'NOV_TUBOSCOPE_HW_INSPECTION';return '';}
const center=i=>Math.abs(i.transform[1])>Math.abs(i.transform[0])?i.transform[4]-i.height/2:i.transform[4]+i.width/2;
const rowText=(items,y,tolerance)=>items.filter(i=>i.str.trim()&&Math.abs(i.transform[5]-y)<tolerance).sort((a,b)=>a.transform[4]-b.transform[4]).map(i=>i.str.trim()).join(' ');
const result=code=>({OK:'Conforme',OP:'Conforme',R:'No conforme / reparable',RF:'No conforme / reparable',FS:'Fuera de servicio'}[code]||'');

// El ancho de un rótulo vertical no es el ancho de su columna.
export function premiumInspectionCells(items,text){
  if(inspectionFormat(text)!=='SAIS_PREMIUM_HW')return null;
  const header=items.find(i=>/SERIAL\s+No\./i.test(i.str));if(!header)return [];
  const head=label=>items.find(i=>normalizedText(i.str.trim())===label&&i.transform[5]>header.transform[5]-30&&i.transform[5]<header.transform[5]);
  const columns={body:head('CONDICION'),pin:head('CONDICION FINAL PIN'),box:head('CONDICION CAJA'),finalConformity:head('CONDICION FINAL')};
  // La primera CONDICIÓN pertenece al CENTRO, antes del bloque PIN.
  columns.body=items.filter(i=>normalizedText(i.str.trim())==='CONDICION'&&i.transform[5]>header.transform[5]-30).sort((a,b)=>a.transform[4]-b.transform[4])[0];
  const observations=items.find(i=>i.str.trim()==='OBSERVACIONES'&&Math.abs(i.transform[5]-header.transform[5])<10);
  return items.filter(i=>validSerial(serialNormalizer(i.str))&&Math.abs(center(i)-center(header))<header.width*.6&&i.transform[5]<header.transform[5]-15&&items.some(n=>/^\d+$/.test(n.str.trim())&&n.transform[4]<i.transform[4]&&Math.abs(n.transform[5]-i.transform[5])<2)).map(i=>{
    const row=items.filter(v=>v.str.trim()&&Math.abs(v.transform[5]-i.transform[5])<2).sort((a,b)=>a.transform[4]-b.transform[4]),cells={};
    for(const [key,h] of Object.entries(columns)){if(!h)continue;const values=row.filter(v=>Math.abs(center(v)-center(h))<h.height*1.5);cells[key]=result(values.map(v=>v.str.trim()).join(' '));}
    const note=observations?row.filter(v=>v.transform[4]>observations.transform[4]-4).map(v=>v.str.trim()).join(' '):'';
    cells.findings=note;cells.observations=note;
    cells.measurements=row.filter(v=>v.transform[4]>i.transform[4]+i.width).map(v=>v.str.trim()).join(' | ');
    return {serial:serialNormalizer(i.str),rawSerial:i.str.trim(),cells,line:rowText(items,i.transform[5],2)};
  });
}

export function tuboscopeInspectionCells(text){
  if(!/Hoja de Recuento Heavyweight/i.test(text))return null;
  return text.split('\n').flatMap(line=>{const m=line.match(/^\s*(\d+)\s+([A-Z0-9][A-Z0-9._-]{2,63})\s+(\S+)\s+(\S+)\s+\d+[.,]\d+/i);if(!m||!validSerial(serialNormalizer(m[2])))return [];return [{serial:serialNormalizer(m[2]),rawSerial:m[2],cells:{pin:m[3].toUpperCase(),box:m[4].toUpperCase(),measurements:line.replace(/^\s*\d+\s+\S+\s+\S+\s+\S+\s+/,'')},line}];});
}

export function enrichInspectionRecords(pages,records,template){
  if(!['SAIS_PREMIUM_HW','NOV_TUBOSCOPE_HW_INSPECTION'].includes(template))return records;
  for(const r of records)r.template=template;
  if(template!=='NOV_TUBOSCOPE_HW_INSPECTION')return records;
  const text=pages.map(p=>p.text).join('\n'),bySerial=new Map(records.map(r=>[r.serial,r]));
  // Las hojas complementarias amplían la misma inspección, nunca crean reparaciones.
  for(const page of pages.filter(p=>/Observaciones Hoja de Totales/i.test(p.text))){let current=null;
    for(const line of page.text.split('\n')){const first=line.trim().split(/\s+/)[0],record=bySerial.get(serialNormalizer(first));if(record){current=record;current.cells.findings=line.slice(line.indexOf(first)+first.length).trim();current.evidence.push({page:page.page,line,section:'OBSERVATIONS'});}else if(/Inspector|Disclaimer|Pág\.|Reporte generado/i.test(line))current=null;else if(current&&line.trim()){current.cells.findings+=' '+line.trim();current.evidence.push({page:page.page,line,section:'OBSERVATIONS'});}}
  }
  for(const page of pages.filter(p=>/Heavyweight Extra Data/i.test(p.text))){for(const line of page.text.split('\n')){const m=line.match(/^\d+\s+([A-Z0-9._-]+)\s+\d+[.,]\d+/i),r=m&&bySerial.get(serialNormalizer(m[1]));if(r){r.cells.measurements+='\nMediciones complementarias: '+line;r.evidence.push({page:page.page,line,section:'MEASUREMENTS'});}}}
  const count=Number(text.match(/(?:Tramos|Tubos) Inspeccionados:\s*(\d+)/i)?.[1]),immediate=Number(text.match(/Tubos para (?:Servicio de Perforación Inmediato \(c\/ BD\)|Uso Inmediato):\s*(\d+)/i)?.[1]),repair=Number(text.match(/Total (?:Length[s]? for Repair\(s\)|de Tubos para Reparación):\s*(\d+)/i)?.[1]),scrap=Number(text.match(/Sin posibilidad de reparación\s+(\d+)/i)?.[1]);
  const allowed=new Set(['OK','TG','TD','TC','TP','ST','TW','RF','RB']);
  const good=records.filter(r=>r.cells.pin==='OK'&&r.cells.box==='OK').length;
  const reconciled=count===records.length&&immediate===good&&repair===count-good&&scrap===0&&records.every(r=>[r.cells.pin,r.cells.box].every(v=>allowed.has(v)));
  for(const r of records){const goodRow=r.cells.pin==='OK'&&r.cells.box==='OK';r.cells.finalConformity=reconciled?(goodRow?'Conforme':'No conforme / reparable'):'';r.cells.observations=reconciled?'Conformidad obtenida de resultados PIN/BOX, contrastados con el resumen: '+immediate+' para uso inmediato y '+repair+' para reparación. El reporte no informa resultado individual del cuerpo.':'Resultados PIN/BOX sin conformidad individual verificable; revisar el resumen antes de guardar.';}
  return records;
}
