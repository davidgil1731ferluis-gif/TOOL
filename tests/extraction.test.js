import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectionCells} from '../src/engine/inspectionCells.js';
import {fieldExtractor} from '../src/engine/fieldExtractor.js';
import {bhaColumnCandidates} from '../src/engine/pdfLines.js';
import {coalescePdfItems,pdfLines} from '../src/engine/pdfLines.js';
const item=(str,x,y,width=20)=>({str,width,height:10,transform:[1,0,0,1,x,y]});
test('TQC con letras separadas reconstruye serial y columnas sin confundir Final de otras mediciones',()=>{
 const word=(str,x,y)=>[...str].map((c,i)=>item(c,x+i*3,y,2.9));
 const items=[...word('9.1CUERPO',0,600),...word('Serial',10,520),...word('Final',70,520),...word('Cuerpo',130,520),...word('Obs PIN',200,520),...word('Obs BOX',270,520),...word('Final',350,515),...word('Observaciones',450,520),...word('ABC001N',10,470),...word('OK',130,470),...word('OK',200,470),...word('OK',270,470),...word('Conforme',350,470),...word('Herramienta',450,470),...word('ABC002N',10,420),...word('OK',130,420),...word('OK',200,420),...word('OK',270,420),...word('Conforme',350,420)];
 const rows=inspectionCells(items);assert.equal(rows.length,2);assert.equal(rows[0].serial,'ABC001N');assert.equal(rows[0].cells.box,'Conforme');assert.equal(rows[0].cells.finalConformity,'Conforme');assert.equal(rows[0].cells.findings,'Herramienta');assert.match(pdfLines(items),/ABC001N/);
 assert(coalescePdfItems(items).length<items.length);
});
test('celda TQC conserva No en otra línea y no lo asigna al cuerpo',()=>{
  const items=[item('9.1 CUERPO',0,600),item('Serial',0,520),item('Cuerpo',100,520),item('Obs PIN',200,520),item('Obs BOX',300,520),item('Final',400,520),item('Observaciones',500,520),item('ABC001',0,455),item('---',0,395),item('Conforme',100,455),item('No',200,464),item('Conforme/Reparable',200,447),item('Conforme',300,455),item('No Conforme/Reparable',400,455),item('Rosca mellada',500,455)];
  const [record]=inspectionCells(items);assert.equal(record.cells.body,'Conforme');assert.equal(record.cells.pin,'No Conforme/Reparable');
  const fields=fieldExtractor('TOTAL QC','INSPECTION',{...record,evidence:[]});
  assert.equal(fields.finalConformity,'NO_CONFORME_REPARABLE');assert.equal(fields.findings,'Rosca mellada');
});
test('BHA conserva serial compuesto y extrae medidas por columna',()=>{
  const headers=[['Propietario',60],['Serial',100],['Externo',140],['Interno',180],['Fishing',220],['Efectiva',260],['Long Parcial',300]];
  const items=[item('COMPONENTES BHA',10,550),...headers.map(([s,x])=>item(s,x,500)),item('AWS825 10 7586',80,450,60),item('7"',140,450),item('4"',180,450),item('1,67',220,450),item('31,01',260,450)];
  const [record]=bhaColumnCandidates(items);assert.equal(record.serial,'AWS825107586');assert.equal(record.rawSerial,'AWS825 10 7586');assert.equal(record.cells.length,'31,01');assert.equal(record.cells.fishingNeck,'1,67');
});
