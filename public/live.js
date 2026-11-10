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
window.addEventListener('kestrel:account-view',queueReportProblemPosition);
new MutationObserver(records=>{
  if(records.some(record=>[...record.addedNodes].some(node=>node.id==='piezas-report-problem'))) queueReportProblemPosition();
}).observe(document.body,{childList:true});

const login=document.querySelector('#staff-dialog');
const message=login.querySelector('[data-testid="staff-message"]');
const workspace=document.querySelector('#live-workspace');
let currentUser=null;
const reportDialog=document.querySelector('#live-report-dialog');
let reportClock;
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(path,body) {
  const response=await fetch(path,{method:body?'POST':'GET',headers:body?{'content-type':'application/json'}:{},body:body?JSON.stringify(body):undefined,credentials:'same-origin'});
  const data=await response.json(); if(!response.ok) throw new Error(data.error||'Request failed.'); return data;
}
function showError(error){message.textContent=error.message||'The request could not be completed.';}
function render(data) {
  currentUser=data.user;
  document.querySelector('#live-sign-in').textContent=`${currentUser.displayName} · Sign out`;
  document.querySelector('#view-as').disabled=true;
  document.querySelector('#demo-banner').querySelector('strong').textContent='Live staff workspace';
  document.querySelector('#starter-panel').hidden=true;
  for(const id of ['director','operations','patrol','guardian']) document.querySelector('#'+id).hidden=true;
  workspace.hidden=false;
  workspace.innerHTML=`<div class="o-heading"><div><h2>${escape(currentUser.role==='instructor'?'My group':currentUser.role==='patrol'?'Active alerts':'Radio reports')}</h2><p>${escape(currentUser.displayName)} · Live shared records</p></div><button class="o-button" data-testid="live-refresh">Refresh</button></div>${currentUser.role==='instructor'?instructor(data):reports(data)}`;
  workspace.querySelector('[data-testid="live-refresh"]').onclick=refresh;
  workspace.querySelector('[data-testid="live-report-open"]')?.addEventListener('click',()=>report(data));
  workspace.querySelectorAll('[data-testid="live-found"]').forEach(button=>button.onclick=async()=>{try{await api('/api/live/reports/found',{id:button.dataset.id});await refresh();}catch(e){alert(e.message);}});
}
function instructor(data) {
  const group=data.groups[0];
  const kids=data.attendance.map(att=>{const child=data.children.find(c=>c.id===att.childRecordId);return child&&{...child,...att};}).filter(Boolean);
  const activeReports=new Set((data.reports||[]).map(report=>report.childRecordId));
  if(!group) return '<p class="o-empty">No group is assigned to your account. Ask the administrator to assign your group.</p>';
  return `<p class="o-note">${escape(group.label)} · Level ${escape(group.level)} · ${escape(group.meeting||'Meeting place not recorded')} · ${kids.length} / 6 children</p><section class="o-medical-list" data-testid="live-medical-reminders"><h3>Must know · your group only</h3>${kids.filter(c=>c.medical).map(c=>`<div class="o-medical-item"><strong>${escape(c.displayName)}</strong><p>${escape(c.medical)}</p></div>`).join('')||'<p>No medical alerts recorded for your group.</p>'}</section><div class="o-roster-heading"><h3>Today’s group</h3><span>${kids.length} / 6</span></div><div class="o-list">${kids.map(child=>`<article class="o-roster-row live-child-row" data-testid="live-child"><div class="o-child"><strong>${escape(child.displayName)}</strong><span>${escape(child.clothing||'Clothing not recorded')}</span><span class="bib">Bib ${escape(child.bib)}</span>${activeReports.has(child.id)?'<span class="o-alert-label">Missing child report saved</span>':''}</div></article>`).join('')||'<p class="o-empty">No children are assigned to your group today.</p>'}</div><div class="instructor-report-cta"><button class="o-button o-danger" type="button" data-testid="live-report-open" ${kids.length?'':'disabled'}>Report missing child</button></div>`;
}
function reports(data) {
  const rows=data.reports||[];
  return `<p class="o-warning">Saved reports are shared live. Call by physical radio; this app does not transmit radio.</p>${rows.length?rows.map(r=>`<article class="o-incident" data-testid="live-report"><h3>${escape(r.childName)} · Bib ${escape(r.bib)}</h3><p><b>Report time:</b> ${escape(localTime(r.reportedAt||r.lastSeenTime))} · <b>Last seen place:</b> ${escape(r.lastSeenPlace)}</p><p><b>Clothing:</b> ${escape(r.clothing||'Not recorded')} · <b>Equipment:</b> ${escape(r.equipment||'Not recorded')}</p><p><b>Injuries / concerns:</b> ${escape(r.injuries||'Unknown')}</p><p>Reported by ${escape(r.reporterName)}</p>${currentUser.role==='patrol'?`<button class="o-button" data-testid="live-found" data-id="${escape(r.id)}">Mark found</button>`:''}</article>`).join(''):'<p class="o-empty">No active missing-child reports.</p>'}`;
}
function localTime(value) { const date=new Date(value||''); return Number.isNaN(date.getTime())?value||'Not recorded':date.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}); }
function report(data) {
  const kids=data.attendance.map(att=>{const child=data.children.find(c=>c.id===att.childRecordId);return child&&{...child,...att};}).filter(Boolean);
  const select=reportDialog.querySelector('[data-testid="live-report-child-select"]');
  select.innerHTML=`<option value="">Choose a child</option>${kids.map(child=>`<option value="${escape(child.id)}">${escape(child.displayName)} · Bib ${escape(child.bib)}</option>`).join('')}`;
  const updateLocalTime=()=>reportDialog.querySelector('[data-testid="live-report-time"]').textContent=new Date().toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
  updateLocalTime(); clearInterval(reportClock); reportClock=setInterval(updateLocalTime,10000);
  reportDialog.querySelector('[data-testid="live-report-status"]').textContent='';
  reportDialog.querySelector('#live-report-form').reset();
  select.onchange=()=>{
    const child=kids.find(candidate=>candidate.id===select.value);
    const group=data.groups.find(candidate=>candidate.id===child?.groupRecordId);
    reportDialog.querySelector('[data-testid="live-last-seen-place"]').value=group?.meeting ? `${group.meeting} (not confirmed as last seen)` : 'N/A';
    reportDialog.querySelector('[data-testid="live-clothing"]').value=child?.clothing||'N/A';
    reportDialog.querySelector('[data-testid="live-equipment"]').value=child?.equipment||'N/A';
    reportDialog.querySelector('[data-testid="live-injuries"]').value=child?.medical ? `Medical: ${child.medical}` : 'N/A';
  };
  reportDialog.showModal();
}
async function refresh(){try{render({user:currentUser,...await api('/api/live/dashboard')});}catch(error){alert(error.message);}}
const liveSignIn=document.querySelector('[data-testid="live-sign-in"]');
if(liveSignIn) liveSignIn.onclick=async()=>{
  if(currentUser){try{await api('/api/live/sign-out',{});}catch{} currentUser=null;location.reload();return;}
  login.showModal();
};
login.querySelector('[data-testid="staff-close"]').onclick=()=>login.close();
reportDialog.querySelector('[data-testid="live-report-close"]').onclick=()=>reportDialog.close();
reportDialog.addEventListener('close',()=>{clearInterval(reportClock);reportClock=undefined;});
reportDialog.querySelector('#live-report-form').onsubmit=async event=>{
  event.preventDefault(); const childRecordId=reportDialog.querySelector('[data-testid="live-report-child-select"]').value; if(!childRecordId)return;
  const values=Object.fromEntries(new FormData(event.currentTarget));
  const save=reportDialog.querySelector('[data-testid="live-report-save"]');
  const status=reportDialog.querySelector('[data-testid="live-report-status"]'); save.disabled=true;
  try{const saved=await api('/api/live/reports',{...values,childRecordId});status.textContent=`${saved.childName} · Bib ${saved.bib} is saved for Desk and Patrol. Report time: ${new Date(saved.reportedAt).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}. Call both by physical radio.`;setTimeout(()=>reportDialog.close(),1400);await refresh();}
  catch(error){status.textContent=error.message;}
  finally{save.disabled=false;}
};
login.querySelector('#staff-sign-in').onsubmit=async event=>{
  event.preventDefault();const form=new FormData(event.currentTarget);
  try{let auth=await api('/api/live/sign-in',{email:form.get('email'),password:form.get('password')});if(auth.mfa){const code=prompt('Enter your verification code');if(!code)return;auth=await api('/api/live/mfa',{challengeToken:auth.challengeToken,code});}login.close();render({user:auth.user,...await api('/api/live/dashboard')});}
  catch(error){showError(error);}
};
if(!document.body.hasAttribute('data-account-preview')) api('/api/live/me').then(async result=>{if(result.user)render({user:result.user,...await api('/api/live/dashboard')});}).catch(()=>{});
