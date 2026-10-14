import {tablePage,columnKey} from './tableExtractor.js';
// Fallback para tablas con rótulos explícitos; las plantillas conocidas conservan sus lectores.
export function coordinateTable(items,page=1){
 const lines=[];
 for(const item of items.filter(i=>i.str?.trim())){const y=item.transform[5];let row=lines.find(r=>Math.abs(r.y-y)<3);if(!row){row={y,items:[]};lines.push(row);}row.items.push(item);}
 lines.sort((a,b)=>b.y-a.y);for(const line of lines)line.items.sort((a,b)=>a.transform[4]-b.transform[4]);
 const head=lines.findIndex(r=>r.items.some(i=>columnKey(i.str)==='serial')&&r.items.filter(i=>columnKey(i.str)).length>=4);
 if(head<0)return null;
 const columns=lines[head].items.filter(i=>columnKey(i.str));
 const rows=lines.slice(0,head).map(r=>{const text=r.items.map(i=>i.str).join(' ');const pair=text.match(/^([^:]+):\s*(.+)$/);return pair?[pair[1],pair[2]]:[text];});
 rows.push(columns.map(c=>c.str));
 const serialIndex=columns.findIndex(c=>columnKey(c.str)==='serial');
 for(const line of lines.slice(head+1)){
   const row=columns.map((col,j)=>{const left=j?(columns[j-1].transform[4]+columns[j-1].width+col.transform[4])/2:-Infinity;const next=columns[j+1];const right=next?(col.transform[4]+col.width+next.transform[4])/2:Infinity;return line.items.filter(i=>i.transform[4]+i.width/2>=left&&i.transform[4]+i.width/2<right).map(i=>i.str).join(' ');});
   if(!row[serialIndex])continue;
   rows.push(row);
 }
 const result=tablePage(rows,page);return result.structuredRecords.length?result:null;
}
