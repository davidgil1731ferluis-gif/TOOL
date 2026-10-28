import {utils} from 'xlsx';
import {columnKey,tableHeader} from './tableExtractor.js';
import {normalizeDate} from './fieldExtractor.js';
import {serialNormalizer,validSerial} from './serialNormalizer.js';
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase();
const metadataKey=v=>{const s=norm(v).replace(/[:º°#]/g,'').trim();return /^(?:COMPONENTE\s+)?BHA\s*(?:N[OÚU]?(?:MERO)?\.?|NUMERO)?$/.test(s)||/^NUMERO\s+BHA$/.test(s)?'bhaNumber':/^(LOCACION|POZO|WELL)$/.test(s)?'well':/^(FASE|PHASE)$/.test(s)?'phase':/^(FECHA(?: BHA)?|DATE)$/.test(s)?'bhaDate':'';};
const bhaColumn=v=>{const known=columnKey(v);if(known)return known;const s=norm(v);return /^DIAMETRO\s+EXTERNO\b|^EXTERNO\s*\(/.test(s)?'outerDiameter':/^DIAMETRO\s+INTERNO\b|^INTERNO\s*\(/.test(s)?'innerDiameter':/^FISHING\s+NECK\b/.test(s)?'fishingNeck':/^LONG(?:ITUD)?\.?\s+EFECTIVA\b/.test(s)?'length':'';};
// Un reporte BHA conserva su propio encabezado; no hereda fechas de inventarios del libro.
export function bhaSpreadsheetPage(rows,page,sheet,ws={}){
 const detected=tableHeader(rows),header=detected?.end??rows.findIndex(r=>r.some(v=>columnKey(v)==='serial'));if(header<0)return null;
 const labels=detected?Array.from({length:Math.max(...rows.slice(detected.start,header+1).map(r=>r.length))},(_,c)=>rows.slice(detected.start,header+1).map(r=>r[c]).filter(v=>String(v??'').trim()).join(' ')):rows[header];
 const columns=labels.map(bhaColumn);if(!columns.includes('outerDiameter')&&!columns.includes('innerDiameter'))return null;
 const metadata={},warnings=[];
 for(let r=0;r<(detected?.start??header);r++)for(let c=0;c<rows[r].length;c++){
  const key=metadataKey(rows[r][c]);if(!key)continue;
  let next=c+1;while(next<rows[r].length&&!String(rows[r][next]??'').trim())next++;
  if(next>=rows[r].length||metadataKey(rows[r][next]))continue;
  const value=rows[r][next];metadata[key]=key==='bhaDate'?bhaDate(value):String(value).trim();
 }
 if(!metadata.bhaNumber||(!/BHA/i.test(sheet)&&!rows.slice(0,header).some(r=>r.some(v=>/COMPONENTES?\s+BHA/i.test(String(v))))))return null;
 const serialColumn=columns.indexOf('serial'),fieldsAllowed=new Set(['description','owner','outerDiameter','innerDiameter','fishingNeck','length']),records=[];
 const mergesByColumn=new Map();for(const m of ws['!merges']||[])for(let c=m.s.c;c<=Math.min(m.e.c,columns.length-1);c++){if(!mergesByColumn.has(c))mergesByColumn.set(c,[]);mergesByColumn.get(c).push(m);}let ambiguousMerges=false;for(const list of mergesByColumn.values()){list.sort((a,b)=>a.s.r-b.s.r);if(list.some((m,i)=>i&&m.s.r<=list[i-1].e.r))ambiguousMerges=true;}if(ambiguousMerges)warnings.push('Hay celdas combinadas superpuestas. Revisa el reporte.');
 const source=(r,c)=>{const list=mergesByColumn.get(c)||[];let low=0,high=list.length-1,found;while(low<=high){const middle=(low+high)>>1;if(list[middle].s.r<=r){found=list[middle];low=middle+1;}else high=middle-1;}return found&&r<=found.e.r?found.s:{r,c};};
 const merged=(r,c)=>{const cell=source(r,c);return rows[cell.r]?.[cell.c];};
 const duplicateColumns=new Set(columns.filter(Boolean)).size!==columns.filter(Boolean).length;if(duplicateColumns)warnings.push('Hay columnas repetidas en la tabla BHA. Revisa el reporte.');
 for(let r=header+1;r<rows.length;r++){
  const row=rows[r];if(row.some(v=>/JETS\s+BROCA|LONGITUD\s+TOTAL\s+BHA|^TFA$|^VERIFICADO$/i.test(String(v).trim())))break;
  const rawSerial=String(row[serialColumn]??'').trim();if(columnKey(rawSerial)==='serial')continue;
  if(/^(?:n[úu]mero\s+de|serial)$/i.test(rawSerial)){const repeated=tableHeader(rows.slice(r,r+3));if(repeated?.start===0){r+=repeated.end;continue;}}
  const serialCell=utils.encode_cell({r,c:serialColumn});
  if(!rawSerial){if(columns.some((key,c)=>['outerDiameter','length'].includes(key)&&String(row[c]??'').trim()))warnings.push(`${sheet}!${serialCell}: componente sin serial o fórmula sin resultado guardado.`);continue;}
  const serial=serialNormalizer(rawSerial),fields={...metadata};
  for(const [c,key] of columns.entries())if(fieldsAllowed.has(key)){const value=merged(r,c);if(value!==undefined&&String(value).trim())fields[key]=String(value).trim();}
  if(!validSerial(serial))warnings.push(`${sheet}!${serialCell}: revisa los identificadores «${rawSerial}»; no se combinaron ni separaron automáticamente.`);
  const line=row.map(v=>v instanceof Date?v.toISOString().slice(0,10):String(v??'')).join(' | ');
  const dc=columns.indexOf('description'),origin=dc>=0?source(r,dc):null;
  records.push({serial,rawSerial,cells:fields,...(fields.description&&origin&&!duplicateColumns&&!ambiguousMerges?{nameEvidence:{serial,value:fields.description,method:'spreadsheet-cell',page,sheet,cell:utils.encode_cell(origin)}}:{}),evidence:[{page,sheet,cell:serialCell,line}]});
 }
 return {page,sheet,text:rows.map(r=>r.map(v=>v instanceof Date?v.toISOString().slice(0,10):String(v??'')).join(' | ')).join('\n'),structuredRecords:records,structuredType:'BHA',mixedTypes:false,sourceWarnings:warnings,method:'spreadsheet-bha'};
}
function bhaDate(value){if(value instanceof Date)return value.toISOString().slice(0,10);const s=String(value).trim(),short=s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2})$/);return normalizeDate(short?`${short[1]}/${short[2]}/${2000+Number(short[3])}`:s)||s;}
