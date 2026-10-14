import test from 'node:test';
import assert from 'node:assert/strict';
import {classifier} from '../src/engine/classifier.js';
import {premiumInspectionCells,tuboscopeInspectionCells} from '../src/engine/inspectionFormats.js';
import {analyze} from '../src/engine/pipeline.js';
import {documentErrors,prepare,emptyState,applyCommit} from '../src/adapters/repository.js';
import {reportModel} from '../src/export/reportModel.js';

const item=(str,x,y,width=20,vertical=false)=>({str,width,height:4,transform:vertical?[0,4,-4,0,x,y]:[4,0,0,4,x,y]});
test('SAIS lee columnas verticales sin confundir ancho de rótulos ni leyendas con estados',()=>{
  const text='REPORTE DE INSPECCIÓN DE HEAVY WEIGHT CONEXIÓN PREMIUM\nSAIS-OP-F-53R Versión 6 Fecha Vigencia 17-02-2025\nREPORTE No. TEST-001\nFECHA 11/05/2026\nCONDICIÓN FINAL: OP: OPERATIVO - R: REPARABLE - FS: FUERA DE SERVICIO';
  const items=[item('SERIAL No. ACTIVO FIJO',110,455,42),item('CONDICIÓN',246,446,25,true),item('CONDICIÓN FINAL PIN',478,440,80,true),item('CONDICIÓN CAJA',710,440,80,true),item('CONDICIÓN FINAL',725,440,80,true),item('1',100,430,3),item('TEST001N',122,430,18),item('OK',241,430,6),item('R',473,430,4),item('OK',705,430,6),item('R',721,430,4)];
  const candidates=premiumInspectionCells(items,text),draft=analyze([{page:1,text,inspectionCandidates:candidates}]);
  assert.equal(draft.records.length,1);const r=draft.records[0];assert.equal(r.fields.finalConformity,'NO_CONFORME_REPARABLE');assert.equal(r.fields.body,'Conforme');assert.equal(r.fields.box,'Conforme');assert.equal(r.fields.issueDate,'');assert.equal(r.fields.versionDate,'2025-02-17');assert.deepEqual(documentErrors(draft),[]);
  const riskyItems=[...items,item('LUZ NEGRA',220,446,60,true),item('HC',215,430,6)];const risky=analyze([{page:1,text,inspectionCandidates:premiumInspectionCells(riskyItems,text)}]);assert.equal(risky.records[0].fields.body,'');assert(documentErrors(risky).some(e=>e.includes('body')));
});
test('la numeración SAIS detecta filas que no se pudieron leer antes del guardado automático',()=>{const text='REPORTE DE INSPECCIÓN\nSAIS-OP-F-53R\n1 TEST001N 30,17 OK\n2 TEST002N 30,20 OK';const draft=analyze([{page:1,text,inspectionCandidates:[{serial:'TEST001N',rawSerial:'TEST001N',line:'TEST001N',cells:{}}]}]);assert.equal(draft.expectedCount,2);assert(documentErrors(draft).some(e=>/indica 2 seriales/.test(e)));});
const header='Heavyweight (HW)\nReporte de Inspección\nNo.Trabajo Tuboscope: TEST-100A\nNo. Work Order: W100\nFecha: 14.03.2026\nTramos Inspeccionados: 2\nReporte generado del portal de clientes Tuboscope: 20.03.2026';
const summary='Tubos para Uso Inmediato: 1\nTotal de Tubos para Reparación: 1\nSin posibilidad de reparación 0';
const table='Hoja de Recuento Heavyweight\n1 TEST001N OK OK 6,900 Raised 30,0 NA\n2 TEST002N TG OK 6,900 Raised 30,0 NA';
const pages=()=>[{page:1,text:header+'\n'+summary},{page:5,text:table},{page:10,text:'Reporte de Maquinado de Heavyweight\n1 2 TEST002N TG 12,000 OK 13,000 N NA'},{page:12,text:'Observaciones Hoja de Totales de Heavyweight\nTEST001N PIN:Ok BOX:Ok\nTEST002N PIN:ROSCA MELLADA\ncontinuación de observación\nInspector: Test'}];
test('Tuboscope consolida páginas por serial; maquinado requerido es inspección y concilia estados',async()=>{
  const draft={id:'new-format',name:'test.pdf',...analyze(pages())};assert.equal(draft.type,'INSPECTION');assert.equal(draft.expectedCount,2);assert.equal(draft.records.length,2);assert.equal(tuboscopeInspectionCells('Reporte de Maquinado de Heavyweight'),null);assert.deepEqual(documentErrors(draft),[]);
  const bad=draft.records.find(r=>r.serial==='TEST002N');assert.equal(bad.fields.finalConformity,'NO_CONFORME_REPARABLE');assert.match(bad.fields.findings,/continuación/);assert.equal(bad.fields.formatCode,'');assert.equal(bad.fields.body,'');assert.equal(bad.fields.issueDate,'2026-03-20');
  let state=applyCommit(emptyState(),await prepare(draft)).state;assert.equal(state.events.length,2);assert.equal(state.tools.find(t=>t.serial===bad.serial).status,'NO_CONFORME_REPARABLE');
  const repair={id:'repair',name:'repair.pdf',type:'REPAIR',records:[{serial:bad.serial,fields:{issuer:'NOV',reportNumber:'R100',workOrder:'W100',repairDate:'2026-04-01',pin:'OK',box:'OK',machining:'Recut'}}]};state=applyCommit(state,await prepare(repair)).state;
  assert.equal(state.tools.find(t=>t.serial===bad.serial).status,'OPERATIVA');const row=reportModel(state)[0].rows.find(r=>r[0]===bad.serial);assert.equal(row[2],'2026-03-14');assert.equal(row[8],'2026-04-01');assert.equal(state.events[0].template,'NOV_TUBOSCOPE_HW_INSPECTION');
});
test('conteos y códigos no verificables dejan el reporte por completar, sin suponer conforme',()=>{
  for(const altered of [pages().map(p=>({...p,text:p.text.replace('Uso Inmediato: 1','Uso Inmediato: 2')})),pages().map(p=>({...p,text:p.text.replace('TG OK','XYZ OK')}))]){const draft=analyze(altered);assert(draft.records.every(r=>!r.fields.finalConformity));assert(documentErrors(draft).length>0);}
});
test('extracción por etiquetas admite otro emisor y evita clasificar como reparación las recomendaciones',()=>{
  const text='INFORME DE INSPECCIÓN\nEmpresa: Empresa ejemplo\nReporte: REP-10\nCódigo de formato: FORM-01\nVersión: 2\nFecha de versión: 01/01/2026\nFecha de inspección: 02/01/2026\nFecha de emisión: 03/01/2026\nSerial: XYZ123\nCuerpo: Conforme\nPIN: Conforme\nBOX: No conforme / reparable\nFinal: No conforme / reparable';
  const d=analyze([{page:1,text}]);assert.equal(d.records.length,1);assert.equal(d.records[0].fields.issuer,'Empresa ejemplo');assert.equal(d.records[0].fields.finalConformity,'NO_CONFORME_REPARABLE');assert.deepEqual(documentErrors(d),[]);assert.equal(classifier('Reporte de inspección\nTotal de Tubos para Reparación: 10'),'INSPECTION');assert.equal(classifier('Report After Repair\nInspection date'),'REPAIR');
});
test('historial alfabético global por serial conserva grupos y eventos cronológicos horizontales',()=>{
  const data=emptyState();data.tools=[{serial:'NHA100'},{serial:'ABC100'},{serial:'002N'}];data.events=[{id:'2',serial:'ABC100',type:'BHA',date:'2026-03-01',fields:{bhaNumber:'2'}},{id:'1',serial:'ABC100',type:'BHA',date:'2026-01-01',fields:{bhaNumber:'1'}}];const s=reportModel(data)[0];assert.deepEqual(s.rows.map(r=>r[0]),['002N','ABC100','NHA100']);assert.equal(s.rows[1][2],'2026-01-01');assert.equal(s.rows[1][8],'2026-03-01');
});
