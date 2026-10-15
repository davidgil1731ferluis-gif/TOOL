import {bhaSpreadsheetPage} from './bhaSpreadsheet.js';
import {read,utils,SSF} from 'xlsx';
import {tablePage,columnKey} from './tableExtractor.js';
import {decodeText} from './fileFormats.js';
export function spreadsheetExtractor(bytes,name){
  const textFile=/\.(csv|tsv)$/i.test(name);
  const text=textFile?decodeText(bytes):'';
  // CSV is read as text to preserve serials such as 000123.
  const wb=read(textFile?text:bytes,{type:textFile?'string':'array',cellDates:true,cellFormula:true,cellHTML:false,raw:textFile,sheetRows:10002});
  if(wb.SheetNames.length>50)throw new Error('Máximo 50 hojas por archivo.');
  let cells=0;
  let pages=wb.SheetNames.map((name,i)=>{
    const ws=wb.Sheets[name];
    // El rango de Excel puede incluir miles de columnas que solo conservan formato.
    // Los límites se aplican a celdas con datos o fórmulas, antes de construir la matriz.
    let lastRow=-1,lastCol=-1;
    for(const [address,cell] of Object.entries(ws)){if(!/^[A-Z]+[1-9]\d*$/.test(address)||(!cell.f&&(cell.v===undefined||cell.v===null||String(cell.v).trim()==='')))continue;const {r,c}=utils.decode_cell(address);lastRow=Math.max(lastRow,r);lastCol=Math.max(lastCol,c);}
    if((ws['!fullref']&&utils.decode_range(ws['!fullref']).e.r>=10000)||lastRow>=10000||lastCol>=200)throw new Error('La hoja supera 10.000 filas o 200 columnas con contenido. Divídela en archivos más pequeños.');
    ws['!ref']=lastRow>=0?utils.encode_range({s:{r:0,c:0},e:{r:lastRow,c:lastCol}}):'A1';
    const rows=utils.sheet_to_json(ws,{header:1,defval:'',raw:true});
    cells+=rows.reduce((n,r)=>n+r.length,0);if(cells>200000)throw new Error('El archivo contiene demasiadas celdas.');
    // Prefer the displayed cell for serials: preserves an Excel format such as 000000.
    const serialColumns=[...new Set(rows.flatMap(row=>row.flatMap((v,c)=>columnKey(v)==='serial'?[c]:[])))];
    for(const col of serialColumns)for(let r=0;r<rows.length;r++){const cell=ws[utils.encode_cell({r,c:col})];if(cell?.t==='n'){const displayed=String(cell.w||SSF.format(cell.z||'0',cell.v)).trim();rows[r][col]=/^[A-Z0-9._ -]+$/i.test(displayed)?displayed:String(cell.v);}}
    return bhaSpreadsheetPage(rows,i+1,name,ws)||tablePage(rows,i+1,name);
  });
  const hasBhaReport=pages.some(p=>p.method==='spreadsheet-bha');
  const isReport=p=>p.method==='spreadsheet-bha'||(p.structuredType&&p.structuredType!=='BHA')||(p.structuredType==='BHA'&&p.structuredRecords.length&&p.structuredRecords.every(r=>['bhaNumber','well','phase','bhaDate'].every(k=>String(r.cells[k]||'').trim())));
  const ignoredSheets=hasBhaReport?pages.filter(p=>!isReport(p)).map(p=>p.sheet):[];
  if(hasBhaReport)pages=pages.filter(isReport);
  return {pages,ignoredSheets,text:pages.map(p=>p.text).join('\n\n')};
}
