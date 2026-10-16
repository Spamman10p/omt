/* The same-origin model owns hits and geometry; no provider or remote service. */
(()=>{
 'use strict';
 const photo=document.querySelector('.portrait-photo'),scene=document.querySelector('#scene');
 const portrait=document.querySelector('#robot-portrait'),workbench=window.SISPartWorkbench;
 const note=document.createElement('p');note.className='viewer-note';note.setAttribute('role','status');
 const controls=document.createElement('div');controls.className='viewer-controls';
 function button(text,label,action){const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',label);b.onclick=action;controls.append(b);return b;}
 let frame=null,robot=null,timer=0,token=0,angle=-0.55,state='artwork';
 function sync(){
  const visible=state==='ready'&&!scene.hasAttribute('data-ending')&&!document.hidden&&!document.querySelector('#overlay').classList.contains('on');
  if(robot?.setActive)robot.setActive(visible);
 }
 function artwork(message){
  token++;clearTimeout(timer);workbench.unbindModel();if(robot?.setActive)robot.setActive(false);
  robot=null;if(frame){frame.remove();frame=null;}state='artwork';portrait.classList.remove('has-model');
  note.textContent=message;toggle.textContent='TRY 3D';left.hidden=right.hidden=repair.hidden=true;
 }
 function activate(){
  if(location.protocol==='file:'){artwork('Artwork preview. Open the local HTTP site for 3D.');return;}
  artwork('Loading Orchard…');state='loading';toggle.textContent='SHOW ARTWORK';const current=token;
  frame=document.createElement('iframe');frame.title='Interactive Orchard robot';frame.className='robot-frame';
  frame.src='robot/index.html';photo.prepend(frame);
  const started=performance.now();
  function check(){
   if(current!==token)return;
   try{
    const api=frame.contentWindow?.__robot;
    if(api?.failed){artwork('3D unavailable. Your artwork preview still works.');return;}
    if(api?.ready){
     if(!workbench.bindModel(api)){artwork('Model connection unavailable. Showing artwork.');return;}
     robot=api;robot.setView(angle);state='ready';portrait.classList.add('has-model');
     note.textContent='DRAG TO SPIN · THREE TAPS TO DETACH';
     toggle.textContent='SHOW ARTWORK';left.hidden=right.hidden=repair.hidden=false;sync();return;
    }
   }catch(e){artwork('3D unavailable. Showing artwork.');return;}
   if(performance.now()-started>30000){artwork('3D took too long. Tap TRY 3D to retry.');return;}
   timer=setTimeout(check,100);
  }
  frame.onerror=()=>artwork('3D unavailable. Showing artwork.');check();
 }
 const toggle=button('TRY 3D','Switch between 3D robot and artwork',()=>state==='artwork'?activate():artwork('Original Orchard artwork.'));
 const left=button('↶','Rotate robot left',()=>{angle-=Math.PI/6;robot?.setView(angle);});
 const right=button('↷','Rotate robot right',()=>{angle+=Math.PI/6;robot?.setView(angle);});
 const repair=button('REPAIR','Repair all robot parts',()=>workbench.repair());
 photo.append(note,controls);
 new MutationObserver(sync).observe(scene,{attributes:true,attributeFilter:['data-ending']});
 new MutationObserver(sync).observe(document.querySelector('#overlay'),{attributes:true,attributeFilter:['class']});
 document.addEventListener('visibilitychange',sync);
 window.OMTRobotViewer=Object.freeze({activate,showArtwork:()=>artwork('Original Orchard artwork.'),getState:()=>state});
 activate();
})();
