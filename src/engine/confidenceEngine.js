import {fieldDefinitions} from './fieldExtractor.js';
import {matrixValidator} from './matrixValidator.js';
export function confidenceEngine(type,record,template) {
  const keys=(fieldDefinitions[type]||[]).map(f=>f[0]);
  const coverage=keys.length?keys.filter(k=>record.fields[k]).length/keys.length:0;
  return {score:Math.round(coverage*100),meaning:'Cobertura de campos; no es una probabilidad de exactitud.',requiresReview:matrixValidator(type,record).length>0,templateKnown:template!=='GENERIC_REVIEW'};
}
