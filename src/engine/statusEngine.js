export function statusEngine(events) {
  const technical=events.filter(e=>e.type!=='BHA').sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
  const last=technical.at(-1);
  return {status:last?(last.type==='REPAIR'?'OPERATIVA':last.fields.finalConformity):'SIN_ESTADO_TECNICO',statusDate:last?.date||'',statusCreatedAt:last?.createdAt||'',statusEventId:last?.id||''};
}
export function applyStatus(tool,event) {
  if(event.type==='BHA') return tool;
  const next=statusEngine([event]);
  const oldKey=[tool.statusDate||'',tool.statusCreatedAt||'',tool.statusEventId||''].join('|');
  const newKey=[event.date,event.createdAt,event.id].join('|');
  return !tool.statusDate||newKey>=oldKey?{...tool,...next}:tool;
}
