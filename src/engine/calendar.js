import {normalizeDate} from './fieldExtractor.js';
import {serialNormalizer,validSerial} from './serialNormalizer.js';
export const eventTypes=['INSPECTION','REPAIR','BHA'];
export function scheduleEntry(input){
  const title=String(input.title||'').trim(),date=normalizeDate(input.date||''),type=input.type,serial=serialNormalizer(input.serial||''),notes=String(input.notes||'').trim();
  if(!title||title.length>160)throw new Error('Escribe un título de hasta 160 caracteres.');
  if(!date||!eventTypes.includes(type))throw new Error('Selecciona una fecha y un tipo válidos.');
  if(serial&&!validSerial(serial))throw new Error('Revisa el serial. Puedes dejarlo vacío.');
  if(notes.length>2000)throw new Error('Las notas admiten hasta 2000 caracteres.');
  return {id:input.id||crypto.randomUUID(),title,date,type,serial,notes,createdAt:input.createdAt||new Date().toISOString()};
}
// Un reporte multiserial representa una actividad por fecha, no decenas de citas.
export function calendarActivities(data){
  const docs=new Map(data.documents.map(d=>[d.id,d])),map=new Map();
  for(const e of data.events){const key=[e.documentId,e.type,e.date].join('|');let a=map.get(key);if(!a){a={id:key,date:e.date,type:e.type,title:docs.get(e.documentId)?.name||e.fields.reportNumber||e.fields.certificateNumber||'BHA '+e.fields.bhaNumber,documentId:e.documentId,serials:[],planned:false};map.set(key,a);}a.serials.push(e.serial);}
  return [...map.values(),...(data.scheduledEvents||[]).map(e=>({...e,serials:e.serial?[e.serial]:[],planned:true}))].sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title));
}
export function timelineSeries(data){
  const map=new Map();for(const a of calendarActivities(data).filter(e=>!e.planned)){if(!map.has(a.date))map.set(a.date,{date:a.date,INSPECTION:0,REPAIR:0,BHA:0});map.get(a.date)[a.type]++;}
  return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
