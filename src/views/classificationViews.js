import {groups,subgroups} from '../engine/toolCatalog.js';
import {colorPicker} from './colorPicker.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const subgroupOptions=(data,parent,id='')=>`<option value="">Sin subgrupo</option>`+subgroups(data,parent).map(g=>`<option value="${esc(g.id)}" ${g.id===id?'selected':''}>${esc(g.name)}</option>`).join('');
export function classificationFields(data,{groupId='HWDP',subgroupId=''}={}){
 const parent=groups(data).find(g=>g.id===groupId)||groups(data)[0],child=subgroups(data,parent.id).find(g=>g.id===subgroupId);
 return `<section class="classification-fields" aria-label="Clasificación"><div class="classification-selects"><label>Grupo<select name="groupId">${groups(data).map(g=>`<option value="${esc(g.id)}" ${g.id===parent.id?'selected':''}>${esc(g.name)}</option>`).join('')}</select></label><label>Subgrupo<select name="subgroupId">${subgroupOptions(data,parent.id,child?.id)}</select></label></div><input type="hidden" name="subgroupCreatedAt" value="${esc(child?.createdAt||'')}"><div class="classification-create"><details class="inline-group" id="inline-group"><summary>+ Nuevo grupo</summary><label>Nombre del grupo<input data-inline-group-name maxlength="60" autocomplete="off" placeholder="Ej. Estabilizadores"></label>${colorPicker('#0d9488',{inline:true})}<div class="row-actions"><button type="button" class="secondary" data-action="create-inline-group">Crear grupo</button><button type="button" class="subtle" data-action="cancel-inline-group">Cancelar</button></div><p role="alert" data-inline-group-error></p></details><details class="inline-group" id="inline-subgroup"><summary>+ Nuevo subgrupo</summary><p class="subgroup-parent-context">Dentro de <strong data-subgroup-parent>${esc(parent.name)}</strong></p><label>Nombre del subgrupo<input data-inline-subgroup-name maxlength="60" autocomplete="off" placeholder="Ej. 5⅞ pulgadas"></label>${colorPicker('#2583b5',{inline:true})}<div class="row-actions"><button type="button" class="secondary" data-action="create-inline-subgroup">Crear subgrupo</button><button type="button" class="subtle" data-action="cancel-inline-subgroup">Cancelar</button></div><p role="alert" data-inline-subgroup-error></p></details></div><p class="inline-group-status" role="status" data-inline-group-status></p></section>`;
}
export function syncClassification(form,data,{groupId,subgroupId}={}){
 const parentSelect=form.elements.groupId,childSelect=form.elements.subgroupId;if(!parentSelect||!childSelect)return;
 const parent=groupId??parentSelect.value,child=subgroupId??childSelect.value;
 parentSelect.replaceChildren(...groups(data).map(g=>new Option(g.name,g.id)));parentSelect.value=parent;
 if(!parentSelect.value)parentSelect.value=groups(data)[0].id;
 childSelect.innerHTML=subgroupOptions(data,parentSelect.value,child);childSelect.value=subgroups(data,parentSelect.value).some(g=>g.id===child)?child:'';
 form.elements.subgroupCreatedAt.value=subgroups(data,parentSelect.value).find(g=>g.id===childSelect.value)?.createdAt||'';
 const label=form.querySelector('[data-subgroup-parent]');if(label)label.textContent=groups(data).find(g=>g.id===parentSelect.value)?.name||'';
}
export function pendingClassification(form){
 if(form.querySelector('#inline-group[open] [data-inline-group-name]')?.value.trim())return 'Crea el grupo o cancela antes de guardar.';
 if(form.querySelector('#inline-subgroup[open] [data-inline-subgroup-name]')?.value.trim())return 'Crea el subgrupo o cancela antes de guardar.';
 return '';
}
