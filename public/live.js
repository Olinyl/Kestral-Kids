import { mountReportProblem } from './report-problem-widget.js';
mountReportProblem();

const login=document.querySelector('#staff-dialog');
const message=login.querySelector('[data-testid="staff-message"]');
const workspace=document.querySelector('#live-workspace');
let currentUser=null;
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
  workspace.querySelectorAll('[data-testid="live-missing-child"]').forEach(button=>button.onclick=()=>report(button.dataset.childId,button.dataset.childName,button.dataset.bib));
  workspace.querySelectorAll('[data-testid="live-found"]').forEach(button=>button.onclick=async()=>{try{await api('/api/live/reports/found',{id:button.dataset.id});await refresh();}catch(e){alert(e.message);}});
}
function instructor(data) {
  const group=data.groups[0];
  const kids=data.attendance.map(att=>{const child=data.children.find(c=>c.id===att.childRecordId);return child&&{...child,...att};}).filter(Boolean);
  if(!group) return '<p class="o-empty">No group is assigned to your account. Ask the administrator to assign your group.</p>';
  return `<p class="o-note">${escape(group.label)} · Level ${escape(group.level)} · ${escape(group.meeting||'Meeting place not recorded')} · ${kids.length} / 6 children</p><div class="o-roster-heading"><h3>Today’s group</h3><span>${kids.length} / 6</span></div><div class="o-list">${kids.map((child,index)=>`<article class="o-roster-row" data-testid="live-child"><div class="o-child"><strong>${escape(child.displayName)}</strong><span>${escape(child.clothing||'Clothing not recorded')}</span><span class="bib">${escape(child.bib)}</span></div><button class="o-button o-danger" data-testid="live-missing-child" data-child-id="${escape(child.id)}" data-child-name="${escape(child.displayName)}" data-bib="${escape(child.bib)}">Report missing child</button></article>`).join('')||'<p class="o-empty">No children are assigned to your group today.</p>'}</div><section class="o-medical-list"><h3>Must know · your group only</h3>${kids.filter(c=>c.medical).map(c=>`<div class="o-medical-item"><strong>${escape(c.displayName)}</strong><p>${escape(c.medical)}</p></div>`).join('')||'<p>No medical alerts recorded for your group.</p>'}</section><p class="o-footer">Keep your radio with you. Offline access is not available.</p>`;
}
function reports(data) {
  const rows=data.reports||[];
  return `<p class="o-warning">Saved reports are shared live. Call by physical radio; this app does not transmit radio.</p>${rows.length?rows.map(r=>`<article class="o-incident" data-testid="live-report"><h3>${escape(r.childName)} · Bib ${escape(r.bib)}</h3><p><b>Last seen:</b> ${escape(r.lastSeenTime||'Not recorded')} · ${escape(r.lastSeenPlace)}</p><p><b>Clothing:</b> ${escape(r.clothing||'Not recorded')} · <b>Equipment:</b> ${escape(r.equipment||'Not recorded')}</p><p><b>Injuries / concerns:</b> ${escape(r.injuries||'Unknown')}</p><p>Reported by ${escape(r.reporterName)}</p>${currentUser.role==='patrol'?`<button class="o-button" data-testid="live-found" data-id="${escape(r.id)}">Mark found</button>`:''}</article>`).join(''):'<p class="o-empty">No active missing-child reports.</p>'}`;
}
async function report(childRecordId,name,bib) {
  const lastSeenTime=prompt('Last seen time'); if(lastSeenTime===null)return;
  const lastSeenPlace=prompt('Last seen place'); if(!lastSeenPlace)return;
  const clothing=prompt('Confirmed clothing','')||'';
  const equipment=prompt('Skis, helmet and other equipment','')||'';
  const injuries=prompt('Injuries or concerns (write unknown if unconfirmed)','Unknown')||'Unknown';
  try { const saved=await api('/api/live/reports',{childRecordId,lastSeenTime,lastSeenPlace,clothing,equipment,injuries}); alert(`${saved.childName} · Bib ${saved.bib} saved for Desk and Patrol. Call both by physical radio; no radio message was sent.`); await refresh(); }
  catch(error){alert(error.message);}
}
async function refresh(){try{render({user:currentUser,...await api('/api/live/dashboard')});}catch(error){alert(error.message);}}
document.querySelector('[data-testid="live-sign-in"]').onclick=async()=>{
  if(currentUser){try{await api('/api/live/sign-out',{});}catch{} currentUser=null;location.reload();return;}
  login.showModal();
};
login.querySelector('[data-testid="staff-close"]').onclick=()=>login.close();
login.querySelector('#staff-sign-in').onsubmit=async event=>{
  event.preventDefault();const form=new FormData(event.currentTarget);
  try{let auth=await api('/api/live/sign-in',{email:form.get('email'),password:form.get('password')});if(auth.mfa){const code=prompt('Enter your verification code');if(!code)return;auth=await api('/api/live/mfa',{challengeToken:auth.challengeToken,code});}login.close();render({user:auth.user,...await api('/api/live/dashboard')});}
  catch(error){showError(error);}
};
api('/api/live/me').then(async result=>{if(result.user)render({user:result.user,...await api('/api/live/dashboard')});}).catch(()=>{});
