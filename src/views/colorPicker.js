import {rgbToHex,hexToRgb} from '../engine/colorValues.js';
export function colorPicker(value='#0d9488',{inline=false}={}){
 const color=/^#[\da-f]{6}$/i.test(value)?value:'#0d9488',rgb=hexToRgb(color);
 return `<fieldset class="group-color-picker"><legend>Color del grupo</legend><div class="color-picker-row"><label class="color-swatch-label">Selector<input type="color" ${inline?'data-inline-group-color':'name="color"'} value="${color}"></label><div class="rgb-channels">${[['r','Rojo','R'],['g','Verde','G'],['b','Azul','B']].map(([key,label,short])=>`<label>${short}<input type="text" inputmode="numeric" maxlength="3" data-rgb="${key}" value="${rgb[key]}" aria-label="${label} (${short})" autocomplete="off"></label>`).join('')}</div><output class="color-hex" data-color-code>${color.toUpperCase()}</output></div><p class="color-help">RGB: de 0 a 255 por canal.</p><p role="alert" data-color-error hidden></p></fieldset>`;
}
export function syncColorPicker(input){
 const picker=input.closest('.group-color-picker');if(!picker)return;
 const color=picker.querySelector('input[type=color]'),error=picker.querySelector('[data-color-error]');
 try{
  if(input.matches('[data-rgb]'))color.value=rgbToHex(Object.fromEntries([...picker.querySelectorAll('[data-rgb]')].map(i=>[i.dataset.rgb,i.value])));
  else{const rgb=hexToRgb(color.value);for(const el of picker.querySelectorAll('[data-rgb]'))el.value=rgb[el.dataset.rgb];}
  picker.querySelector('[data-color-code]').textContent=color.value.toUpperCase();error.textContent='';error.hidden=true;picker.classList.remove('color-invalid');
 }catch(e){error.textContent=e.message;error.hidden=false;picker.classList.add('color-invalid');}
}
export function validColorPicker(container){
 const picker=container?.querySelector('.group-color-picker');if(!picker)return true;
 syncColorPicker(picker.querySelector('[data-rgb]'));
 if(!picker.querySelector('[data-color-error]').hidden){picker.querySelector('[data-rgb]').focus();return false;}return true;
}
