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
 const candidates=[...data.events.filter(e=>e.type==='BHA'),...extracted.filter(e=>e.type==='BHA')].filter(e=>cleanToolName(e.fields?.description)&&/^\d{4}-\d{2}-\d{2}$/.test(e.date||e.fields?.bhaDate||''));
 return data.tools.filter(t=>!cleanToolName(t.toolName)).flatMap(tool=>{
  const own=candidates.filter(e=>e.serial===tool.serial).sort((a,b)=>(b.date||b.fields.bhaDate).localeCompare(a.date||a.fields.bhaDate));if(!own.length)return [];
  const latest=own[0],day=latest.date||latest.fields.bhaDate,names=[...new Set(own.filter(e=>(e.date||e.fields.bhaDate)===day).map(e=>descriptionName(e.fields.description)))];
  if(names.length!==1||!names[0]||names[0].length>160)return [];
  const document=data.documents.find(d=>d.id===latest.documentId);if(!document||document.type!=='BHA')return [];
  return [{serial:tool.serial,toolName:names[0],baseName:tool.toolName||'',baseCreatedAt:tool.createdAt,nameSource:'BHA',nameSourceDocumentId:latest.documentId,nameSourceDate:day,baseDocumentCreatedAt:document.createdAt,baseDocumentRevision:document.revision||0}];
 }).sort((a,b)=>a.serial.localeCompare(b.serial));
}
