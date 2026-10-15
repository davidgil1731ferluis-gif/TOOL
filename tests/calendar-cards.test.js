import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarView} from '../src/views/calendarViews.js';
import {calendarActivities} from '../src/engine/calendar.js';
import {emptyState} from '../src/adapters/repository.js';
test('día muestra tarjetas de reportes multiserial y agenda, con accesos independientes sin botones anidados',()=>{
 const state=emptyState();state.documents=[{id:'r',name:'reporte.pdf'}];state.events=['TEST001','TEST002'].map((serial,i)=>({id:'e'+i,documentId:'r',serial,type:'REPAIR',date:'2026-02-22',fields:{reportNumber:'R-123',issuer:'Taller'}}));state.scheduledEvents=[{id:'s',date:'2026-02-22',type:'INSPECTION',title:'Inspección <prueba>',serial:'TEST001'}];
 const activity=calendarActivities(state).find(a=>!a.planned);assert.equal(activity.reference,'R-123');assert.equal(activity.context,'Taller');
 const html=calendarView(state,'2026-02','2026-02-22');assert.match(html,/class="calendar-day[^\"]*" data-calendar-date="2026-02-22"/);assert.equal((html.match(/class="calendar-event-card/g)||[]).length,2);assert.match(html,/data-report="r"[^>]*title="R-123 · Taller"/);assert.match(html,/data-schedule-edit="s"/);assert.match(html,/2 seriales/);assert.match(html,/Inspección &lt;prueba&gt;/);assert(!/<button[^>]*>[\s\S]*?<button/.test(html.split('class="calendar-day-select"')[1]?.split('</button>')[0]||''));
});
test('días con muchos eventos muestran tres tarjetas y acceso al detalle completo',()=>{
 const state=emptyState();state.scheduledEvents=Array.from({length:5},(_,i)=>({id:'s'+i,date:'2026-02-22',type:'BHA',title:'BHA '+i,serial:''}));const html=calendarView(state,'2026-02','2026-02-22');assert.equal((html.match(/class="calendar-event-card/g)||[]).length,3);assert.match(html,/\+ 2 eventos/);assert.equal((html.match(/class="calendar-event"/g)||[]).length,5);assert.match(html,/class="calendar-scroll"/);
});
