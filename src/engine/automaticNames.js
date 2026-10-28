import {cleanToolName,nameKey} from './toolNames.js';
import {serialNormalizer} from './serialNormalizer.js';
const methods=new Set(['spreadsheet-cell','pdf-columns','table-cell']);
export function verifiedName(event){
 const proof=event.nameEvidence,value=cleanToolName(event.fields?.description).replace(/^\(\d+\)\s*/,''),key=nameKey(value);
 if(!proof||!methods.has(proof.method)||serialNormalizer(proof.serial)!==event.serial||nameKey(String(proof.value||'').replace(/^\(\d+\)\s*/,''))!==key)return '';
 if(proof.ambiguous||event.descriptionConflict||!/[a-záéíóúñ]/i.test(value)||value.length<3||value.length>160||/^(n\/?a|no aplica|varios|sin nombre|descripcion|description|herramienta|tool|unknown|[-—]+)$/i.test(value)||key===nameKey(event.serial))return '';
 return value;
}
// Only new, accepted reports may fill blank names. Never rewrite a name or old events.
export function automaticToolNames(state,incoming){
 const tools=new Map(state.tools.map(t=>[t.serial,t])),history=new Map();
 for(const event of state.events)if(['BHA','INSPECTION'].includes(event.type)){
  if(!history.has(event.serial))history.set(event.serial,[]);history.get(event.serial).push(event);
 }
 const proposals=new Map();
 for(const event of incoming){const tool=tools.get(event.serial),name=verifiedName(event);if(!tool||cleanToolName(tool.toolName)||tool.nameSource==='MANUAL'||!name)continue;
  const own=history.get(event.serial)||[],newest=own.reduce((d,e)=>e.date>d?e.date:d,'');if(event.date!==newest)continue;
  const latest=own.filter(e=>e.date===newest),keys=new Set(latest.map(e=>nameKey(String(e.fields?.description||'').replace(/^\(\d+\)\s*/,''))));
  if(keys.size!==1||!keys.has(nameKey(name))||latest.some(e=>e.descriptionConflict||e.nameEvidence?.ambiguous))continue;
  proposals.set(event.serial,{serial:event.serial,toolName:name,nameSource:event.type==='BHA'?'BHA':'DOCUMENT',nameSourceDocumentId:event.documentId,nameSourceDate:event.date});
 }
 return [...proposals.values()];
}
