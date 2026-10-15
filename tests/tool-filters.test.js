import test from 'node:test';
import assert from 'node:assert/strict';
import {toolMatches} from '../src/engine/toolFilters.js';
import {reportModel} from '../src/export/reportModel.js';
import {emptyState} from '../src/adapters/repository.js';
const events=[{id:'e1',serial:'ABC001N',date:'2026-01-01',type:'REPAIR',fields:{},documentId:'r'},{id:'e2',serial:'ABC001N',date:'2026-02-28',type:'BHA',fields:{},documentId:'b'},{id:'e3',serial:'ABC001N',date:'2026-05-01',type:'INSPECTION',fields:{},documentId:'i'}];
const tool={id:'ABC001N',serial:'ABC001N',groupId:'HWDP',status:'NO_CONFORME_REPARABLE'};
test('rango de eventos incluye ambos extremos y cualquier tipo; excluye fichas sin eventos',()=>{
 assert(toolMatches(tool,events,{from:'2026-02-28',to:'2026-02-28'}));assert(!toolMatches(tool,events,{from:'2026-03-01',to:'2026-04-30'}));assert(toolMatches(tool,events,{to:'2026-01-01'}));assert(toolMatches(tool,events,{from:'2026-05-01'}));assert(!toolMatches(tool,events,{from:'2026-05-01',to:'2026-01-01'}));assert(!toolMatches({...tool,serial:'MANUAL001'},events,{from:'2026-01-01'}));assert(toolMatches({...tool,serial:'MANUAL001'},events,{}));
});
test('estado es actual y se combina con grupo, búsqueda y fechas',()=>{
 assert(toolMatches(tool,events,{group:'HWDP',search:'abc001n',from:'2026-01-01',to:'2026-03-01',status:'NO_CONFORME_REPARABLE'}));assert(!toolMatches(tool,events,{status:'OPERATIVA'}));assert(!toolMatches(tool,events,{group:'OTRAS'}));assert(!toolMatches(tool,events,{search:'otro'}));assert(toolMatches({serial:'MANUAL001'},[],{status:'SIN_ESTADO_TECNICO'}));
});
test('Excel filtra herramientas y conserva el historial completo de las seleccionadas',()=>{
 const data={...emptyState(),tools:[tool,{id:'OTHER002',serial:'OTHER002',status:'OPERATIVA'}],events};const sheets=reportModel(data,{from:'2026-02-28',to:'2026-02-28',status:'NO_CONFORME_REPARABLE'});assert.equal(sheets[0].rows.length,1);assert.equal(sheets[0].rows[0][0],'ABC001N');assert.equal(sheets[0].columns.length,20);assert.equal(sheets[0].rows[0][2],'2026-01-01');assert.equal(sheets[0].rows[0][14],'2026-05-01');assert.equal(reportModel(data,{status:'CONFORME'})[0].rows.length,0);
});
