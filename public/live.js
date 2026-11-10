import { mountReportProblem } from './report-problem-widget.js';
function reportProblemPosition() {
  const brand=document.querySelector('.top .brand');
  const button=document.querySelector('#piezas-report-problem')?.shadowRoot?.querySelector('.button');
  if(button) Object.assign(button.style,{minHeight:'44px',height:'44px',fontSize:'14px',fontWeight:'600',borderRadius:'8px',border:'1px solid #bdcbc5',background:'#fff',color:'#173f39',boxShadow:'none'});
  const width=button?.offsetWidth||135;
  const brandRect=brand?.getBoundingClientRect();
  const left=brandRect ? brandRect.right-width-8 : window.innerWidth-width-16;
  const navigation=document.querySelector('.navigation');
  const navTop=navigation&&!navigation.hidden?navigation.getBoundingClientRect().top:window.innerHeight;
  const position={left:Math.max(12,Math.min(left,window.innerWidth-width-12)),bottom:Math.max(16,window.innerHeight-navTop+12)};
  try { localStorage.setItem('piezas-report-problem-position',JSON.stringify(position)); } catch {}
  if(button){button.style.left=`${position.left}px`;button.style.bottom=`${position.bottom}px`;}
}
try { localStorage.setItem('piezas-report-problem-position',JSON.stringify({left:Math.max(12,window.innerWidth-150),bottom:16})); } catch {}
mountReportProblem();
let reportProblemFrame;
const queueReportProblemPosition=()=>{
  cancelAnimationFrame(reportProblemFrame);
  reportProblemFrame=requestAnimationFrame(reportProblemPosition);
};
queueReportProblemPosition();
window.addEventListener('resize',queueReportProblemPosition,{passive:true});
window.addEventListener('orientationchange',queueReportProblemPosition,{passive:true});
window.visualViewport?.addEventListener('resize',queueReportProblemPosition,{passive:true});
function styleReportProblemField() {
  const root=document.querySelector('#piezas-report-problem')?.shadowRoot;
  if(!root||root.querySelector('#report-problem-field-theme')) return Boolean(root);
  const style=document.createElement('style');
  style.id='report-problem-field-theme';
  style.textContent='.panel{border:1px solid #1f2937;border-top-width:3px}.panel textarea,.panel .who input{border-color:#1f2937;background:#f9fafb}.panel textarea:focus-visible,.panel .who input:focus-visible{border-color:#111827;box-shadow:0 0 0 3px rgb(31 41 55 / 18%)}';
  root.append(style);
  return true;
}
const reportProblemObserver=new MutationObserver(()=>{
  if(styleReportProblemField()){queueReportProblemPosition();reportProblemObserver.disconnect();}
});
reportProblemObserver.observe(document.documentElement,{childList:true,subtree:true});
styleReportProblemField();
window.addEventListener('kestrel:account-view',queueReportProblemPosition);
new MutationObserver(records=>{
  if(records.some(record=>[...record.addedNodes].some(node=>node.id==='piezas-report-problem'))) queueReportProblemPosition();
}).observe(document.body,{childList:true});

const login=document.querySelector('#staff-dialog');
const message=login.querySelector('[data-testid="staff-message"]');
const workspace=document.querySelector('#live-workspace');
let currentUser=null;
const liveNotifications=[];
const unreadLiveCount=()=>liveNotifications.filter(item=>!item.read).length;
const liveNav=document.querySelector('#workspace-nav');
let liveInstructorTab='Group roster';
let liveDashboard=null;
const liveAlertStartedAt=Date.now();
const observedLiveFoundStatuses=new Map();
let liveRefreshTimer=null;
function updateLiveAlertTab(){
  const button=liveNav.querySelector('[data-testid="live-nav-alerts"],[data-testid="live-director-nav-alerts"],[data-testid="live-desk-nav-alerts"]');
  if(!button)return;
  const unread=unreadLiveCount();
  button.setAttribute('aria-label',`Alerts${unread?`, ${unread} unread`:''}`);
  let badge=button.querySelector('.nav-alert-count');
  if(unread){if(!badge){badge=document.createElement('span');badge.className='nav-alert-count';badge.setAttribute('aria-hidden','true');button.append(badge);}badge.textContent=unread>9?'9+':String(unread);}
  else badge?.remove();
}
function renderLiveNotifications(){
  updateLiveAlertTab();
  const panel=workspace.querySelector('[data-testid="live-instructor-alerts"],[data-testid="live-director-alerts"],[data-testid="live-desk-alerts"]');
  if(!panel)return;
  const audience=currentUser?.role==='instructor'?'group':'school';
  panel.innerHTML=`<header class="i-notification-heading"><div><h2>Alerts</h2><small>${liveNotifications.length?`${liveNotifications.length} update${liveNotifications.length===1?'':'s'} for your ${audience}`:`Updates for your ${audience}`}</small></div><span class="i-alerts-count">${liveNotifications.length}</span></header>${liveNotifications.length?`<div class="i-notification-list" aria-live="polite">${liveNotifications.map(item=>`<article class="i-notification-item"><span class="i-notification-indicator" aria-hidden="true"></span><span class="i-notification-copy">${escape(item.text)}<small>${escape(item.time)}</small></span></article>`).join('')}</div>`:'<div class="i-notification-empty"><strong>You’re all caught up</strong><small>No new activity for your ${audience}.</small></div>'}<footer class="i-notification-footer"><button type="button" class="o-button" data-clear-live-notifications ${liveNotifications.length?'':'disabled'}>Clear alerts</button></footer>`;
  panel.querySelector('[data-clear-live-notifications]').onclick=()=>{liveNotifications.length=0;renderLiveNotifications();};
}
const notifyLive=text=>{liveNotifications.unshift({text,time:new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}),read:liveInstructorTab==='Alerts'});renderLiveNotifications();};
function observeLiveFoundReports(reports=[]){
  for(const report of reports){
    const id=String(report.id),status=String(report.status||'active').toLowerCase(),previous=observedLiveFoundStatuses.get(id);
    const foundAt=Date.parse(report.foundAt||'');
    const reportedAt=Date.parse(report.reportedAt||'');
    if(currentUser?.role==='desk'&&!previous&&status!=='found'&&reportedAt>=liveAlertStartedAt)
      notifyLive(`Missing-child report for ${report.childName||'a child'} · ${report.lastSeenPlace||'Review alert details'}.`);
    if(status==='found'&&foundAt&&((previous&&previous!=='found')||(!previous&&foundAt>=liveAlertStartedAt)))
      notifyLive(`${report.childName||'A child'} was marked found by ${report.foundByName||'staff'}.`);
    observedLiveFoundStatuses.set(id,status);
  }
}
renderLiveNotifications();
const reportDialog=document.querySelector('#live-report-dialog');
const childDialog=document.createElement('dialog');
childDialog.className='o-dialog';
childDialog.dataset.testid='live-child-dialog';
childDialog.setAttribute('aria-labelledby','live-child-dialog-title');
document.body.append(childDialog);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const listValue=value=>{if(Array.isArray(value))return value;try{const parsed=JSON.parse(value||'[]');return Array.isArray(parsed)?parsed:[];}catch{return [];}};
const guardianHealth=child=>[
  child?.medical&&`Medical conditions: ${child.medical}`,
  child?.medications&&`Medications and location: ${child.medications}`,
  child?.allergies&&`Allergies: ${child.allergies}`,
].filter(Boolean).join('\n')||'N/A';
const localTimeInput=()=>{const now=new Date();return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;};
async function api(path,body,method) {
  const response=await fetch(path,{method:method||(body?'POST':'GET'),headers:body?{'content-type':'application/json'}:{},body:body?JSON.stringify(body):undefined,credentials:'same-origin'});
  const data=await response.json(); if(!response.ok) throw new Error(data.error||'Request failed.'); return data;
}
function showError(error){message.textContent=error.message||'The request could not be completed.';}
function render(data) {
  liveDashboard=data;
  currentUser=data.user;
  const isInstructor=currentUser.role==='instructor';
  const isDirector=currentUser.role==='director';
  const isDesk=currentUser.role==='desk';
  const isGuardian=currentUser.role==='guardian';
  if(isDirector)liveInstructorTab='Alerts';
  if(isDesk&&!['Roster','Alerts'].includes(liveInstructorTab))liveInstructorTab='Roster';
  observeLiveFoundReports(data.reports||[]);
  document.body.classList.toggle('live-instructor-view',isInstructor);
  document.body.classList.toggle('live-director-view',isDirector);
  document.body.classList.toggle('live-desk-view',isDesk);
  document.querySelector('.navigation').hidden=!(isInstructor||isDirector||isDesk||isGuardian);
  liveNav.replaceChildren();
  if(isInstructor||isDirector||isDesk||isGuardian){
    const navLabels=isInstructor?['Group roster','Alerts']:isDesk?['Roster','Alerts']:isGuardian?['My children']:['Alerts'];
    for(const label of navLabels){
      const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',label);
      button.innerHTML=`<span class="nav-label-full">${label}</span>`;
      if(label==='Alerts')button.dataset.testid=isDirector?'live-director-nav-alerts':isDesk?'live-desk-nav-alerts':'live-nav-alerts';
      if(label===liveInstructorTab)button.setAttribute('aria-current','page');
      button.addEventListener('click',()=>{liveInstructorTab=label;if(label==='Alerts')liveNotifications.forEach(item=>{item.read=true;});render(liveDashboard);});
      liveNav.append(button);
    }
  }
  if(isInstructor||isDirector||isDesk||isGuardian){
    if(!liveRefreshTimer)liveRefreshTimer=setInterval(()=>refresh(true),20000);
  }else if(liveRefreshTimer){clearInterval(liveRefreshTimer);liveRefreshTimer=null;}
  const instructorGroup=data.groups?.[0];
  if(liveSignIn){liveSignIn.hidden=false;liveSignIn.textContent=`${currentUser.displayName} · Sign out`;}
  document.querySelector('[data-testid="account-menu"]').hidden=true;
  document.querySelector('#demo-banner').querySelector('strong').textContent=isGuardian?'Live guardian workspace':'Live staff workspace';
  document.querySelector('#starter-panel').hidden=true;
  for(const id of ['director','operations','patrol','guardian']) document.querySelector('#'+id).hidden=true;
  workspace.hidden=false;
  const heading=isGuardian?'My children':isDesk&&liveInstructorTab==='Roster'?'School desk':isDirector||liveInstructorTab==='Alerts'&&(isInstructor||isDesk)?'Alerts':isInstructor?instructorGroup?.label||'No group assigned':currentUser.role==='patrol'?'Active alerts':'Radio reports';
  const onAlerts=isDirector||liveInstructorTab==='Alerts'&&(isInstructor||isDesk);
  const content=isGuardian?guardianWorkspace(data):isDirector?'<section class="i-alerts-page" data-testid="live-director-alerts" aria-label="Director alerts"></section>':isInstructor?(liveInstructorTab==='Alerts'?'<section class="i-alerts-page" data-testid="live-instructor-alerts" aria-label="Instructor alerts"></section>':instructor(data)):isDesk?(liveInstructorTab==='Alerts'?'<section class="i-alerts-page" data-testid="live-desk-alerts" aria-label="School desk alerts"></section>':deskWorkspace(data)):reports(data);
  workspace.innerHTML=`<div class="${onAlerts?'i-alerts-heading':'o-heading'}"><div><h2>${escape(heading)}</h2><p>${escape(currentUser.displayName)} · ${onAlerts?`${isInstructor?'Group':'School'} alerts`:isInstructor?`Level ${escape(instructorGroup?.level??'not recorded')} · ${escape(instructorGroup?.meeting||'Meeting place not recorded')}`:'Live shared records'}</p></div><button class="o-button" data-testid="live-refresh">Refresh</button></div>${content}`;
  renderLiveNotifications();
  workspace.querySelector('[data-testid="live-refresh"]').onclick=refresh;
  workspace.querySelector('[data-testid="live-report-open"]')?.addEventListener('click',()=>report(data));
  workspace.querySelectorAll('[data-testid^="live-consent-"]').forEach(button=>button.onclick=()=>guardianConsent(data.children.find(child=>child.id===button.dataset.childId)));
  workspace.querySelectorAll('[data-testid^="live-desk-child-"]').forEach(button=>button.onclick=()=>deskChild(data.children.find(child=>child.id===button.dataset.childId)));
  workspace.querySelector('[data-testid="live-desk-search"]')?.addEventListener('input',event=>{const query=event.target.value.trim().toLowerCase();workspace.querySelectorAll('.live-desk-child').forEach(card=>{card.hidden=!card.textContent.toLowerCase().includes(query);});});
  workspace.querySelectorAll('[data-testid^="live-child-view-"]').forEach(button=>button.addEventListener('click',()=>showLiveChild(data,button.dataset.childId)));
  workspace.querySelectorAll('[data-testid^="live-instructor-found-"]').forEach(button=>button.onclick=async()=>{button.disabled=true;try{await api('/api/live/reports/found',{id:button.dataset.reportId});await refresh();}catch(error){button.disabled=false;alert(error.message);}});
  workspace.querySelectorAll('[data-testid="live-found"]').forEach(button=>button.onclick=async()=>{try{await api('/api/live/reports/found',{id:button.dataset.id});await refresh();}catch(e){alert(e.message);}});
}
function guardianWorkspace(data){
  const rows=data.children||[];
  return `<section class="o-group-card"><div class="o-roster-heading"><h3>Your children</h3><span>${rows.length}</span></div>${rows.length?rows.map(child=>`<article class="o-roster-row"><div class="o-child"><strong>${escape(child.displayName)}</strong><span class="o-status">${child.consent?'Consent on file · updated '+escape(new Date(child.consent.updatedAt).toLocaleDateString()):'Consent form required'}</span><small>${escape(child.birthDate||'Date of birth not recorded')} · ${escape(child.program||'Program not recorded')}</small></div><button class="o-button o-primary" data-testid="live-consent-${escape(child.id)}" data-child-id="${escape(child.id)}">${child.consent?'Review or edit consent':'Fill consent form'}</button></article>`).join(''):'<p class="o-empty">No registrations are linked to your account.</p>'}</section>`;
}
const guardianRelationships=['Spouse','Partner/Significant Other','Parent','Child','Sibling','Grandparent','Aunt/Uncle','Cousin','Legal Guardian','Friend','Neighbour','Co-worker','Other'];
const guardianRelationshipOptions=selected=>`<option value="">Choose relationship</option>${guardianRelationships.map(value=>`<option ${value===selected?'selected':''}>${escape(value)}</option>`).join('')}`;
function guardianConsent(child){
  if(!child)return;
  const saved=child.consent||{};
  const contacts=listValue(saved.emergencyContacts),adults=listValue(saved.authorizedPickupAdults);
  const contactRow=(item,index)=>`<div class="g-contact live-emergency-row"><label>Contact ${index+1} name${index?' (optional)':''}<input data-contact-name value="${escape(item?.name||'')}" ${index?'':'required'}></label><label>Phone number<input type="tel" data-contact-phone value="${escape(item?.phone||'')}" ${index?'':'required'}></label><label>Relationship<select data-contact-relationship ${index?'':'required'}>${guardianRelationshipOptions(item?.relationship)}</select></label></div>`;
  const adultRows=adults.map((item,index)=>`<div class="g-contact live-authorized-row"><label>Name<input data-adult-name value="${escape(item.name||'')}" required></label><label>Relationship<select data-adult-relationship required>${guardianRelationshipOptions(item.relationship)}</select></label><button type="button" class="d-button" data-remove-adult>Remove</button></div>`).join('');
  childDialog.innerHTML=`<form id="live-guardian-consent" class="g-dialog-form g-form"><header class="d-dialog-heading"><div><p>Consent form</p><h2 id="live-child-dialog-title">${escape(child.displayName)}</h2></div><button type="button" class="d-close" data-testid="live-consent-close" aria-label="Close">×</button></header><div class="d-dialog-body"><div class="g-form-content"><div class="g-registration-note">These details come from registration and cannot be changed here.</div><div class="g-locked"><label>Child’s name<input value="${escape(child.displayName)}" readonly></label><label>Date of birth<input value="${escape(child.birthDate||'')}" readonly></label></div><h3>Emergency contacts</h3>${contactRow(contacts[0],0)}${contactRow(contacts[1],1)}<h3>Health information</h3><label>Medical conditions<textarea name="medicalConditions" required>${escape(saved.medicalConditions||'')}</textarea></label><label>Medications and where they are kept<textarea name="medicationsAndLocation" required>${escape(saved.medicationsAndLocation||'')}</textarea></label><label>Allergies<textarea name="allergies" required>${escape(saved.allergies||'')}</textarea></label><h3>Authorized pickup adults</h3><div data-authorized-adults>${adultRows}</div><div class="g-contact"><label>Name<input data-new-adult-name></label><label>Relationship<select data-new-adult-relationship>${guardianRelationshipOptions('')}</select></label><button type="button" class="d-button" data-add-adult>Add</button></div><h3>Consent</h3><aside class="g-use"><strong>How your child’s information is used</strong><p>Contact and health details help the school care for your child and release them only to an adult you authorize.</p></aside><label class="g-check"><input type="checkbox" name="confirmAccuracy" required ${saved.confirmAccuracy?'checked':''}> I confirm the information above is accurate</label><label class="g-check"><input type="checkbox" name="confirmMedicalSharing" required ${saved.confirmMedicalSharing?'checked':''}> I understand medical details are shared with staff and patrol who need them</label><label class="g-check"><input type="checkbox" name="photoConsent" ${saved.photoConsent?'checked':''}> I give permission for photos (optional)</label><label>Guardian signature<input name="signature" required value="${escape(saved.signature||'')}"></label><label>Date<input name="signedDate" type="date" required value="${escape(saved.signedDate||new Date().toISOString().slice(0,10))}"></label><p role="alert" data-testid="live-consent-error"></p></div></div><footer class="d-dialog-footer"><div><button class="d-button d-primary" type="submit" data-testid="live-consent-save">${saved.id?'Save changes':'Submit consent'}</button></div></footer></form>`;
  childDialog.querySelector('[data-testid="live-consent-close"]').onclick=()=>childDialog.close();
  const adultList=childDialog.querySelector('[data-authorized-adults]');
  childDialog.querySelector('[data-add-adult]').onclick=()=>{const name=childDialog.querySelector('[data-new-adult-name]'),relationship=childDialog.querySelector('[data-new-adult-relationship]');if(!name.value.trim()||!relationship.value){name.reportValidity();relationship.reportValidity();return;}const row=document.createElement('div');row.className='g-contact live-authorized-row';row.innerHTML=`<label>Name<input data-adult-name required value="${escape(name.value.trim())}"></label><label>Relationship<select data-adult-relationship required>${guardianRelationshipOptions(relationship.value)}</select></label><button type="button" class="d-button" data-remove-adult>Remove</button>`;adultList.append(row);name.value='';relationship.value='';};
  adultList.onclick=event=>{if(event.target.matches('[data-remove-adult]'))event.target.closest('.live-authorized-row').remove();};
  childDialog.querySelector('#live-guardian-consent').onsubmit=async event=>{event.preventDefault();const form=event.currentTarget,fd=new FormData(form),error=form.querySelector('[data-testid="live-consent-error"]'),save=form.querySelector('[data-testid="live-consent-save"]');const parsedContacts=[...form.querySelectorAll('.live-emergency-row')].map(row=>({name:row.querySelector('[data-contact-name]').value.trim(),phone:row.querySelector('[data-contact-phone]').value.trim(),relationship:row.querySelector('[data-contact-relationship]').value})).filter(contact=>contact.name||contact.phone||contact.relationship);const parsedAdults=[...form.querySelectorAll('.live-authorized-row')].map(row=>({name:row.querySelector('[data-adult-name]').value.trim(),relationship:row.querySelector('[data-adult-relationship]').value}));save.disabled=true;try{await api('/api/live/guardian/consent',{childRecordId:child.id,emergencyContacts:parsedContacts,medicalConditions:fd.get('medicalConditions'),medicationsAndLocation:fd.get('medicationsAndLocation'),allergies:fd.get('allergies'),authorizedPickupAdults:parsedAdults,confirmAccuracy:fd.has('confirmAccuracy'),confirmMedicalSharing:fd.has('confirmMedicalSharing'),photoConsent:fd.has('photoConsent'),signature:fd.get('signature'),signedDate:fd.get('signedDate')},'PUT');childDialog.close();await refresh();}catch(e){error.textContent=e.message;}finally{save.disabled=false;}};
  childDialog.showModal();
}
function deskWorkspace(data){
  const children=data.children||[];
  return `<section class="o-group-card"><div class="o-roster-heading"><h3>Lesson-day roster</h3><span>${children.length} children</span></div><label class="o-search">Find a child<input type="search" data-testid="live-desk-search" placeholder="Name, bib or group"></label><div class="o-list">${children.map(child=>{const att=child.attendance?.[0]||{},active=att.status==='checked_in'&&!att.release;return `<button class="o-roster-row live-desk-child" data-testid="live-desk-child-${escape(child.id)}" data-child-id="${escape(child.id)}"><span><strong>${escape(child.displayName)}</strong><small>${escape(att.group||child.program||'Group not recorded')} · Bib ${escape(att.bib||'unassigned')}</small></span><span class="o-status">${active?'Checked in':att.release?'Released':'Expected'}</span></button>`;}).join('')||'<p class="o-empty">No children are on the lesson-day roster.</p>'}</div></section>`;
}
function deskChild(child){
  if(!child)return;const att=child.attendance?.[0]||{},active=att.status==='checked_in'&&!att.release,consent=child.consent,adults=listValue(consent?.authorizedPickupAdults);
  childDialog.innerHTML=`<section class="g-dialog-form g-form"><header class="d-dialog-heading"><div><p>${escape(att.group||child.program||'Lesson day')}</p><h2 id="live-child-dialog-title">${escape(child.displayName)}</h2></div><button type="button" class="d-close" data-testid="live-desk-close" aria-label="Close">×</button></header><div class="d-dialog-body"><div class="g-form-content"><p>${escape(child.birthDate||'Date of birth not recorded')} · Bib ${escape(att.bib||'unassigned')}</p>${!consent?'<p class="o-warning">Guardian consent is required before check-in.</p>':`<h3>Emergency contacts</h3><p>${escape(consent.emergencyContacts)}</p><h3>Health information</h3><p>Medical conditions: ${escape(consent.medicalConditions)}</p><p>Medications and location: ${escape(consent.medicationsAndLocation)}</p><p>Allergies: ${escape(consent.allergies)}</p>`}<div data-testid="live-desk-action-form">${active?`<form id="live-release-form"><h3>Release child</h3><label>Authorized pickup adult<select name="adultName" required><option value="">Choose authorized adult</option>${adults.map(a=>`<option value="${escape(a.name)}">${escape(a.name)} (${escape(a.relationship)})</option>`).join('')}</select></label><label class="g-check"><input type="checkbox" name="identityVerified" required> I verified this adult’s identity</label><label class="g-check"><input type="checkbox" name="bibReturned"> Bib returned</label><button class="d-button d-primary" type="submit">Release</button></form>`:!att.release?`<form id="live-checkin-form"><h3>Check in</h3><label>Jacket colour<select name="jacket" required>${['Black','Blue','Brown','Green','Grey','Navy','Orange','Peach','Pink','Purple','Red','Teal','White','Yellow'].map(c=>`<option>${c}</option>`).join('')}</select></label><label>Helmet colour<select name="helmet" required>${['Black','Blue','Brown','Green','Grey','Navy','Orange','Peach','Pink','Purple','Red','Teal','White','Yellow'].map(c=>`<option>${c}</option>`).join('')}</select></label><label>Other clothing details (optional)<textarea name="clothingNotes"></textarea></label><label>Equipment<textarea name="equipment"></textarea></label><button class="d-button d-primary" type="submit" ${consent?'':'disabled'}>Check in</button></form>`:'<p>Child has been released.</p>'}</div><p role="alert" data-testid="live-desk-error"></p></div></div><footer class="d-dialog-footer"><div></div></footer></section>`;
  childDialog.querySelector('[data-testid="live-desk-close"]').onclick=()=>childDialog.close();
  childDialog.querySelector('#live-checkin-form')?.addEventListener('submit',async ev=>{ev.preventDefault();const fd=new FormData(ev.currentTarget),err=childDialog.querySelector('[data-testid="live-desk-error"]');try{await api('/api/live/desk/check-in',{childRecordId:child.id,jacket:fd.get('jacket'),helmet:fd.get('helmet'),clothingNotes:fd.get('clothingNotes'),equipment:fd.get('equipment')});childDialog.close();await refresh();}catch(e){err.textContent=e.message;}});
  childDialog.querySelector('#live-release-form')?.addEventListener('submit',async ev=>{ev.preventDefault();const fd=new FormData(ev.currentTarget),err=childDialog.querySelector('[data-testid="live-desk-error"]');try{await api('/api/live/desk/release',{childRecordId:child.id,adultName:fd.get('adultName'),identityVerified:fd.has('identityVerified'),bibReturned:fd.has('bibReturned')});childDialog.close();await refresh();}catch(e){err.textContent=e.message;}});
  childDialog.showModal();
}
function instructor(data) {
  const group=data.groups[0];
  const kids=data.attendance.map(att=>{const child=data.children.find(c=>c.id===att.childRecordId);return child&&{...child,...att};}).filter(Boolean);
  const checkedIn=kids.filter(child=>child.status==='checked_in'&&!child.release);
  const notCheckedIn=kids.filter(child=>child.status!=='checked_in'||child.release);
  const medicalAlerts=checkedIn.filter(child=>child.medical);
  if(!group) return '<p class="o-empty">No group is assigned to your account. Ask the administrator to assign your group.</p>';
  const cards=(children,inactive)=>children.map(child=>{const report=(data.reports||[]).find(item=>item.childRecordId===child.id&&String(item.status||'').toLowerCase()!=='found');return `<article class="o-roster-row live-child-row o-instructor-card${inactive?' is-not-checked-in-card':''}" data-testid="live-child"><div class="o-instructor-child${inactive?' is-not-checked-in':''}"><strong>${escape(child.displayName)}</strong>${report?'<span class="o-missing-tag">Missing</span>':''}<span class="bib">Bib ${escape(child.bib)}</span>${inactive&&child.release?'<span class="o-instructor-status">Released</span>':''}</div><div class="o-instructor-actions">${report?`<span class="o-instructor-alert" role="status">Alert Sent · Searching</span><button class="o-button o-instructor-found" type="button" data-testid="live-instructor-found-${escape(child.id)}" data-report-id="${escape(report.id)}">Found child</button>`:''}<button class="o-button o-instructor-view-child" type="button" data-testid="live-child-view-${escape(child.id)}" data-child-id="${escape(child.id)}" ${inactive?'disabled aria-label="View child unavailable until checked in"':''}>View child</button></div></article>`;}).join('');
  return `<section class="o-medical-list" data-testid="live-medical-reminders"><header class="o-medical-header"><div><span class="o-medical-eyebrow">Safety overview</span><h3>Medical alerts</h3></div><span class="o-medical-count">${medicalAlerts.length?`${medicalAlerts.length} ${medicalAlerts.length===1?'alert':'alerts'}`:'None today'}</span></header>${medicalAlerts.map(child=>`<article class="o-medical-item"><div class="o-medical-item-heading"><span class="o-medical-mark" aria-hidden="true">!</span><strong>${escape(child.displayName)}</strong><span class="o-medical-tag">Medical alert</span></div><p>${escape(child.medical)}</p></article>`).join('')||'<p class="o-medical-clear">No medical alerts for children checked in today.</p>'}</section><section class="o-group-card" aria-label="Today’s Group"><div class="o-roster-heading"><h3>Today’s Group</h3><span>${checkedIn.length} checked in</span></div><div class="o-list">${cards(checkedIn,false)||'<p class="o-empty">No children are checked in yet.</p>'}</div></section><section class="o-group-card o-not-checked-card" aria-label="Not Checked In"><div class="o-roster-heading"><h3>Not Checked In</h3><span>${notCheckedIn.length}</span></div><div class="o-list">${cards(notCheckedIn,true)||'<p class="o-empty">All assigned children are checked in.</p>'}</div></section><div class="instructor-report-cta"><button class="o-button o-danger" type="button" data-testid="live-report-open" ${checkedIn.length?'':'disabled'}>Report missing child</button></div>`;
}
function reports(data) {
  const rows=(data.reports||[]).filter(report=>String(report.status||'active').toLowerCase()!=='found');
  return `<p class="o-warning">Saved reports are shared live. Call by physical radio; this app does not transmit radio.</p>${rows.length?rows.map(r=>{const contacts=listValue(r.emergencyContacts);const adults=listValue(r.authorizedPickupAdults);return `<article class="o-incident" data-testid="live-report"><h3>${escape(r.childName)} · Bib ${escape(r.bib)}</h3><p><b>Reported:</b> ${escape(localTime(r.reportedAt||''))} · <b>Last seen:</b> ${escape(r.lastSeenTime||'N/A')} · <b>Place:</b> ${escape(r.lastSeenPlace||'N/A')}</p><p><b>Clothing:</b> ${escape(r.clothing||'N/A')} · <b>Equipment:</b> ${escape(r.equipment||'N/A')}</p><p><b>Injuries / concerns:</b> ${escape(r.injuries||'N/A')}</p><section class="o-report-guardian"><h4>Latest Guardian information</h4><p><b>Health:</b><br>${escape(r.medical||'N/A').replaceAll('\n','<br>')}</p><p><b>Consent:</b> ${escape(r.consentStatus||'Not recorded')} · <b>Updated:</b> ${escape(r.guardianUpdateDate||'Not recorded')}</p><p><b>Guardian and emergency contacts:</b> ${contacts.length?contacts.map(c=>`${escape(c.name||'Name not recorded')} (${escape(c.relationship||'Relationship not recorded')}) · ${escape(c.phone||'Phone not provided')}${c.email?` · ${escape(c.email)}`:''}`).join('<br>'):'N/A'}</p><p><b>Authorized pickup adults:</b> ${adults.length?adults.map(a=>`${escape(a.name)} (${escape(a.relationship||'Relationship not recorded')})`).join(', '):'N/A'}</p></section><p>Reported by ${escape(r.reporterName)}</p>${currentUser.role==='patrol'?`<button class="o-button" data-testid="live-found" data-id="${escape(r.id)}">Mark found</button>`:''}</article>`;}).join(''):'<p class="o-empty">No active missing-child reports.</p>'}`;
}
function localTime(value) { const date=new Date(value||''); return Number.isNaN(date.getTime())?value||'Not recorded':date.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}); }
const clothingColor=(text,item)=>new RegExp(`([a-z]+)\\s+${item}`,'i').exec(text||'')?.[1]?.toLowerCase()||'';
const colors=['Black','Blue','Brown','Green','Grey','Navy','Orange','Peach','Pink','Purple','Red','Teal','White','Yellow'];
const colorOptions=(testId,label,selected)=>`<label>${label}<select data-testid="${testId}" required><option value="">Choose a colour</option>${colors.map(color=>`<option value="${color.toLowerCase()}" ${selected===color.toLowerCase()?'selected':''}>${color}</option>`).join('')}</select></label>`;
function showLiveChild(data,childId) {
  const attendance=data.attendance.find(row=>row.childRecordId===childId);
  const profile=data.children.find(row=>row.id===childId);
  const group=data.groups.find(row=>row.id===attendance?.groupRecordId);
  if(!attendance||!profile)return;
  const child={...profile,...attendance,group};
  childDialog.innerHTML=`<header><div><p>${escape(group?.label||'Group not assigned')} · Bib ${escape(child.bib)}</p><h2 id="live-child-dialog-title">${escape(child.displayName)}</h2></div><button type="button" class="o-dialog-close" data-testid="live-child-close" aria-label="Close form">×</button></header><div class="o-dialog-body"><p class="${child.medical?'o-alert':'o-note'}"><strong>Medical information</strong><br>${escape(child.medical||'N/A')}</p><dl class="o-facts"><div><dt>Current clothing</dt><dd>${escape(child.clothing||'N/A')}</dd></div><div><dt>Current equipment</dt><dd>${escape(child.equipment||'N/A')}</dd></div><div><dt>Lesson</dt><dd>${escape(group?.level??'Level not recorded')} · ${escape(group?.meeting||'Meeting place not recorded')}</dd></div></dl><form id="live-child-checkin-form" class="o-checkin-form"><h3>Update clothing and equipment</h3>${colorOptions('live-checkin-jacket','Jacket colour',clothingColor(child.clothing,'jacket'))}${colorOptions('live-checkin-helmet','Helmet colour',clothingColor(child.clothing,'helmet'))}<label class="o-clothing-notes">Other clothing details (optional)<textarea data-testid="live-checkin-clothing-notes" rows="2" placeholder="Patterns, logos, or other details">${escape(child.clothing?.split(';').slice(1).join(';').trim()||'')}</textarea></label><label class="o-clothing-notes">Skis, poles, and other equipment (optional)<textarea data-testid="live-checkin-equipment" rows="2" placeholder="Describe equipment the child has today">${escape(child.equipment||'')}</textarea></label><p class="o-note">Confirm the child’s clothing and equipment for today.</p><p class="o-note" role="status" data-testid="live-child-save-status"></p><button class="o-button o-primary" type="submit" data-testid="live-child-save">Save clothing and equipment</button></form></div>`;
  childDialog.querySelector('[data-testid="live-child-close"]').onclick=()=>childDialog.close();
  childDialog.querySelector('#live-child-checkin-form').onsubmit=async event=>{
    event.preventDefault();
    const form=event.currentTarget;
    const save=form.querySelector('[data-testid="live-child-save"]');
    const status=form.querySelector('[data-testid="live-child-save-status"]');
    save.disabled=true;
    const jacket=form.querySelector('[data-testid="live-checkin-jacket"]').value;
    const helmet=form.querySelector('[data-testid="live-checkin-helmet"]').value;
    const notes=form.querySelector('[data-testid="live-checkin-clothing-notes"]').value.trim();
    const clothing=`${jacket} jacket, ${helmet} helmet${notes?`; ${notes}`:''}`;
    const equipment=form.querySelector('[data-testid="live-checkin-equipment"]').value.trim();
    try{await api('/api/live/attendance',{childRecordId,clothing,equipment});childDialog.close();await refresh();}
    catch(error){status.textContent=error.message;save.disabled=false;}
  };
  childDialog.showModal();
}
function report(data) {
  const kids=data.attendance.map(att=>{const child=data.children.find(c=>c.id===att.childRecordId);return child&&{...child,...att};}).filter(child=>child&&child.status==='checked_in'&&!child.release);
  const select=reportDialog.querySelector('[data-testid="live-report-child-select"]');
  select.innerHTML=`<option value="">Choose a child</option>${kids.map(child=>`<option value="${escape(child.id)}">${escape(child.displayName)} · Bib ${escape(child.bib)}</option>`).join('')}`;
  reportDialog.querySelector('[data-testid="live-report-status"]').textContent='';
  reportDialog.querySelector('#live-report-form').reset();
  reportDialog.querySelector('[data-testid="live-last-seen-time"]').value=localTimeInput();
  select.onchange=()=>{
    const child=kids.find(candidate=>candidate.id===select.value);
    reportDialog.querySelector('[data-testid="live-last-seen-place"]').value='';
    reportDialog.querySelector('[data-testid="live-clothing"]').value=child?.clothing||'N/A';
    reportDialog.querySelector('[data-testid="live-equipment"]').value=child?.equipment||'N/A';
    reportDialog.querySelector('[data-testid="live-injuries"]').value='';
  };
  reportDialog.showModal();
}
async function refresh(silent=false){try{render({user:currentUser,...await api('/api/live/dashboard')});}catch(error){if(!silent)alert(error.message);}}
const liveSignIn=document.querySelector('[data-testid="live-sign-in"]');
if(liveSignIn&&!document.body.hasAttribute('data-account-preview'))liveSignIn.hidden=false;
if(liveSignIn) liveSignIn.onclick=async()=>{
  if(currentUser){try{await api('/api/live/sign-out',{});}catch{} currentUser=null;location.reload();return;}
  login.showModal();
};
login.querySelector('[data-testid="staff-close"]').onclick=()=>login.close();
reportDialog.querySelector('[data-testid="live-report-close"]').onclick=()=>reportDialog.close();
reportDialog.querySelector('#live-report-form').onsubmit=async event=>{
  event.preventDefault(); const childRecordId=reportDialog.querySelector('[data-testid="live-report-child-select"]').value; if(!childRecordId)return;
  const values=Object.fromEntries(new FormData(event.currentTarget));
  const save=reportDialog.querySelector('[data-testid="live-report-save"]');
  const status=reportDialog.querySelector('[data-testid="live-report-status"]'); save.disabled=true;
  try{const saved=await api('/api/live/reports',{...values,childRecordId});if(currentUser.role!=='desk')notifyLive(`${saved.updated?'Missing-child report updated':'Missing-child report saved'} for ${saved.childName}. Call Desk and Patrol by radio.`);status.textContent=`${saved.childName} · Bib ${saved.bib}: ${saved.updated?'existing report updated':'report saved'} for Desk and Patrol. Report time: ${new Date(saved.reportedAt).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}. Call both by physical radio.`;setTimeout(()=>reportDialog.close(),1400);await refresh();}
  catch(error){status.textContent=error.message;}
  finally{save.disabled=false;}
};
login.querySelector('#staff-sign-in').onsubmit=async event=>{
  event.preventDefault();const form=new FormData(event.currentTarget);
  try{let auth=await api('/api/live/sign-in',{email:form.get('email'),password:form.get('password')});if(auth.mfa){const code=prompt('Enter your verification code');if(!code)return;auth=await api('/api/live/mfa',{challengeToken:auth.challengeToken,code});}login.close();render({user:auth.user,...await api('/api/live/dashboard')});}
  catch(error){showError(error);}
};
if(!document.body.hasAttribute('data-account-preview')) api('/api/live/me').then(async result=>{if(result.user)render({user:result.user,...await api('/api/live/dashboard')});}).catch(()=>{});
