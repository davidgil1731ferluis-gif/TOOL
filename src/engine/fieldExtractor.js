const grab=(t,re)=>t.match(re)?.[1]?.trim()||'';
export function normalizeDate(value) {
  let y,m,d;
  if(/^\d{4}-\d{2}-\d{2}$/.test(value)) [y,m,d]=value.split('-').map(Number);
  else {
    const a=String(value).match(/(\d{1,2})[.\/-](\d{1,2}|[A-Za-z]{3})[.\/-](\d{4})/);
    if(!a) return '';
    d=+a[1]; m=+a[2]||({jan:1,ene:1,feb:2,mar:3,apr:4,abr:4,may:5,jun:6,jul:7,aug:8,ago:8,sep:9,oct:10,nov:11,dec:12,dic:12}[a[2].toLowerCase()]); y=+a[3];
  }
  const date=new Date(Date.UTC(y,m-1,d));
  if(date.getUTCFullYear()!==y||date.getUTCMonth()!==m-1||date.getUTCDate()!==d) return '';
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
export const fieldDefinitions = {
  INSPECTION: [['certificateNumber','Certificado / número de formato'],['formatCode','Código de formato'],['formatVersion','Versión'],['versionDate','Fecha de versión','date'],['issuer','Empresa emisora'],['inspectionDate','Fecha de inspección','date'],['issueDate','Fecha de emisión','date'],['body','Cuerpo'],['pin','PIN'],['box','BOX'],['finalConformity','Conformidad final','status'],['findings','Hallazgos','textarea'],['observations','Observaciones','textarea']],
  REPAIR: [['issuer','Empresa emisora'],['reportNumber','Número de reporte'],['workOrder','Orden de trabajo'],['repairDate','Fecha de reparación','date'],['pin','Estado PIN'],['box','Estado BOX'],['machining','Maquinado','textarea'],['observations','Observaciones','textarea']],
  BHA: [['bhaNumber','Número BHA'],['well','Pozo'],['phase','Fase'],['bhaDate','Fecha','date'],['owner','Propietario'],['outerDiameter','Diámetro externo (in)'],['innerDiameter','Diámetro interno (in)'],['fishingNeck','Fishing neck (ft)'],['length','Longitud (ft)']]
};
export function fieldExtractor(text,type,record) {
  const fields=Object.fromEntries((fieldDefinitions[type]||[]).map(([key])=>[key,'']));
  const row=record.evidence.map(e=>e.line).join('\n');
  if(type==='INSPECTION') {
    fields.issuer=/TOTAL\s*QC/i.test(text)?'TOTAL QC SAS':'';
    fields.certificateNumber=grab(text,/N[°º]\s*(\d{8,})/i);
    fields.formatCode=grab(text,/(FT-END-\d+)/i);
    fields.formatVersion=grab(text,/FT-END-\d+\s+Versi[óo]n\s*:\s*(\d+)/i);
    fields.versionDate=normalizeDate(grab(text,/FT-END-\d+\s+Versi[óo]n\s*:\s*\d+\s+Fecha:\s*(\S+)/i));
    fields.inspectionDate=normalizeDate(grab(text,/Fecha\s+inspecci[óo]n\s*:?\s*(\S+)/i));
    fields.issueDate=normalizeDate(grab(text,/Fecha\s+emisi[óo]n\s*:?\s*(\S+)/i));
    // Only unambiguous row-level conformity; no global document state inheritance.
    if(/fuera\s+(?:de\s+)?servicio|desecho|scrap/i.test(row)) fields.finalConformity='NO_CONFORME_FUERA_SERVICIO';
    else if(/no\s+conforme\s*\/\s*reparable/i.test(row)) fields.finalConformity='NO_CONFORME_REPARABLE';
    else if(/conforme/i.test(row)&&!(/\bno\b|\bNC\b/i.test(row))) fields.finalConformity='CONFORME';
    for(const [key,section] of [['body','BODY'],['pin','PIN'],['box','BOX']]) {
      const evidence=record.evidence.find(e=>e.section===section)?.line||'';
      if(key==='body'&&/\bno\b|reparabl|\bNC\b/i.test(evidence)) continue;
      if(/No\s+Conforme\/Reparable/i.test(evidence)) fields[key]='No conforme / reparable';
      else if(/fuera\s+(?:de\s+)?servicio/i.test(evidence)) fields[key]='Fuera de servicio';
      else if(/Conforme/i.test(evidence)&&!(/\bno\b|\bNC\b/i.test(evidence))) fields[key]='Conforme';
    }
    fields.findings=row;
    fields.observations=grab(text,/5\.\s*Observaciones\s*\n([\s\S]*?)(?=6\.\s*Condici)/i);
    if(record.cells) {
      Object.assign(fields,record.cells);
      const cell=record.cells.finalConformity||'';
      fields.finalConformity=/no\s*conforme\s*\/\s*reparable/i.test(cell)?'NO_CONFORME_REPARABLE':/fuera\s+(?:de\s+)?servicio/i.test(cell)?'NO_CONFORME_FUERA_SERVICIO':/^conforme$/i.test(cell.trim())?'CONFORME':'';
    }
  }
  if(type==='REPAIR') {
    fields.issuer=/NOV Tuboscope/i.test(text)?'NOV Tuboscope - Base Yopal - Casanare':'';
    fields.reportNumber=grab(text,/Tuboscope,\s*Orden No\.\s*:\s*(\w+)/i)||grab(text,/Report No\.\s*:\s*(\w+)/i);
    fields.workOrder=grab(text,/Orden de Trabajo No\.\s*:\s*(\w+)/i)||grab(text,/Tuboscope W\.O\s*:\s*(\w+)/i);
    fields.repairDate=normalizeDate(grab(row,/(\d{2}[.]\d{2}[.]\d{4})/));
    const states=row.match(new RegExp(record.serial.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s+(OK|NC)\\s+(OK|NC)'));
    fields.pin=states?.[1]||'';fields.box=states?.[2]||'';
    const lines=text.split('\n'); const i=lines.findIndex(l=>l.startsWith(record.serial+' ')&&/maquinado|reface/i.test(l));
    if(i>=0) {
      const remarks=[lines[i]];
      for(let j=i+1;j<Math.min(i+4,lines.length);j++) {
        if(/^[A-Z0-9-]{3,}\s+|Inspector|Firma|Disclaimer/i.test(lines[j]) && !/^OK\s/i.test(lines[j])) break;
        remarks.push(lines[j]);
      }
      fields.machining=remarks.join('\n');
    }
    fields.observations=row;
  }
  if(type==='BHA') {
    fields.bhaNumber=grab(text,/COMPONENTE BHA\s*N[º°o]?\s*:\s*(\d+)/i);
    fields.well=grab(text,/LOCACI[ÓO]N:\s*([^\n]+)/i);
    fields.phase=grab(text,/FASE:\s*([^\n]+)/i);
    fields.bhaDate=normalizeDate(grab(text,/FECHA:\s*(\S+)/i));
    const tail=row.slice(row.indexOf(record.rawSerial)+record.rawSerial.length);
    const diam=tail.match(/^\s*(\d+(?:\s+\d+\/\d+)?\s*")\s*(\d+(?:[.,]\d+|\s+\d+\/\d+)?\s*")/);
    fields.outerDiameter=diam?.[1]||'';fields.innerDiameter=diam?.[2]||'';
    Object.assign(fields,record.cells||{});
  }
  return fields;
}
