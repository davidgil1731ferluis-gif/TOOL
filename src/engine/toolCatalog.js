import {serialNormalizer,validSerial} from './serialNormalizer.js';
import {toolGroup} from './toolGroup.js';
import {statusEngine} from './statusEngine.js';
import {confirmCount} from './countValidator.js';
export const defaultGroups=[{id:'HWDP',name:'HWDP',color:'#2563eb'},{id:'OTRAS',name:'Otras',color:'#a85516'}];
export const groupId=tool=>tool?.groupId||toolGroup(tool?.serial||'');
export const groups=data=>[...defaultGroups,...(data.toolGroups||[]).filter(g=>!defaultGroups.some(d=>d.id===g.id))];
export const groupInfo=(data,tool)=>groups(data).find(g=>g.id===groupId(tool))||defaultGroups[1];
export function groupEntry(input){
 const name=String(input.name||'').trim().replace(/\s+/g,' '),color=String(input.color||'').toLowerCase();
 if(!name||name.length>60)throw new Error('El grupo debe tener un nombre de 1 a 60 caracteres.');
 if(!/^#[0-9a-f]{6}$/.test(color))throw new Error('Selecciona un color válido.');
 if(defaultGroups.some(g=>g.name.toLowerCase()===name.toLowerCase()))throw new Error('Ese grupo ya existe.');
 // El identificador depende del nombre para evitar duplicados entre dispositivos.
 const encoded=Array.from(name.toLocaleLowerCase()).map(c=>c.codePointAt(0).toString(16)).join('_');
 return {id:'g_'+encoded,name,color,createdAt:input.createdAt||new Date().toISOString()};
}
export function toolEntry(previous,input,data){
 const serial=serialNormalizer(input.serial),selected=String(input.groupId||toolGroup(serial)),toolType=String(input.toolType||'').trim();
 if(!validSerial(serial))throw new Error('Escribe un serial válido de 3 a 64 caracteres.');
 if(!groups(data).some(g=>g.id===selected))throw new Error('El grupo ya no está disponible.');
 if(toolType.length>100)throw new Error('El tipo de herramienta admite hasta 100 caracteres.');
 return {...(previous||statusEngine([])),id:serial,serial,group:toolGroup(serial),groupId:selected,toolType,registered:true,createdAt:previous?.createdAt||new Date().toISOString(),eventIds:previous?.eventIds||[]};
}
export function catalogDiff(previous,state){
 const writes=[];
 for(const name of ['tools','documents','events','bha','bhaMembers','toolGroups']){const before=new Map((previous[name]||[]).map(x=>[x.id,x])),after=new Map((state[name]||[]).map(x=>[x.id,x]));for(const [id,value] of after)if(JSON.stringify(before.get(id))!==JSON.stringify(value))writes.push({name,id,value});for(const id of before.keys())if(!after.has(id))writes.push({name,id,remove:true});}
 if(writes.length>475)throw new Error('Demasiados cambios para una sola eliminación. Elimina primero algunos reportes de esta herramienta.');
 return {state,writes};
}
export function applyGroup(previous,input){const state=structuredClone(previous),entry=groupEntry(input),old=(state.toolGroups||[]).find(g=>g.id===entry.id);if(old)throw new Error('Ese grupo ya existe.');state.toolGroups=[...(state.toolGroups||[]),entry];return {...catalogDiff(previous,state),entry};}
export function applyTool(previous,input){const state=structuredClone(previous),entry=toolEntry(state.tools.find(t=>t.serial===serialNormalizer(input.serial)),input,state);state.tools=state.tools.filter(t=>t.serial!==entry.serial).concat(entry);return {...catalogDiff(previous,state),entry};}
export function toolRemovalSnapshot(state,serial){return {toolCreatedAt:state.tools.find(t=>t.serial===serial)?.createdAt||'',eventIds:state.events.filter(e=>e.serial===serial).map(e=>e.id).sort(),documents:state.documents.filter(d=>state.events.some(e=>e.serial===serial&&e.documentId===d.id)).map(d=>({id:d.id,revision:d.revision||0,createdAt:d.createdAt})).sort((a,b)=>a.id.localeCompare(b.id))};}
export function applyToolRemoval(previous,serial,{snapshot}={}){
 if(!validSerial(serial))throw new Error('Serial inválido.');
 if(snapshot&&JSON.stringify(toolRemovalSnapshot(previous,serial))!==JSON.stringify(snapshot))throw new Error('El historial cambió en otra sesión. Revisa la herramienta antes de eliminar.');
 const state=structuredClone(previous),removed=state.events.filter(e=>e.serial===serial),affectedDocumentIds=[...new Set(removed.map(e=>e.documentId))],removedIds=new Set(removed.map(e=>e.id)),removedDocumentIds=[];
 state.tools=state.tools.filter(t=>t.serial!==serial);state.events=state.events.filter(e=>e.serial!==serial);state.bhaMembers=state.bhaMembers.filter(m=>m.toolId!==serial&&!removedIds.has(m.eventId));
 state.documents=state.documents.flatMap(d=>{if(!affectedDocumentIds.includes(d.id))return [d];const events=state.events.filter(e=>e.documentId===d.id);if(!events.length){removedDocumentIds.push(d.id);return [];}
   const next={...d,recordCount:events.length,eventIds:events.map(e=>e.id),revision:(d.revision||0)+1,updatedAt:new Date().toISOString(),validationMode:'corrected',excludedSerials:[...new Set([...(d.excludedSerials||[]),serial])]};
   if(d.expectedCount||d.countEvidence?.length)next.countConfirmation=confirmCount({...next,records:events});return [next];});
 state.bha=state.bha.filter(b=>!removedDocumentIds.includes(b.documentId));
 return {...catalogDiff(previous,state),affectedDocumentIds,removedDocumentIds};
}
