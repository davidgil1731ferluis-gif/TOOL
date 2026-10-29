import {normalizeDate} from './fieldExtractor.js';
const DAY=86400000;
const known=new Set(['OPERATIVA','CONFORME','NO_CONFORME_REPARABLE','NO_CONFORME_FUERA_SERVICIO']);
export const isUsableStatus=status=>status==='OPERATIVA'||status==='CONFORME';
export const toolStatusLabel=status=>isUsableStatus(status)?'Operativa / conforme':({NO_CONFORME_REPARABLE:'No conforme · reparable',NO_CONFORME_FUERA_SERVICIO:'Fuera de servicio',SIN_ESTADO_TECNICO:'Sin estado técnico'}[status]||'Sin estado técnico');
export const dayNumber=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&normalizeDate(value)===value?Date.parse(value+'T00:00:00Z')/DAY:null;
export function monthsBefore(day,months){
 if(dayNumber(day)===null||!Number.isInteger(months)||months<1)throw new Error('Fecha o periodo no válido.');
 const [year,month,date]=day.split('-').map(Number),first=new Date(Date.UTC(year,month-1-months,1)),last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
 first.setUTCDate(Math.min(date,last));return first.toISOString().slice(0,10);
}
export function dashboardMetrics(data,{today,inspectionDays=90,repairMonths=12}={}){
 const current=dayNumber(today);if(current===null)throw new Error('Indica la fecha de consulta.');
 if(![30,60,90,180,365].includes(Number(inspectionDays)))inspectionDays=90;
 if(![3,6,12,24].includes(Number(repairMonths)))repairMonths=12;
 inspectionDays=Number(inspectionDays);repairMonths=Number(repairMonths);
 const start=monthsBefore(today,repairMonths),tools=new Map();
 for(const tool of data.tools||[]){const serial=String(tool.serial||tool.id||'');if(serial&&!tools.has(serial))tools.set(serial,tool);}
 const lastInspection=new Map(),repairCounts=new Map(),seen=new Set();let excludedDates=0;
 for(const event of data.events||[]){if(!tools.has(event.serial)||!['INSPECTION','REPAIR'].includes(event.type))continue;
  const date=dayNumber(event.date);if(date===null||date>current){excludedDates++;continue;}
  const key=event.id||JSON.stringify([event.documentId,event.type,event.serial,event.date]);if(seen.has(key))continue;seen.add(key);
  if(event.type==='INSPECTION'&&(!lastInspection.has(event.serial)||event.date>lastInspection.get(event.serial)))lastInspection.set(event.serial,event.date);
  if(event.type==='REPAIR'&&event.date>=start)repairCounts.set(event.serial,(repairCounts.get(event.serial)||0)+1);
 }
 const rows=[...tools].map(([serial,tool])=>{const inspectionDate=lastInspection.get(serial)||'',status=known.has(tool.status)?tool.status:'SIN_ESTADO_TECNICO';return {serial,toolName:tool.toolName||'',status,inspectionDate,ageDays:inspectionDate?current-dayNumber(inspectionDate):null,repairs:repairCounts.get(serial)||0};});
 const usable=rows.filter(t=>isUsableStatus(t.status)),reparable=rows.filter(t=>t.status==='NO_CONFORME_REPARABLE'),outOfService=rows.filter(t=>t.status==='NO_CONFORME_FUERA_SERVICIO'),unknown=rows.filter(t=>t.status==='SIN_ESTADO_TECNICO');
 const aged=rows.filter(t=>t.ageDays!==null&&t.ageDays>=inspectionDays).sort((a,b)=>b.ageDays-a.ageDays||a.serial.localeCompare(b.serial)),missing=rows.filter(t=>t.ageDays===null),recurring=rows.filter(t=>t.repairs>=2).sort((a,b)=>b.repairs-a.repairs||a.serial.localeCompare(b.serial));
 const ages=rows.filter(t=>t.ageDays!==null).map(t=>t.ageDays).sort((a,b)=>a-b),middle=Math.floor(ages.length/2),median=ages.length?(ages.length%2?ages[middle]:(ages[middle-1]+ages[middle])/2):null;
 return {today,inspectionDays,repairMonths,start,total:rows.length,availability:rows.length?Math.round(usable.length/rows.length*1000)/10:null,usable,reparable,outOfService,unknown,aged,missing,recurring,median,inspected:ages.length,repairEvents:[...repairCounts.values()].reduce((a,b)=>a+b,0),excludedDates};
}
