import {serialNormalizer,validSerial} from './serialNormalizer.js';
export function countEvidence(pages,type,rowCount=0){
 const evidence=[];
 if(['INSPECTION','REPAIR'].includes(type))for(const page of pages){
   const expression=type==='INSPECTION'?/(Cantidad de Componentes|Tramos Inspeccionados|Tubos Inspeccionados)\s*:\s*(\d+)/gi:/(Tubos Inspeccionados)\s*:\s*(\d+)/gi;
   for(const match of page.text.matchAll(expression))if(+match[2]>0)evidence.push({page:page.page||1,label:match[1],count:+match[2]});
 }
 if(!evidence.length&&rowCount)evidence.push({page:0,label:'Numeración de filas',count:rowCount});
 return evidence;
}
function snapshot(draft){return {type:draft.type,expectedCount:Number(draft.expectedCount)||0,declaredCounts:[...new Set((draft.countEvidence||[]).map(e=>Number(e.count)).filter(n=>n>0))].sort((a,b)=>a-b),serials:(draft.records||[]).map(r=>serialNormalizer(r.serial)).sort()};}
export function needsCountReview(draft){return Boolean(draft.expectedCount&&draft.records?.length!==draft.expectedCount)||new Set((draft.countEvidence||[]).map(e=>e.count)).size>1;}
export function confirmedCount(draft){
 const confirmation=draft.countConfirmation;
 if(!confirmation||!Number.isFinite(Date.parse(confirmation.confirmedAt)))return false;
 const current=snapshot(draft),{confirmedAt,...saved}=confirmation;
 return current.serials.length>0&&current.serials.every(validSerial)&&new Set(current.serials).size===current.serials.length&&saved.type===current.type&&saved.expectedCount===current.expectedCount&&JSON.stringify(saved.declaredCounts)===JSON.stringify(current.declaredCounts)&&JSON.stringify(saved.serials)===JSON.stringify(current.serials);
}
export function confirmCount(draft){
 const current=snapshot(draft);
 if(!current.serials.length||current.serials.length>100||!current.serials.every(validSerial)||new Set(current.serials).size!==current.serials.length)throw new Error('Corrige los seriales inválidos o repetidos antes de confirmar la cantidad.');
 return {...current,confirmedAt:new Date().toISOString()};
}
