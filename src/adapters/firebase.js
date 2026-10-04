import {initializeApp} from 'firebase/app';
import {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail,sendEmailVerification,onAuthStateChanged,signOut,connectAuthEmulator,reload} from 'firebase/auth';
import {getFirestore,collection,getDocs,doc,runTransaction,connectFirestoreEmulator,setDoc,deleteDoc,writeBatch} from 'firebase/firestore';
import {scheduleEntry} from '../engine/calendar.js';
import {firebaseConfig,useEmulators} from '../config.js';
import {prepare,applyCommit,collectionNames,emptyState} from './repository.js';
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
  async saveSchedule(input){const entry=scheduleEntry(input);await setDoc(this.ref('scheduledEvents',entry.id),entry);return entry;}
  async deleteSchedule(id){await deleteDoc(this.ref('scheduledEvents',id));}
  async clearAll({deletingProject=false}={}){
    if(!navigator.onLine)throw new Error('Conéctate a internet para borrar los datos de la cuenta.');
    await setDoc(this.ref('settings','maintenance'),{deleting:true});
    // El bloqueo impide nuevas escrituras durante un borrado de varios lotes.
    // Si falla, se conserva el bloqueo y el usuario puede reintentar la limpieza.
    for(const name of [...collectionNames,'scheduledEvents']){const snapshot=await getDocs(collection(db,...this.path,name));for(let i=0;i<snapshot.docs.length;i+=400){const batch=writeBatch(db);for(const d of snapshot.docs.slice(i,i+400))batch.delete(d.ref);await batch.commit();}}
    if(!deletingProject)await setDoc(this.ref('settings','maintenance'),{deleting:false});
  }
  async save(draft,options={}) {
    const prepared=await prepare(draft);
    const seed=(await getDocs(collection(db,...this.path,'events'))).docs.map(d=>d.data());
    return runTransaction(db,async tx=>{
      const current=emptyState();const cache=new Map();
      const read=async(name,id)=>{const key=name+'/'+id;if(!cache.has(key)){const snap=await tx.get(this.ref(name,id));cache.set(key,snap.exists()?snap.data():null);}return cache.get(key);};
      const document=await read('documents',draft.id);if(document)current.documents.push(document);
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
