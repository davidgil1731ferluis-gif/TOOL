let active=null,tooltip=null;
function hide(){if(active)active.removeAttribute('aria-describedby');tooltip?.remove();active=null;tooltip=null;}
function show(target){
 if(!target||target===active)return;hide();active=target;
 tooltip=document.createElement('div');tooltip.id='tool-name-tooltip';tooltip.className='tool-name-tooltip';tooltip.setAttribute('role','tooltip');tooltip.textContent=target.dataset.toolFullName;
 document.body.append(tooltip);target.setAttribute('aria-describedby',tooltip.id);
 const rect=target.getBoundingClientRect(),box=tooltip.getBoundingClientRect(),gap=8,margin=12;
 tooltip.style.left=Math.max(margin,Math.min(rect.left,innerWidth-box.width-margin))+'px';
 tooltip.style.top=Math.max(margin,rect.bottom+gap+box.height<=innerHeight-margin?rect.bottom+gap:rect.top-box.height-gap)+'px';
}
document.addEventListener('mouseover',e=>{const target=e.target.closest?.('[data-tool-full-name]');if(target)show(target);});
document.addEventListener('mouseout',e=>{if(active&&e.target===active&&!active.contains(e.relatedTarget))hide();});
document.addEventListener('focusin',e=>{const target=e.target.closest?.('[data-tool-full-name]');if(target)show(target);else hide();});
document.addEventListener('focusout',e=>{if(e.target===active)hide();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
document.addEventListener('scroll',hide,true);
window.addEventListener('resize',hide);
// A rendered view can replace the hovered cell without a mouseout event.
new MutationObserver(()=>{if(active&&!active.isConnected)hide();}).observe(document.querySelector('#app'),{childList:true,subtree:true});
