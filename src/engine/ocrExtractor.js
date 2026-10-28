import {createWorker} from 'tesseract.js';
import {coordinateTable} from './coordinateTable.js';
export async function createOCR(onProgress=()=>{}){
  const base=new URL('ocr/',new URL(import.meta.env.BASE_URL,location.href)).href;
  const worker=await createWorker('spa+eng',1,{workerPath:base+'worker.min.js',corePath:base,langPath:base,gzip:true,logger:m=>{if(m.status==='recognizing text')onProgress(Math.round(m.progress*100));}});
  await worker.setParameters({preserve_interword_spaces:'1'});
  return {
    async read(image,page=1){
      const {data}=await worker.recognize(image,{}, {text:true,blocks:true});const items=[];
      for(const block of data.blocks||[])for(const paragraph of block.paragraphs||[])for(const line of paragraph.lines||[]){let group;for(const word of line.words||[]){if(group&&word.bbox.x0-group.end<Math.max(16,(word.bbox.y1-word.bbox.y0)*.8)){group.str+=' '+word.text;group.end=word.bbox.x1;group.width=group.end-group.transform[4];}else{group={str:word.text,end:word.bbox.x1,width:word.bbox.x1-word.bbox.x0,height:word.bbox.y1-word.bbox.y0,transform:[1,0,0,1,word.bbox.x0,-line.bbox.y0]};items.push(group);}}}
      const table=coordinateTable(items,page);return {page,text:data.text,method:'ocr',ocrConfidence:data.confidence,...(table?{structuredRecords:table.structuredRecords,structuredType:table.structuredType,mixedTypes:table.mixedTypes,sourceWarnings:table.sourceWarnings||[]}:{})};
    },
    close:()=>worker.terminate()
  };
}
export async function imageCanvas(file){
  const bitmap=await createImageBitmap(file);
  try{if(bitmap.width*bitmap.height>40000000)throw new Error('Imagen demasiado grande. Máximo 40 megapíxeles.');const scale=Math.min(1,2600/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);return canvas;}finally{bitmap.close();}
}
