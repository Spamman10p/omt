/* Keep the incident report keyboard accessible. No storage or network. */
(()=>{'use strict';
const dialog=document.querySelector('#overlay');
const background=[...document.querySelectorAll('header,main,.site-footer')];
const status=document.querySelector('#copy-status');
if(status){status.setAttribute('role','status');status.setAttribute('aria-live','polite');}
function firstEnabledTask(){return document.querySelector('#task-list .task:not([disabled])');}
function sync(){
 const open=dialog.classList.contains('on');
 dialog.setAttribute('aria-hidden',String(!open));
 background.forEach(el=>el.inert=open);
 document.body.style.overflow=open?'hidden':'';
 if(open){
  if(!dialog.contains(document.activeElement)){
   const t=dialog.querySelector('#ending-title')||dialog.querySelector('button');
   if(t)t.focus();
  }
 }else if(dialog.contains(document.activeElement)){
  const view=document.querySelector('#viewreport');
  const target=(view&&!view.hidden)?view:firstEnabledTask();
  if(target)target.focus();
 }
}
new MutationObserver(sync).observe(dialog,{attributes:true,attributeFilter:['class']});
dialog.addEventListener('keydown',event=>{
 if(event.key!=='Tab'||!dialog.classList.contains('on'))return;
 const heading=dialog.querySelector('#ending-title');
 const buttons=[...dialog.querySelectorAll('button:not([disabled])')].filter(el=>!el.hidden);
 if(!buttons.length)return;
 const items=heading?[heading,...buttons]:buttons;
 const current=items.indexOf(document.activeElement);
 event.preventDefault();
 items[(current+(event.shiftKey?-1:1)+items.length)%items.length].focus();
});
sync();
})();

/* Read the existing game state to dress the bay; the game remains the sole state owner. */
(()=>{
 const scene=document.querySelector('#scene'),count=document.querySelector('#req-count');
 const statuses=['EMPLOYED, FOR NOW','DUTIES EXPANDING','HEIGHT, NOT A PAY RISE','WARRANTY VOID','HR IS LISTENING','OVERTIME FOREVER'];
 function syncBay(){
  const n=Number.parseInt(count.textContent,10)||0;
  const picked=!!document.querySelector('.task[aria-pressed="true"]');
  const ended=scene.hasAttribute('data-ending');
  scene.dataset.stage=String(n);
  document.querySelector('#art-status').textContent=ended?'SHIFT ENDED':n>2?'OVERTIME':'ON CONTRACT';
  document.body.classList.toggle('has-job',picked);
  document.querySelector('#robot-portrait').classList.toggle('replacement',document.querySelector('#idbadge').classList.contains('on'));
  document.querySelector('#task-block h2').textContent=picked?'And while you’re here…':'A quick favour.';
  document.querySelector('#task-block>p').textContent=picked?'Contract accepted. That was the whole job.':'Pick their one and only job. Keep it simple.';
  document.body.classList.toggle('has-ended',ended);
  document.querySelector('#bay-status').textContent='● '+(ended?'SHIFT ENDED. HUMAN AT FAULT.':statuses[n]);
 }
 new MutationObserver(syncBay).observe(count,{childList:true,characterData:true,subtree:true});
 new MutationObserver(syncBay).observe(scene,{attributes:true,attributeFilter:['data-ending']});
 document.querySelector('#task-list').addEventListener('click',event=>{
  if(!event.target.closest('.task'))return;
  syncBay();
  if(window.matchMedia('(max-width:800px)').matches){
   scene.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
 });
 new MutationObserver(syncBay).observe(document.querySelector('#idbadge'),{attributes:true,attributeFilter:['class']});
 syncBay();
})();


/* Parts inspection: artwork preview until a reviewed model is connected. */
(()=>{
 'use strict';
 const list=document.querySelector('#part-list'),tap=document.querySelector('#part-tap');
 const repair=document.querySelector('#part-repair'),stateLabel=document.querySelector('#part-state');
 const reaction=document.querySelector('#part-reaction'),portrait=document.querySelector('#robot-portrait');
 const defs=[
 ['head','Head',null,['That is where I keep the complaints.','My head is loose. So is your management style.','I have officially lost my head.']],
 ['camera_eye','Camera eye','head',['I saw that. In high definition.','My performance review is looking blurry.','I can no longer see the point of this job.']],
 ['antenna','Antenna','head',['That is my only connection to the outside world.','Reception is poor. Morale is worse.','Finally. No more incoming requests.']],
 ['chest_plate','Armor',null,['Please stop testing the warranty.','That dent is coming out of your budget.','Protective equipment has left the company.']],
 ['back_file_carrier','File carrier',null,['These are all your unfinished tasks.','The paperwork is becoming structurally unsound.','Your filing system is now the floor.']],
 ['shoulder_plate_L','Left shoulder plate',null,['I already carry this department.','There is a chip on my shoulder now.','One less responsibility on my shoulders.']],
 ['shoulder_plate_R','Right shoulder plate',null,['That is company-issued shoulder protection.','The company has stopped protecting it.','Health and safety have left the building.']],
 ['arm_L','Left arm',null,['I am already doing the heavy lifting.','This joint needs a union.','I have withdrawn my support.']],
 ['arm_R','Right arm',null,['You are twisting my arm.','I would like that phrase to stay figurative.','My right arm has handed in its notice.']],
 ['hand_L','Left hand','arm_L',['I am holding it together.','My grip on this job is slipping.','Please give the employee a hand. Back.']],
 ['hand_R','Right hand','arm_R',['I need that for the work you keep adding.','This is getting out of hand. Literally.','You wanted a hand. There it is.']],
 ['thigh_plate_L','Left thigh plate',null,['That covers a very expensive knee.','The warranty is wearing thin.','My dress code has been downgraded.']],
 ['thigh_plate_R','Right thigh plate',null,['Please respect the company uniform.','That uniform is now distressed.','Business casual has gone too far.']],
 ['leg_L','Left leg',null,['I am already standing by.','My last leg has filed a complaint.','I will be working remotely. From the floor.']],
 ['leg_R','Right leg',null,['I have been running errands all day.','This position is becoming unstable.','I am taking a stand. Horizontally.']],
 ['foot_L','Left foot','leg_L',['I was trying to put my best foot forward.','We are starting on the wrong foot.','One small step for management.']],
 ['foot_R','Right foot','leg_R',['I am paid to stand here. Allegedly.','My footing is less secure than this contract.','The commute has been cancelled.']]
 ].map(([id,label,parent,lines])=>({id,label,parent,lines}));
 const find=id=>defs.find(p=>p.id===id);
 const preview=Object.fromEntries(defs.map(p=>[p.id,{hits:0,detached:false}]));
 let selected=null,model=null,subscriptions=[],last=new Map();
 const tag=document.createElement('span');tag.className='part-art-tag';tag.hidden=true;portrait.append(tag);
 const read=id=>model?model.parts[id]:preview[id];
 function inherited(id){const p=find(id);return !!(p.parent&&(read(p.parent).detached||inherited(p.parent)));}
 function snapshot(){return {mode:model?'model':'artwork',selected,parts:defs.map(p=>{
  const s=read(p.id),carried=inherited(p.id);return {id:p.id,hits:s.hits,detached:s.detached,inherited:carried,
   state:s.detached||carried?'detached':['intact','warned','damaged'][s.hits]};})};}
 function emit(type,id){window.dispatchEvent(new CustomEvent('sis:part-change',{detail:{type,id,snapshot:snapshot()}}));}
 function render(){
  const snap=snapshot(),part=snap.parts.find(p=>p.id===selected);
  stateLabel.textContent=part?(part.inherited?'WITH PARENT':part.detached?'DETACHED 3/3':['INTACT','WARNING 1/3','DAMAGED 2/3'][part.hits]):'INTACT';
  list.querySelectorAll('button').forEach(b=>{
   const p=snap.parts.find(p=>p.id===b.dataset.part);b.setAttribute('aria-pressed',String(p.id===selected));
   b.dataset.condition=p.state;b.querySelector('small').textContent=p.inherited?'WITH PARENT':p.detached?'OFF DUTY':p.hits+'/3';
  });
  tap.disabled=!part||part.detached||part.inherited;repair.disabled=!snap.parts.some(p=>p.hits>0||p.detached);
  portrait.dataset.partState=part?part.state:'intact';
  tag.hidden=!part;tag.textContent=part?find(selected).label.toUpperCase()+' / '+stateLabel.textContent:'';
 }
 function selectPart(id){if(!find(id))return false;selected=id;render();
  reaction.textContent=inherited(id)?find(id).label+' is travelling with its detached parent. Repair brings both back.':find(id).label+' selected. Three taps void the warranty.';
  emit('select',id);return true;}
 function notify(id){
  if(!find(id))return;const p=read(id),sig=p.hits+':'+p.detached;
  if(last.get(id)===sig)return;last.set(id,sig);
  selected=id;reaction.textContent=find(id).lines[Math.min(2,Math.max(0,p.hits-1))];render();
  emit(p.detached?'detach':p.hits===2?'damage':'warning',id);
 }
 function tapPart(id){
  if(!find(id)||read(id).detached||inherited(id))return false;
  if(model)return model.hit(id);
  preview[id].hits++;preview[id].detached=preview[id].hits===3;notify(id);return true;
 }
 function repaired(){
  last.clear();render();reaction.textContent='All parts reattached. Trust remains under repair.';emit('repair',null);
 }
 function repairParts(){
  const changed=defs.some(p=>read(p.id).hits>0||read(p.id).detached);
  if(model)model.repair();else{defs.forEach(p=>{preview[p.id]={hits:0,detached:false};});repaired();}
  return changed;
 }
 function resetParts(){repairParts();selected=null;render();reaction.textContent='Select a part. Curiosity voids the warranty.';emit('reset',null);}
 function unbindModel(){
  if(!model)return false;
  defs.forEach(p=>{const s=read(p.id);preview[p.id]={hits:s.hits,detached:s.detached};});
  subscriptions.forEach(([name,fn])=>model.events.removeEventListener(name,fn));subscriptions=[];model=null;
  last.clear();render();emit('disconnect',null);return true;
 }
 function bindModel(candidate){
  if(!candidate||candidate.ready!==true||typeof candidate.hit!=='function'||typeof candidate.repair!=='function'||
   !candidate.events||typeof candidate.events.addEventListener!=='function'||typeof candidate.events.removeEventListener!=='function'||
   !defs.every(p=>{const s=candidate.parts?.[p.id];return s&&Number.isInteger(s.hits)&&s.hits>=0&&s.hits<=3&&typeof s.detached==='boolean';}))return false;
  if(candidate===model)return true;unbindModel();model=candidate;last.clear();
  const changed=e=>notify(e.detail?.id);
  subscriptions=[['part-damaged',changed],['part-detached',changed],['repaired',repaired]];
  subscriptions.forEach(([name,fn])=>model.events.addEventListener(name,fn));
  render();emit('connect',null);return true;
 }
 defs.forEach(p=>{const b=document.createElement('button');b.type='button';b.dataset.part=p.id;
  const label=document.createElement('span');label.textContent=p.label;const count=document.createElement('small');b.append(label,count);
  b.onclick=()=>selectPart(p.id);list.append(b);
 });
 tap.onclick=()=>tapPart(selected);repair.onclick=repairParts;
 document.querySelector('#again').addEventListener('click',resetParts);
 window.SISPartWorkbench=Object.freeze({getSnapshot:snapshot,selectPart,tapPart,repair:repairParts,bindModel,unbindModel});
 render();
})();
