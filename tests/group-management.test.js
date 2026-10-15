import test from 'node:test';
import assert from 'node:assert/strict';
import {applyGroup,applyGroupUpdate,applyGroupRemoval,applyAssignments,applyGroupToolsRemoval,groupToolsSnapshot,groupInfo} from '../src/engine/toolCatalog.js';
import {emptyState,applyCommit,prepare,documentErrors} from '../src/adapters/repository.js';
import {OfflineRepository,overlayPending} from '../src/adapters/offlineRepository.js';
import {reportModel} from '../src/export/reportModel.js';
const draft=(id='r',type='REPAIR')=>({id,name:id+'.pdf',type,expectedCount:3,records:['TEST001N','TEST002N','OTHER003'].map(serial=>({serial,evidence:[],fields:type==='BHA'?{bhaNumber:'1',well:'Pozo',phase:'12',bhaDate:'2026-10-01'}:{issuer:'Taller',reportNumber:id,workOrder:'OT1',repairDate:'2026-10-01',pin:'OK',box:'OK',machining:'Reface'}}))});
async function fixture(){let state=applyCommit(emptyState(),await prepare(draft())).state;state=applyCommit(state,await prepare(draft('b','BHA'))).state;state=applyGroup(state,{name:'Grupo A',color:'#2563eb'}).state;const id=state.toolGroups[0].id;state=applyAssignments(state,{groupId:id,serials:'TEST001N\nTEST002N'}).state;return {state,id};}
test('editar nombre/color conserva ID, herramientas, estado, historial y grupo de Excel',async()=>{
 const {state,id}=await fixture(),next=applyGroupUpdate(state,{id,name:'Brocas',color:'#db2777'}).state;
 assert.equal(next.toolGroups[0].id,id);assert.deepEqual(next.events,state.events);assert.deepEqual(next.tools,state.tools);assert.equal(groupInfo(next,next.tools.find(t=>t.serial==='TEST001N')).name,'Brocas');assert.equal(reportModel(next,{group:id})[0].rows[0][1],'Brocas');
 assert.throws(()=>applyGroupUpdate(next,{id,name:'HWDP',color:'#123456'}),/existe/);const two=applyGroup(next,{name:'Otro',color:'#123456'}).state;assert.throws(()=>applyGroupUpdate(two,{id,name:'Otro',color:'#123456'}),/existe/);assert.throws(()=>applyGroup(two,{name:'Brocas',color:'#123456'}),/existe/);
});
test('eliminar grupo traslada todas las herramientas y no elimina eventos ni documentos',async()=>{
 const {state,id}=await fixture(),next=applyGroupRemoval(state,id,'OTRAS').state;assert.equal(next.toolGroups.length,0);assert.equal(next.tools.length,state.tools.length);assert.deepEqual(next.events,state.events);assert.deepEqual(next.documents,state.documents);assert(next.tools.filter(t=>t.serial.startsWith('TEST')).every(t=>t.groupId==='OTRAS'));
 assert.throws(()=>applyGroupRemoval(state,id,id),/destino/);assert.throws(()=>applyGroupRemoval(state,'HWDP','OTRAS'),/iniciales/);
});
test('añadir seriales normaliza y elimina repetidos, conserva estado/tipo y valida toda la lista antes de guardar',async()=>{
 const {state,id}=await fixture();state.tools.find(t=>t.serial==='TEST001N').toolType='Heavy Weight';const next=applyAssignments(state,{groupId:id,serials:'test001n, NEW004; NEW004\nNEW005'}).state;assert.equal(next.tools.length,5);assert.equal(next.tools.find(t=>t.serial==='TEST001N').status,'OPERATIVA');assert.equal(next.tools.find(t=>t.serial==='TEST001N').toolType,'Heavy Weight');assert.equal(next.tools.find(t=>t.serial==='NEW004').status,'SIN_ESTADO_TECNICO');assert.deepEqual(next.events,state.events);assert.throws(()=>applyAssignments(state,{groupId:id,serials:'NEW006; inválido'}),/inválidos/);assert.equal(state.tools.length,3);
});
test('vaciar grupo conserva grupo y otros seriales; reporte compartido cambia una sola revisión y conteo auditado',async()=>{
 const {state,id}=await fixture();state.scheduledEvents=[{id:'agenda',serial:'TEST001N'}];const result=applyGroupToolsRemoval(state,id,{snapshot:groupToolsSnapshot(state,id)}),next=result.state;
 assert.equal(next.toolGroups.length,1);assert.equal(next.tools.length,1);assert.equal(next.tools[0].serial,'OTHER003');assert.equal(next.events.length,2);assert.equal(next.bhaMembers.length,1);assert.equal(next.scheduledEvents.length,1);
 for(const doc of next.documents){assert.equal(doc.revision,2);assert.equal(doc.recordCount,1);assert.equal(doc.expectedCount,3);assert.deepEqual(documentErrors({...doc,records:next.events.filter(e=>e.documentId===doc.id)}),[]);}
 const all=applyGroupToolsRemoval(next,'OTRAS');assert.equal(all.state.documents.length,0);assert.equal(all.state.bha.length,0);assert.equal(all.state.bhaMembers.length,0);assert.equal(all.state.toolGroups.length,1);
});
test('vaciar grupo rechaza una ficha nueva, reagrupación o historial actualizado después de confirmar',async()=>{
 const {state,id}=await fixture(),snapshot=groupToolsSnapshot(state,id),changed=applyAssignments(state,{groupId:id,serials:'NEW004'}).state;assert.throws(()=>applyGroupToolsRemoval(changed,id,{snapshot}),/cambió/);const moved=applyAssignments(state,{groupId:'OTRAS',serials:'TEST001N'}).state;assert.throws(()=>applyGroupToolsRemoval(moved,id,{snapshot}),/cambió/);assert.throws(()=>applyGroupToolsRemoval(state,'HWDP'),/no contiene/);
});
class Store{constructor(){this.map=new Map();}async get(k){return structuredClone(this.map.get(k));}async update(k,fn){const next=fn(await this.get(k));this.map.set(k,structuredClone(next));return structuredClone(next);}}
class Remote{
 constructor(state){this.state=state;this.receipts=new Set();this.loseAck=false;}
 async load(){return structuredClone(this.state);}
 async saveGroup(input){const r=applyGroup(this.state,input);this.state=r.state;return r.entry;}
 async operation(options,work){if(this.receipts.has(options?.operationId))return;const r=work();this.state=r.state;if(options?.operationId)this.receipts.add(options.operationId);if(this.loseAck){this.loseAck=false;throw Error('Conexión perdida después del envío');}return r.entry||r;}
 async updateGroup(input,options){return this.operation(options,()=>applyGroupUpdate(this.state,input,options));}
 async deleteGroup(id,target,options){return this.operation(options,()=>applyGroupRemoval(this.state,id,target,options));}
 async deleteGroupTools(id,options){return this.operation(options,()=>applyGroupToolsRemoval(this.state,id,options));}
 async assignSerials(input,options){return this.operation(options,()=>{const result=applyAssignments(this.state,input);for(const tool of result.state.tools)if(input.createdAtBySerial?.[tool.serial])tool.createdAt=input.createdAtBySerial[tool.serial];return result;});}
}
test('edición, asignación masiva y borrado de grupo sobreviven reinicio sin red y sincronizan en orden',async()=>{
 const {state,id}=await fixture(),remote=new Remote(state),store=new Store();let online=true;const make=()=>new OfflineRepository('u','principal',remote,{store,online:()=>online});let repo=make();await repo.load();online=false;
 await repo.updateGroup({id,name:'Renombrado',color:'#db2777'});await repo.assignSerials({groupId:id,serials:'NEW004, NEW005'});await repo.deleteGroup(id,'OTRAS');repo=make();assert.equal((await repo.status()).pending,3);assert.equal((await repo.load()).toolGroups.length,0);const overlay=overlayPending(remote.state,await repo.load(),(await store.get(repo.key)).operations);assert.equal(overlay.toolGroups.length,0);assert(overlay.tools.every(t=>!['TEST001N','TEST002N','NEW004','NEW005'].includes(t.serial)||t.groupId==='OTRAS'));
 online=true;await repo.flush();assert.equal((await repo.status()).pending,0,JSON.stringify(await repo.status()));assert.equal(remote.state.tools.length,5);assert.equal(remote.state.toolGroups.length,0);assert.equal(remote.state.events.length,6);
});
test('asignar seriales nuevos y vaciar sin red conserva generaciones y elimina solo lo confirmado',async()=>{
 const {state,id}=await fixture(),remote=new Remote(state),store=new Store();let online=true;const repo=new OfflineRepository('u','p',remote,{store,online:()=>online});await repo.load();online=false;await repo.assignSerials({groupId:id,serials:'NEW004, NEW005'});await repo.deleteGroupTools(id,{snapshot:groupToolsSnapshot(await repo.load(),id)});online=true;await repo.flush();assert.equal((await repo.status()).pending,0,JSON.stringify(await repo.status()));assert.equal(remote.state.tools.length,1);assert.equal(remote.state.toolGroups.length,1);
});
test('acuse perdido de vaciado no vuelve a eliminar un serial creado después; conflicto recupera versión en línea',async()=>{
 const {state,id}=await fixture(),remote=new Remote(state),store=new Store();let online=true;const repo=new OfflineRepository('u','p',remote,{store,online:()=>online});await repo.load();online=false;await repo.deleteGroupTools(id,{snapshot:groupToolsSnapshot(await repo.load(),id)});online=true;remote.loseAck=true;await repo.flush();assert.equal((await repo.status()).pending,1);remote.state=applyAssignments(remote.state,{groupId:id,serials:'TEST001N'}).state;await repo.flush();assert.equal((await repo.status()).pending,0);assert(remote.state.tools.some(t=>t.serial==='TEST001N'));
 online=false;await repo.deleteGroupTools(id,{snapshot:groupToolsSnapshot(await repo.load(),id)});remote.state.tools.find(t=>t.serial==='TEST001N').createdAt='otra generación';online=true;await repo.flush();assert.equal((await repo.status()).conflict.kind,'deleteGroupTools');await repo.resolveConflict(false);assert.equal((await repo.status()).pending,0);assert((await repo.load()).tools.some(t=>t.serial==='TEST001N'));
});
