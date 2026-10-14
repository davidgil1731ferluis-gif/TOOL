import {prepare,applyCommit,applyDocumentRemoval,emptyState} from './repository.js';
import {scheduleEntry} from '../engine/calendar.js';
import {statusEngine} from '../engine/statusEngine.js';
import {toolGroup} from '../engine/toolGroup.js';
import {offlineStore} from './offlineStore.js';
import {initialProject,DEFAULT_PROJECT,projectOwner} from './projects.js';
const id=()=>crypto.randomUUID();
const lock=(key,work)=>globalThis.navigator?.locks?navigator.locks.request(key,work):work();
export function overlayPending(cloud,local,operations){
 const state=structuredClone({...emptyState(),...cloud}),documents=new Set(operations.filter(o=>['save','deleteDocument'].includes(o.kind)).map(o=>o.documentId));
 for(const name of ['documents','events','bha','bhaMembers']){
   const belongs=x=>documents.has(name==='documents'?x.id:name==='bhaMembers'?x.bhaId:x.documentId);
   state[name]=state[name].filter(x=>!belongs(x)).concat(local[name].filter(belongs));
 }
 const tools=new Map([...local.tools,...cloud.tools].map(t=>[t.serial,t]));
 state.tools=[...new Set(state.events.map(e=>e.serial))].map(serial=>{const events=state.events.filter(e=>e.serial===serial);return {...tools.get(serial),id:serial,serial,group:toolGroup(serial),eventIds:events.map(e=>e.id),...statusEngine(events)};});
 const agenda=new Set(operations.filter(o=>['saveSchedule','deleteSchedule'].includes(o.kind)).map(o=>o.scheduleId));
 state.scheduledEvents=state.scheduledEvents.filter(e=>!agenda.has(e.id)).concat(local.scheduledEvents.filter(e=>agenda.has(e.id)));
 return state;
}
export class OfflineRepository{
 constructor(uid,project,remote,{store=offlineStore,online=()=>globalThis.navigator?.onLine!==false,onChange=()=>{}}={}){this.uid=uid;this.project=project||DEFAULT_PROJECT;this.scope=projectOwner(uid,this.project);this.key='workspace:'+this.scope;this.remote=remote;this.store=store;this.online=online;this.onChange=onChange;this.running=null;this.syncing=false;}
 async status(){const r=await this.store.get(this.key);return {pending:r?.operations.length||0,pendingDocumentIds:[...new Set((r?.operations||[]).map(o=>o.documentId).filter(Boolean))],syncing:this.syncing,error:r?.error||'',conflict:r?.conflict||null};}
 async emit(){try{this.onChange(await this.status());}catch{}}
 async load(){const cached=await this.store.get(this.key);if(cached)return structuredClone(cached.state);if(!this.online())throw new Error('Abre este proyecto una vez con conexión para descargar sus datos y trabajar sin internet.');const state=await this.remote.load();const r=await this.store.update(this.key,old=>old||{uid:this.uid,project:this.project,state,operations:[],error:'',conflict:null,lastSyncedAt:Date.now()});return structuredClone(r.state);}
 async mutate(change){await this.load();const record=await this.store.update(this.key,r=>{if(r.clearing)throw new Error('Se está vaciando el proyecto. Intenta al terminar.');change(r);r.error=r.conflict?r.error:'';return r;});await this.emit();this.flush().catch(()=>{});return record;}
 async save(draft,options={}){const prepared=await prepare(draft);let saved;await this.mutate(r=>{const original=r.state.documents.find(d=>d.id===draft.id);const localOptions=options.editing&&original?{...options,baseRevision:original.revision||0}:options;const result=applyCommit(r.state,prepared,localOptions);r.state=result.state;saved=result.document;r.operations.push({id:id(),kind:'save',documentId:draft.id,draft:structuredClone(draft),options:{...options,baseCreatedAt:draft.createdAt||original?.createdAt||''}});});return saved;}
 async deleteDocument(documentId,options={}){await this.mutate(r=>{const original=r.state.documents.find(d=>d.id===documentId);r.state=applyDocumentRemoval(r.state,documentId,options).state;if(original)r.operations.push({id:id(),kind:'deleteDocument',documentId,name:original.name,options:{...options,baseRevision:original.revision||0,baseCreatedAt:original.createdAt||''}});});}
 async saveSchedule(input){const entry=scheduleEntry(input);await this.mutate(r=>{r.state.scheduledEvents=r.state.scheduledEvents.filter(e=>e.id!==entry.id).concat(entry);r.operations.push({id:id(),kind:'saveSchedule',scheduleId:entry.id,entry});});return entry;}
 async deleteSchedule(scheduleId){await this.mutate(r=>{r.state.scheduledEvents=r.state.scheduledEvents.filter(e=>e.id!==scheduleId);r.operations.push({id:id(),kind:'deleteSchedule',scheduleId});});}
 async send(op){if(op.kind==='save')return this.remote.save(op.draft,{...op.options,operationId:op.id});if(op.kind==='deleteDocument')return this.remote.deleteDocument(op.documentId,op.options);if(op.kind==='saveSchedule')return this.remote.saveSchedule(op.entry);if(op.kind==='deleteSchedule')return this.remote.deleteSchedule(op.scheduleId);throw new Error('Operación pendiente no reconocida.');}
 flush({refresh=false}={}){this.requestRefresh||=refresh;if(!this.online())return Promise.resolve();if(this.running)return this.running.then(async()=>{const r=await this.store.get(this.key);if((r?.operations.length||this.requestRefresh)&&!r.conflict&&!r.error)return this.flush();});this.running=lock('tooltrace-cloud:'+this.scope,()=>this.drain()).finally(()=>{this.running=null;});return this.running;}
 async drain(){if(!this.online())return;const initial=await this.store.get(this.key),refresh=this.requestRefresh;this.requestRefresh=false;if(!initial||initial.clearing||initial.conflict||(!initial.operations.length&&(!refresh||(!initial.error&&Date.now()-(initial.lastSyncedAt||0)<15000))))return;this.syncing=true;await this.emit();try{
   while(this.online()){
     const r=await this.store.get(this.key),op=r.operations[0];if(!op)break;
     try{const saved=await this.send(op);await this.store.update(this.key,current=>{
       if(!current.operations.some(o=>o.id===op.id))return current;
       current.operations=current.operations.filter(o=>o.id!==op.id);current.error='';current.conflict=null;
       // La siguiente edición local se refiere a la generación realmente creada en Firebase.
       if(saved?.createdAt)for(const next of current.operations)if(next.documentId===op.documentId&&next.options)next.options.baseCreatedAt=saved.createdAt;
       const localDoc=current.state.documents.find(d=>d.id===op.documentId);if(localDoc&&saved)localDoc.createdAt=saved.createdAt;
       return current;
     });await this.emit();}
     catch(e){const conflict=Boolean(op.documentId&&/(otra sesión|ya fue guardado|ya existe un evento|ya no está disponible|generación|cambió)/i.test(e.message));await this.store.update(this.key,current=>{if(!current.operations.some(o=>o.id===op.id))return current;current.error=e.message;current.conflict=conflict?{operationId:op.id,documentId:op.documentId,name:op.name||op.draft?.name||current.state.documents.find(d=>d.id===op.documentId)?.name||'Documento',message:e.message}:null;return current;});return;}
   }
   if(this.online()){const cloud=await this.remote.load();await this.store.update(this.key,r=>{r.state=overlayPending(cloud,r.state,r.operations);r.lastSyncedAt=Date.now();if(!r.operations.length){r.error='';r.conflict=null;}return r;});}
 }catch(e){await this.store.update(this.key,r=>({...r,error:e.message}));}finally{this.syncing=false;await this.emit();}}
 async resolveConflict(keepLocal){if(!this.online())throw new Error('Conéctate para resolver la diferencia con la versión en línea.');await lock('tooltrace-cloud:'+this.scope,async()=>{const before=await this.store.get(this.key);if(!before?.conflict)return;const cloud=await this.remote.load();await this.store.update(this.key,r=>{
   if(r.conflict?.operationId!==before.conflict.operationId)throw new Error('La sincronización cambió. Abre de nuevo esta opción.');const documentId=r.conflict.documentId,local=r.state.documents.find(d=>d.id===documentId),server=cloud.documents.find(d=>d.id===documentId);
   r.operations=r.operations.filter(o=>o.documentId!==documentId);
   if(keepLocal&&local){if(server&&server.type!==local.type)throw new Error('El tipo del reporte en línea es diferente. Revisa el documento antes de reemplazarlo.');const draft={...local,records:r.state.events.filter(e=>e.documentId===documentId).map(e=>({serial:e.serial,rawSerial:e.rawSerial,sourceEventId:e.id,template:e.template,evidence:e.evidence,fields:e.fields}))};local.revision=server?(server.revision||0)+1:1;local.createdAt=server?.createdAt||local.createdAt;r.operations.push({id:id(),kind:'save',documentId,draft,options:{editing:!!server,baseRevision:server?.revision||0,baseCreatedAt:server?.createdAt||''}});}
   else if(keepLocal&&server)r.operations.push({id:id(),kind:'deleteDocument',documentId,options:{baseRevision:server.revision||0,baseCreatedAt:server.createdAt||''}});
   r.state=overlayPending(cloud,r.state,r.operations);r.error='';r.conflict=null;return r;
 });});await this.emit();return this.flush();}
 async clearAll(options={}){if(!this.online())throw new Error('Conéctate para vaciar o eliminar un proyecto.');return lock('tooltrace-cloud:'+this.scope,async()=>{await this.store.update(this.key,r=>{if(r?.operations.length)throw new Error('Sincroniza o resuelve los cambios pendientes antes de vaciar el proyecto.');return {...r,clearing:true};});try{await this.remote.clearAll(options);await this.store.update(this.key,r=>({...r,state:emptyState(),operations:[],error:'',conflict:null,clearing:false}));}catch(e){await this.store.update(this.key,r=>({...r,clearing:false,error:e.message}));throw e;}finally{await this.emit();}});}
}
export class CachedProjectDirectory{
 constructor(uid,remote,{store=offlineStore,online=()=>navigator.onLine}={}){this.uid=uid;this.remote=remote;this.store=store;this.online=online;this.key='directory:'+uid;}
 async list(){const cached=await this.store.get(this.key);if(!this.online())return cached?.projects||[initialProject()];try{const projects=await this.remote.list();await this.store.update(this.key,()=>({uid:this.uid,projects}));return projects;}catch(e){if(cached)return cached.projects;throw e;}}
 async create(name){if(!this.online())throw new Error('Conéctate para crear un proyecto.');const entry=await this.remote.create(name);await this.store.update(this.key,r=>({uid:this.uid,projects:[...(r?.projects||[initialProject()]).filter(p=>p.id!==entry.id),entry]}));return entry;}
 async remove(project){if(!this.online())throw new Error('Conéctate para eliminar un proyecto.');await this.remote.remove(project);await this.store.update(this.key,r=>({uid:this.uid,projects:(r?.projects||[initialProject()]).filter(p=>p.id!==project)}));}
}
