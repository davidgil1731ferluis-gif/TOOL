import {namePatch,checkNameDocument} from '../engine/toolNames.js';
import {allGroups,applyGroup,groupEntry,toolEntry,applyToolRemoval,applyGroupUpdate,applyGroupRemoval,groupId,assignmentSerials,applyGroupToolsRemoval} from '../engine/toolCatalog.js';
import {initializeApp} from 'firebase/app';
import {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail,sendEmailVerification,onAuthStateChanged,signOut,connectAuthEmulator,reload} from 'firebase/auth';
import {getFirestore,collection,getDocsFromServer as getDocs,doc,runTransaction,connectFirestoreEmulator,setDoc,deleteDoc,writeBatch} from 'firebase/firestore';
import {scheduleEntry} from '../engine/calendar.js';
import {firebaseConfig,useEmulators} from '../config.js';
import {prepare,applyCommit,applyDocumentRemoval,collectionNames,emptyState} from './repository.js';
import {projectPath,initialProject,newProject,DEFAULT_PROJECT} from './projects.js';
export const configured=Boolean(firebaseConfig.apiKey&&firebaseConfig.projectId&&firebaseConfig.appId);
const app=configured?initializeApp(firebaseConfig):null;
export const auth=app?getAuth(app):null;const db=app?getFirestore(app):null;
if(app&&useEmulators){connectAuthEmulator(auth,'http://127.0.0.1:9099');connectFirestoreEmulator(db,'127.0.0.1',8080);}
export const session={watch:cb=>auth?onAuthStateChanged(auth,cb):cb(null),login:(email,password)=>signInWithEmailAndPassword(auth,email,password),register:async(email,password)=>{const result=await createUserWithEmailAndPassword(auth,email,password);await sendEmailVerification(result.user);return result;},reset:email=>sendPasswordResetEmail(auth,email),logout:()=>signOut(auth),verify:()=>sendEmailVerification(auth.currentUser),refresh:async()=>{await reload(auth.currentUser);await auth.currentUser.getIdToken(true);return auth.currentUser;}};
export class FirebaseRepository {
  constructor(uid,project=DEFAULT_PROJECT){this.uid=uid;this.path=projectPath(uid,project);}
  ref(name,id){return doc(db,...this.path,name,id);}
  async load(){const names=[...collectionNames,'scheduledEvents'];const sets=await Promise.all(names.map(n=>getDocs(collection(db,...this.path,n))));return Object.fromEntries(names.map((n,i)=>[n,sets[i].docs.map(d=>d.data())]));}
  async saveGroup(input,options={}){
    const entry=groupEntry(input),seed=(await getDocs(collection(db,...this.path,'toolGroups'))).docs.map(d=>d.id);
    return runTransaction(db,async tx=>{
      const receipt=options.operationId?this.ref('syncReceipts',options.operationId):null;if(receipt&&(await tx.get(receipt)).exists())return;
      const state=emptyState();for(const id of new Set([...seed,entry.id,...(entry.parentId&&!['HWDP','OTRAS'].includes(entry.parentId)?[entry.parentId]:[])])){const snap=await tx.get(this.ref('toolGroups',id));if(snap.exists())state.toolGroups.push(snap.data());}
      const parent=entry.parentId?allGroups(state).find(g=>g.id===entry.parentId&&!g.parentId):null;
      if(entry.parentId&&!parent)throw new Error('El grupo principal ya no está disponible.');
      if(parent&&options.parentCreatedAt!==undefined&&(parent.createdAt||'')!==options.parentCreatedAt)throw new Error('El grupo principal cambió de generación.');
      const old=state.toolGroups.find(g=>g.id===entry.id);if(old){if(old.name===entry.name&&old.color===entry.color&&old.createdAt===entry.createdAt&&(old.parentId||'')===(entry.parentId||''))return old;throw new Error('Ese grupo o subgrupo ya existe.');}
      const result=applyGroup(state,entry);tx.set(this.ref('toolGroups',entry.id),result.entry);
      if(parent&&!['HWDP','OTRAS'].includes(parent.id))tx.set(this.ref('toolGroups',parent.id),{...parent,membershipRevision:(parent.membershipRevision||0)+1});
      if(receipt)tx.set(receipt,{id:options.operationId,groupId:entry.id,createdAt:new Date().toISOString()});return result.entry;
    });
  }
  async updateGroup(input,options={}){
    const seed=(await getDocs(collection(db,...this.path,'toolGroups'))).docs.map(d=>d.id);
    return runTransaction(db,async tx=>{const receipt=options.operationId?this.ref('syncReceipts',options.operationId):null;if(receipt&&(await tx.get(receipt)).exists())return;const state=emptyState();
      for(const id of new Set([...seed,input.id])){const snap=await tx.get(this.ref('toolGroups',id));if(snap.exists())state.toolGroups.push(snap.data());}
      const result=applyGroupUpdate(state,input,options);tx.set(this.ref('toolGroups',input.id),result.entry);if(receipt)tx.set(receipt,{id:options.operationId,groupId:input.id,createdAt:new Date().toISOString()});return result.entry;
    });
  }
  async deleteGroup(id,targetId,options={}){
    const [toolSet,groupSet]=await Promise.all(['tools','toolGroups'].map(name=>getDocs(collection(db,...this.path,name))));const seedGroups=groupSet.docs.map(d=>d.data()),seedGroup=seedGroups.find(g=>g.id===id),ids=toolSet.docs.map(d=>d.data()).filter(t=>seedGroup?.parentId?t.subgroupId===id:groupId(t)===id).map(t=>t.id);
    return runTransaction(db,async tx=>{const receipt=options.operationId?this.ref('syncReceipts',options.operationId):null;if(receipt&&(await tx.get(receipt)).exists())return;const state=emptyState();if((await tx.get(this.ref('settings','maintenance'))).data()?.deleting)throw new Error('El proyecto está en mantenimiento.');
      for(const key of new Set([...seedGroups.map(g=>g.id),id,targetId]))if(!['HWDP','OTRAS'].includes(key)){const snap=await tx.get(this.ref('toolGroups',key));if(snap.exists())state.toolGroups.push(snap.data());}
      const group=state.toolGroups.find(g=>g.id===id);if(group&&(group.membershipRevision||0)!==(seedGroup?.membershipRevision||0))throw new Error('La lista de herramientas se está actualizando. Reintenta la sincronización.');
      for(const serial of ids){const snap=await tx.get(this.ref('tools',serial));if(snap.exists())state.tools.push(snap.data());}
      const result=applyGroupRemoval(state,id,targetId,options);for(const w of result.writes)if(w.remove)tx.delete(this.ref(w.name,w.id));else tx.set(this.ref(w.name,w.id),w.value);
      for(const target of state.toolGroups.filter(g=>g.id===targetId||g.id===options.targetSubgroupId||g.id===group?.parentId))tx.set(this.ref('toolGroups',target.id),{...target,membershipRevision:(target.membershipRevision||0)+1});
      if(receipt)tx.set(receipt,{id:options.operationId,groupId:id,createdAt:new Date().toISOString()});
    });
  }
  async deleteGroupTools(id,options={}){
    if(!options.snapshot?.tools?.length)throw new Error('Vuelve a confirmar los seriales del grupo.');
    const seed=(await getDocs(collection(db,...this.path,'events'))).docs.map(d=>d.data());
    return runTransaction(db,async tx=>{const receipt=options.operationId?this.ref('syncReceipts',options.operationId):null;if(receipt&&(await tx.get(receipt)).exists())return;
      const state=emptyState(),cache=new Map(),read=async(name,key)=>{const k=name+'/'+key;if(!cache.has(k)){const snap=await tx.get(this.ref(name,key));cache.set(k,snap.exists()?snap.data():null);}return cache.get(k);};
      if((await read('settings','maintenance'))?.deleting)throw new Error('El proyecto está en mantenimiento.');
      if(!['HWDP','OTRAS'].includes(id)){const group=await read('toolGroups',id);if(group)state.toolGroups.push(group);}
      const ownIds=new Set(),docIds=new Set();for(const selected of options.snapshot.tools){const tool=await read('tools',selected.serial);if(tool){if(groupId(tool)!==id)throw new Error('El grupo cambió en otra sesión. Revisa antes de eliminar.');state.tools.push(tool);}for(const key of tool?.eventIds||seed.filter(e=>e.serial===selected.serial).map(e=>e.id))ownIds.add(key);for(const d of selected.documents)docIds.add(d.id);}
      for(const key of ownIds){const event=await read('events',key);if(event)docIds.add(event.documentId);}const allIds=new Set(ownIds);
      for(const key of docIds){const document=await read('documents',key);if(document){state.documents.push(document);for(const eventId of document.eventIds||seed.filter(e=>e.documentId===key).map(e=>e.id))allIds.add(eventId);}const bha=await read('bha',key);if(bha)state.bha.push(bha);}
      for(const key of allIds){const event=await read('events',key);if(event)state.events.push(event);}for(const key of ownIds){const member=await read('bhaMembers',key);if(member)state.bhaMembers.push(member);}
      const result=applyGroupToolsRemoval(state,id,options);for(const w of result.writes)if(w.remove)tx.delete(this.ref(w.name,w.id));else tx.set(this.ref(w.name,w.id),w.value);
      if(receipt)tx.set(receipt,{id:options.operationId,groupId:id,createdAt:new Date().toISOString()});
    });
  }
  async assignSerials(input,options={}){const serials=assignmentSerials(input.serials);return this.writeTools(serials.map(serial=>({serial,groupId:input.groupId,...(input.subgroupId!==undefined?{subgroupId:input.subgroupId}:{}),...(input.subgroupCreatedAt!==undefined?{subgroupCreatedAt:input.subgroupCreatedAt}:{}),requireExisting:!!input.requireExisting,baseCreatedAt:input.createdAtBySerial?.[serial],createdAt:input.createdAtBySerial?.[serial]})),options);}
  async saveToolName(input){return runTransaction(db,async tx=>{if((await tx.get(this.ref('settings','maintenance'))).data()?.deleting)throw new Error('El proyecto está en mantenimiento.');const ref=this.ref('tools',input.serial),snap=await tx.get(ref),old=snap.exists()?snap.data():null,patch=namePatch(old,input);if(Object.keys(patch).length&&input.nameSource==='BHA')checkNameDocument((await tx.get(this.ref('documents',input.nameSourceDocumentId))).data(),input);if(Object.keys(patch).length)tx.update(ref,patch);return {...old,...patch};});}
  async saveTool(input){const result=await this.writeTools([input]);return result.entries[0];}
  async writeTools(inputs,options={}){
    return runTransaction(db,async tx=>{
      const receipt=options.operationId?this.ref('syncReceipts',options.operationId):null;if(receipt&&(await tx.get(receipt)).exists())return;
      const state=emptyState(),memberships=new Set(),previous=new Map();for(const input of inputs){const snap=await tx.get(this.ref('tools',input.serial));const old=snap.exists()?snap.data():null;previous.set(input.serial,old);for(const id of [input.groupId,old&&groupId(old),input.subgroupId,old?.subgroupId])if(id&&!['HWDP','OTRAS'].includes(id))memberships.add(id);}
      for(const id of memberships){const snap=await tx.get(this.ref('toolGroups',id));if(snap.exists())state.toolGroups.push(snap.data());}
      const touched=new Set(),entries=inputs.map(input=>{const old=previous.get(input.serial),entry=toolEntry(old,{...input,toolType:input.toolType??old?.toolType??''},state);if(groupId(old||{serial:input.serial})!==entry.groupId||(old?.subgroupId||'')!==(entry.subgroupId||'')){if(old){touched.add(groupId(old));if(old.subgroupId)touched.add(old.subgroupId);}touched.add(entry.groupId);if(entry.subgroupId)touched.add(entry.subgroupId);}return entry;});
      for(const entry of entries)tx.set(this.ref('tools',entry.serial),entry);
      // Una asignación también actualiza el grupo para detectar eliminaciones concurrentes.
      for(const group of state.toolGroups)if(touched.has(group.id))tx.set(this.ref('toolGroups',group.id),{...group,membershipRevision:(group.membershipRevision||0)+1});
      if(receipt)tx.set(receipt,{id:options.operationId,groupId:inputs[0].groupId,createdAt:new Date().toISOString()});return {entries};
    });
  }
  async deleteTool(serial,options={}){
    // Los IDs se descubren fuera de la transacción; sus versiones se vuelven a leer dentro.
    const seed=(await getDocs(collection(db,...this.path,'events'))).docs.map(d=>d.data());
    return runTransaction(db,async tx=>{
      const receipt=options.operationId?this.ref('syncReceipts',options.operationId):null;
      if(receipt&&(await tx.get(receipt)).exists())return;
      const current=emptyState(),cache=new Map();
      const read=async(name,id)=>{const key=name+'/'+id;if(!cache.has(key)){const snap=await tx.get(this.ref(name,id));cache.set(key,snap.exists()?snap.data():null);}return cache.get(key);};
      if((await read('settings','maintenance'))?.deleting)throw new Error('El proyecto está en mantenimiento.');
      const tool=await read('tools',serial);if(tool)current.tools.push(tool);
      const ownIds=new Set([...(tool?.eventIds||[]),...seed.filter(e=>e.serial===serial).map(e=>e.id)]),docIds=new Set((options.snapshot?.documents||[]).map(d=>d.id)),allIds=new Set(ownIds);
      for(const id of ownIds){const event=await read('events',id);if(event)docIds.add(event.documentId);}
      for(const id of docIds){const document=await read('documents',id);if(document){current.documents.push(document);for(const eventId of document.eventIds||seed.filter(e=>e.documentId===id).map(e=>e.id))allIds.add(eventId);}const bha=await read('bha',id);if(bha)current.bha.push(bha);}
      for(const id of allIds){const event=await read('events',id);if(event)current.events.push(event);}
      for(const id of ownIds){const member=await read('bhaMembers',id);if(member)current.bhaMembers.push(member);}
      const result=applyToolRemoval(current,serial,options);
      for(const w of result.writes)if(w.remove)tx.delete(this.ref(w.name,w.id));else tx.set(this.ref(w.name,w.id),w.value);
      if(receipt)tx.set(receipt,{id:options.operationId,serial,createdAt:new Date().toISOString()});
      return {affectedDocumentIds:result.affectedDocumentIds,removedDocumentIds:result.removedDocumentIds};
    });
  }
  async saveSchedule(input){const entry=scheduleEntry(input);await setDoc(this.ref('scheduledEvents',entry.id),entry);return entry;}
  async deleteSchedule(id){await deleteDoc(this.ref('scheduledEvents',id));}
  async deleteDocument(id,options={}){
    if(!navigator.onLine)throw new Error('Conéctate a internet para eliminar el documento.');
    const seed=(await getDocs(collection(db,...this.path,'events'))).docs.map(d=>d.data());
    return runTransaction(db,async tx=>{
      const current=emptyState(),cache=new Map();
      const read=async(name,id)=>{const key=name+'/'+id;if(!cache.has(key)){const snap=await tx.get(this.ref(name,id));cache.set(key,snap.exists()?snap.data():null);}return cache.get(key);};
      if((await read('settings','maintenance'))?.deleting)throw new Error('El proyecto está en mantenimiento. Intenta de nuevo al terminar.');
      const document=await read('documents',id);if(document)current.documents.push(document);
      if(document&&options.baseCreatedAt&&document.createdAt!==options.baseCreatedAt)throw new Error('El documento cambió de generación en otra sesión. Revisa la sincronización.');
      const ownIds=new Set([...(document?.eventIds||[]),...seed.filter(e=>e.documentId===id).map(e=>e.id)]),allIds=new Set(ownIds),serials=new Set();
      for(const eventId of ownIds){const event=await read('events',eventId);if(event)serials.add(event.serial);}
      for(const serial of serials){const tool=await read('tools',serial);if(tool)current.tools.push(tool);for(const eventId of tool?.eventIds||seed.filter(e=>e.serial===serial).map(e=>e.id))allIds.add(eventId);}
      for(const eventId of allIds){const event=await read('events',eventId);if(event)current.events.push(event);}
      const bha=await read('bha',id);if(bha)current.bha.push(bha);
      for(const eventId of ownIds){const member=await read('bhaMembers',eventId);if(member)current.bhaMembers.push(member);}
      const result=applyDocumentRemoval(current,id,options);
      for(const write of result.writes)if(write.remove)tx.delete(this.ref(write.name,write.id));else tx.set(this.ref(write.name,write.id),write.value);
    });
  }
  async clearAll({deletingProject=false}={}){
    if(!navigator.onLine)throw new Error('Conéctate a internet para borrar los datos de la cuenta.');
    await setDoc(this.ref('settings','maintenance'),{deleting:true});
    // El bloqueo impide nuevas escrituras durante un borrado de varios lotes.
    // Si falla, se conserva el bloqueo y el usuario puede reintentar la limpieza.
    for(const name of [...collectionNames,'scheduledEvents','syncReceipts']){const snapshot=await getDocs(collection(db,...this.path,name));for(let i=0;i<snapshot.docs.length;i+=400){const batch=writeBatch(db);for(const d of snapshot.docs.slice(i,i+400))batch.delete(d.ref);await batch.commit();}}
    if(!deletingProject)await setDoc(this.ref('settings','maintenance'),{deleting:false});
  }
  async save(draft,options={}) {
    const prepared=await prepare(draft);
    if(options.operationId)prepared.document.syncOperationId=options.operationId;
    const seed=(await getDocs(collection(db,...this.path,'events'))).docs.map(d=>d.data());
    return runTransaction(db,async tx=>{
      const current=emptyState();const cache=new Map();
      const read=async(name,id)=>{const key=name+'/'+id;if(!cache.has(key)){const snap=await tx.get(this.ref(name,id));cache.set(key,snap.exists()?snap.data():null);}return cache.get(key);};
      const document=await read('documents',draft.id);if(document)current.documents.push(document);
      if(document&&options.operationId&&document.syncOperationId===options.operationId)return document;
      if(document&&options.baseCreatedAt&&document.createdAt!==options.baseCreatedAt)throw new Error('El documento cambió de generación en otra sesión. Revisa la sincronización.');
      if(document&&!options.editing)throw new Error('Este PDF ya fue guardado.');
      const oldIds=document?.eventIds||seed.filter(e=>e.documentId===draft.id).map(e=>e.id);
      const eventIds=new Set([...oldIds,...prepared.events.map(e=>e.id)]);
      const serials=new Set(prepared.events.map(e=>e.serial));
      for(const id of oldIds){const event=await read('events',id);if(event)serials.add(event.serial);}
      for(const serial of serials){
        const tool=await read('tools',serial);if(tool)current.tools.push(tool);
        for(const id of tool?.eventIds||seed.filter(e=>e.serial===serial).map(e=>e.id))eventIds.add(id);
      }
      for(const id of eventIds){const event=await read('events',id);if(event)current.events.push(event);}
      const bha=await read('bha',draft.id);if(bha)current.bha.push(bha);
      for(const id of oldIds){const member=await read('bhaMembers',id);if(member)current.bhaMembers.push(member);}
      const result=applyCommit(current,prepared,options);
      for(const write of result.writes){if(write.remove)tx.delete(this.ref(write.name,write.id));else tx.set(this.ref(write.name,write.id),write.value);}
      return result.document;
    });
  }
}

export class FirebaseProjectDirectory {
  constructor(uid){this.uid=uid;}
  async list(){const result=await getDocs(collection(db,'users',this.uid,'projects'));return [initialProject(),...result.docs.map(d=>({...d.data(),id:d.id})).filter(p=>p.id!==DEFAULT_PROJECT).sort((a,b)=>a.createdAt.localeCompare(b.createdAt))];}
  async create(name){const entry=newProject(name);await setDoc(doc(db,'users',this.uid,'projects',entry.id),entry);return entry;}
  async remove(id){if(id===DEFAULT_PROJECT)throw new Error('El proyecto principal se puede vaciar, pero no eliminar.');const path=projectPath(this.uid,id);await deleteDoc(doc(db,...path));await deleteDoc(doc(db,...path,'settings','maintenance'));}
}
