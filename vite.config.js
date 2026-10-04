import {defineConfig} from 'vite';
import fs from 'node:fs';
import path from 'node:path';
export default defineConfig({base:'./',optimizeDeps:{noDiscovery:true,include:[]},plugins:[{name:'offline-shell',closeBundle(){
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
 const assets=walk('dist').filter(f=>!f.endsWith('sw.js')).map(f=>'./'+path.relative('dist',f).replaceAll('\\','/'));
 const version='tooltrace-'+Date.now();
 fs.writeFileSync('dist/sw.js',`const CACHE=${JSON.stringify(version)};const ASSETS=${JSON.stringify(assets)};
 self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
 self.addEventListener('message',e=>{if(e.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
 self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('tooltrace-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
 self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;const scope=new URL('./',self.location.href);if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match(new URL('./index.html',scope),{ignoreVary:true})));return;}if(ASSETS.some(a=>new URL(a,scope).href===u.href))e.respondWith(caches.match(e.request,{ignoreVary:true}).then(r=>r||fetch(e.request)));});`);
}}]});
