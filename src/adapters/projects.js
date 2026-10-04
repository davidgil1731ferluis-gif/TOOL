export const DEFAULT_PROJECT='principal';
export const initialProject=()=>({id:DEFAULT_PROJECT,name:'Proyecto principal',createdAt:''});
export function projectId(id=DEFAULT_PROJECT){if(!/^[A-Za-z0-9_-]{1,80}$/.test(id))throw new Error('Proyecto inválido.');return id;}
export function projectName(value){const name=String(value||'').trim().replace(/\s+/g,' ');if(!name||name.length>80)throw new Error('Escribe un nombre de proyecto de hasta 80 caracteres.');return name;}
export const projectOwner=(uid,id)=>projectId(id)===DEFAULT_PROJECT?uid:uid+'/'+id;
export const projectPath=(uid,id=DEFAULT_PROJECT)=>id===DEFAULT_PROJECT?['users',uid]:['users',uid,'projects',projectId(id)];
export const demoStateKey=(id=DEFAULT_PROJECT)=>id===DEFAULT_PROJECT?'tooltrace-explicit-demo-v1':'tooltrace-demo-project-'+projectId(id);
export function newProject(name){return {id:'p_'+crypto.randomUUID(),name:projectName(name),createdAt:new Date().toISOString()};}
export class DemoProjectDirectory {
  constructor(){this.key='tooltrace-demo-projects-v1';}
  async list(){return [initialProject(),...JSON.parse(localStorage.getItem(this.key)||'[]')];}
  async create(name){const entry=newProject(name);const write=async()=>{const list=(await this.list()).filter(p=>p.id!==DEFAULT_PROJECT);list.push(entry);localStorage.setItem(this.key,JSON.stringify(list));return entry;};return navigator.locks?navigator.locks.request(this.key,write):write();}
  async remove(id){projectId(id);if(id===DEFAULT_PROJECT)throw new Error('El proyecto principal se puede vaciar, pero no eliminar.');const write=async()=>{const list=(await this.list()).filter(p=>p.id!==DEFAULT_PROJECT&&p.id!==id);localStorage.setItem(this.key,JSON.stringify(list));localStorage.removeItem(demoStateKey(id));};return navigator.locks?navigator.locks.request(this.key,write):write();}
}
