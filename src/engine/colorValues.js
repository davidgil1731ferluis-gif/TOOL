export function rgbToHex({r,g,b}){
 const channels=[r,g,b].map(v=>String(v??'').trim());
 if(channels.some(v=>!/^\d{1,3}$/.test(v)||Number(v)>255))throw new Error('Usa valores enteros de 0 a 255 para R, G y B.');
 return '#'+channels.map(v=>Number(v).toString(16).padStart(2,'0')).join('');
}
export function hexToRgb(value){
 if(!/^#[\da-f]{6}$/i.test(value))throw new Error('Selecciona un color válido.');
 return Object.fromEntries(['r','g','b'].map((key,i)=>[key,parseInt(value.slice(1+i*2,3+i*2),16)]));
}
