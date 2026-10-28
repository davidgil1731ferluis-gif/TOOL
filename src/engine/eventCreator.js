export function eventCreator(type,record,documentId,id,createdAt) {
  const dateKey={INSPECTION:'inspectionDate',REPAIR:'repairDate',BHA:'bhaDate'}[type];
  return {id,documentId,type,template:record.template||'GENERIC_REVIEW',toolId:record.serial,serial:record.serial,date:record.fields[dateKey],fields:{...record.fields},evidence:record.evidence||[],...(record.nameEvidence?{nameEvidence:{...record.nameEvidence}}:{}),...(record.descriptionConflict?{descriptionConflict:true}:{}),rawSerial:record.rawSerial||record.serial,createdAt};
}
