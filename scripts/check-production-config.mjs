import {firebaseConfig, useEmulators} from '../src/config.js';
const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missing = required.filter(key => !String(firebaseConfig[key] || '').trim());
if (missing.length || useEmulators) {
  console.error(`Publicación detenida: ${missing.length ? 'completa '+missing.join(', ')+' en src/config.js. ' : ''}${useEmulators ? 'Desactiva useEmulators. ' : ''}Consulta PRODUCCION.md.`);
  process.exit(1);
}
console.log(`Configuración lista para publicar: ${firebaseConfig.projectId}. Comprueba Authentication y las reglas siguiendo PRODUCCION.md.`);
