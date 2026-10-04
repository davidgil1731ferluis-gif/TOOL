export function classifier(text) {
  const t = text.toUpperCase();
  const scores = { INSPECTION: /CERTIFICADO DE INSPECCI[ÓO]N/.test(t) ? 4 : 0, REPAIR: /REPORT AFTER REPAIR|TOTAL DESPU[ÉE]S DE REPARACI[ÓO]N|REPAIR REMARKS/.test(t) ? 4 : 0, BHA: /COMPONENTES BHA|COMPONENTE BHA/.test(t) ? 4 : 0 };
  const sorted = Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  return sorted[0][1] && sorted[0][1] > sorted[1][1] ? sorted[0][0] : 'UNKNOWN';
}
