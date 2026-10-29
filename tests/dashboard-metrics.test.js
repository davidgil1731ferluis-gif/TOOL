import test from 'node:test';
import assert from 'node:assert/strict';
import {dashboardMetrics,monthsBefore,toolStatusLabel,isUsableStatus} from '../src/engine/dashboardMetrics.js';
import {readDashboardSnapshot} from '../src/engine/dashboardRefresh.js';
import {dashboardIndicators,dashboardFreshness,dashboardDetail} from '../src/views/dashboardViews.js';
import {toolMatches} from '../src/engine/toolFilters.js';
import {emptyState,prepare,applyCommit} from '../src/adapters/repository.js';
import {OfflineRepository} from '../src/adapters/offlineRepository.js';
const day='2026-10-27';
const event=(id,serial,type,date)=>({id,serial,type,date,documentId:id,createdAt:'2026-10-27T10:00:00Z',fields:type==='INSPECTION'?{finalConformity:serial==='A003'?'NO_CONFORME_REPARABLE':serial==='A004'?'NO_CONFORME_FUERA_SERVICIO':'CONFORME'}:{}});
const fixture=()=>({...emptyState(),tools:[{serial:'A001',status:'OPERATIVA'},{serial:'A002',status:'CONFORME'},{serial:'A003',status:'NO_CONFORME_REPARABLE'},{serial:'A004',status:'NO_CONFORME_FUERA_SERVICIO'},{serial:'A005',status:'SIN_ESTADO_TECNICO'},{serial:'A006',status:'OPERATIVA'}],events:[event('i1','A001','INSPECTION','2026-09-12'),event('i2','A002','INSPECTION','2026-06-29'),event('i3','A003','INSPECTION','2026-10-26'),event('i4','A004','INSPECTION',day),event('r1','A001','REPAIR','2026-01-10'),event('r2','A001','REPAIR','2026-07-10'),event('r3','A003','REPAIR','2025-12-10'),event('r4','A003','REPAIR','2026-02-10'),event('r5','A002','REPAIR','2026-10-20'),event('r6','A006','REPAIR',day),event('b1','A005','BHA',day)]});
test('los cuatro indicadores usan los registros del proyecto y no modifican sus datos',()=>{
 const data=fixture(),before=structuredClone(data),m=dashboardMetrics(data,{today:day});assert.equal(m.total,6);assert.equal(m.availability,50);assert.equal(m.usable.length,3);assert.equal(m.reparable.length,1);assert.equal(m.outOfService.length,1);assert.equal(m.unknown.length,1);assert.equal(m.aged.length,1);assert.equal(m.aged[0].ageDays,120);assert.equal(m.missing.length,2);assert.equal(m.median,23);assert.equal(m.recurring.length,2);assert.equal(m.repairEvents,6);assert.deepEqual(data,before);
});
test('operativa y conforme son un único grupo visible, sin alterar los estados históricos',()=>{
 assert.equal(toolStatusLabel('OPERATIVA'),toolStatusLabel('CONFORME'));assert(isUsableStatus('CONFORME'));assert(!isUsableStatus('NO_CONFORME_REPARABLE'));const data=fixture(),before=structuredClone(data);assert.deepEqual(data.tools.filter(t=>toolMatches(t,data.events,{status:'APTAS'})).map(t=>t.serial),['A001','A002','A006']);assert.equal(data.tools.filter(t=>toolMatches(t,data.events,{status:'OPERATIVA'})).length,2);assert.deepEqual(data,before);
});
test('sin inventario no se inventa una disponibilidad del cero o cien por ciento',()=>{
 const m=dashboardMetrics(emptyState(),{today:day});assert.equal(m.availability,null);assert.equal(m.total,0);assert.equal(m.median,null);assert.equal(m.recurring.length,0);assert(dashboardIndicators(m).includes('data-kpi-value="availability">—'));
});
test('estados ausentes o desconocidos permanecen separados de la disponibilidad',()=>{
 const data=fixture();data.tools.push({serial:'X001'},{serial:'X002',status:'Otro'});const m=dashboardMetrics(data,{today:day});assert.equal(m.unknown.length,3);assert.equal(m.availability,37.5);assert.equal(m.usable.length+m.reparable.length+m.outOfService.length+m.unknown.length,m.total);
});
test('la última inspección se elige por fecha real y no por orden o fecha de carga',()=>{
 const data=fixture();data.events.push({...event('i-old','A002','INSPECTION','2025-01-01'),createdAt:'2026-10-27'});data.events.push(event('i-new','A002','INSPECTION','2026-10-20'));const m=dashboardMetrics(data,{today:day});assert.equal(m.aged.length,0);assert.equal(m.inspected,4);assert.equal(m.missing.length,2);
});
test('umbral de inspección es inclusivo, ajustable y avanza con la fecha de consulta',()=>{
 const data={...emptyState(),tools:[{serial:'A001',status:'CONFORME'}],events:[event('i','A001','INSPECTION','2026-09-27')]};assert.equal(dashboardMetrics(data,{today:day,inspectionDays:30}).aged.length,1);assert.equal(dashboardMetrics(data,{today:day,inspectionDays:60}).aged.length,0);assert.equal(dashboardMetrics(data,{today:'2026-10-28',inspectionDays:30}).aged[0].ageDays,31);
});
test('inspecciones y reparaciones futuras o con fecha inválida no entran en los periodos',()=>{
 const data=fixture();data.events.push(event('future-inspection','A005','INSPECTION','2026-10-28'),event('bad-inspection','A005','INSPECTION','2026-02-30'),event('future-repair','A002','REPAIR','2026-10-28'));data.scheduledEvents=[{serial:'A005',type:'INSPECTION',date:'2026-10-27'}];const m=dashboardMetrics(data,{today:day});assert.equal(m.excludedDates,3);assert.equal(m.missing.length,2);assert.equal(m.repairEvents,6);assert.equal(m.recurring.length,2);
});
test('recurrencia usa eventos únicos, fechas inclusivas y meses de calendario',()=>{
 const data=fixture();data.events.push(data.events[4],event('old','A006','REPAIR','2025-10-26'),event('boundary','A006','REPAIR','2025-10-27'));const m=dashboardMetrics(data,{today:day});assert.equal(m.recurring.length,3);assert.equal(m.repairEvents,7);assert.equal(m.start,'2025-10-27');const recent=dashboardMetrics(data,{today:day,repairMonths:3});assert.equal(recent.recurring.length,0);assert.equal(recent.repairEvents,2);assert.equal(recent.start,'2026-07-27');
});
test('restar meses respeta fin de mes, años bisiestos y cambio de año',()=>{
 assert.equal(monthsBefore('2026-03-31',1),'2026-02-28');assert.equal(monthsBefore('2024-03-31',1),'2024-02-29');assert.equal(monthsBefore('2024-02-29',12),'2023-02-28');assert.equal(monthsBefore('2026-01-15',3),'2025-10-15');
});
test('BHA, herramientas ajenas y duplicados no inflan numeradores ni denominadores',()=>{
 const data=fixture();data.tools.push({...data.tools[0]});data.events.push(event('orphan','OTHER001','REPAIR',day),event('bha2','A001','BHA',day));const m=dashboardMetrics(data,{today:day});assert.equal(m.total,6);assert.equal(m.repairEvents,6);assert.equal(m.recurring.length,2);assert.equal(m.usable.length,3);
});
test('los parámetros inválidos vuelven a los valores conocidos y no inventan periodos',()=>{
 const m=dashboardMetrics(fixture(),{today:day,inspectionDays:-1,repairMonths:'<script>'});assert.equal(m.inspectionDays,90);assert.equal(m.repairMonths,12);assert.throws(()=>dashboardMetrics(fixture(),{today:'2026-02-30'}),/consulta/);
});
test('el detalle escapa nombres/seriales y presenta las filas que sustentan cada indicador',()=>{
 const data=fixture();data.tools[0].toolName='<img onerror=alert(1)>';const m=dashboardMetrics(data,{today:day}),html=dashboardDetail(m,'usable');assert(html.includes('&lt;img'));assert(!html.includes('<img'));assert(html.includes('data-kpi-serial="A001"'));assert.equal(dashboardDetail(m,'invalid'),'');assert(dashboardIndicators(m).includes('no indica vencimiento'));assert(dashboardIndicators(m,{loading:true}).includes('aria-busy="true"'));
});
test('la actualización identifica datos locales, pendientes, conflictos y errores',()=>{
 assert.match(dashboardFreshness({local:true}),/este navegador/);assert.match(dashboardFreshness({online:false}),/Sin conexión/);assert.match(dashboardFreshness({sync:{pending:2}}),/2 cambio/);assert.match(dashboardFreshness({sync:{error:'Fallo'}}),/No se pudo/);assert.match(dashboardFreshness({sync:{conflict:{}}}),/conflicto/);assert.match(dashboardFreshness({sync:{lastSyncedAt:1793130000000}}),/Sincronizado/);
});
test('la lectura automática pide renovar la cola/caché y toma los datos resultantes',async()=>{
 const calls=[],repo={data:fixture(),async flush(o){calls.push(o);this.data.tools[2].status='OPERATIVA';},async load(){return this.data;},async status(){return {pending:0,lastSyncedAt:123};}};const result=await readDashboardSnapshot(repo);assert.deepEqual(calls,[{refresh:true}]);assert.equal(dashboardMetrics(result.data,{today:day}).availability,66.7);assert.equal(result.sync.lastSyncedAt,123);
});
test('la lectura local nunca solicita red y conserva la base de datos',async()=>{
 const data=fixture(),before=structuredClone(data),repo={load:async()=>data,flush:()=>{throw Error('No debe ejecutarse');},status:()=>{throw Error('No debe ejecutarse');}};const result=await readDashboardSnapshot(repo,{local:true});assert.equal(dashboardMetrics(result.data,{today:day}).availability,50);assert.deepEqual(data,before);
});
test('la cola sin conexión actualiza indicadores antes de enviar y conserva la corrección remota',async()=>{
 class Store{constructor(){this.map=new Map();}async get(k){return structuredClone(this.map.get(k));}async update(k,fn){const r=fn(await this.get(k));this.map.set(k,structuredClone(r));return r;}}
 let online=true;const initial=fixture(),remote={state:initial,async load(){return structuredClone(this.state);},async save(d,o){const result=applyCommit(this.state,await prepare(d),o);this.state=result.state;return result.document;}};
 const repo=new OfflineRepository('kpi-user','kpi-project',remote,{store:new Store(),online:()=>online});await repo.load();online=false;await repo.save({id:'repair-new',name:'repair-new.pdf',type:'REPAIR',records:[{serial:'A003',fields:{issuer:'Taller',reportNumber:'NEW1',workOrder:'OT1',repairDate:day,pin:'OK',box:'OK',machining:'Reface'},evidence:[]}]});
 let result=await readDashboardSnapshot(repo);assert.equal(dashboardMetrics(result.data,{today:day}).availability,66.7);assert.equal(result.sync.pending,1);online=true;result=await readDashboardSnapshot(repo);assert.equal(result.sync.pending,0);assert.equal(dashboardMetrics(result.data,{today:day}).availability,66.7);assert.deepEqual(result.data.events.find(e=>e.id==='i3'),initial.events.find(e=>e.id==='i3'));
});
