import test from 'node:test';
import assert from 'node:assert/strict';
import {chartTicks,chartView} from '../src/views/calendarViews.js';
import {emptyState} from '../src/adapters/repository.js';
test('fechas del eje espaciadas aun con eventos próximos al final',()=>{
 const ticks=chartTicks([{date:'2026-07-17'},{date:'2026-09-21'},{date:'2026-09-22'}]);
 assert.equal(ticks.length,5);for(let i=1;i<ticks.length;i++)assert(ticks[i].x-ticks[i-1].x>150);
 assert.equal(chartTicks([{date:'2026-09-21'}]).length,1);
 assert.equal(chartTicks([{date:'2026-09-21'},{date:'2026-09-22'}]).length,2);
});
test('tarjetas incluyen reportes del día, seriales y acceso seguro',()=>{
 const data=emptyState();data.documents=[{id:'doc',name:'<PDF>'}];data.events=[{id:'e',documentId:'doc',serial:'001N',date:'2026-09-21',type:'REPAIR',fields:{issuer:'<script>',reportNumber:'001'}}];
 const html=chartView(data);assert(html.includes('data-chart-date="2026-09-21"'));assert(html.includes('data-report="doc"'));assert(html.includes('001N'));assert(html.includes('&lt;script&gt;'));assert(!html.includes('<script>'));assert.equal((html.match(/class="chart-point"/g)||[]).length,1);
});
