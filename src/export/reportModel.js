import {toolGroup} from '../engine/toolGroup.js';
import {fieldDefinitions} from '../engine/fieldExtractor.js';
import {matrixValidator} from '../engine/matrixValidator.js';
const col=(label,type='text')=>({label,type});
export function reportModel(data,{group='ALL',search='',pending=[]}={}) {
  const matches=serial=>(group==='ALL'||toolGroup(serial)===group)&&serial.includes(search);
  const tools=data.tools.filter(t=>matches(t.serial)).sort((a,b)=>toolGroup(a.serial).localeCompare(toolGroup(b.serial))||a.serial.localeCompare(b.serial));
  const documents=new Map(data.documents.map(d=>[d.id,d]));
  const names={INSPECTION:'Inspección',REPAIR:'Reparación',BHA:'BHA'};
  const results={CONFORME:'Conforme',NO_CONFORME_REPARABLE:'No conforme · reparable',NO_CONFORME_FUERA_SERVICIO:'Fuera de servicio'};
  const serials=[...new Set([...tools.map(t=>t.serial),...data.events.filter(e=>matches(e.serial)).map(e=>e.serial)])].sort((a,b)=>toolGroup(a).localeCompare(toolGroup(b))||a.localeCompare(b));
  const grouped=new Map(serials.map(serial=>[serial,[]]));
  for(const e of data.events.filter(e=>matches(e.serial)).sort((a,b)=>a.date.localeCompare(b.date)||(a.createdAt||'').localeCompare(b.createdAt||'')||a.id.localeCompare(b.id)))grouped.get(e.serial).push(e);
  const eventColumns=[col('Fecha','date'),col('Tipo'),col('Empresa'),col('Reporte'),col('Resultado'),col('Detalles clave')];
  const eventValues=e=>{const f=e.fields;const keys=e.type==='INSPECTION'?[['body','Cuerpo'],['pin','PIN'],['box','BOX'],['findings','Hallazgos']]:e.type==='REPAIR'?[['workOrder','Orden'],['pin','PIN'],['box','BOX'],['machining','Maquinado']]:[['well','Pozo'],['phase','Fase']];return [e.date,names[e.type],f.issuer||'',f.certificateNumber||f.reportNumber||f.bhaNumber||'',e.type==='REPAIR'?'Operativa':e.type==='BHA'?'Uso en BHA':results[f.finalConformity]||f.finalConformity||'',keys.filter(([k])=>f[k]).map(([k,label])=>label+': '+f[k]).join(' · ')];};
  const maxEvents=Math.max(0,...serials.map(serial=>grouped.get(serial).length));
  if(2+maxEvents*eventColumns.length>16384)throw new Error('El historial de una herramienta supera las 16.384 columnas de Excel.');
  const horizontal={name:'Historial por herramienta',columns:[col('Serial'),col('Grupo'),...Array.from({length:maxEvents},(_,i)=>eventColumns.map(c=>({...c,label:`Evento ${i+1} · ${c.label}`}))).flat()],rows:serials.map(serial=>{const events=grouped.get(serial);return [serial,toolGroup(serial),...Array.from({length:maxEvents},(_,i)=>events[i]?eventValues(events[i]):eventColumns.map(()=>'')).flat()];})};
  const sheets=[horizontal];
  for(const [type,name] of [['INSPECTION','Inspecciones'],['REPAIR','Reparaciones'],['BHA','BHA']]){
    const defs=fieldDefinitions[type];
    sheets.push({name,columns:[col('Serial'),col('Grupo'),...defs.map(([,label,kind])=>col(label,kind==='date'?'date':'text')),col('PDF de origen'),col('Páginas'),col('Serial original'),col('ID del documento'),col('ID del evento')],rows:data.events.filter(e=>e.type===type&&matches(e.serial)).sort((a,b)=>a.serial.localeCompare(b.serial)||a.date.localeCompare(b.date)).map(e=>[e.serial,toolGroup(e.serial),...defs.map(([key])=>e.fields[key]),documents.get(e.documentId)?.name||'', [...new Set((e.evidence||[]).map(x=>x.page))].join(', '),e.rawSerial||e.serial,e.documentId,e.id])});
  }
  const waiting=[];
  const pendingDefs=[...new Map(Object.values(fieldDefinitions).flat().map(def=>[def[0],def])).values()];
  for(const d of pending){
    if(!d.records?.length){if(group==='ALL'&&!search)waiting.push(['','',d.name,d.type,d.error||'Sin seriales detectados',...pendingDefs.map(()=>''),'']);continue;}
    for(const r of d.records){if(!matches(r.serial))continue;const errors=[d.error,...matrixValidator(d.type,r)].filter(Boolean).join(' ').replace(/\b[a-zA-Z]+\b/g,key=>pendingDefs.find(([k])=>k===key)?.[1]||key);waiting.push([r.serial,toolGroup(r.serial),d.name,d.type,errors,...pendingDefs.map(([key])=>r.fields?.[key]||''),[...new Set((r.evidence||[]).map(e=>e.page))].join(', ')]);}
  }
  if(waiting.length)sheets.push({name:'Por completar',columns:[...['Serial','Grupo','PDF de origen','Tipo','Datos por completar'].map(x=>col(x)),...pendingDefs.map(([,label])=>col(label)),col('Páginas')],rows:waiting});
  return sheets.map(s=>({...s,rows:s.rows.map(row=>row.map(value=>value??''))}));
}
