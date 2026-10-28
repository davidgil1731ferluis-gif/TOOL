import {spreadsheetExtractor} from './spreadsheetExtractor.js';
self.onmessage=({data})=>{
 try{self.postMessage({result:spreadsheetExtractor(new Uint8Array(data.bytes),data.name)});}
 catch(error){self.postMessage({error:error.message||'No se pudo leer la hoja de cálculo.'});}
};
