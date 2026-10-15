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
 return {...(previous||statusEngine([])),id:serial,serial,group:toolGroup(serial),groupId:selected,toolType,registered:true,createdAt:previous?.createdAt||input.createdAt||new Date().toISOString(),eventIds:previous?.eventIds||[]};
}
export function catalogDiff(previous,state){
 const writes=[];
 for(const name of ['tools','documents','events','bha','bhaMembers','toolGroups']){const before=new Map((previous[name]||[]).map(x=>[x.id,x])),after=new Map((state[name]||[]).map(x=>[x.id,x]));for(const [id,value] of after)if(JSON.stringify(before.get(id))!==JSON.stringify(value))writes.push({name,id,value});for(const id of before.keys())if(!after.has(id))writes.push({name,id,remove:true});}
 if(writes.length>475)throw new Error('La operación supera el límite seguro. Divide los cambios en grupos más pequeños.');
 return {state,writes};
}
export function applyGroup(previous,input){const state=structuredClone(previous),entry=groupEntry(input),old=(state.toolGroups||[]).find(g=>g.id===entry.id);if(old||groups(state).some(g=>g.name.toLocaleLowerCase()===entry.name.toLocaleLowerCase()))throw new Error('Ese grupo ya existe.');state.toolGroups=[...(state.toolGroups||[]),entry];return {...catalogDiff(previous,state),entry};}
export function applyGroupUpdate(previous,input,{baseCreatedAt}={}){
 const state=structuredClone(previous),old=(state.toolGroups||[]).find(g=>g.id===input.id);if(!old)throw new Error('El grupo ya no está disponible.');
 if(baseCreatedAt&&old.createdAt!==baseCreatedAt)throw new Error('El grupo cambió de generación. Recupera la versión en línea para revisarlo.');
 const checked=groupEntry(input);if(groups(state).some(g=>g.id!==old.id&&g.name.toLocaleLowerCase()===checked.name.toLocaleLowerCase()))throw new Error('Ese nombre de grupo ya existe.');
 const entry={...old,name:checked.name,color:checked.color};state.toolGroups=state.toolGroups.map(g=>g.id===old.id?entry:g);return {...catalogDiff(previous,state),entry};
}
export function applyGroupRemoval(previous,id,targetId,{baseCreatedAt}={}){
 const state=structuredClone(previous),old=(state.toolGroups||[]).find(g=>g.id===id);if(defaultGroups.some(g=>g.id===id))throw new Error('Los grupos iniciales no se pueden eliminar.');
 if(!old)throw new Error('El grupo ya no está disponible.');if(baseCreatedAt&&old.createdAt!==baseCreatedAt)throw new Error('El grupo cambió de generación. Recupera la versión en línea para revisarlo.');
 if(id===targetId||!groups(state).some(g=>g.id===targetId))throw new Error('Selecciona otro grupo de destino.');
 const serials=state.tools.filter(t=>groupId(t)===id).map(t=>t.serial);state.tools=state.tools.map(t=>groupId(t)===id?{...t,groupId:targetId}:t);state.toolGroups=state.toolGroups.filter(g=>g.id!==id);
 return {...catalogDiff(previous,state),serials};
}
export function assignmentSerials(input){const serials=[...new Set((Array.isArray(input)?input:String(input||'').split(/[\s,;]+/)).map(serialNormalizer).filter(Boolean))];if(!serials.length||serials.length>100)throw new Error('Añade entre 1 y 100 seriales por vez.');if(!serials.every(validSerial))throw new Error('Revisa los seriales: hay valores inválidos.');return serials;}
export function applyAssignments(previous,input){let state=previous;const serials=assignmentSerials(input.serials);for(const serial of serials){const old=state.tools.find(t=>t.serial===serial);state=applyTool(state,{serial,groupId:input.groupId,toolType:old?.toolType||''}).state;}return {...catalogDiff(previous,state),serials};}
export function groupToolsSnapshot(state,id){return {groupCreatedAt:(state.toolGroups||[]).find(g=>g.id===id)?.createdAt||'',tools:state.tools.filter(t=>groupId(t)===id).map(t=>({serial:t.serial,...toolRemovalSnapshot(state,t.serial)})).sort((a,b)=>a.serial.localeCompare(b.serial))};}
export function applyGroupToolsRemoval(previous,id,{snapshot}={}){
 if(!groups(previous).some(g=>g.id===id))throw new Error('El grupo ya no está disponible.');
 if(snapshot&&JSON.stringify(groupToolsSnapshot(previous,id))!==JSON.stringify(snapshot))throw new Error('El historial del grupo cambió en otra sesión. Revisa los seriales antes de eliminar.');
 const serials=previous.tools.filter(t=>groupId(t)===id).map(t=>t.serial),selected=new Set(serials),state=structuredClone(previous),removed=state.events.filter(e=>selected.has(e.serial)),affectedDocumentIds=[...new Set(removed.map(e=>e.documentId))],removedIds=new Set(removed.map(e=>e.id)),removedDocumentIds=[];
 if(!serials.length)throw new Error('Este grupo no contiene seriales.');
 state.tools=state.tools.filter(t=>!selected.has(t.serial));state.events=state.events.filter(e=>!selected.has(e.serial));state.bhaMembers=state.bhaMembers.filter(m=>!selected.has(m.toolId)&&!removedIds.has(m.eventId));
 state.documents=state.documents.flatMap(d=>{if(!affectedDocumentIds.includes(d.id))return [d];const events=state.events.filter(e=>e.documentId===d.id);if(!events.length){removedDocumentIds.push(d.id);return [];}
  const excluded=removed.filter(e=>e.documentId===d.id).map(e=>e.serial),next={...d,recordCount:events.length,eventIds:events.map(e=>e.id),revision:(d.revision||0)+1,updatedAt:new Date().toISOString(),validationMode:'corrected',excludedSerials:[...new Set([...(d.excludedSerials||[]),...excluded])]};if(d.expectedCount||d.countEvidence?.length)next.countConfirmation=confirmCount({...next,records:events});return [next];});
 state.bha=state.bha.filter(b=>!removedDocumentIds.includes(b.documentId));
 const result=catalogDiff(previous,state);return {...result,serials,affectedDocumentIds,removedDocumentIds};
}
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
