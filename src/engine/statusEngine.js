export function statusEngine(events) {
  let last;for(const event of events){if(event.type==='BHA')continue;const order=last?(event.date.localeCompare(last.date)||String(event.createdAt||'').localeCompare(String(last.createdAt||''))||event.id.localeCompare(last.id)):1;if(order>=0)last=event;}
  return {status:last?(last.type==='REPAIR'?'OPERATIVA':last.fields.finalConformity):'SIN_ESTADO_TECNICO',statusDate:last?.date||'',statusCreatedAt:last?.createdAt||'',statusEventId:last?.id||''};
}
export function applyStatus(tool,event) {
  if(event.type==='BHA') return tool;
  const next=statusEngine([event]);
  const oldKey=[tool.statusDate||'',tool.statusCreatedAt||'',tool.statusEventId||''].join('|');
  const newKey=[event.date,event.createdAt,event.id].join('|');
  return !tool.statusDate||newKey>=oldKey?{...tool,...next}:tool;
}
