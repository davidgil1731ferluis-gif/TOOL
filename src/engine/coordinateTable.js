import {tablePage,columnKey} from './tableExtractor.js';
import {pdfRows} from './pdfRows.js';
function headerCells(items){
 const cells=[];
 for(let i=0;i<items.length;i++){
  let label='',best=null;
  for(let j=i;j<Math.min(items.length,i+5);j++){
   if(j>i&&items[j].transform[4]-(items[j-1].transform[4]+items[j-1].width)>Math.max(18,items[j].height*2))break;
   label+=(label?' ':'')+items[j].str.trim();if(columnKey(label))best={...items[i],str:label,width:items[j].transform[4]+items[j].width-items[i].transform[4],last:j};
  }
  if(best){cells.push(best);i=best.last;}
 }
 return cells;
}
// Fallback para tablas con rótulos explícitos; las plantillas conocidas conservan sus lectores.
export function coordinateTable(items,page=1){
 const lines=pdfRows(items,3);
 const headers=lines.map(r=>headerCells(r.items));
 const head=headers.findIndex(c=>c.some(i=>columnKey(i.str)==='serial')&&c.length>=3);
 if(head<0)return null;
 const columns=headers[head];
 const rows=lines.slice(0,head).map(r=>{const text=r.items.map(i=>i.str).join(' ');const pair=text.match(/^([^:]+):\s*(.+)$/);return pair?[pair[1],pair[2]]:[text];});
 rows.push(columns.map(c=>c.str));
 const serialIndex=columns.findIndex(c=>columnKey(c.str)==='serial');
 for(const line of lines.slice(head+1)){
   const row=columns.map((col,j)=>{const left=j?(columns[j-1].transform[4]+columns[j-1].width+col.transform[4])/2:-Infinity;const next=columns[j+1];const right=next?(col.transform[4]+col.width+next.transform[4])/2:Infinity;return line.items.filter(i=>i.transform[4]+i.width/2>=left&&i.transform[4]+i.width/2<right).map(i=>i.str).join(' ');});
   if(!row[serialIndex])continue;
   rows.push(row);
 }
 const result=tablePage(rows,page);
 for(const record of result.structuredRecords)if(record.nameEvidence)record.nameEvidence={...record.nameEvidence,method:'pdf-columns'};
 return result.structuredRecords.length?result:null;
}
