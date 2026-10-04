import {validSerial,serialNormalizer} from './serialNormalizer.js';
import {normalizeDate} from './fieldExtractor.js';
export const states=['CONFORME','NO_CONFORME_REPARABLE','NO_CONFORME_FUERA_SERVICIO'];
const required={INSPECTION:['certificateNumber','formatCode','formatVersion','versionDate','issuer','inspectionDate','issueDate','body','pin','box','finalConformity'],REPAIR:['issuer','reportNumber','workOrder','repairDate','pin','box','machining'],BHA:['bhaNumber','well','phase','bhaDate']};
export function matrixValidator(type,record) {
  const errors=[];const f=record.fields||{};
  if(!required[type]) return ['Seleccione un tipo documental válido.'];
  if(!validSerial(serialNormalizer(record.serial))) errors.push('Serial inválido (3–64 caracteres y al menos un dígito).');
  for(const key of required[type]) if(!String(f[key]||'').trim()||/^(---|varios)$/i.test(f[key])) errors.push(`Falta completar: ${key}.`);
  for(const key of ['versionDate','inspectionDate','issueDate','repairDate','bhaDate']) if(f[key]&&normalizeDate(f[key])!==f[key]) errors.push(`Fecha inválida: ${key}.`);
  if(type==='INSPECTION'&&f.finalConformity&&!states.includes(f.finalConformity)) errors.push('Conformidad no válida.');
  if(f.inspectionDate&&f.issueDate&&f.issueDate<f.inspectionDate) errors.push('La emisión no puede preceder a la inspección.');
  if(type==='INSPECTION'&&f.finalConformity==='CONFORME'&&['body','pin','box'].some(k=>/no\s*conforme|fuera\s*(de\s*)?servicio|^NC$/i.test(f[k]||''))) errors.push('La conformidad final contradice el resultado de cuerpo, PIN o BOX.');
  if(type==='BHA') {
    for(const k of ['outerDiameter','innerDiameter','fishingNeck','length']) {
      const raw=String(f[k]||'').trim().replace(/"$/, '').trim();
      if(!raw||/^(N\/A|---|\*{2,3})$/i.test(raw)) continue;
      let value;
      const fraction=raw.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);
      if(fraction) value=+fraction[3]>0?(+(fraction[1]||0)+(+fraction[2]/+fraction[3])):NaN;
      else value=/^\d+(?:[.,]\d+)?$/.test(raw)?Number(raw.replace(',','.')):NaN;
      if(!Number.isFinite(value)||value<0||(['outerDiameter','innerDiameter','length'].includes(k)&&value===0)) errors.push(`Medida inválida: ${k}. Use un número positivo, fracción o N/A; conserve la unidad indicada.`);
    }
  }
  for(const [k,v] of Object.entries(f)) if(String(v).length>12000) errors.push(`Campo demasiado largo: ${k}.`);
  return errors;
}
