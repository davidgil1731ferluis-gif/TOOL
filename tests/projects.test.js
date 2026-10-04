import test from 'node:test';
import assert from 'node:assert/strict';
import {DemoRepository,emptyState} from '../src/adapters/repository.js';
import {DemoProjectDirectory,projectOwner,projectPath,projectName} from '../src/adapters/projects.js';
import {reportModel} from '../src/export/reportModel.js';
test('proyectos conservan datos anteriores y aíslan el mismo PDF y serial, edición, agenda, Excel y borrado',async()=>{
  const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
  const legacy=emptyState();legacy.tools=[{id:'OLDN',serial:'OLDN',status:'OPERATIVA'}];memory.set('tooltrace-explicit-demo-v1',JSON.stringify(legacy));
  const directory=new DemoProjectDirectory();const a=await directory.create('Pozo A'),b=await directory.create('Pozo B');
  assert.equal((await directory.list()).length,3);assert.equal((await new DemoRepository().load()).tools[0].serial,'OLDN');
  const first=new DemoRepository(a.id),second=new DemoRepository(b.id);
  const draft={id:'same-pdf',name:'reporte.pdf',type:'REPAIR',records:[{serial:'001N',fields:{issuer:'NOV',reportNumber:'R1',workOrder:'W1',repairDate:'2026-09-01',pin:'OK',box:'OK',machining:'Reface'}}]};
  await first.save(draft);await second.save({...draft,records:[{...draft.records[0],fields:{...draft.records[0].fields,repairDate:'2026-10-01'}}]});
  await assert.rejects(()=>first.save(draft),/ya fue guardado/);
  const edited=structuredClone(draft);edited.records[0].fields.repairDate='2026-09-02';await first.save(edited,{editing:true,baseRevision:1});
  await first.saveSchedule({title:'Solo A',date:'2026-10-04',type:'BHA'});
  const sa=await first.load(),sb=await second.load();assert.equal(sa.events[0].date,'2026-09-02');assert.equal(sb.events[0].date,'2026-10-01');assert.equal(sb.scheduledEvents.length,0);
  assert.equal(reportModel(sa)[0].rows[0][2],'2026-09-02');assert.equal(reportModel(sb)[0].rows[0][2],'2026-10-01');
  await first.clearAll();assert.deepEqual(await first.load(),emptyState());assert.equal((await second.load()).documents.length,1);assert.equal((await new DemoRepository().load()).tools.length,1);
});
test('rutas de proyecto aíslan cuentas y archivos, principal conserva rutas existentes',()=>{
  assert.deepEqual(projectPath('user','principal'),['users','user']);assert.deepEqual(projectPath('user','p_a'),['users','user','projects','p_a']);
  assert.equal(projectOwner('user','principal'),'user');assert.equal(projectOwner('user','p_a'),'user/p_a');assert.notEqual(projectOwner('other','p_a'),projectOwner('user','p_a'));
  assert.throws(()=>projectPath('user','a/b'));assert.throws(()=>projectName(' '));assert.throws(()=>projectName('x'.repeat(81)));assert.equal(projectName('  Pozo   Norte '),'Pozo Norte');
});
test('eliminar un proyecto quita su nombre y estado sin afectar otros proyectos ni principal',async()=>{
  const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
  const directory=new DemoProjectDirectory(),a=await directory.create('Eliminar'),b=await directory.create('Conservar');
  await new DemoRepository(a.id).saveSchedule({title:'A',date:'2026-10-04',type:'BHA'});
  await new DemoRepository(b.id).saveSchedule({title:'B',date:'2026-10-04',type:'BHA'});
  await directory.remove(a.id);
  assert.deepEqual((await directory.list()).map(p=>p.id),['principal',b.id]);
  assert.deepEqual(await new DemoRepository(a.id).load(),emptyState());
  assert.equal((await new DemoRepository(b.id).load()).scheduledEvents.length,1);
  await assert.rejects(()=>directory.remove('principal'),/principal/);
});
