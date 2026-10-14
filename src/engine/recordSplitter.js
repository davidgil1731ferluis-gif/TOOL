import {serialExtractor} from './serialExtractor.js';
import {inspectionFormat,tuboscopeInspectionCells,enrichInspectionRecords} from './inspectionFormats.js';
export function recordSplitter(pages,type) {
  const bySerial=new Map();
  const template=type==='INSPECTION'?inspectionFormat(pages.map(p=>p.text).join('\n')):'';
  for(const page of pages) for(const candidate of (template==='NOV_TUBOSCOPE_HW_INSPECTION'?tuboscopeInspectionCells(page.text)||[]:type==='INSPECTION'&&page.inspectionCandidates? page.inspectionCandidates:type==='BHA'&&page.bhaCandidates!==null&&page.bhaCandidates!==undefined?page.bhaCandidates:serialExtractor(page.text,type))) {
    if(!bySerial.has(candidate.serial)) bySerial.set(candidate.serial,{serial:candidate.serial,rawSerial:candidate.rawSerial,evidence:[]});
    const section=/9\.2\s*TOOL JOINT/i.test(page.text)?'PIN':/9\.3\s*TOOL JOINT/i.test(page.text)?'BOX':/9\.1\s*CUERPO/i.test(page.text)?'BODY':'';
    bySerial.get(candidate.serial).evidence.push({page:page.page,line:candidate.line,section});
    if(candidate.cells) bySerial.get(candidate.serial).cells={...bySerial.get(candidate.serial).cells,...candidate.cells};
  }
  return enrichInspectionRecords(pages,[...bySerial.values()],template);
}
