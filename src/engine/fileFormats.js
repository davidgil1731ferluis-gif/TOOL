export const acceptedFiles='.pdf,.xlsx,.xls,.ods,.csv,.tsv,.txt,.png,.jpg,.jpeg,.webp,.bmp';
export function decodeText(bytes){
  if(bytes[0]===0xff&&bytes[1]===0xfe)return new TextDecoder('utf-16le').decode(bytes);
  if(bytes[0]===0xfe&&bytes[1]===0xff)return new TextDecoder('utf-16be').decode(bytes);
  try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{return new TextDecoder('windows-1252').decode(bytes);}
}
export function fileKind(name,bytes=new Uint8Array()) {
  const head=new TextDecoder().decode(bytes.slice(0,1024));
  if(head.includes('%PDF-'))return 'pdf';
  const ext=String(name).split('.').pop().toLowerCase();
  if(['xlsx','xls','ods'].includes(ext)) {
    if((bytes[0]===0x50&&bytes[1]===0x4b)||(bytes[0]===0xd0&&bytes[1]===0xcf))return 'spreadsheet';
    throw new Error('El archivo no tiene una cabecera de hoja de cálculo válida.');
  }
  if(['png','jpg','jpeg','webp','bmp'].includes(ext))return 'image';
  if(['csv','tsv'].includes(ext))return 'spreadsheet';
  if(ext==='txt')return 'text';
  throw new Error('Formato no compatible. Usa PDF, Excel, ODS, CSV, TXT o una imagen PNG, JPG, WebP o BMP.');
}
