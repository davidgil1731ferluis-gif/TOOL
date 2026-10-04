import {serialNormalizer} from './serialNormalizer.js';
export function toolGroup(value) {
  const serial=serialNormalizer(value);
  return serial.startsWith('NHA')||serial.endsWith('N')?'HWDP':'OTRAS';
}
