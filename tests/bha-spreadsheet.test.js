import test from 'node:test';
import assert from 'node:assert/strict';
import {utils,write} from 'xlsx';
import {spreadsheetExtractor} from '../src/engine/spreadsheetExtractor.js';
import {analyze} from '../src/engine/pipeline.js';
import {documentErrors} from '../src/adapters/repository.js';
function fixture({ambiguous=false,auxiliary=false,missing=false}={}){
 const rows=[['COMPONENTES BHA'],['COMPONENTE BHA Nº:','','3','','','LOCACIÓN:','','Pozo prueba'],['FECHA:','','22-02-26','','','FASE:','','18 1/2"'],[],['Descripción','Conexión','Propietario','Serial','Diametro Externo F.N. (IN)','Diametro Interno (IN)','Fishing Neck (FT)','Long Efectiva (FT)'],['HWDP','XT57','Propietario','NHA0001',7,4,'1,09',30.18],['','','',ambiguous?'S001 / 900001':'000123',7,4,'1,32',30.54],['JETS BROCA','','','NEVER009'],['BIT IADC','','','S423']];
 if(missing)rows.splice(7,0,['Otra herramienta','','', '',8,3,'',30]);
 const ws=utils.aoa_to_sheet(rows);ws['!merges']=[utils.decode_range('C6:C7')];ws.D7=ambiguous?{t:'s',v:'S001 / 900001'}:{t:'n',v:123,z:'000000'};ws['!ref']='A1:IW107';const wb=utils.book_new();utils.book_append_sheet(wb,ws,'BHA reporte');
 if(auxiliary){utils.book_append_sheet(wb,utils.aoa_to_sheet([['BHA','Serial','Pozo','Fecha'],['3','INVENTORY001','Pozo prueba','2026-02-22']]),'TALLY apoyo');utils.book_append_sheet(wb,utils.aoa_to_sheet([['Serial','Longitud'],['NEVER001',30]]),'Inventario');}
 return {wb,bytes:()=>write(wb,{type:'array',bookType:'xlsx'})};
}
test('BHA Excel acepta rango con formato vacío, metadatos desplazados, fecha corta y propietario combinado',()=>{
 const f=fixture(),extracted=spreadsheetExtractor(f.bytes(),'bha.xlsx'),result=analyze(extracted.pages);assert.equal(result.type,'BHA');assert.equal(result.records.length,2);assert.deepEqual(result.records.map(r=>r.serial),['NHA0001','000123']);assert.deepEqual(documentErrors(result),[]);
 assert.equal(result.records[1].fields.bhaDate,'2026-02-22');assert.equal(result.records[1].fields.well,'Pozo prueba');assert.equal(result.records[1].fields.owner,'Propietario');assert.equal(result.records[0].fields.outerDiameter,'7');assert.equal(result.records[0].fields.length,'30.18');assert.equal(result.records[1].evidence[0].cell,'D7');assert(!('torque' in result.records[0].fields));
});
test('no convierte inventarios ni tally sin fase en eventos del BHA principal',()=>{
 const f=fixture({auxiliary:true}),extracted=spreadsheetExtractor(f.bytes(),'bha.xlsx'),result=analyze(extracted.pages);assert.deepEqual(extracted.ignoredSheets,['TALLY apoyo','Inventario']);assert.equal(extracted.pages.length,1);assert.equal(result.records.length,2);assert(!result.records.some(r=>r.serial.startsWith('INVENTORY')||r.serial.startsWith('NEVER')));
});
test('identificadores múltiples y filas sin serial conservan origen y requieren revisión',()=>{
 const f=fixture({ambiguous:true,missing:true}),result=analyze(spreadsheetExtractor(f.bytes(),'bha.xlsx').pages);assert.equal(result.records[1].rawSerial,'S001 / 900001');assert(result.sourceWarnings.some(w=>w.includes('D7')));assert(result.sourceWarnings.some(w=>/sin serial/.test(w)));assert(documentErrors({...result,validationMode:'automatic'}).some(e=>/revisa los identificadores/.test(e)));assert(documentErrors(result).some(e=>/Serial inválido/.test(e)));
 result.records[1].serial='S001';assert.deepEqual(documentErrors({...result,validationMode:'corrected'}),[]);
});
test('no oculta reportes de otro tipo y rechaza contenido real fuera de los límites',()=>{
 const f=fixture();utils.book_append_sheet(f.wb,utils.aoa_to_sheet([['Empresa','Reporte','Orden de trabajo','Fecha de reparación','Serial','PIN','BOX','Maquinado'],['Taller','R1','OT1','2026-02-22','REPAIR001','OK','OK','Reface']]),'Reparación');const result=analyze(spreadsheetExtractor(f.bytes(),'mixto.xlsx').pages);assert(result.mixedDocumentTypes);assert(documentErrors(result).some(e=>/mezcla/.test(e)));
 const g=fixture();g.wb.Sheets['BHA reporte'].IW107={t:'s',v:'Contenido real'};assert.throws(()=>spreadsheetExtractor(g.bytes(),'ancho.xlsx'),/columnas con contenido/);
});
