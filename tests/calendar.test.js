import test from 'node:test';
import assert from 'node:assert/strict';
import {scheduleEntry,calendarActivities,timelineSeries} from '../src/engine/calendar.js';
import {reportModel} from '../src/export/reportModel.js';
import {emptyState,DemoRepository} from '../src/adapters/repository.js';
test('agenda valida fechas, tipo, serial opcional y notas',()=>{
  assert.equal(scheduleEntry({title:'Inspección',date:'2026-10-04',type:'INSPECTION',serial:' nha 123 '}).serial,'NHA123');
  for(const v of [{date:'2026-02-30'},{title:''},{type:'OTHER'},{serial:'abc'}])assert.throws(()=>scheduleEntry({title:'Cita',date:'2026-10-04',type:'BHA',...v}));
});
test('calendario agrupa multiserial y distingue agenda; gráfico excluye futuros',()=>{
  const state=emptyState();state.documents=[{id:'a',name:'a.pdf'}];state.events=[{id:'1',documentId:'a',serial:'001N',type:'REPAIR',date:'2026-09-01',fields:{}},{id:'2',documentId:'a',serial:'002N',type:'REPAIR',date:'2026-09-01',fields:{}},{id:'3',documentId:'a',serial:'003N',type:'REPAIR',date:'2026-09-02',fields:{}}];state.scheduledEvents=[scheduleEntry({title:'Próxima',date:'2026-10-04',type:'BHA'})];
  assert.equal(calendarActivities(state).length,3);assert.equal(calendarActivities(state)[0].serials.length,2);assert.equal(timelineSeries(state)[0].REPAIR,1);assert.equal(timelineSeries(state).length,2);
  const history=reportModel(state)[0];assert.equal(history.name,'Historial por herramienta');assert.equal(history.rows.length,3);assert.deepEqual(history.rows.map(r=>r[2]),['2026-09-01','2026-09-01','2026-09-02']);
});
test('agenda local persiste y eliminación limpia todas las entidades',async()=>{
  const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};const repo=new DemoRepository();const entry=await repo.saveSchedule({title:'Prueba',date:'2026-10-04',type:'BHA'});assert.equal((await repo.load()).scheduledEvents.length,1);await repo.saveSchedule({...entry,title:'Cambio'});assert.equal((await repo.load()).scheduledEvents.length,1);await repo.deleteSchedule(entry.id);assert.equal((await repo.load()).scheduledEvents.length,0);await repo.saveSchedule(entry);await repo.clearAll();assert.deepEqual(await repo.load(),emptyState());
});
