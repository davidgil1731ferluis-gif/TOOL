import test from 'node:test';
import assert from 'node:assert/strict';
import {componentStates,normalizeComponentState,normalizeComponentFields} from '../src/engine/componentStates.js';
import {inspectionSuggestions} from '../src/views/inspectionOptions.js';
import {analyze} from '../src/engine/pipeline.js';
import {prepare,applyCommit,emptyState} from '../src/adapters/repository.js';
import {reportModel} from '../src/export/reportModel.js';
const repair=()=>({id:'r',name:'r.pdf',type:'REPAIR',records:[{serial:'TEST001N',evidence:[{page:1,line:'TEST001N OK OK'}],fields:{issuer:'Taller',reportNumber:'R1',workOrder:'OT1',repairDate:'2026-10-14',pin:'ok',box:' OK ',machining:'Reface'}}]});
test('Cuerpo, PIN y BOX ofrecen exactamente tres estados, sin códigos ni OK como opción',()=>{
 assert.deepEqual(componentStates,['Conforme','No conforme/reparable','Fuera de servicio']);for(const key of ['body','pin','box'])assert.deepEqual(inspectionSuggestions[key],componentStates);
});
test('normaliza OK sin distinguir mayúsculas y conserva códigos desconocidos sin asumir conformidad',()=>{
 for(const value of ['OK','ok',' Ok ','conforme'])assert.equal(normalizeComponentState(value),'Conforme');assert.equal(normalizeComponentState('No Conforme / Reparable'),'No conforme/reparable');assert.equal(normalizeComponentState('NO_CONFORME_FUERA_SERVICIO'),'Fuera de servicio');for(const value of ['NC','TG','OK NC','ROSCA MELLADA',''])assert.equal(normalizeComponentState(value),value);
 assert.deepEqual(normalizeComponentFields('BHA',{pin:'OK'}),{pin:'OK'});
});
test('extracción automática normaliza campos de PDF e información tabular; no decide conformidad final por un OK aislado',()=>{
 const d=repair(),table=analyze([{page:1,text:'',structuredType:'REPAIR',structuredRecords:d.records.map(r=>({...r,cells:r.fields}))}]);assert.equal(table.records[0].fields.pin,'Conforme');assert.equal(table.records[0].fields.box,'Conforme');
 const pdf=analyze([{page:1,text:'Certificado de inspección\nEmpresa: Taller\nSerial: TEST001N\nCuerpo: ok\nPIN: OK\nBOX: Ok'}]);assert.equal(pdf.records[0].fields.body,'Conforme');assert.equal(pdf.records[0].fields.pin,'Conforme');assert.equal(pdf.records[0].fields.box,'Conforme');assert.equal(pdf.records[0].fields.finalConformity,'');
});
test('guardado manual normaliza OK y conserva evidencia; reparación emitida sigue operativa',async()=>{
 const draft=repair(),prepared=await prepare(draft);assert.equal(prepared.events[0].fields.pin,'Conforme');assert.equal(prepared.events[0].fields.box,'Conforme');assert.equal(prepared.events[0].evidence[0].line,'TEST001N OK OK');assert.equal(draft.records[0].fields.pin,'ok');const state=applyCommit(emptyState(),prepared).state;assert.equal(state.tools[0].status,'OPERATIVA');
});
test('Excel interpreta datos históricos OK como Conforme sin modificar los eventos originales',async()=>{
 const state=applyCommit(emptyState(),await prepare(repair())).state;state.events[0].fields.pin='OK';state.events[0].fields.box='ok';const sheets=reportModel(state),detailed=sheets.find(s=>s.name==='Reparaciones'),index=detailed.columns.findIndex(c=>c.label==='Estado PIN');assert.equal(detailed.rows[0][index],'Conforme');assert.match(sheets[0].rows[0].at(-1),/PIN: Conforme/);assert.equal(state.events[0].fields.pin,'OK');
});
