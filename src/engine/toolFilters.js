import {nameKey} from './toolNames.js';
import {groupId} from './toolCatalog.js';
import {serialNormalizer} from './serialNormalizer.js';
import {isUsableStatus} from './dashboardMetrics.js';
export function eventBound(value){
 if(value===undefined||value===null||String(value).trim()==='')return null;
 const text=String(value).trim(),number=Number(text);return /^\d+$/.test(text)&&Number.isSafeInteger(number)?number:NaN;
}
export function eventCountError(minEvents,maxEvents){
 const min=eventBound(minEvents),max=eventBound(maxEvents);
 if(Number.isNaN(min)||Number.isNaN(max))return 'Usa cantidades enteras de cero en adelante.';
 return min!==null&&max!==null&&min>max?'El mínimo de eventos no puede superar el máximo.':'';
}
export function toolMatches(tool,events,{group='ALL',subgroup='ALL',search='',name='',query='',from='',to='',status='ALL',minEvents='',maxEvents=''}={}){
 if(group!=='ALL'&&groupId(tool)!==group)return false;
 if(subgroup!=='ALL'&&(subgroup==='NONE'?!!tool.subgroupId:tool.subgroupId!==subgroup))return false;
 if(query&&!(tool.serial.includes(serialNormalizer(query))||nameKey(tool.toolName).includes(nameKey(query))))return false;
 if(!tool.serial.includes(serialNormalizer(search)))return false;
 if(name&&!nameKey(tool.toolName).includes(nameKey(name)))return false;
 if(status==='APTAS'){if(!isUsableStatus(tool.status))return false;}else if(status!=='ALL'&&(tool.status||'SIN_ESTADO_TECNICO')!==status)return false;
 if(from&&to&&from>to)return false;
 if(eventCountError(minEvents,maxEvents))return false;
 const min=eventBound(minEvents),max=eventBound(maxEvents);if(min===null&&max===null&&!from&&!to)return true;
 const own=events instanceof Map?events.get(tool.serial)||[]:events.filter(e=>e.serial===tool.serial);
 if((min!==null&&own.length<min)||(max!==null&&own.length>max))return false;
 return !(from||to)||own.some(e=>/^\d{4}-\d{2}-\d{2}$/.test(e.date||'')&&(!from||e.date>=from)&&(!to||e.date<=to));
}
