import test from 'node:test';
import assert from 'node:assert/strict';
import {prepare,applyCommit,emptyState,documentErrors} from '../src/adapters/repository.js';
import {fieldDefinitions} from '../src/engine/fieldExtractor.js';
const repair=(id='repair',serial='134333N',date='2026-09-01')=>({id,name:id+'.pdf',type:'REPAIR',template:'NOV_TUBOSCOPE_HW',records:[{serial,fields:{issuer:'NOV Tuboscope',reportNumber:id,workOrder:'WO001',repairDate:date,pin:'OK',box:'OK',machining:'Reface'},evidence:[]}]});
const inspection=(id='inspection',serial='134333N',date='2026-09-21')=>({id,name:id+'.pdf',type:'INSPECTION',template:'TOTAL_QC_FT_END_003',records:[{serial,fields:{issuer:'TOTAL QC',certificateNumber:id,formatCode:'FT-END-003',formatVersion:'002',versionDate:'2025-02-22',inspectionDate:date,issueDate:'2026-09-22',body:'Conforme',pin:'No conforme / reparable',box:'Conforme',finalConformity:'NO_CONFORME_REPARABLE'},evidence:[]}]});
function editDraft(state,id){const doc=state.documents.find(d=>d.id===id);return {...doc,records:state.events.filter(e=>e.documentId===id).map(e=>({serial:e.serial,sourceEventId:e.id,fields:{...e.fields},evidence:e.evidence})),baseRevision:doc.revision||0};}
test('BHA solo guarda los campos solicitados, sin confirmación individual',async()=>{
  const d={id:'bha',name:'bha.pdf',type:'BHA',records:[{serial:'001234',fields:{bhaNumber:'30',well:'UF19X',phase:'12',bhaDate:'2026-09-22',bhaType:'MWD',component:'HWDP',connection:'XT57',partialLength:'10',cumulativeLength:'20',torque:'error',weight:'error',cumulativeWeight:'error',buoyantWeight:'error',observations:'Omitir'},evidence:[]}]};
  assert.deepEqual(documentErrors(d),[]);const p=await prepare(d);
  assert.deepEqual(Object.keys(p.events[0].fields),fieldDefinitions.BHA.map(([k])=>k));
  assert.equal(p.bha.type,undefined);assert.equal(p.events[0].fields.torque,undefined);
});
test('edición de fecha recalcula estado usando todo el historial',async()=>{
  let state=applyCommit(emptyState(),await prepare(repair())).state;
  state=applyCommit(state,await prepare(inspection())).state;
  assert.equal(state.tools[0].status,'NO_CONFORME_REPARABLE');
  const d=editDraft(state,'inspection');const original=state.events.find(e=>e.documentId==='inspection');
  d.records[0].fields.inspectionDate='2026-08-01';
  const result=applyCommit(state,await prepare(d),{editing:true,baseRevision:d.baseRevision});
  assert.equal(result.state.tools[0].status,'OPERATIVA');
  assert.equal(result.state.events.find(e=>e.documentId==='inspection').createdAt,original.createdAt);
  assert.equal(result.state.events.some(e=>e.id===original.id),false);
  assert.equal(result.state.events.length,2);assert.equal(result.document.revision,2);
  assert.equal(result.document.sha256,'inspection');
});
test('corregir serial reasocia evento y conserva historial anterior',async()=>{
  let state=applyCommit(emptyState(),await prepare(repair())).state;
  state=applyCommit(state,await prepare(inspection())).state;
  const d=editDraft(state,'inspection');d.records[0].serial='134334N';
  state=applyCommit(state,await prepare(d),{editing:true,baseRevision:1}).state;
  assert.equal(state.tools.find(t=>t.serial==='134333N').status,'OPERATIVA');
  assert.equal(state.tools.find(t=>t.serial==='134334N').status,'NO_CONFORME_REPARABLE');
  assert.equal(state.events.length,2);
});
test('corregir un serial sin otros eventos elimina la ficha vacía',async()=>{
  let state=applyCommit(emptyState(),await prepare(repair())).state;
  const d=editDraft(state,'repair');d.records[0].serial='CORRECTO001';
  state=applyCommit(state,await prepare(d),{editing:true,baseRevision:1}).state;
  assert.deepEqual(state.tools.map(t=>t.serial),['CORRECTO001']);
});
test('las ediciones rechazan duplicados lógicos y revisiones obsoletas',async()=>{
  let state=applyCommit(emptyState(),await prepare(repair('A'))).state;
  state=applyCommit(state,await prepare(repair('B'))).state;
  const d=editDraft(state,'B');d.records[0].fields.reportNumber='A';
  const p=await prepare(d);assert.throws(()=>applyCommit(state,p,{editing:true,baseRevision:1}),/Ya existe un evento/);
  d.records[0].fields.reportNumber='B';const prepared=await prepare(d);
  const changed=applyCommit(state,prepared,{editing:true,baseRevision:1}).state;
  assert.throws(()=>applyCommit(changed,prepared,{editing:true,baseRevision:1}),/otra sesión/);
  assert.equal(state.documents[1].revision,1);
});
test('BHA editado actualiza cabecera y miembros; nunca el estado técnico',async()=>{
  let state=applyCommit(emptyState(),await prepare(repair())).state;
  const bha={id:'b',name:'b.pdf',type:'BHA',records:[{serial:'134333N',fields:{bhaNumber:'25',well:'UF19Y',phase:'12',bhaDate:'2026-08-12'},evidence:[]}]};
  state=applyCommit(state,await prepare(bha)).state;
  const d=editDraft(state,'b');d.records[0].fields.well='UF19X';d.records[0].fields.bhaDate='2026-10-01';
  state=applyCommit(state,await prepare(d),{editing:true,baseRevision:1}).state;
  assert.equal(state.bha[0].well,'UF19X');assert.equal(state.bhaMembers[0].fields.bhaDate,'2026-10-01');
  assert.equal(state.bhaMembers.length,1);assert.equal(state.tools[0].status,'OPERATIVA');
});
test('conserva compatibilidad con documentos V1 y bloqueo por PDF tras editar',async()=>{
  let state=applyCommit(emptyState(),await prepare(repair())).state;
  delete state.documents[0].revision;delete state.documents[0].eventIds;delete state.tools[0].eventIds;
  const d=editDraft(state,'repair');d.records[0].fields.workOrder='WO002';
  state=applyCommit(state,await prepare(d),{editing:true,baseRevision:0}).state;
  assert.equal(state.documents[0].revision,1);assert.equal(state.tools[0].eventIds.length,1);
  const original=await prepare(repair());assert.throws(()=>applyCommit(state,original),/PDF ya fue guardado/);
});
test('documento incompleto o conteo distinto queda pendiente',()=>{
  const d=repair();delete d.records[0].fields.issuer;assert(documentErrors(d).some(e=>e.includes('issuer')));
  const count=repair();count.expectedCount=2;assert(documentErrors(count).some(e=>e.includes('indica 2')));
});
