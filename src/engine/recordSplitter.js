import {serialExtractor} from './serialExtractor.js';
import {inspectionFormat,tuboscopeInspectionCells,enrichInspectionRecords} from './inspectionFormats.js';
export function recordSplitter(pages,type) {
  const bySerial=new Map();
  const template=type==='INSPECTION'?inspectionFormat(pages.map(p=>p.text).join('\n')):'';
  for(const page of pages) for(const candidate of (template==='NOV_TUBOSCOPE_HW_INSPECTION'?tuboscopeInspectionCells(page.text)||[]:type==='INSPECTION'&&page.inspectionCandidates? page.inspectionCandidates:type==='BHA'&&page.bhaCandidates!==null&&page.bhaCandidates!==undefined?page.bhaCandidates:serialExtractor(page.text,type))) {
    if(!bySerial.has(candidate.serial)) bySerial.set(candidate.serial,{serial:candidate.serial,rawSerial:candidate.rawSerial,evidence:[]});
    const compact=page.text.replace(/\s/g,'');const section=/9\.2TOOLJOINT/i.test(compact)?'PIN':/9\.3TOOLJOINT/i.test(compact)?'BOX':/9\.1CUERPO/i.test(compact)?'BODY':'';
    bySerial.get(candidate.serial).evidence.push({page:page.page,line:candidate.line,section});
    const record=bySerial.get(candidate.serial);
    if(record.cells?.description&&candidate.cells?.description&&record.cells.description.trim().toLowerCase()!==candidate.cells.description.trim().toLowerCase())record.descriptionConflict=true;
    if(candidate.nameEvidence)record.nameEvidence={...candidate.nameEvidence,page:page.page,...(page.method==='ocr'?{method:'ocr'}:{}),...(record.descriptionConflict?{ambiguous:true}:{})};
    if(candidate.cells) record.cells={...record.cells,...candidate.cells};
  }
  return enrichInspectionRecords(pages,[...bySerial.values()],template);
}
