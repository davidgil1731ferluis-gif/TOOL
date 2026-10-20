import {nameKey} from './toolNames.js';
import {groupId} from './toolCatalog.js';
import {serialNormalizer} from './serialNormalizer.js';
export function toolMatches(tool,events,{group='ALL',search='',name='',from='',to='',status='ALL'}={}){
 if(group!=='ALL'&&groupId(tool)!==group)return false;
 if(!tool.serial.includes(serialNormalizer(search)))return false;
 if(name&&!nameKey(tool.toolName).includes(nameKey(name)))return false;
 if(status!=='ALL'&&(tool.status||'SIN_ESTADO_TECNICO')!==status)return false;
 if(from&&to&&from>to)return false;
 return !(from||to)||events.some(e=>e.serial===tool.serial&&/^\d{4}-\d{2}-\d{2}$/.test(e.date||'')&&(!from||e.date>=from)&&(!to||e.date<=to));
}
