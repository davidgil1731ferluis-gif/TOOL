import test from 'node:test';
import assert from 'node:assert/strict';
import {toolNameProposals,applyToolName,namePatch} from '../src/engine/toolNames.js';
import {applyTool,applyAssignments} from '../src/engine/toolCatalog.js';
import {emptyState,applyCommit,prepare} from '../src/adapters/repository.js';
import {toolMatches} from '../src/engine/toolFilters.js';
import {reportModel} from '../src/export/reportModel.js';
import {OfflineRepository,overlayPending} from '../src/adapters/offlineRepository.js';
import {bhaColumnCandidates} from '../src/engine/pdfLines.js';
import {spreadsheetExtractor} from '../src/engine/spreadsheetExtractor.js';
import {utils,write} from 'xlsx';
const fixture=()=>({...emptyState(),tools:[{id:'AAA001',serial:'AAA001',createdAt:'generation1',groupId:'HWDP',toolType:'Tipo conservado',status:'OPERATIVA',eventIds:['e1','e2']}],documents:[{id:'d1',type:'BHA',createdAt:'d1generation',revision:3},{id:'d2',type:'BHA',createdAt:'d2generation',revision:2}],events:[{id:'e1',serial:'AAA001',type:'BHA',date:'2026-01-01',documentId:'d1',fields:{description:'Nombre anterior'}},{id:'e2',serial:'AAA001',type:'BHA',date:'2026-02-01',documentId:'d2',fields:{description:'(5) Estabilizador nuevo'}}],bha:[{id:'d1',number:'1'}],bhaMembers:[{id:'e1',toolId:'AAA001',bhaId:'d1'}],scheduledEvents:[{id:'agenda',date:'2027-01-01'}]});
test('propuestas usan BHA más reciente sin modificar datos; nombres manuales y empates ambiguos se omiten',()=>{
 const state=fixture(),before=structuredClone(state),p=toolNameProposals(state);assert.equal(p[0].toolName,'Estabilizador nuevo');assert.equal(p[0].nameSourceDocumentId,'d2');assert.deepEqual(state,before);
 state.tools[0].toolName='Nombre elegido';assert.deepEqual(toolNameProposals(state),[]);delete state.tools[0].toolName;
 state.events.push({...state.events[1],id:'e3',fields:{description:'Nombre diferente'}});assert.deepEqual(toolNameProposals(state),[]);
});
test('completar nombre solo cambia metadatos del serial: conserva todas las entidades y campos validados',()=>{
 const state=fixture(),before=structuredClone(state),p=toolNameProposals(state)[0],saved=applyToolName(state,p).state;
 for(const key of ['documents','events','bha','bhaMembers','scheduledEvents','toolGroups'])assert.deepEqual(saved[key],before[key]);
 for(const [key,value] of Object.entries(before.tools[0]))assert.deepEqual(saved.tools[0][key],value);
 assert.equal(saved.tools[0].toolName,p.toolName);assert.deepEqual(state,before);
 const concurrent=structuredClone(state);concurrent.tools[0].groupId='OTRAS';concurrent.tools[0].status='CONFORME';assert.equal(applyToolName(concurrent,p).entry.groupId,'OTRAS');assert.equal(applyToolName(concurrent,p).entry.status,'CONFORME');
});
test('rechaza nombre, generación o BHA obsoletos y nunca recrea una herramienta eliminada',()=>{
 const state=fixture(),p=toolNameProposals(state)[0];for(const mutate of [s=>s.tools[0].toolName='Otro',s=>s.tools[0].createdAt='Nueva',s=>s.documents[1].revision++,s=>s.tools=[]]){const copy=structuredClone(state);mutate(copy);assert.throws(()=>applyToolName(copy,p),/cambió|disponible/);}
 assert.throws(()=>applyToolName(state,{...p,toolName:'x'.repeat(161)}),/160/);
 const request={...p,operationId:'retry-safe'},entry=applyToolName(state,request).entry;assert.deepEqual(namePatch(entry,request),{});
});
test('editar nombre, cambiar grupo e importar reportes preservan el nombre sin alterar la historia',async()=>{
 let state=fixture();state=applyTool(state,{serial:'AAA001',toolName:'Nombre propio',groupId:'HWDP',toolType:'Tipo conservado'}).state;
 state=applyAssignments(state,{groupId:'OTRAS',serials:['AAA001']}).state;assert.equal(state.tools[0].toolName,'Nombre propio');
 const prepared=await prepare({id:'repair',name:'repair.pdf',type:'REPAIR',records:[{serial:'AAA001',evidence:[],fields:{issuer:'Taller',reportNumber:'R1',workOrder:'OT',repairDate:'2026-03-01',pin:'OK',box:'OK',machining:'Reface'}}]});state=applyCommit(state,prepared).state;assert.equal(state.tools[0].toolName,'Nombre propio');assert.equal(state.tools[0].status,'OPERATIVA');
 assert.throws(()=>applyTool(state,{serial:'AAA001',toolName:'Obsoleto',groupId:'OTRAS',baseName:'Otro',baseCreatedAt:state.tools[0].createdAt}),/cambió/);
});
test('nombre combina filtros y exportación sin recortar el historial de la herramienta',()=>{
 const state=fixture();state.tools[0].toolName='Estabilizador hidráulico';assert(toolMatches(state.tools[0],state.events,{name:' HIDRAULICO ',group:'HWDP',from:'2026-02-01'}));assert(!toolMatches(state.tools[0],state.events,{name:'HWDP'}));
 const sheets=reportModel(state,{name:'HIDRAULICO'});assert.equal(sheets[0].rows.length,1);assert(sheets[0].columns.some(c=>c.label==='Evento 2 · Fecha'));assert.equal(reportModel(state,{name:'Inexistente'})[0].rows.length,0);
});
test('BHA nuevo nombra herramientas nuevas; las ya validadas requieren vista previa',async()=>{
 const draft={id:'newBHA',name:'bha.xlsx',type:'BHA',records:['NEW001','OLD001'].map(serial=>({serial,evidence:[],fields:{bhaNumber:'3',well:'Prueba',phase:'12',bhaDate:'2026-03-01',description:'(2) HWDP 5 in'}}))},previous=applyTool(emptyState(),{serial:'OLD001',groupId:'HWDP',toolType:'Tipo conservado'}).state;
 const saved=applyCommit(previous,await prepare(draft)).state;assert.equal(saved.tools.find(t=>t.serial==='NEW001').toolName,'HWDP 5 in');assert.equal(saved.tools.find(t=>t.serial==='OLD001').toolName,'');assert.equal(toolNameProposals(saved).find(p=>p.serial==='OLD001').toolName,'HWDP 5 in');assert.equal(saved.tools.find(t=>t.serial==='NEW001').status,'SIN_ESTADO_TECNICO');
});
test('Excel BHA propaga descripción solo dentro de celdas realmente combinadas',()=>{
 const ws=utils.aoa_to_sheet([['COMPONENTES BHA'],['BHA','1'],['Pozo','Prueba'],['Fecha','2026-02-01'],['Fase','12'],['Descripción de la herramienta','Serial','Diámetro externo'],['(2) HWDP 5 in','AAA001',5],['','AAA002',5],['Estabilizador','AAA003',8]]);ws['!merges']=[utils.decode_range('A7:A8')];const wb=utils.book_new();utils.book_append_sheet(wb,ws,'BHA');const result=spreadsheetExtractor(write(wb,{type:'array',bookType:'xlsx'}),'bha.xlsx');assert.deepEqual(result.pages[0].structuredRecords.map(r=>r.cells.description),['(2) HWDP 5 in','(2) HWDP 5 in','Estabilizador']);
});
test('PDF BHA reconoce nombres combinados por cantidad y nombres individuales sin extenderlos a otros seriales',()=>{
 const item=(str,x,y,width=25)=>({str,width,height:7,transform:[7,0,0,7,x,y]});const items=[item('COMPONENTES BHA',0,140),item('Descripción de la',60,110,40),item('Conexión',115,105),item('Serial',210,105),item('Externo',260,105),item('Interno',300,105),item('Efectiva',350,105),item('Long Parcial',400,105),item('AAA001',210,90),item('AAA002',210,80),item('AAA003',210,65),item('(2) HWDP 5 in',60,85,45),item('Estabilizador',60,65,45),item('JETS BROCA',50,20)];const result=bhaColumnCandidates(items);assert.deepEqual(result.map(r=>r.cells.description),['HWDP 5 in','HWDP 5 in','Estabilizador']);
});
class Store{constructor(){this.values=new Map();}async get(k){return structuredClone(this.values.get(k));}async update(k,fn){const value=fn(await this.get(k));this.values.set(k,structuredClone(value));return structuredClone(value);}}
test('nombre sin conexión sobrevive reinicio, sincroniza con cambios remotos sin sobrescribirlos y tolera acuse perdido',async()=>{
 const store=new Store();let online=false,lost=true;const remote={state:fixture(),async load(){return structuredClone(this.state);},async saveToolName(input){const r=applyToolName(this.state,input);this.state=r.state;if(lost){lost=false;throw Error('Conexión perdida');}return r.entry;}};online=true;
 const make=()=>new OfflineRepository('owner','project',remote,{store,online:()=>online}),repo=make();await repo.load();online=false;const p=toolNameProposals(await repo.load())[0];await repo.saveToolName(p);assert.equal((await make().load()).tools[0].toolName,p.toolName);
 remote.state.tools[0].groupId='OTRAS';remote.state.tools[0].status='CONFORME';const history=structuredClone(remote.state.events);online=true;await repo.flush();assert.equal((await repo.status()).pending,1);await repo.flush();assert.equal((await repo.status()).pending,0);assert.equal(remote.state.tools[0].groupId,'OTRAS');assert.equal(remote.state.tools[0].status,'CONFORME');assert.deepEqual(remote.state.events,history);
});
test('overlay de nombre pendiente conserva metadatos remotos y no recrea herramienta eliminada',()=>{
 const state=fixture(),entry=toolNameProposals(state)[0],local=applyToolName(state,entry).state,op={kind:'saveToolName',serial:entry.serial,entry};state.tools[0].groupId='OTRAS';assert.equal(overlayPending(state,local,[op]).tools[0].groupId,'OTRAS');assert.equal(overlayPending(state,local,[op]).tools[0].toolName,entry.toolName);state.tools=[];state.events=[];assert.deepEqual(overlayPending(state,local,[op]).tools,[]);
});
