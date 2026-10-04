import {serialExtractor} from './serialExtractor.js';
export function recordSplitter(pages,type) {
  const bySerial=new Map();
  for(const page of pages) for(const candidate of (type==='INSPECTION'&&page.inspectionCandidates? page.inspectionCandidates:type==='BHA'&&page.bhaCandidates!==null&&page.bhaCandidates!==undefined?page.bhaCandidates:serialExtractor(page.text,type))) {
    if(!bySerial.has(candidate.serial)) bySerial.set(candidate.serial,{serial:candidate.serial,rawSerial:candidate.rawSerial,evidence:[]});
    const section=/9\.2\s*TOOL JOINT/i.test(page.text)?'PIN':/9\.3\s*TOOL JOINT/i.test(page.text)?'BOX':/9\.1\s*CUERPO/i.test(page.text)?'BODY':'';
    bySerial.get(candidate.serial).evidence.push({page:page.page,line:candidate.line,section});
    if(candidate.cells) bySerial.get(candidate.serial).cells={...bySerial.get(candidate.serial).cells,...candidate.cells};
  }
  return [...bySerial.values()];
}
