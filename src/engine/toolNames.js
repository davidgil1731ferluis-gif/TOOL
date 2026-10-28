import {serialNormalizer} from './serialNormalizer.js';
export const cleanToolName=value=>String(value??'').trim().replace(/\s+/g,' ');
export const nameKey=value=>cleanToolName(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
const descriptionName=value=>cleanToolName(value).replace(/^\(\d+\)\s*/, '');
export function namePatch(tool,input){
 if(!tool)throw new Error('La herramienta ya no está disponible.');
 if(input.baseCreatedAt!==tool.createdAt)throw new Error('La herramienta cambió de generación. Revisa el nombre.');
 const toolName=cleanToolName(input.toolName);
 if(!toolName||toolName.length>160)throw new Error('El nombre debe tener entre 1 y 160 caracteres.');
 const patch={toolName,nameSource:input.nameSource==='BHA'?'BHA':'MANUAL',nameSourceDocumentId:String(input.nameSourceDocumentId||''),nameSourceDate:String(input.nameSourceDate||'')};
 // Una repetición tras perder la conexión no vuelve a modificar el registro.
 if(input.operationId&&tool.nameOperationId===input.operationId)return {};
 if((tool.toolName||'')!==(input.baseName||''))throw new Error('El nombre cambió en otra sesión. Revisa la propuesta.');
 return {...patch,...(input.operationId?{nameOperationId:input.operationId}:{})};
}
export function applyToolName(previous,input){
 const state=structuredClone(previous),serial=serialNormalizer(input.serial),tool=state.tools.find(t=>t.serial===serial),patch=namePatch(tool,input);
 if(Object.keys(patch).length&&input.nameSource==='BHA')checkNameDocument(state.documents.find(d=>d.id===input.nameSourceDocumentId),input);
 Object.assign(tool,patch);return {state,entry:tool};
}
export function checkNameDocument(document,input){if(!document||document.type!=='BHA'||document.createdAt!==input.baseDocumentCreatedAt||(document.revision||0)!==input.baseDocumentRevision)throw new Error('El BHA cambió en otra sesión. Revisa la propuesta.');}
// Solo seriales ya existentes y descripciones explícitas: nunca cambia eventos.
export function toolNameProposals(data,extracted=[]){
 const documents=new Map(data.documents.map(d=>[d.id,d])),bySerial=new Map();
 for(const event of [...data.events,...extracted]){
  if(event.type!=='BHA'||!cleanToolName(event.fields?.description)||!/^\d{4}-\d{2}-\d{2}$/.test(event.date||event.fields?.bhaDate||''))continue;
  const day=event.date||event.fields.bhaDate,old=bySerial.get(event.serial);
  if(!old||day>old.day)bySerial.set(event.serial,{day,event,names:new Set([descriptionName(event.fields.description)])});
  else if(day===old.day)old.names.add(descriptionName(event.fields.description));
 }
 return data.tools.filter(t=>!cleanToolName(t.toolName)).flatMap(tool=>{
  const entry=bySerial.get(tool.serial);if(!entry||entry.names.size!==1)return [];
  const toolName=[...entry.names][0],document=documents.get(entry.event.documentId);if(!toolName||toolName.length>160||!document||document.type!=='BHA')return [];
  return [{serial:tool.serial,toolName,baseName:tool.toolName||'',baseCreatedAt:tool.createdAt,nameSource:'BHA',nameSourceDocumentId:document.id,nameSourceDate:entry.day,baseDocumentCreatedAt:document.createdAt,baseDocumentRevision:document.revision||0}];
 }).sort((a,b)=>a.serial.localeCompare(b.serial));
}
