import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,applyCommit,prepare,applyDocumentRemoval,documentErrors} from '../src/adapters/repository.js';
import {applyTool,applyGroup,applyToolRemoval,toolRemovalSnapshot,groupInfo} from '../src/engine/toolCatalog.js';
import {reportModel} from '../src/export/reportModel.js';
import {OfflineRepository,overlayPending} from '../src/adapters/offlineRepository.js';
import {documentEventDates,documentDateCard} from '../src/views/toolCatalogViews.js';
const draft=(id='report',serials=['ABC001N','ABC002N'])=>({id,name:id+'.pdf',type:'REPAIR',expectedCount:serials.length,records:serials.map(serial=>({serial,evidence:[],fields:{issuer:'Taller',reportNumber:id,workOrder:'OT-1',repairDate:'2026-09-01',pin:'OK',box:'OK',machining:'Reface',observations:''}}))});
const initial=async()=>applyCommit(emptyState(),await prepare(draft())).state;
test('grupo manual y tipo sobreviven importación, edición, borrado de reporte y exportación',async()=>{
 let state=applyGroup(emptyState(),{name:'Estabilizadores',color:'#0d9488'}).state;const group=state.toolGroups[0];
 state=applyTool(state,{serial:' abc001n ',groupId:group.id,toolType:'Estabilizador'}).state;
 state=applyCommit(state,await prepare(draft())).state;
 assert.equal(groupInfo(state,state.tools.find(t=>t.serial==='ABC001N')).name,'Estabilizadores');
 const sheet=reportModel(state,{group:group.id})[0];assert.equal(sheet.rows.length,1);assert.equal(sheet.rows[0][1],'Estabilizadores');
 state=applyDocumentRemoval(state,'report').state;assert.equal(state.tools.length,1);assert.equal(state.tools[0].status,'SIN_ESTADO_TECNICO');assert.equal(state.tools[0].toolType,'Estabilizador');
 assert.equal(reportModel(state)[0].rows[0][0],'ABC001N');
 assert.throws(()=>applyGroup(state,{name:'Estabilizadores',color:'#ff0000'}),/ya existe/);
 assert.throws(()=>applyTool(state,{serial:'ABC003',groupId:'inexistente'}),/grupo/);
 assert.throws(()=>applyGroup(state,{name:'Otro',color:'red;display:none'}),/color/);
});
test('eliminar serial conserva otros seriales del reporte, agenda, conteo auditado y estado',async()=>{
 const state=await initial();state.scheduledEvents=[{id:'agenda',serial:'ABC001N'}];
 const result=applyToolRemoval(state,'ABC001N',{snapshot:toolRemovalSnapshot(state,'ABC001N')});
 assert.equal(result.state.tools.length,1);assert.equal(result.state.events[0].serial,'ABC002N');assert.equal(result.state.tools[0].status,'OPERATIVA');
 assert.equal(result.state.documents[0].revision,2);assert.equal(result.state.documents[0].recordCount,1);assert.equal(result.state.documents[0].expectedCount,2);assert.deepEqual(result.state.documents[0].excludedSerials,['ABC001N']);
 assert.equal(result.state.scheduledEvents.length,1);
 assert.deepEqual(documentErrors({...result.state.documents[0],records:result.state.events}),[]);
 const last=applyToolRemoval(result.state,'ABC002N');assert.equal(last.state.documents.length,0);assert.deepEqual(last.removedDocumentIds,['report']);
});
test('borrado BHA quita solo miembros del serial y rechaza historial o generación obsoletos',async()=>{
 const d={id:'bha',name:'bha.pdf',type:'BHA',records:['ABC001','ABC002'].map(serial=>({serial,evidence:[],fields:{bhaNumber:'1',well:'Pozo',phase:'12',bhaDate:'2026-09-10'}}))};
 const state=applyCommit(emptyState(),await prepare(d)).state,snapshot=toolRemovalSnapshot(state,'ABC001');
 const result=applyToolRemoval(state,'ABC001',{snapshot});assert.equal(result.state.bha.length,1);assert.equal(result.state.bhaMembers.length,1);assert.equal(result.state.bhaMembers[0].toolId,'ABC002');
 const changed=structuredClone(state);changed.documents[0].revision++;assert.throws(()=>applyToolRemoval(changed,'ABC001',{snapshot}),/cambió/);
 changed.documents[0].revision--;changed.tools.find(t=>t.serial==='ABC001').createdAt='new generation';assert.throws(()=>applyToolRemoval(changed,'ABC001',{snapshot}),/cambió/);
});
class Store{constructor(){this.map=new Map();}async get(k){return structuredClone(this.map.get(k));}async update(k,fn){const next=fn(await this.get(k));this.map.set(k,structuredClone(next));return structuredClone(next);}}
class Remote{
 constructor(state){this.state=state;this.receipts=new Set();this.loseAck=false;}
 async load(){return structuredClone(this.state);}
 async saveGroup(input){const result=applyGroup(this.state,input);this.state=result.state;return result.entry;}
 async saveTool(input){const result=applyTool(this.state,input);this.state=result.state;return result.entry;}
 async save(d,options){const p=await prepare(d);p.document.createdAt='2026-10-14T23:59:00.000Z';for(const e of p.events)e.createdAt=p.document.createdAt;const result=applyCommit(this.state,p,options);this.state=result.state;return result.document;}
 async deleteTool(serial,options){if(this.receipts.has(options.operationId))return;const result=applyToolRemoval(this.state,serial,options);this.state=result.state;this.receipts.add(options.operationId);if(this.loseAck){this.loseAck=false;throw Error('Conexión perdida');}return result;}
}
test('carga nueva sin conexión y eliminación posterior concilian la generación remota',async()=>{
 const remote=new Remote(emptyState()),store=new Store();let online=true;const repo=new OfflineRepository('u','p',remote,{store,online:()=>online});await repo.load();online=false;
 await repo.save(draft('nuevo',['ABC001N']));await repo.deleteTool('ABC001N',{snapshot:toolRemovalSnapshot(await repo.load(),'ABC001N')});online=true;await repo.flush();assert.equal((await repo.status()).pending,0,JSON.stringify(await repo.status()));assert.equal(remote.state.events.length,0);assert.equal(remote.state.documents.length,0);
});
test('grupos, herramientas y eliminación se conservan sin conexión y sincronizan por orden',async()=>{
 const remote=new Remote(await initial()),store=new Store();let online=true;
 const make=()=>new OfflineRepository('u','principal',remote,{store,online:()=>online});let repo=make();await repo.load();online=false;
 const group=await repo.saveGroup({name:'Brocas',color:'#be185d'});await repo.saveTool({serial:'BIT123',groupId:group.id,toolType:'Broca'});
 await repo.deleteTool('ABC001N',{snapshot:toolRemovalSnapshot(await repo.load(),'ABC001N')});
 repo=make();assert.equal((await repo.status()).pending,3);assert.equal((await repo.load()).tools.length,2);
 online=true;await repo.flush();assert.equal((await repo.status()).pending,0,JSON.stringify(await repo.status()));assert.equal(remote.state.tools.length,2);assert.equal(remote.state.events.length,1);assert.equal(groupInfo(remote.state,remote.state.tools.find(t=>t.serial==='BIT123')).name,'Brocas');
});
test('acuse perdido de eliminación no elimina una nueva carga del mismo serial',async()=>{
 const remote=new Remote(await initial()),store=new Store();let online=true;const repo=new OfflineRepository('u','p',remote,{store,online:()=>online});await repo.load();online=false;
 await repo.deleteTool('ABC001N',{snapshot:toolRemovalSnapshot(await repo.load(),'ABC001N')});remote.loseAck=true;online=true;await repo.flush();assert.equal((await repo.status()).pending,1);
 remote.state=applyCommit(remote.state,await prepare(draft('nuevo',['ABC001N']))).state;await repo.flush();assert.equal((await repo.status()).pending,0);assert(remote.state.tools.some(t=>t.serial==='ABC001N'));
});
test('eliminación con cambios remotos se recupera para revisar sin borrar el historial nuevo',async()=>{
 const remote=new Remote(await initial()),store=new Store();let online=true;const repo=new OfflineRepository('u','p',remote,{store,online:()=>online});await repo.load();online=false;await repo.deleteTool('ABC001N',{snapshot:toolRemovalSnapshot(await repo.load(),'ABC001N')});
 remote.state=applyCommit(remote.state,await prepare(draft('nuevo',['ABC001N']))).state;online=true;await repo.flush();assert.equal((await repo.status()).conflict.kind,'deleteTool');await repo.resolveConflict(false);assert.equal((await repo.status()).pending,0);assert.equal((await repo.load()).events.filter(e=>e.serial==='ABC001N').length,2);
});
test('overlay conserva registros manuales vacíos y grupos pendientes; tarjeta usa fecha de evento',async()=>{
 const cloud=await initial();let local=applyGroup(cloud,{name:'Brocas',color:'#be185d'}).state;const entry=local.toolGroups[0];local=applyTool(local,{serial:'BIT123',groupId:entry.id}).state;
 const overlay=overlayPending(cloud,local,[{kind:'saveGroup',entry},{kind:'saveTool',serial:'BIT123'}]);assert(overlay.tools.some(t=>t.serial==='BIT123'));assert.equal(overlay.toolGroups.length,1);
 assert(!overlayPending(cloud,local,[]).tools.some(t=>t.serial==='BIT123'),'un registro manual eliminado en otro dispositivo no reaparece desde la caché');
 const doc={id:'r',type:'REPAIR',createdAt:'2026-10-14'},events=[{documentId:'r',date:'2026-09-10'},{documentId:'r',date:'2026-09-01'}];assert.deepEqual(documentEventDates(doc,events),['2026-09-01','2026-09-10']);assert.match(documentDateCard(doc,events),/01\/09\/2026 – 10\/09\/2026/);assert(!documentDateCard(doc,events).includes('14/10/2026'));
});
