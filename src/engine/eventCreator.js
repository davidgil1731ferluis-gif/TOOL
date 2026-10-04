export function eventCreator(type,record,documentId,id,createdAt) {
  const dateKey={INSPECTION:'inspectionDate',REPAIR:'repairDate',BHA:'bhaDate'}[type];
  return {id,documentId,type,toolId:record.serial,serial:record.serial,date:record.fields[dateKey],fields:{...record.fields},evidence:record.evidence||[],rawSerial:record.rawSerial||record.serial,createdAt};
}
