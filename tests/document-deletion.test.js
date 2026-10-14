import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,prepare,applyCommit,applyDocumentRemoval,DemoRepository} from '../src/adapters/repository.js';
const repair=(id,serial='001N',date='2026-10-01')=>({id,name:id+'.pdf',type:'REPAIR',records:[{serial,fields:{issuer:'NOV',reportNumber:id,workOrder:'W1',repairDate:date,pin:'OK',box:'OK',machining:'Recut'}}]});
const inspection={id:'inspection',name:'inspection.pdf',type:'INSPECTION',template:'SAIS_PREMIUM_HW',records:[{serial:'001N',fields:{issuer:'SAIS',certificateNumber:'I1',formatCode:'SAIS-OP-F-53R',formatVersion:'6',versionDate:'2025-02-17',inspectionDate:'2026-09-01',body:'Conforme',pin:'No conforme / reparable',box:'Conforme',finalConformity:'NO_CONFORME_REPARABLE'}}]};
const bha={id:'bha',name:'bha.pdf',type:'BHA',records:[{serial:'001N',fields:{bhaNumber:'1',well:'Pozo',phase:'1',bhaDate:'2026-10-02'}},{serial:'BHA002',fields:{bhaNumber:'1',well:'Pozo',phase:'1',bhaDate:'2026-10-02'}}]};
const commit=async(state,draft)=>applyCommit(state,await prepare(draft)).state;
test('eliminar reparación restaura inspección anterior sin borrar otros reportes o agenda',async()=>{
  let state=await commit(emptyState(),inspection);state=await commit(state,repair('latest'));state=await commit(state,repair('other','OTHER123'));state=await commit(state,bha);state.scheduledEvents=[{id:'agenda',serial:'001N'}];
  assert.equal(state.tools.find(t=>t.serial==='001N').status,'OPERATIVA');const before=structuredClone(state);const result=applyDocumentRemoval(state,'latest',{baseRevision:1});
  assert.deepEqual(state,before);assert.equal(result.state.tools.find(t=>t.serial==='001N').status,'NO_CONFORME_REPARABLE');assert.equal(result.state.events.filter(e=>e.serial==='001N').length,2);assert.equal(result.state.documents.length,3);assert.equal(result.state.scheduledEvents.length,1);assert.equal(result.state.tools.find(t=>t.serial==='OTHER123').status,'OPERATIVA');
});
test('eliminar BHA quita miembros y fichas sin historial; mantiene estado de herramientas compartidas',async()=>{
  let state=await commit(emptyState(),repair('repair'));state=await commit(state,bha);const next=applyDocumentRemoval(state,'bha').state;
  assert.equal(next.bha.length,0);assert.equal(next.bhaMembers.length,0);assert.equal(next.tools.length,1);assert.equal(next.tools[0].status,'OPERATIVA');assert.equal(next.events.length,1);
  const onlyBha=applyDocumentRemoval(state,'repair').state;assert.equal(onlyBha.tools.find(t=>t.serial==='001N').status,'SIN_ESTADO_TECNICO');assert.equal(onlyBha.tools.find(t=>t.serial==='001N').eventIds.length,1);
});
test('borrado del último reporte permite volver a cargar el mismo documento sin duplicados',async()=>{
  const state=await commit(emptyState(),repair('file'));const deleted=applyDocumentRemoval(state,'file');assert.deepEqual(deleted.state,emptyState());assert.equal((await commit(deleted.state,repair('file'))).events.length,1);
});
test('rechaza revisión obsoleta y permite reintento idempotente y documentos antiguos',async()=>{
  const state=await commit(emptyState(),repair('file'));assert.throws(()=>applyDocumentRemoval(state,'file',{baseRevision:0}),/otra sesión/);delete state.documents[0].revision;const next=applyDocumentRemoval(state,'file',{baseRevision:0}).state;assert.deepEqual(applyDocumentRemoval(next,'file').writes,[]);
});
test('borrado en repositorio local se limita al proyecto seleccionado',async()=>{
  const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};const first=new DemoRepository('p_first'),second=new DemoRepository('p_second');await first.save(repair('shared'));await second.save(repair('shared'));await first.deleteDocument('shared',{baseRevision:1});assert.equal((await first.load()).documents.length,0);assert.equal((await second.load()).documents.length,1);
});
