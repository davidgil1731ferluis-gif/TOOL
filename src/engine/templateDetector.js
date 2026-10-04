export function templateDetector(text, type) {
  if (type === 'INSPECTION' && /TOTAL\s*QC/i.test(text) && /FT-END-003/i.test(text)) return 'TOTAL_QC_FT_END_003';
  if (type === 'REPAIR' && /Tuboscope/i.test(text)) return 'NOV_TUBOSCOPE_HW';
  if (type === 'BHA' && /COMPONENTES BHA/i.test(text)) return 'ECOPETROL_BHA';
  return 'GENERIC_REVIEW';
}
