export function classifier(text) {
  const t = text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const scores = { INSPECTION: /(?:CERTIFICADO|REPORTE|INFORME) DE INSPECCION|INSPECTION REPORT|HOJA DE RECUENTO HEAVYWEIGHT/.test(t) ? 4 : 0, REPAIR: /REPORT AFTER REPAIR|TOTAL DESPUES DE REPARACION|REPAIR REMARKS/.test(t) ? 8 : 0, BHA: /COMPONENTES BHA|COMPONENTE BHA|BOTTOM HOLE ASSEMBLY/.test(t) ? 4 : 0 };
  if(/(?:FECHA DE REPARACION|REPAIR DATE)\s*[:|]/.test(t)&&/(?:MAQUINADO|MACHINING)\s*[:|]/.test(t))scores.REPAIR+=5;
  if(/(?:FECHA DE INSPECCION|INSPECTION DATE)\s*[:|]/.test(t)&&/(?:CERTIFICADO|CERTIFICATE|CONFORMIDAD FINAL)\s*[:|]/.test(t))scores.INSPECTION+=3;
  const sorted = Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  return sorted[0][1] && sorted[0][1] > sorted[1][1] ? sorted[0][0] : 'UNKNOWN';
}
