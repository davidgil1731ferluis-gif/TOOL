import {serialNormalizer} from '../engine/serialNormalizer.js';
import {matrixValidator} from '../engine/matrixValidator.js';
import {fieldDefinitions} from '../engine/fieldExtractor.js';
import {eventCreator} from '../engine/eventCreator.js';
import {statusEngine} from '../engine/statusEngine.js';
import {toolGroup} from '../engine/toolGroup.js';
import {scheduleEntry} from '../engine/calendar.js';
export const collectionNames=['tools','documents','events','bha','bhaMembers'];
export const emptyState=()=>({...Object.fromEntries(collectionNames.map(key=>[key,[]])),scheduledEvents:[]});
export async function digest(value) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256',typeof value==='string'?new TextEncoder().encode(value):value))].map(x=>x.toString(16).padStart(2,'0')).join(''); }
export function documentErrors(draft) {
  const errors=[];
  if(!fieldDefinitions[draft.type]) errors.push('Seleccione el tipo de documento.');
  if(!draft.records?.length) errors.push('No se detectaron seriales.');
  if(draft.records?.length>100) errors.push('Máximo 100 seriales por documento.');
  if(draft.expectedCount&&draft.records?.length!==draft.expectedCount) errors.push(`El PDF indica ${draft.expectedCount} seriales y se detectaron ${draft.records?.length||0}.`);
  const seen=new Set();
  for(const record of draft.records||[]) {
    const serial=serialNormalizer(record.serial);
    if(seen.has(serial)) errors.push(`Serial repetido: ${serial}.`);seen.add(serial);
    errors.push(...matrixValidator(draft.type,{...record,serial}).map(error=>`${serial||'Sin serial'}: ${error}`));
  }
  const common={INSPECTION:['certificateNumber','formatCode','formatVersion','versionDate','issuer','inspectionDate','issueDate'],REPAIR:['issuer','reportNumber','workOrder'],BHA:['bhaNumber','well','phase','bhaDate']}[draft.type]||[];
  for(const key of common) if(new Set((draft.records||[]).map(r=>String(r.fields[key]||'').trim())).size>1) errors.push(`El dato ${key} debe coincidir en todo el reporte.`);
  return errors;
}
export async function prepare(draft) {
  const errors=documentErrors(draft);if(errors.length) throw new Error(errors.join(' '));
  const at=new Date().toISOString();const events=[];
  for(const record of draft.records) {
    const fields=Object.fromEntries(fieldDefinitions[draft.type].map(([key])=>[key,String(record.fields[key]??'').trim()]));
    const serial=serialNormalizer(record.serial);
    const ref=(fields.certificateNumber||fields.reportNumber||fields.bhaNumber).toUpperCase();
    const date=fields.inspectionDate||fields.repairDate||fields.bhaDate;
    const id=await digest(JSON.stringify([draft.type,(fields.issuer||'').toUpperCase(),ref,serial,date,fields.well||'']));
    events.push({...eventCreator(draft.type,{...record,serial,fields},draft.id,id,at),sourceEventId:record.sourceEventId||''});
  }
  const document={id:draft.id,name:draft.name,type:draft.type,template:draft.template||'GENERIC_REVIEW',sha256:draft.id,recordCount:events.length,createdAt:at,storage:'LOCAL_DEVICE',reviewed:true,validationMode:draft.validationMode||'automatic',eventIds:events.map(e=>e.id),revision:1};
  const bha=draft.type==='BHA'?{id:draft.id,documentId:draft.id,number:events[0].fields.bhaNumber,well:events[0].fields.well,phase:events[0].fields.phase,date:events[0].date,createdAt:at}:null;
  return {document,events,bha};
}
// El mismo plan se aplica al modo local y a la transacción Firestore.
export function applyCommit(previous,prepared,{editing=false,baseRevision=0}={}) {
  const state=structuredClone(previous);const p=structuredClone(prepared);
  const original=state.documents.find(d=>d.id===p.document.id);
  if(!editing&&original) throw new Error('Este PDF ya fue guardado.');
  if(editing&&!original) throw new Error('El documento ya no está disponible.');
  if(editing&&(original.revision||0)!==baseRevision) throw new Error('El reporte cambió en otra sesión. Ábrelo de nuevo antes de editar.');
  if(editing&&original.type!==p.document.type) throw new Error('No se puede cambiar el tipo de un reporte guardado.');
  const oldEvents=state.events.filter(e=>e.documentId===p.document.id);
  for(const event of p.events) {
    if(state.events.some(e=>e.id===event.id&&e.documentId!==p.document.id)) throw new Error(`Ya existe un evento de ${event.serial} con ese reporte y fecha.`);
    const source=oldEvents.find(e=>e.id===event.sourceEventId)||oldEvents.find(e=>e.id===event.id);
    event.createdAt=source?.createdAt||event.createdAt;
    if(editing)event.updatedAt=p.document.createdAt;
    delete event.sourceEventId;
  }
  if(original) p.document={...p.document,createdAt:original.createdAt,updatedAt:p.document.createdAt,revision:(original.revision||0)+1};
  state.documents=state.documents.filter(d=>d.id!==p.document.id).concat(p.document);
  state.events=state.events.filter(e=>e.documentId!==p.document.id).concat(p.events);
  const affected=new Set([...oldEvents,...p.events].map(e=>e.serial));
  for(const serial of affected) {
    const events=state.events.filter(e=>e.serial===serial);const tool=state.tools.find(t=>t.serial===serial);
    state.tools=state.tools.filter(t=>t.serial!==serial);
    if(events.length) state.tools.push({...tool,id:serial,serial,group:toolGroup(serial),createdAt:tool?.createdAt||events[0].createdAt,eventIds:events.map(e=>e.id),...statusEngine(events)});
  }
  state.bha=state.bha.filter(b=>b.documentId!==p.document.id);
  state.bhaMembers=state.bhaMembers.filter(m=>m.bhaId!==p.document.id);
  if(p.bha) {
    state.bha.push({...p.bha,createdAt:original?.createdAt||p.bha.createdAt});
    state.bhaMembers.push(...p.events.map(e=>({id:e.id,bhaId:p.bha.id,toolId:e.serial,eventId:e.id,fields:e.fields})));
  }
  const writes=[];
  for(const name of collectionNames) {
    const oldMap=new Map(previous[name].map(x=>[x.id,x]));const newMap=new Map(state[name].map(x=>[x.id,x]));
    for(const [id,value] of newMap) if(JSON.stringify(oldMap.get(id))!==JSON.stringify(value)) writes.push({name,id,value});
    for(const id of oldMap.keys()) if(!newMap.has(id)) writes.push({name,id,remove:true});
  }
  if(writes.length>480) throw new Error('Demasiados cambios para una sola operación. Modifica menos seriales a la vez.');
  return {state,writes,document:p.document};
}
export class DemoRepository {
  constructor(){this.key='tooltrace-explicit-demo-v1';}
  async load(){return {...emptyState(),...JSON.parse(localStorage.getItem(this.key)||'{}')};}
  async saveSchedule(input){const entry=scheduleEntry(input);const commit=async()=>{const state=await this.load();state.scheduledEvents=state.scheduledEvents.filter(e=>e.id!==entry.id).concat(entry);localStorage.setItem(this.key,JSON.stringify(state));return entry;};return navigator.locks?navigator.locks.request('tooltrace-demo-write',commit):commit();}
  async deleteSchedule(id){const commit=async()=>{const state=await this.load();state.scheduledEvents=state.scheduledEvents.filter(e=>e.id!==id);localStorage.setItem(this.key,JSON.stringify(state));};return navigator.locks?navigator.locks.request('tooltrace-demo-write',commit):commit();}
  async clearAll(){const commit=()=>localStorage.setItem(this.key,JSON.stringify(emptyState()));return navigator.locks?navigator.locks.request('tooltrace-demo-write',commit):commit();}
  async save(draft,options={}) {
    const prepared=await prepare(draft);
    const commit=async()=>{const result=applyCommit(await this.load(),prepared,options);localStorage.setItem(this.key,JSON.stringify(result.state));return result.document;};
    return globalThis.navigator?.locks?navigator.locks.request('tooltrace-demo-write',commit):commit();
  }
}
