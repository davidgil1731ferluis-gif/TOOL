function open() {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('tooltrace-pdfs',2);
    request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('files'))db.createObjectStore('files');if(!db.objectStoreNames.contains('inbox'))db.createObjectStore('inbox',{keyPath:'key'});};
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
}
export async function pdfStore(action,key,value) {
  const db=await open();try{return await new Promise((resolve,reject)=>{
    const tx=db.transaction('files',action==='get'?'readonly':'readwrite');const store=tx.objectStore('files');const req=action==='get'?store.get(key):store.put(value,key);let result;
    req.onsuccess=()=>{result=req.result;};tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(tx.error||new Error('No se pudo conservar el PDF.'));tx.onerror=()=>reject(tx.error);
  });}finally{db.close();}
}
export const archive={
  async clear(owner){const db=await open();try{await new Promise((resolve,reject)=>{const tx=db.transaction(['files','inbox'],'readwrite');for(const name of ['files','inbox']){const req=tx.objectStore(name).openCursor();req.onsuccess=()=>{const cursor=req.result;if(cursor){if(String(cursor.key).startsWith(owner+':'))cursor.delete();cursor.continue();}};}tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error);});}finally{db.close();}},
  async list(owner) {
    const db=await open();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('inbox');const req=tx.objectStore('inbox').getAll();req.onsuccess=()=>resolve(req.result.filter(e=>e.owner===owner));req.onerror=()=>reject(req.error);});}finally{db.close();}
  },
  async capture(owner,file,id) {
    const db=await open();try{return await new Promise((resolve,reject)=>{
      const tx=db.transaction(['files','inbox'],'readwrite');const inbox=tx.objectStore('inbox');const key=owner+':'+id;let result;
      const req=inbox.get(key);req.onsuccess=()=>{
        if(req.result){result={entry:req.result,created:false};return;}
        const entry={key,owner,id,name:file.name,uploadedAt:new Date().toISOString(),status:'queued',type:'UNKNOWN',template:'',records:[],pages:[],error:''};
        tx.objectStore('files').put(file,key);inbox.put(entry);result={entry,created:true};
      };
      tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(tx.error||new Error('No se pudo conservar el documento.'));tx.onerror=()=>reject(tx.error);
    });}finally{db.close();}
  },
  async put(owner,entry) {
    const db=await open();try{return await new Promise((resolve,reject)=>{
      const tx=db.transaction('inbox','readwrite');tx.objectStore('inbox').put({...entry,key:owner+':'+entry.id,owner,updatedAt:new Date().toISOString()});tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||new Error('No se pudo guardar el cambio local.'));tx.onerror=()=>reject(tx.error);
    });}finally{db.close();}
  }
};
