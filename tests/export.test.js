import test from 'node:test';
import assert from 'node:assert/strict';
import {toolGroup} from '../src/engine/toolGroup.js';
import {reportModel} from '../src/export/reportModel.js';
import {xlsxBlob} from '../src/export/xlsx.js';
import {emptyState,prepare,applyCommit} from '../src/adapters/repository.js';
test('HWDP por prefijo o sufijo normalizado, no coincidencia intermedia',()=>{
  for(const s of [' nha123 ','001N',' nh af34 '])assert.equal(toolGroup(s),'HWDP');
  for(const s of ['ABN123','XNHA123','001N-X','001234',''])assert.equal(toolGroup(s),'OTRAS');
});
const repair=(id,serial)=>({id,name:id+'.pdf',type:'REPAIR',records:[{serial,fields:{issuer:'NOV',reportNumber:id,workOrder:'001',repairDate:'2026-09-01',pin:'OK',box:'OK',machining:'Reface'},evidence:[{page:1,line:'example'}]}]});
test('exportación conserva eventos repetidos, ceros, fechas, campos y pendientes',async()=>{
  let state=emptyState();for(const [id,s] of [['a','001N'],['b','001N'],['c','12345']])state=applyCommit(state,await prepare(repair(id,s))).state;
  // Los datos anteriores sin grupo también se clasifican.
  delete state.tools[0].group;
  const sheets=reportModel(state,{group:'HWDP',pending:[{name:'pending.pdf',type:'REPAIR',records:[{serial:'002N',fields:{},evidence:[]}]}]});
  assert.equal(sheets[0].rows.length,1);assert.equal(sheets[2].rows.length,2);assert.equal(sheets[2].rows[0][0],'001N');assert.equal(sheets[4].rows.length,1);
  assert(sheets[2].columns.some(c=>c.label==='Maquinado'));assert(!sheets[3].columns.some(c=>/Torque|peso|Observaciones/i.test(c.label)));
  const old=state.events.find(e=>e.documentId==='a');const draft=repair('a','12345');draft.records[0].sourceEventId=old.id;
  state=applyCommit(state,await prepare(draft),{editing:true,baseRevision:1}).state;
  assert.equal(state.tools.find(t=>t.serial==='12345').group,'OTRAS');assert.equal(reportModel(state,{group:'HWDP'})[2].rows.length,1);
});
test('XLSX texto seguro, fechas numéricas, filtros y paneles inmóviles',async()=>{
  const blob=xlsxBlob([{name:'Prueba',columns:[{label:'Serial',type:'text'},{label:'Fecha',type:'date'}],rows:[['001N','2026-09-01'],['=HYPERLINK("bad")','']]}]);
  const bytes=new Uint8Array(await blob.arrayBuffer());assert.equal(bytes[0],80);assert.equal(bytes[1],75);
  const xml=new TextDecoder().decode(bytes);assert(xml.includes('001N'));assert(xml.includes('&quot;bad&quot;'));assert(!xml.includes('<f>'));assert(xml.includes('<autoFilter'));assert(xml.includes('state="frozen"'));assert(xml.includes('s="2"><v>46266</v>'));
});
test('una fila por serial contiene todos los eventos completos en orden horizontal',async()=>{
  let state=emptyState();
  const later=repair('later','001N');later.records[0].fields.repairDate='2026-10-01';
  for(const d of [later,repair('earlier','001N'),repair('other','002N')])state=applyCommit(state,await prepare(d)).state;
  const sheet=reportModel(state)[0];assert.equal(sheet.rows.length,2);
  const index=label=>sheet.columns.findIndex(c=>c.label===label);const row=sheet.rows.find(r=>r[0]==='001N');
  assert.equal(row[index('Evento 1 · Fecha')],'2026-09-01');assert.equal(row[index('Evento 2 · Fecha')],'2026-10-01');
  assert.equal(row[index('Evento 1 · Reporte')],'earlier');assert.match(row[index('Evento 2 · Detalles clave')],/Maquinado: Reface/);
  assert.equal(sheet.rows.find(r=>r[0]==='002N')[index('Evento 2 · Fecha')],'');
  assert(sheet.rows.every(r=>r.length===sheet.columns.length));assert.equal(reportModel(state,{search:'001'})[0].rows.length,1);
});
