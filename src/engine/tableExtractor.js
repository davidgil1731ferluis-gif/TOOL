import {fieldDefinitions,normalizeDate} from './fieldExtractor.js';
import {serialNormalizer} from './serialNormalizer.js';
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const aliases={description:['descripcion','descripcion de la herramienta','tool description','description of tool'],serial:['serial','seriales','numero de serie','no de serie','s/n','serial number','serial no'],issuer:['empresa','empresa emisora','company','inspection company','emitido por'],certificateNumber:['certificado','numero de certificado','certificado / numero de formato','certificate number'],reportNumber:['reporte','numero de reporte','report number','report no','informe'],formatCode:['codigo de formato','format code'],formatVersion:['version','revision'],versionDate:['fecha de version','fecha vigencia','version date'],inspectionDate:['fecha de inspeccion','inspection date'],issueDate:['fecha de emision','issue date'],body:['cuerpo','body'],pin:['pin','estado pin'],box:['box','estado box'],finalConformity:['conformidad final','resultado final','final conformity'],repairDate:['fecha de reparacion','repair date'],workOrder:['orden de trabajo','work order','ot'],machining:['maquinado','machining'],bhaNumber:['numero bha','bha numero','bha no','bha number','bha'],well:['pozo','well','locacion'],phase:['fase','phase'],bhaDate:['fecha bha','fecha','date'],observations:['observaciones','observations'],findings:['hallazgos','findings']};
for(const defs of Object.values(fieldDefinitions))for(const [key,label] of defs)aliases[key]=[...(aliases[key]||[]),key,label];
const lookup=new Map(Object.entries(aliases).flatMap(([k,vs])=>vs.map(v=>[norm(v),k])));
for(const label of ['numero de formato','numero formato','no certificado'])lookup.set(norm(label),'certificateNumber');
for(const label of ['no serial','numero serial','n serial'])lookup.set(norm(label),'serial');
export const columnKey=v=>lookup.get(norm(v))||'';
function value(v,key){if(v instanceof Date)return v.toISOString().slice(0,10);const s=String(v??'').trim();if(/Date$/.test(key))return normalizeDate(s)||s;if(key==='finalConformity'){const n=norm(s);if(['conforme','ok','pass'].includes(n))return 'CONFORME';if(['noconformereparable','reparable'].includes(n))return 'NO_CONFORME_REPARABLE';if(['noconformefueraservicio','fueradeservicio','fueraservicio','scrap'].includes(n))return 'NO_CONFORME_FUERA_SERVICIO';}return s;}
export function tablePage(rows,page=1,sheet=''){
  const metadata={};let columns=[],records=[],header=-1;
  for(let i=0;i<rows.length;i++){
    const keys=rows[i].map(columnKey);
    if(keys.includes('serial')&&keys.filter(Boolean).length>=2){header=i;columns=keys;break;}
    const key=columnKey(rows[i][0]);if(key&&rows[i][1]!==undefined)metadata[key]=value(rows[i][1],key);
  }
  if(header>=0)for(let i=header+1;i<rows.length;i++){
    const row=rows[i];if(!row.some(v=>String(v??'').trim()))continue;
    if(columnKey(row[columns.indexOf('serial')])==='serial')continue;
    const fields={...metadata};columns.forEach((key,j)=>{if(key&&String(row[j]??'').trim())fields[key]=value(row[j],key);});
    const rawSerial=String(fields.serial??'');delete fields.serial;
    records.push({serial:serialNormalizer(rawSerial),rawSerial,cells:fields,evidence:[{page,sheet,line:row.map(v=>v instanceof Date?v.toISOString().slice(0,10):String(v??'')).join(' | ')}]});
  }
  if(header<0&&metadata.serial){const rawSerial=String(metadata.serial),fields={...metadata};delete fields.serial;records.push({serial:serialNormalizer(rawSerial),rawSerial,cells:fields,evidence:[{page,sheet,line:rows.map(r=>r.join(' : ')).join('\n')}]});}
  const keys=new Set([...Object.keys(metadata),...columns]);
  const types=[keys.has('inspectionDate')||keys.has('finalConformity')?'INSPECTION':'',keys.has('repairDate')||(keys.has('machining')&&keys.has('workOrder'))?'REPAIR':'',keys.has('bhaNumber')?'BHA':''].filter(Boolean);
  const type=types.length===1?types[0]:'';
  if(type==='INSPECTION')for(const r of records){if(!r.cells.certificateNumber&&r.cells.reportNumber)r.cells.certificateNumber=r.cells.reportNumber;}
  if(type&&type!=='BHA')for(const r of records){const key=type==='INSPECTION'?'inspectionDate':'repairDate';r.cells[key]||=r.cells.bhaDate||'';delete r.cells.bhaDate;}
  return {page,sheet,text:rows.map(r=>r.map(v=>v instanceof Date?v.toISOString().slice(0,10):String(v??'')).join(' | ')).join('\n'),structuredRecords:records,structuredType:type,mixedTypes:types.length>1};
}
