import test from 'node:test';
import assert from 'node:assert/strict';
import {toolMatches,eventCountError} from '../src/engine/toolFilters.js';
import {rgbToHex,hexToRgb} from '../src/engine/colorValues.js';
import {colorPicker} from '../src/views/colorPicker.js';
import {reportModel} from '../src/export/reportModel.js';
import {emptyState} from '../src/adapters/repository.js';
const tools=[{id:'ABC001N',serial:'ABC001N',toolName:'Estabilizador hidráulico',groupId:'HWDP',status:'OPERATIVA'},{id:'SUB002',serial:'SUB002',toolName:'Float sub',groupId:'OTRAS',status:'CONFORME'},{id:'ZERO003',serial:'ZERO003',toolName:'Sin historial',groupId:'OTRAS',status:'SIN_ESTADO_TECNICO'}];
const events=[{id:'e1',serial:'ABC001N',type:'REPAIR',date:'2026-01-01',fields:{},documentId:'r'},{id:'e2',serial:'ABC001N',type:'BHA',date:'2026-02-01',fields:{},documentId:'b'},{id:'e3',serial:'ABC001N',type:'INSPECTION',date:'2026-03-01',fields:{},documentId:'i'},{id:'e4',serial:'SUB002',type:'BHA',date:'2026-02-01',fields:{},documentId:'x'}];
test('una consulta encuentra serial o nombre, con tildes y mayúsculas normalizadas',()=>{
 for(const query of ['abc 001n','HIDRAULICO',' estabilizador '])assert(toolMatches(tools[0],events,{query}));assert(!toolMatches(tools[0],events,{query:'sub'}));assert(toolMatches(tools[1],events,{query:'FLOAT SUB'}));assert(toolMatches({...tools[0],toolName:''},events,{query:'ABC001'}));
});
test('consulta unificada combina grupo, estado y fechas sin convertir búsqueda por nombre en serial',()=>{
 assert(toolMatches(tools[0],events,{query:'hidraulico',group:'HWDP',status:'OPERATIVA',from:'2026-02-01',to:'2026-02-01'}));assert(!toolMatches(tools[0],events,{query:'hidraulico',group:'OTRAS'}));assert(!toolMatches(tools[0],events,{query:'hidraulico',status:'CONFORME'}));
});
test('límites de cantidad son inclusivos, admiten exactos y cero eventos',()=>{
 assert(toolMatches(tools[0],events,{minEvents:'3',maxEvents:'3'}));assert(!toolMatches(tools[0],events,{maxEvents:'2'}));assert(!toolMatches(tools[1],events,{minEvents:'2'}));assert(toolMatches(tools[2],events,{minEvents:'0',maxEvents:'0'}));assert(!toolMatches(tools[1],events,{maxEvents:'0'}));assert(toolMatches(tools[0],events,{}));
});
test('conteo usa el historial total incluso cuando la fecha selecciona un único evento',()=>{
 assert(toolMatches(tools[0],events,{from:'2026-02-01',to:'2026-02-01',minEvents:'3',maxEvents:'3'}));assert(!toolMatches(tools[0],events,{from:'2026-02-01',to:'2026-02-01',maxEvents:'1'}));const index=new Map(tools.map(t=>[t.serial,events.filter(e=>e.serial===t.serial)]));assert(toolMatches(tools[0],index,{minEvents:3,maxEvents:3}));assert(toolMatches(tools[2],index,{maxEvents:0}));
});
test('cantidades inválidas no producen coincidencias ni ignoran silenciosamente el filtro',()=>{
 for(const minEvents of ['-1','1.5','1e3','invalid','9007199254740992']){assert(eventCountError(minEvents,''));assert(!toolMatches(tools[0],events,{minEvents}));}assert(eventCountError('4','3'));assert(!eventCountError('0',''));assert(!eventCountError('','0'));
});
test('exportación combina nombre y cantidad y conserva todo el historial sin modificar datos',()=>{
 const data={...emptyState(),tools,events},before=structuredClone(data),sheets=reportModel(data,{query:'HIDRAULICO',minEvents:'3',maxEvents:'3',from:'2026-02-01',to:'2026-02-01'});assert.equal(sheets[0].rows.length,1);assert.equal(sheets[0].rows[0][0],'ABC001N');assert.equal(sheets[0].columns.length,21);assert.equal(sheets[0].rows[0][3],'2026-01-01');assert.equal(sheets[0].rows[0][15],'2026-03-01');assert.deepEqual(data,before);assert.equal(reportModel(data,{query:'FLOAT',maxEvents:'1'})[0].rows[0][0],'SUB002');assert.equal(reportModel(data,{minEvents:'4',maxEvents:'3'})[0].rows.length,0);
});
test('exportación de herramientas sin eventos incluye sus fichas y omite pendientes sin serial al filtrar',()=>{
 const data={...emptyState(),tools,events};assert.deepEqual(reportModel(data,{maxEvents:'0'})[0].rows.map(r=>r[0]),['ZERO003']);const sheets=reportModel(data,{query:'sin coincidencias',pending:[{name:'pendiente.pdf',type:'BHA',records:[]}]});assert(!sheets.some(s=>s.name==='Por completar'));
});
test('RGB convierte valores límite y conserva el color sin alterar el formato guardado',()=>{
 assert.equal(rgbToHex({r:'0',g:'255',b:'128'}),'#00ff80');assert.equal(rgbToHex({r:255,g:255,b:255}),'#ffffff');assert.equal(rgbToHex({r:0,g:0,b:0}),'#000000');assert.deepEqual(hexToRgb('#0D9488'),{r:13,g:148,b:136});assert.equal(rgbToHex(hexToRgb('#0d9488')),'#0d9488');
});
test('RGB rechaza vacíos, negativos, decimales, texto y valores fuera de rango',()=>{
 for(const r of ['',-1,256,'1.5','x','1e2',null])assert.throws(()=>rgbToHex({r,g:0,b:0}),/0 a 255/);assert.throws(()=>hexToRgb('red'),/válido/);assert.throws(()=>hexToRgb('#fff'),/válido/);
});
test('selector RGB usa el mismo campo de color en formulario independiente e integrado',()=>{
 const direct=colorPicker('#0d9488'),inline=colorPicker('#0d9488',{inline:true});assert(direct.includes('name="color"'));assert(inline.includes('data-inline-group-color'));assert(!inline.includes('name="color"'));assert.equal((inline.match(/data-rgb=/g)||[]).length,3);assert(direct.includes('value="148"'));assert(direct.includes('#0D9488'));
});
