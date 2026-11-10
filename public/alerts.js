// Fictional-data preview adapter. Live recipient checks and read-state writes must
// run on the server against verified Piezas sessions, not trust this UI context.
export const NOTICE_CATEGORIES=['Early pickup — weather','Meeting point changed','Lesson delayed','Group update'];
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const e=escape;
const active=record=>record.active!==false&&!['found','resolved','closed'].includes(String(record.status||'').toLowerCase());
const hash=value=>[...String(value)].reduce((total,char)=>(total*31+char.codePointAt(0))>>>0,0).toString(36);
const need=(condition,message)=>{if(!condition)throw new Error(message);};

export function createAlertStore(seed) {
 seed.groupNotices??=[];seed.alertReadState??=[];seed.alertArchivedState??=[];seed.alertActivities??=[];
 let serial=seed.groupNotices.length;
 const childrenFor=person=>person.role==='guardian'?seed.children.filter(c=>c.guardianId===person.guardianId):person.role==='instructor'?seed.children.filter(c=>groupsFor(person).some(g=>g.id===seed.attendance.find(a=>a.childId===c.id)?.groupId)):seed.children;
 function groupsFor(person){
  if(['director','desk'].includes(person.role))return [...seed.groups];
  if(person.role==='instructor')return seed.groups.filter(g=>g.instructorId===person.instructorId);
  if(person.role==='guardian'){const ids=new Set(seed.attendance.filter(a=>seed.children.some(c=>c.id===a.childId&&c.guardianId===person.guardianId)).map(a=>a.groupId));return seed.groups.filter(g=>ids.has(g.id));}
  return [];
 }
 const incidentAllowed=(person,record)=>['director','desk','patrol'].includes(person.role)||person.role==='instructor'&&childrenFor(person).some(c=>[c.id,c.stableId].filter(Boolean).includes(record.childId));
 function items(person){
  const results=[],children=childrenFor(person),childIds=new Set(children.map(c=>c.id)),groupIds=new Set(groupsFor(person).map(g=>g.id));
  if(person.role!=='guardian')for(const record of seed.patrolAlerts||[]){
   if(!incidentAllowed(person,record)||person.role==='patrol'&&!active(record))continue;
   const linkedChild=seed.children.find(child=>[child.id,child.stableId].filter(Boolean).includes(record.childId));
   const link=active(record)?{kind:'incident',id:record.id}:linkedChild?{kind:'child',childId:linkedChild.id}:null;
   results.push({id:(active(record)?'incident:':'resolved:')+record.id,type:active(record)?'incident':'resolved',priority:active(record)?'emergency':'routine',title:active(record)?`Missing child · ${record.childName}`:`Child found · ${record.childName}`,body:active(record)?`${record.lastSeenPlace||'Last seen place not recorded'} · ${record.lastSeenTime||'Time not recorded'}`:`${record.childName} was marked found${record.foundBy?' by '+record.foundBy:''}. Patrol access to child details has ended.`,selfReported:record.source==='Instructor',childId:record.childId,incidentId:record.id,at:record.reportedAt||record.createdAt||'',link});
  }
  if(person.role!=='patrol'){
   for(const notice of seed.groupNotices){
    const intersects=notice.groupIds.some(id=>groupIds.has(id));
    if(!['director','desk'].includes(person.role)&&!intersects)continue;
    results.push({...notice,type:'group',priority:notice.category==='Early pickup — weather'?'important':'routine',link:null});
   }
   for(const child of children){
    if(child.consentStatus!=='complete'&&['guardian','director','desk'].includes(person.role))results.push({id:'consent:'+child.id,type:'consent',priority:'important',title:`Consent needed · ${child.displayName}`,body:person.role==='guardian'?'Complete consent before the next lesson.':'Guardian consent must be complete before check-in.',childId:child.id,link:{kind:'consent',childId:child.id},at:''});
    const attendance=seed.attendance.find(a=>a.childId===child.id);
    if(child.medicalStatus==='alert'&&(person.role!=='instructor'||attendance?.status==='checked_in'&&!attendance.release)){
     const version=hash([child.medical,child.medications,child.allergies,child.consentUpdatedAt].join('|'));
     results.push({id:`care:${child.id}:${version}`,type:'care',priority:'important',title:`Care information · ${child.displayName}`,body:[child.medical,child.medications&&'Medication: '+child.medications,child.allergies&&'Allergies: '+child.allergies].filter(Boolean).join(' · '),childId:child.id,link:{kind:'child',childId:child.id},at:''});
    }
   }
   if(person.role==='guardian')for(const notice of seed.parentAlerts||[]){if(notice.guardianId!==person.guardianId)continue;results.push({id:'parent:'+notice.id,type:'message',priority:'routine',title:'Message from the school',body:notice.text,at:notice.createdAt,link:notice.childIds?.find(id=>childIds.has(id))?{kind:'child',childId:notice.childIds.find(id=>childIds.has(id))}:null});}
   results.push(...seed.alertActivities.filter(item=>item.recipientRole===person.role&&(!item.instructorId||item.instructorId===person.instructorId)).map(item=>({...item,type:'activity',priority:'routine',link:null})));
  }
  return results;
 }
 const contexts=[{id:'director',role:'director'},{id:'desk',role:'desk'},{id:'patrol',role:'patrol'},...seed.instructors.map(p=>({id:p.id,role:'instructor',instructorId:p.id})),...seed.guardians.map(p=>({id:p.id,role:'guardian',guardianId:p.id}))];
 // Pre-existing sample records are already known; urgent cases remain pinned
 // regardless of read state. New events increment the person's unread count.
 const baseline=new Set(contexts.flatMap(person=>items(person).map(item=>item.id)));
 const key=person=>[person.role,person.role==='guardian'?person.guardianId:person.role==='instructor'?person.instructorId:person.id].join(':');
 const isRead=(person,item)=>baseline.has(item.id)||person.role==='instructor'&&item.type==='incident'&&item.selfReported||seed.alertReadState.some(row=>row.person===key(person)&&row.id===item.id);
 const list=person=>items(person).filter(item=>!(baseline.has(item.id)&&['care','consent'].includes(item.type))&&(item.type==='incident'||!seed.alertArchivedState.some(row=>row.person===key(person)&&row.id===item.id))).map(item=>({...item,read:isRead(person,item)})).sort((a,b)=>Number(b.type==='incident')-Number(a.type==='incident')||Number(!b.read)-Number(!a.read)||String(b.at||'').localeCompare(String(a.at||'')));
 function open(person,id){const item=list(person).find(item=>item.id===id);need(item,'This alert is no longer available to this account.');return item;}
 function markRead(person,id){open(person,id);if(!seed.alertReadState.some(row=>row.person===key(person)&&row.id===id))seed.alertReadState.push({person:key(person),id,at:new Date().toISOString()});}
 function clear(person){for(const item of list(person)){markRead(person,item.id);if(item.type!=='incident'&&!seed.alertArchivedState.some(row=>row.person===key(person)&&row.id===item.id))seed.alertArchivedState.push({person:key(person),id:item.id});}}
 function send(person,input){
  need(['director','desk','instructor'].includes(person.role),'You do not have permission to send group notices.');need(NOTICE_CATEGORIES.includes(input.category),'Choose a notice type.');
  need(Array.isArray(input.groupIds)&&input.groupIds.length,'Choose at least one group.');
  const groups=groupsFor(person);need(input.groupIds.every(id=>groups.some(group=>group.id===id)),person.role==='instructor'?'Choose only your assigned groups.':'Choose a current lesson group.');
  const message=String(input.message||'').trim();need(message.length>0&&message.length<=600,'Enter notice details of 1–600 characters.');
  const notice={id:'group-notice-'+Date.now()+'-'+ ++serial,category:input.category,title:input.category,body:message,groupIds:[...new Set(input.groupIds)],sender:person.name||({director:'Director',desk:'School desk',instructor:'Instructor'}[person.role]),senderRole:person.role,at:new Date().toISOString()};
  seed.groupNotices.push(notice);return {...notice};
 }
 function resolve(person,caseId){const record=(seed.patrolAlerts||[]).find(item=>item.id===caseId&&active(item));need(record&&incidentAllowed(person,record)&&person.role!=='guardian','This case is no longer available to this account.');record.active=false;record.status='Found';record.foundAt=new Date().toISOString();record.foundBy=person.name||person.role;record.systemLog??=[];record.systemLog.push({time:new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}),action:'Child marked found',actor:person.name||person.role});return record;}
 return {list,groupsFor,send,markRead,open,clear,resolve,
  unread:person=>list(person).filter(item=>!item.read).length,
  caseFor:(person,id)=>{const item=open(person,id);const record=seed.patrolAlerts.find(row=>row.id===item.incidentId);need(record&&incidentAllowed(person,record)&&(person.role!=='patrol'||active(record)),'This case is no longer available to this account.');return record;},
  activity:(text,recipient={role:'director'})=>{seed.alertActivities.unshift({id:'activity-'+Date.now()+'-'+ ++serial,title:text,body:'Preview activity recorded by the school.',recipientRole:recipient.role,instructorId:recipient.instructorId,at:new Date().toISOString()});},
 };
}

function readableTime(value){const date=new Date(value);return value&&Number.isFinite(date.getTime())?date.toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Current lesson day';}
export function alertCards(items,{compact=false}={}){
 if(!items.length)return '<div class="i-notification-empty a-empty"><strong>You’re all caught up</strong><small>No new preview activity. Relevant notices will appear here.</small></div>';
 const prefix=compact?'popup':'shared';
 return items.map(item=>`<article class="a-card ${item.type==='incident'?'a-emergency':''}" data-testid="${prefix}-alert-card" data-alert-type="${e(item.type)}"><div class="a-card-top"><span class="a-label ${item.type==='incident'?'a-label-emergency':item.priority==='important'?'a-label-important':''}">${item.type==='incident'?'Active missing-child incident':item.type==='resolved'?'Resolved incident':item.type==='care'?'Care information':item.type==='consent'?'Action needed':'School notice'}</span><span class="a-read-state">${item.read?'Read':'Unread'}</span></div><h3>${e(item.title)}</h3><p>${e(item.body)}</p><small>${e(readableTime(item.at))}${item.sender?' · '+e(item.sender):''}</small><div class="a-actions">${item.link?`<button type="button" class="d-button" data-alert-open="${e(item.id)}" data-testid="${prefix}-alert-open">${item.type==='incident'?'View incident':item.type==='consent'?'Review consent':'View details'}</button>`:''}${!item.read?`<button type="button" class="d-button" data-alert-read="${e(item.id)}" data-testid="${prefix}-alert-read">Mark read</button>`:''}</div></article>`).join('');
}

export function createSharedAlerts(root,seed,{store,getContext,onOpen,onChange}){
 let filter='all',notice='',lastFocus=null;
 const dialog=document.createElement('dialog');dialog.className='d-dialog a-compose-dialog';dialog.dataset.testid='shared-alert-dialog';dialog.setAttribute('aria-labelledby','shared-alert-title');document.body.append(dialog);
 const current=()=>getContext();
 const close=()=>{if(dialog.open)dialog.close();dialog.replaceChildren();if(lastFocus?.isConnected)lastFocus.focus();};
 function show(title,body){lastFocus=document.activeElement;dialog.innerHTML=`<div class="d-dialog-heading"><h2 id="shared-alert-title">${e(title)}</h2><button type="button" class="d-close" data-alert-close data-testid="shared-alert-close" aria-label="Close form">×</button></div>${body}`;if(!dialog.open)dialog.showModal();}
 function render(){
  const person=current(),items=store.list(person),canSend=['director','desk','instructor'].includes(person.role),emergency=items.filter(item=>item.type==='incident'),routine=items.filter(item=>item.type!=='incident'&&(filter!=='unread'||!item.read));
  root.innerHTML=`<section class="a-inbox" data-testid="shared-alerts"><div class="d-page-heading"><div><h2>Alerts</h2><p>Updates relevant to your children, groups and responsibilities.</p></div>${canSend?'<button type="button" class="d-button d-primary" data-alert-compose data-testid="shared-alert-compose">Send group notice</button>':''}</div>${notice?`<p class="d-feedback" role="status" data-testid="shared-alert-feedback">${e(notice)}</p>`:''}<section class="d-section a-section"><div class="d-section-heading"><h3>Active incidents <span class="a-count">${emergency.length}</span></h3><span class="a-section-note">Reading an alert does not mark a child found.</span></div><div class="a-list">${emergency.length?alertCards(emergency):'<p class="d-empty">No active incident notifications.</p>'}</div></section><section class="d-section a-section"><div class="d-section-heading"><h3>Notifications</h3><label class="a-filter">Show<select data-alert-filter data-testid="shared-alert-filter"><option value="all">All notifications</option><option value="unread" '+(filter==='unread'?'selected':'')+'>Unread only</option></select></label></div><div class="a-list">${alertCards(routine)}</div><footer class="a-footer"><button type="button" class="d-button" data-alert-mark-all data-testid="shared-alert-mark-all">Mark all read</button><button type="button" class="d-button" data-alert-clear data-testid="shared-alert-clear">Clear notifications</button></footer></section></section>`;
  const content=root.firstElementChild,alias=document.createElement('section');alias.dataset.testid=person.role==='director'?'director-alerts':person.role==='instructor'?'instructor-alerts':person.role+'-alerts';
  while(content.firstChild)alias.append(content.firstChild);content.append(alias);
  if(person.role==='director')alias.querySelector('.d-page-heading p').textContent='School updates and safety reports';
  root.querySelector('[data-alert-clear]').textContent='Clear alerts';
 }
 function compose(){
  const person=current(),groups=store.groupsFor(person),instructor=person.role==='instructor';
  need(groups.length,'No lesson groups are available for this account.');
  show('Send group notice',`<form data-alert-notice-form><div class="d-dialog-body g-form"><p class="g-registration-note">In-app notice only. No email, text or device push notification is sent.</p><label>Notice type<select name="category" data-testid="shared-notice-category" required><option value="">Choose a notice type</option>${NOTICE_CATEGORIES.map(type=>`<option>${e(type)}</option>`).join('')}</select></label>${!instructor?'<label>Audience<select name="scope" data-testid="shared-notice-scope"><option value="selected">Selected groups</option><option value="all">All lesson groups</option></select></label>':''}<fieldset class="a-group-options" data-alert-groups><legend>${instructor?'Your assigned groups':'Choose groups'}</legend>${groups.map(group=>`<label><input type="checkbox" name="groups" value="${e(group.id)}" data-testid="shared-notice-group">${e(group.label)}${group.program?' · '+e(String(group.program).replace(/^Kestrel Kids,\s*/,'')):''}</label>`).join('')}</fieldset><p class="a-recipient-note">${instructor?'Only parents of your assigned children, their instructor, Director and Desk receive this notice.':'Parents and instructors in the selected groups, Director and Desk receive this notice. Patrol receives only missing-child incident alerts.'}</p><label>Notice details<textarea name="message" data-testid="shared-notice-message" rows="4" maxlength="600" required placeholder="Explain what the group needs to do."></textarea></label><p class="d-help">Do not include medical or family details in group notices.</p><p class="d-form-error" role="alert" data-testid="shared-alert-error" hidden></p></div><footer class="d-dialog-footer"><span>Preview only · edits reset on reload</span><div><button type="button" class="d-button" data-alert-close>Cancel</button><button type="submit" class="d-button d-primary" data-testid="shared-notice-send">Send notice</button></div></footer></form>`);
  dialog.querySelector('[name="scope"]')?.addEventListener('change',event=>{const all=event.target.value==='all';dialog.querySelector('[data-alert-groups]').disabled=all;dialog.querySelectorAll('[name="groups"]').forEach(input=>input.checked=all);});
 }
 function open(id){const person=current(),item=store.open(person,id);store.markRead(person,id);
  if(item.type!=='incident'){onOpen(item.link,item);return;}
  if(person.role==='patrol'){onOpen({kind:'patrol',incidentId:item.incidentId},item);return;}
  const record=store.caseFor(person,id);
  show('Missing child · '+record.childName,`<div class="d-dialog-body"><p class="a-emergency-note">Active missing-child case · ${e(record.caseNumber)}</p><dl class="d-card-facts">${[['Child',record.childName],['Group',record.group],['Bib',record.bib||'Not recorded'],['Last seen',record.lastSeenTime],['Place',record.lastSeenPlace],['Clothing',record.clothing],['Clothing confidence',record.clothingConfidence||'Verify before use'],['Medical information',record.medical]].map(([label,value])=>`<div><dt>${label}</dt><dd>${e(value||'Not recorded')}</dd></div>`).join('')}</dl><p class="o-warning">Use the existing radio procedure. This preview does not transmit radio or call emergency services.</p></div><footer class="d-dialog-footer"><span>Reading this alert does not close the case.</span><div><button type="button" class="d-button" data-alert-close>Close</button><button type="button" class="d-button d-primary" data-alert-found="${e(item.id)}" data-testid="shared-alert-found">Mark child found</button></div></footer>`);
 }
 function refresh(){onChange();if(!root.hidden&&root.querySelector('[data-testid="shared-alerts"]'))render();}
 document.addEventListener('click',event=>{
  const target=event.target.closest('[data-alert-open],[data-alert-read],[data-alert-compose],[data-alert-clear],[data-alert-mark-all],[data-alert-close],[data-alert-found],[data-alert-confirm-found]');if(!target)return;
  try {
   if(target.hasAttribute('data-alert-close')){close();return;}
   if(target.hasAttribute('data-alert-compose')){compose();return;}
   if(target.dataset.alertOpen){open(target.dataset.alertOpen);refresh();return;}
   if(target.dataset.alertRead){store.markRead(current(),target.dataset.alertRead);refresh();return;}
   if(target.hasAttribute('data-alert-clear')){store.clear(current());refresh();return;}
   if(target.hasAttribute('data-alert-mark-all')){for(const item of store.list(current()))store.markRead(current(),item.id);refresh();return;}
   if(target.dataset.alertFound){const item=store.open(current(),target.dataset.alertFound),record=store.caseFor(current(),item.id);show('Confirm child found',`<div class="d-dialog-body"><p>Confirm that ${e(record.childName)} has been physically located. Closing the case removes Patrol access to the child’s details.</p></div><footer class="d-dialog-footer"><span>${e(record.caseNumber)}</span><div><button type="button" class="d-button" data-alert-close>Cancel</button><button type="button" class="d-button d-primary" data-alert-confirm-found="${e(item.id)}" data-testid="shared-alert-confirm-found">Confirm found</button></div></footer>`);return;}
   if(target.dataset.alertConfirmFound){const item=store.open(current(),target.dataset.alertConfirmFound);store.resolve(current(),item.incidentId);notice='Child marked found. Patrol can no longer open this case.';close();refresh();}
  }catch(problem){notice=problem.message;if(!root.hidden)render();}
 });
 dialog.addEventListener('submit',event=>{if(!event.target.matches('[data-alert-notice-form]'))return;event.preventDefault();const form=event.target,data=new FormData(form);try{const person=current(),ids=data.get('scope')==='all'?store.groupsFor(person).map(g=>g.id):data.getAll('groups');store.send(person,{category:data.get('category'),groupIds:ids,message:data.get('message')});notice='Notice sent to the relevant parents and staff in this preview.';close();refresh();}catch(problem){const output=dialog.querySelector('[data-testid="shared-alert-error"]');output.textContent=problem.message;output.hidden=false;}});
 root.addEventListener('change',event=>{if(event.target.hasAttribute('data-alert-filter')){filter=event.target.value;render();}});
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 return {render,open,close,enter(){for(const item of store.list(current()))store.markRead(current(),item.id);},clear(){close();root.replaceChildren();root.hidden=true;}};
}
