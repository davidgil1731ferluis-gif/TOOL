// Conservar guiones y ceros iniciales evita unir herramientas diferentes.
export function serialNormalizer(value) {
  return String(value ?? '').normalize('NFKC').trim().toUpperCase().replace(/[‐‑–—]/g, '-').replace(/\s+/g, '');
}
export function validSerial(value) { return /^[A-Z0-9][A-Z0-9._-]{2,63}$/.test(value) && /\d/.test(value) && !['VARIOS','N/A','000'].includes(value); }
