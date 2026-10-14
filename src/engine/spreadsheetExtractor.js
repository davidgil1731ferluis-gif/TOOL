import {read,utils,SSF} from 'xlsx';
import {tablePage,columnKey} from './tableExtractor.js';
import {decodeText} from './fileFormats.js';
export function spreadsheetExtractor(bytes,name){
  const textFile=/\.(csv|tsv)$/i.test(name);
  const text=textFile?decodeText(bytes):'';
  // CSV is read as text to preserve serials such as 000123.
  const wb=read(textFile?text:bytes,{type:textFile?'string':'array',cellDates:true,cellFormula:false,cellHTML:false,raw:textFile,sheetRows:10002});
  if(wb.SheetNames.length>50)throw new Error('Máximo 50 hojas por archivo.');
  let cells=0;
  const pages=wb.SheetNames.map((name,i)=>{
    const ws=wb.Sheets[name];const range=ws['!ref']?utils.decode_range(ws['!ref']):null;
    if(ws['!fullref']||range&&(range.e.r>=10000||range.e.c>=200))throw new Error('La hoja supera 10.000 filas o 200 columnas. Divídela en archivos más pequeños.');
    const rows=utils.sheet_to_json(ws,{header:1,defval:'',raw:true});
    cells+=rows.reduce((n,r)=>n+r.length,0);if(cells>200000)throw new Error('El archivo contiene demasiadas celdas.');
    // Prefer the displayed cell for serials: preserves an Excel format such as 000000.
    const h=rows.findIndex(r=>r.some(v=>columnKey(v)==='serial'));
    if(h>=0){const col=rows[h].findIndex(v=>columnKey(v)==='serial');for(let r=h+1;r<rows.length;r++){const cell=ws[utils.encode_cell({r:r+(range?.s.r||0),c:col+(range?.s.c||0)})];if(cell?.t==='n')rows[r][col]=cell.w||SSF.format(cell.z||'0',cell.v);}}
    return tablePage(rows,i+1,name);
  });
  return {pages,text:pages.map(p=>p.text).join('\n\n')};
}
