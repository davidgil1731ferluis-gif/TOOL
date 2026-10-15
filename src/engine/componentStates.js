export const componentStates=['Conforme','No conforme/reparable','Fuera de servicio'];
export function normalizeComponentState(value){
 const original=String(value??'').trim(),key=original.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[\s_/-]/g,'');
 if(key==='OK'||key==='CONFORME')return componentStates[0];
 if(key==='NOCONFORMEREPARABLE')return componentStates[1];
 if(['FUERADESERVICIO','FUERASERVICIO','NOCONFORMEFUERASERVICIO'].includes(key))return componentStates[2];
 // Conservar códigos o resultados desconocidos evita convertirlos en conformidad por suposición.
 return original;
}
export function normalizeComponentFields(type,fields){const result={...fields};if(['INSPECTION','REPAIR'].includes(type))for(const key of ['body','pin','box'])if(key in result)result[key]=normalizeComponentState(result[key]);return result;}
