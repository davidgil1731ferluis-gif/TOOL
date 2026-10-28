// Spatial buckets avoid scanning every previous line for every PDF fragment.
export function pdfRows(items,tolerance=2.5){
 const buckets=new Map(),rows=[];
 for(const item of items){if(!item.str?.trim()||!Number.isFinite(item.transform?.[5]))continue;
  const y=item.transform[5],key=Math.floor(y/tolerance);let row;
  for(let k=key-1;k<=key+1;k++)for(const candidate of buckets.get(k)||[])if(Math.abs(candidate.y-y)<tolerance&&(!row||candidate.order<row.order))row=candidate;
  if(!row){row={y,items:[],order:rows.length};rows.push(row);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(row);}
  row.items.push(item);
 }
 return rows.sort((a,b)=>b.y-a.y).map(r=>({...r,items:r.items.sort((a,b)=>a.transform[4]-b.transform[4])}));
}
