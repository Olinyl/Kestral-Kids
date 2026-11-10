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
async function api(path,body) {
  const response=await fetch(path,{method:body?'POST':'GET',headers:body?{'content-type':'application/json'}:{},body:body?JSON.stringify(body):undefined,credentials:'same-origin'});
  const data=await response.json(); if(!response.ok) throw new Error(data.error||'Request failed.'); return data;
}
function showError(error){message.textContent=error.message||'The request could not be completed.';}
function render(data) {
  liveDashboard=data;
  currentUser=data.user;
  const isInstructor=currentUser.role==='instructor';
  const isDirector=currentUser.role==='director';
  const isDesk=currentUser.role==='desk';
  if(isDirector)liveInstructorTab='Alerts';
  if(isDesk&&!['Radio reports','Alerts'].includes(liveInstructorTab))liveInstructorTab='Radio reports';
  observeLiveFoundReports(data.reports||[]);
  document.body.classList.toggle('live-instructor-view',isInstructor);
  document.body.classList.toggle('live-director-view',isDirector);
  document.body.classList.toggle('live-desk-view',isDesk);
  document.querySelector('.navigation').hidden=!(isInstructor||isDirector||isDesk);
  liveNav.replaceChildren();
  if(isInstructor||isDirector||isDesk){
    const navLabels=isInstructor?['Group roster','Alerts']:isDesk?['Radio reports','Alerts']:['Alerts'];
    for(const label of navLabels){
      const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',label);
      button.innerHTML=`<span class="nav-label-full">${label}</span>`;
      if(label==='Alerts')button.dataset.testid=isDirector?'live-director-nav-alerts':isDesk?'live-desk-nav-alerts':'live-nav-alerts';
      if(label===liveInstructorTab)button.setAttribute('aria-current','page');
      button.addEventListener('click',()=>{liveInstructorTab=label;if(label==='Alerts')liveNotifications.forEach(item=>{item.read=true;});render(liveDashboard);});
      liveNav.append(button);
    }
  }
  if(isInstructor||isDirector||isDesk){
    if(!liveRefreshTimer)liveRefreshTimer=setInterval(()=>refresh(true),20000);
  }else if(liveRefreshTimer){clearInterval(liveRefreshTimer);liveRefreshTimer=null;}
  const instructorGroup=data.groups?.[0];
  if(liveSignIn){liveSignIn.hidden=false;liveSignIn.textContent=`${currentUser.displayName} · Sign out`;}
  document.querySelector('[data-testid="account-menu"]').hidden=true;
  document.querySelector('#demo-banner').querySelector('strong').textContent='Live staff workspace';
  document.querySelector('#starter-panel').hidden=true;
  for(const id of ['director','operations','patrol','guardian']) document.querySelector('#'+id).hidden=true;
  workspace.hidden=false;
  const heading=isDirector||liveInstructorTab==='Alerts'&&(isInstructor||isDesk)?'Alerts':isInstructor?instructorGroup?.label||'No group assigned':currentUser.role==='patrol'?'Active alerts':'Radio reports';
  const onAlerts=isDirector||liveInstructorTab==='Alerts'&&(isInstructor||isDesk);
  const content=isDirector?'<section class="i-alerts-page" data-testid="live-director-alerts" aria-label="Director alerts"></section>':isInstructor?(liveInstructorTab==='Alerts'?'<section class="i-alerts-page" data-testid="live-instructor-alerts" aria-label="Instructor alerts"></section>':instructor(data)):isDesk?(liveInstructorTab==='Alerts'?'<section class="i-alerts-page" data-testid="live-desk-alerts" aria-label="School desk alerts"></section>':reports(data)):reports(data);
  workspace.innerHTML=`<div class="${onAlerts?'i-alerts-heading':'o-heading'}"><div><h2>${escape(heading)}</h2><p>${escape(currentUser.displayName)} · ${onAlerts?`${isInstructor?'Group':'School'} alerts`:isInstructor?`Level ${escape(instructorGroup?.level??'not recorded')} · ${escape(instructorGroup?.meeting||'Meeting place not recorded')}`:'Live shared records'}</p></div><button class="o-button" data-testid="live-refresh">Refresh</button></div>${content}`;
  renderLiveNotifications();
  workspace.querySelector('[data-testid="live-refresh"]').onclick=refresh;
  workspace.querySelector('[data-testid="live-report-open"]')?.addEventListener('click',()=>report(data));
  workspace.querySelectorAll('[data-testid^="live-child-view-"]').forEach(button=>button.addEventListener('click',()=>showLiveChild(data,button.dataset.childId)));
  workspace.querySelectorAll('[data-testid^="live-instructor-found-"]').forEach(button=>button.onclick=async()=>{button.disabled=true;try{await api('/api/live/reports/found',{id:button.dataset.reportId});await refresh();}catch(error){button.disabled=false;alert(error.message);}});
  workspace.querySelectorAll('[data-testid="live-found"]').forEach(button=>button.onclick=async()=>{try{await api('/api/live/reports/found',{id:button.dataset.id});await refresh();}catch(e){alert(e.message);}});
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
