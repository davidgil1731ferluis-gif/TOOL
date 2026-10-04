import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectionCells} from '../src/engine/inspectionCells.js';
import {fieldExtractor} from '../src/engine/fieldExtractor.js';
import {bhaColumnCandidates} from '../src/engine/pdfLines.js';
const item=(str,x,y,width=20)=>({str,width,height:10,transform:[1,0,0,1,x,y]});
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
