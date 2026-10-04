import {serialNormalizer} from './serialNormalizer.js';
export function toolMatcher(serial,tools) { return tools.find(t=>t.serial===serialNormalizer(serial))||null; }
