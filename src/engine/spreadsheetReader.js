// Keep workbook parsing off the UI thread. Every job releases its worker and byte buffer.
export async function readSpreadsheet(bytes,name){
 if(typeof Worker==='undefined')return (await import('./spreadsheetExtractor.js')).spreadsheetExtractor(bytes,name);
 let worker;
 try{worker=new Worker(new URL('./spreadsheetWorker.js',import.meta.url),{type:'module'});}
 catch{return (await import('./spreadsheetExtractor.js')).spreadsheetExtractor(bytes,name);}
 let timeout;
 try{return await new Promise((resolve,reject)=>{
  timeout=setTimeout(()=>reject(new Error('La lectura tardó demasiado. El original se conserva; divide el libro en archivos más pequeños.')),60000);
  worker.onmessage=({data})=>data.error?reject(new Error(data.error)):resolve(data.result);
  worker.onerror=()=>reject(new Error('No se pudo iniciar la lectura del libro. Recarga la aplicación y reintenta desde Documentos.'));
  worker.postMessage({bytes:bytes.buffer,name},[bytes.buffer]);
 });}finally{clearTimeout(timeout);worker.terminate();}
}
