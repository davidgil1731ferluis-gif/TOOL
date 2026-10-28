import test from 'node:test';
import assert from 'node:assert/strict';
import {utils,write} from 'xlsx';
import {spreadsheetExtractor} from '../src/engine/spreadsheetExtractor.js';
import {bhaSpreadsheetPage} from '../src/engine/bhaSpreadsheet.js';
import {tablePage,tableHeader} from '../src/engine/tableExtractor.js';
import {analyze} from '../src/engine/pipeline.js';
import {coordinateTable} from '../src/engine/coordinateTable.js';
import {verifiedName,automaticToolNames} from '../src/engine/automaticNames.js';
import {emptyState,prepare,applyCommit,documentErrors} from '../src/adapters/repository.js';
import {applyTool,applyGroup} from '../src/engine/toolCatalog.js';
import {OfflineRepository,overlayPending} from '../src/adapters/offlineRepository.js';
import {pdfRows} from '../src/engine/pdfRows.js';
import {statusEngine} from '../src/engine/statusEngine.js';
const meta=[['COMPONENTES BHA'],['BHA','7'],['Pozo','Prueba'],['Fase','12'],['Fecha','2026-10-20']];
const sheetRows=[...meta,['Descripción de','Número de','Diámetro externo (in)'],['la herramienta','serie',''],['Estabilizador 8 in','000123',8],['HWDP 5 in','NHA001',5]];
function book(rows=sheetRows,type='xlsx'){const wb=utils.book_new(),ws=utils.aoa_to_sheet(rows);utils.book_append_sheet(wb,ws,'BHA');return write(wb,{type:'array',bookType:type});}
function draft(serial='OLD001',name='Estabilizador 8 in',date='2026-10-20',id='new-bha'){
 return {id,name:id+'.xlsx',type:'BHA',validationMode:'automatic',records:[{serial,fields:{bhaNumber:id,well:'Prueba',phase:'12',bhaDate:date,description:name},nameEvidence:{serial,value:name,method:'spreadsheet-cell',sheet:'BHA',cell:'A7'},evidence:[{page:1,sheet:'BHA',cell:'B7',line:serial+' | '+name}]}]};
}
const base=()=>applyTool(emptyState(),{serial:'OLD001',toolType:'Tipo conservado',groupId:'HWDP'}).state;

test('lee encabezados de dos filas en XLSX/XLS/ODS y conserva seriales y origen de nombre',()=>{
 for(const type of ['xlsx','xls','ods']){const result=analyze(spreadsheetExtractor(book(sheetRows,type),'bha.'+type).pages);assert.equal(result.type,'BHA');assert.deepEqual(result.records.map(r=>r.serial),['000123','NHA001']);assert.equal(result.records[0].nameEvidence.cell,'A8');assert.equal(result.records[0].fields.description,'Estabilizador 8 in');assert.deepEqual(documentErrors({...result,validationMode:'automatic'}),[]);}
});
test('serial numérico con ceros en encabezado dividido conserva su representación',()=>{
 const wb=utils.book_new(),ws=utils.aoa_to_sheet(sheetRows);ws.B8={t:'n',v:123,z:'000000'};utils.book_append_sheet(wb,ws,'BHA');const result=analyze(spreadsheetExtractor(write(wb,{type:'array',bookType:'xlsx'}),'b.xlsx').pages);assert.equal(result.records[0].serial,'000123');
});
test('cabecera dividida repetida en el libro no se convierte en un componente',()=>{
 const rows=[...sheetRows.slice(0,8),...sheetRows.slice(5,7),sheetRows[8]];const result=analyze(spreadsheetExtractor(book(rows),'b.xlsx').pages);assert.deepEqual(result.records.map(r=>r.serial),['000123','NHA001']);assert.deepEqual(documentErrors({...result,validationMode:'automatic'}),[]);
});
test('celdas combinadas superpuestas requieren revisión y no certifican nombres',()=>{
 const result=bhaSpreadsheetPage(sheetRows,1,'BHA',{'!merges':[utils.decode_range('A8:A9'),utils.decode_range('A9:A10')]});assert(result.sourceWarnings.some(w=>/superpuestas/.test(w)));assert(result.structuredRecords.every(r=>!r.nameEvidence));
});
test('metadatos desplazados y alias ingleses en CSV conservan tipos y campos',()=>{
 const rows=[['','','BHA','1'],['','','Well','Prueba'],['','','Phase','12'],['','','Fecha','2026-10-20'],['Tool serial number','Tool name','OD (in)'],['000123','Float sub',8]];
 const result=tablePage(rows,1,'BHA');assert.equal(result.structuredType,'BHA');assert.equal(result.structuredRecords[0].cells.well,'Prueba');assert.equal(result.structuredRecords[0].cells.outerDiameter,'8');assert.equal(result.structuredRecords[0].nameEvidence.serial,'000123');
});
test('cabeceras repetidas no generan registros y columnas ambiguas exigen revisión',()=>{
 const p=tablePage([['Serial','Description','BHA'],['000123','Float sub','1'],['Serial','Description','BHA'],['000124','Filter sub','1']]);assert.equal(p.structuredRecords.length,2);
 const duplicate=tablePage([['Serial','Description','Description','BHA'],['000123','Float sub','Filter sub','1']]);assert(duplicate.sourceWarnings.length);assert(!duplicate.structuredRecords[0].nameEvidence);
 assert.equal(tableHeader([['Serial','Description'],['AAA001','HWDP 5 in']]).end,0);
});
test('PDF reúne fragmentos de cabecera y conserva descripción y serial de su columna',()=>{
 const item=(str,x,y,width=70)=>({str,width,height:10,transform:[1,0,0,1,x,y]});
 const p=coordinateTable([item('Serial',0,600),item('Descripción',150,600,64),item('de',216,600,12),item('la herramienta',230,600,90),item('BHA',400,600),item('000123',0,580),item('Float sub',150,580),item('1',400,580)]);
 assert.equal(p.structuredRecords[0].cells.description,'Float sub');assert.equal(p.structuredRecords[0].nameEvidence.method,'pdf-columns');assert.equal(p.structuredRecords[0].serial,'000123');
});
test('nombre automático completa solo el vacío y conserva exactamente los eventos históricos',async()=>{
 let initial=base();initial=applyGroup(initial,{name:'Conservar grupo',color:'#0d9488'}).state;initial.tools[0].groupId=initial.toolGroups[0].id;
 const old=await prepare({id:'old',name:'old.pdf',type:'REPAIR',records:[{serial:'OLD001',fields:{issuer:'Taller',reportNumber:'R1',workOrder:'OT1',repairDate:'2026-10-01',pin:'OK',box:'OK',machining:'Reface'},evidence:[]}]});initial=applyCommit(initial,old).state;initial.scheduledEvents=[{id:'cita',date:'2027-01-01'}];const before=structuredClone(initial);
 const result=applyCommit(initial,await prepare(draft()));assert.equal(result.state.tools[0].toolName,'Estabilizador 8 in');assert.equal(result.state.tools[0].status,'OPERATIVA');assert.equal(result.state.tools[0].groupId,before.tools[0].groupId);assert.equal(result.state.tools[0].toolType,'Tipo conservado');assert.deepEqual(result.state.events.find(e=>e.id===old.events[0].id),before.events[0]);assert.deepEqual(result.state.documents.find(d=>d.id==='old'),before.documents[0]);assert.deepEqual(result.state.scheduledEvents,before.scheduledEvents);assert.deepEqual(initial,before);assert.deepEqual(result.document.autoNamedSerials,['OLD001']);
});
test('ningún nombre existente ni una decisión manual se sustituye al importar',async()=>{
 for(const extra of [{toolName:'Nombre aprobado',nameSource:'BHA'},{toolName:'Nombre manual',nameSource:'MANUAL'},{toolName:'',nameSource:'MANUAL'}]){const previous=base();Object.assign(previous.tools[0],extra);const saved=applyCommit(previous,await prepare(draft())).state;assert.equal(saved.tools[0].toolName,extra.toolName);}
});
test('OCR, descripciones genéricas, cambios manuales y seriales sin coincidencia no autoasignan',async()=>{
 for(const mutate of [r=>r.nameEvidence.method='ocr',r=>r.nameEvidence.serial='OTHER001',r=>r.nameEvidence.ambiguous=true,r=>r.fields.description='Nombre modificado',r=>{r.fields.description='N/A';r.nameEvidence.value='N/A';}]){const d=draft();mutate(d.records[0]);const saved=applyCommit(base(),await prepare(d)).state;assert.equal(saved.tools[0].toolName,'');}
 const pages=spreadsheetExtractor(book(),'bha.xlsx').pages.map(p=>({...p,method:'ocr'}));const result=analyze(pages);assert.equal(result.records[0].nameEvidence.method,'ocr');assert(documentErrors({...result,validationMode:'automatic'}).some(e=>/imagen/.test(e)));
});
test('un BHA antiguo y nombres contradictorios del mismo día quedan para revisión',async()=>{
 let previous=base();const later=draft('OLD001','Nombre reciente','2026-10-22','later');delete later.records[0].nameEvidence;previous=applyCommit(previous,await prepare(later)).state;
 const saved=applyCommit(previous,await prepare(draft())).state;assert.equal(saved.tools[0].toolName,'');
 previous=base();const conflict=draft('OLD001','Otro nombre','2026-10-20','conflict');delete conflict.records[0].nameEvidence;previous=applyCommit(previous,await prepare(conflict)).state;assert.equal(applyCommit(previous,await prepare(draft())).state.tools[0].toolName,'');
});
test('editar un reporte antiguo conserva el nombre y no rellena herramientas existentes',async()=>{
 const d=draft();delete d.records[0].nameEvidence;let previous=applyCommit(base(),await prepare(d)).state;const edited=await prepare(draft('OLD001','Otro nombre'));const saved=applyCommit(previous,edited,{editing:true,baseRevision:1}).state;assert.equal(saved.tools[0].toolName,'');
 previous=applyCommit(base(),await prepare(draft())).state;const edit=draft();delete edit.records[0].nameEvidence;const updated=applyCommit(previous,await prepare(edit),{editing:true,baseRevision:1}).state;assert.deepEqual(updated.events[0].nameEvidence,previous.events[0].nameEvidence);assert.equal(updated.tools[0].toolName,previous.tools[0].toolName);
});
test('conflicto de descripción entre páginas queda señalado sin inventar un nombre',()=>{
 const pages=['Float sub','Filter sub'].map((description,i)=>({page:i+1,text:'COMPONENTES BHA',bhaCandidates:[{serial:'OLD001',rawSerial:'OLD001',line:description,cells:{description},nameEvidence:{serial:'OLD001',value:description,method:'pdf-columns'}}]}));const result=analyze(pages,'BHA');assert(result.records[0].descriptionConflict);assert(result.sourceWarnings.some(w=>/descripciones/.test(w)));
});
test('la renovación de caché conserva el autoasignado pendiente y respeta nombres remotos nuevos',async()=>{
 const cloud=base(),d=draft(),local=applyCommit(cloud,await prepare(d)).state,ops=[{kind:'save',documentId:d.id,draft:d,options:{}}];assert.equal(overlayPending(cloud,local,ops).tools[0].toolName,'Estabilizador 8 in');const remote=structuredClone(cloud);remote.tools[0].toolName='Corregido desde otro equipo';assert.equal(overlayPending(remote,local,ops).tools[0].toolName,'Corregido desde otro equipo');
});
test('sin conexión persiste la evidencia, se sincroniza y no sobrescribe correcciones remotas',async()=>{
 class Store{constructor(){this.v=new Map();}async get(k){return structuredClone(this.v.get(k));}async update(k,fn){const r=fn(await this.get(k));this.v.set(k,structuredClone(r));return r;}}
 for(const corrected of [false,true]){let online=true;const remote={state:base(),async load(){return structuredClone(this.state);},async save(d,o){const r=applyCommit(this.state,await prepare(d),o);this.state=r.state;return r.document;}};const store=new Store(),make=()=>new OfflineRepository('u','p',remote,{store,online:()=>online}),repo=make();await repo.load();online=false;await repo.save(draft());assert.equal((await make().load()).tools[0].toolName,'Estabilizador 8 in');if(corrected)remote.state.tools[0].toolName='Corrección remota';online=true;await repo.flush();assert.equal((await repo.status()).pending,0);assert.equal(remote.state.tools[0].toolName,corrected?'Corrección remota':'Estabilizador 8 in');}
});
test('índice espacial reproduce agrupación de filas sin modificar los fragmentos',()=>{
 const items=Array.from({length:200},(_,r)=>Array.from({length:8},(_,c)=>({str:r+':'+c,width:20,height:10,transform:[1,0,0,1,c*30,5000-r*12+c%2*.2]}))).flat(),before=structuredClone(items),rows=pdfRows(items);assert.equal(rows.length,200);assert(rows.every(r=>r.items.length===8));assert.deepEqual(items,before);
});
test('cálculo lineal de estado conserva orden técnico y desempates anteriores',()=>{
 const events=Array.from({length:1000},(_,i)=>({id:'e'+i,type:i%3?'REPAIR':'INSPECTION',date:'2026-10-'+String(1+i%27).padStart(2,'0'),createdAt:'2026-10-27T10:00:00Z',fields:{finalConformity:'CONFORME'}})),last=[...events].sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id)).at(-1);assert.equal(statusEngine(events).statusEventId,last.id);assert.equal(statusEngine([...events].reverse()).statusEventId,last.id);
});
