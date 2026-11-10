import { planAssignments } from './grouping.js';
import {childMeta,profileMeta,lessonDetails} from './profile-ui.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const phoneValid = value => /^[+\d\s().-]+$/.test(value) && value.replace(/\D/g, '').length >= 10 && value.replace(/\D/g, '').length <= 15;
const formatPhone = value => {
  const digits = value.replace(/\D/g, '');
  const national = digits.length === 10 ? digits : digits.length === 11 && digits[0] === '1' ? digits.slice(1) : null;
  return national ? `+1 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}` : '+' + digits;
};
const button = (label, action, id = '', style = '') => `<button type="button" class="d-button ${style}" data-action="${action}" data-id="${escape(id)}" data-testid="${action}${id ? '-' + escape(id) : ''}">${escape(label)}</button>`;
const state = (text, type = '') => `<span class="d-state ${type}">${escape(text)}</span>`;

export function createDirector(root, seed, { onChange, onNavigate }) {
  let view = 'Overview';
  let query = '';
  let filter = 'all';
  let notice = '';
  let serial = 0;
  let page = 0;
  let groupSelection = new Set();
  let groupCandidates = [];
  let candidateIndex = -1;
  const notifications = [];
  seed.parentAlerts ??= [];
  const notificationButton = document.createElement('button');
  notificationButton.type = 'button';
  notificationButton.className = 'd-notifications-button';
  notificationButton.dataset.testid = 'director-notifications';
  document.querySelector('.brand-actions').prepend(notificationButton);
  const notificationPanel = document.createElement('section');
  notificationPanel.className = 'd-notification-panel';
  notificationPanel.dataset.testid = 'director-notification-list';
  notificationPanel.setAttribute('aria-label','Preview notifications');
  notificationPanel.hidden = true;
  document.querySelector('#app-shell').append(notificationPanel);
  function renderNotifications() {
    notificationPanel.style.top=document.querySelector('.top').offsetHeight+'px';
    notificationButton.textContent = `Alerts${notifications.length ? ' ('+notifications.length+')' : ''}`;
    notificationButton.setAttribute('aria-expanded',String(!notificationPanel.hidden));
    notificationPanel.innerHTML = `<div class="d-section-heading"><h2>Preview notifications</h2><button type="button" class="d-close" data-notifications-close aria-label="Close notifications">×</button></div>${notifications.length ? notifications.map(item=>`<p class="d-notification-entry">${escape(item.text)}<small>${escape(item.time)}</small></p>`).join('') : '<p class="d-empty">No new preview activity.</p>'}<button type="button" class="d-button" data-notifications-clear>Clear notifications</button>`;
    notificationPanel.querySelector('[data-notifications-close]').onclick=()=>{notificationPanel.hidden=true;renderNotifications();notificationButton.focus();};
    notificationPanel.querySelector('[data-notifications-clear]').onclick=()=>{notifications.length=0;renderNotifications();};
  }
  function notify(text) {
    notifications.unshift({text,time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})});
    renderNotifications();
  }
  notificationButton.onclick=()=>{notificationPanel.hidden=!notificationPanel.hidden;renderNotifications();};
  renderNotifications();
  const knownAlerts=new Set((seed.patrolAlerts||[]).map(alert=>alert.id));
  window.addEventListener('kestrel:preview-change',()=>{
    for(const alert of seed.patrolAlerts||[]) {
      if(knownAlerts.has(alert.id)) continue;
      knownAlerts.add(alert.id);
      if(alert.active!==false) notify(`Missing-child alert: ${alert.childName||'Child'} · ${alert.lastSeenPlace||'Review alert details'}`);
    }
  });
  let pageTotal = 0;
  const pageSize = 25;
  const pageRows = records => {pageTotal=records.length;page=Math.max(0,Math.min(page,Math.ceil(records.length/pageSize)-1));return records.slice(page*pageSize,(page+1)*pageSize);};
  const pagination = () => `<div class="d-pagination"><span role="status" data-testid="director-page-summary">${pageTotal ? (page*pageSize+1).toLocaleString('en-CA')+' - '+Math.min((page+1)*pageSize,pageTotal).toLocaleString('en-CA') : '0'} of ${pageTotal.toLocaleString('en-CA')}</span><div><button class="d-button" data-action="page-prev" data-testid="director-prev" ${page===0?'disabled':''}>Previous</button> <button class="d-button" data-action="page-next" data-testid="director-next" ${(page+1)*pageSize>=pageTotal?'disabled':''}>Next</button></div></div>`;
  const dialog = document.createElement('dialog');
  dialog.className = 'd-dialog';
  document.body.append(dialog);
  const childGroup = id => seed.groups.find(group => group.id === seed.attendance.find(row => row.childId === id)?.groupId);
  const guardian = child => seed.guardians.find(person => person.id === child.guardianId);
  const members = group => seed.attendance.filter(row => row.groupId === group.id).map(row => seed.children.find(child => child.id === row.childId)).filter(Boolean);
  const teachingCount = instructorId => seed.attendance.filter(row => seed.groups.find(group => group.id === row.groupId)?.instructorId === instructorId).length;
  const pickupStatus = adult => adult.validFrom && adult.validFrom > seed.lessonDate ? 'Not yet active' : adult.validUntil && adult.validUntil < seed.lessonDate ? 'Expired' : 'Authorized';
  const gaps = child => [child.consentStatus !== 'complete' && 'Consent needed', !((child.emergencyName && phoneValid(child.emergencyPhone ?? '')) || (child.emergencyName2 && phoneValid(child.emergencyPhone2 ?? ''))) && 'Emergency contact incomplete', (!child.medicalStatus || !child.medical?.trim()) && 'Medical information missing', !(child.pickupAdults ?? []).some(adult => adult.name && pickupStatus(adult) === 'Authorized') && 'Pickup permission missing', !guardian(child) && 'Guardian missing', !childGroup(child.id) && 'Group not assigned'].filter(Boolean);
  const programFor = child => lessonDetails(seed,child).program || 'Program not recorded';
  const matching = text => text.toLowerCase().includes(query.trim().toLowerCase());
  const field = (name, label, value = '', type = 'text', required = false) => `<label>${label}<input name="${name}" type="${type}" value="${escape(value)}" data-testid="${name}" ${required ? 'required' : ''}></label>`;
  const select = (name, label, selected, options) => `<label>${label}<select name="${name}" data-testid="${name}">${options.map(([id, text]) => `<option value="${escape(id)}" ${id === selected ? 'selected' : ''}>${escape(text)}</option>`).join('')}</select></label>`;
  const textarea = (name, label, value, help = '') => `<label class="d-wide">${label}<textarea name="${name}" rows="3" data-testid="${name}">${escape(value)}</textarea>${help ? `<span class="d-help">${help}</span>` : ''}</label>`;
  const openChild = child => button('View details', 'child-open', child.id);
  const facts = entries => `<dl class="d-card-facts">${entries.map(([label,value])=>`<div><dt>${escape(label)}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
  const profileCard = (testid,title,subtitle,body,actions) => `<article class="d-profile-card" data-testid="${testid}"><header class="d-card-heading"><h3>${escape(title)}</h3>${subtitle ? `<p>${escape(subtitle)}</p>` : ''}</header>${body}<footer class="d-card-actions">${actions}</footer></article>`;

  function overview() {
    const incomplete = seed.children.filter(child => child.consentStatus !== 'complete');
    const checked = seed.attendance.filter(row => row.status === 'checked_in' && !row.release).length;
    const medical = seed.children.filter(child => child.medicalStatus === 'alert' && child.medical?.trim() && seed.attendance.some(row => row.childId === child.id));
    return `<div class="d-page-heading"><div><h2>School overview</h2><p>Start with the children who need your attention.</p></div>${button('View all children', 'view-children', '', 'd-primary')}</div>
      <dl class="d-totals" aria-label="Lesson day summary">
        <div><dt>Children today</dt><dd data-testid="director-today-count">${seed.attendance.length}</dd></div>
        <div><dt>Checked in</dt><dd data-testid="director-checked-count">${checked}<span> / ${seed.attendance.length}</span></dd></div>
        <div><dt>Lesson groups</dt><dd data-testid="director-group-count">${seed.groups.length}</dd></div>
        <div><dt>Missing consent forms</dt><dd class="${incomplete.length ? 'd-amber-text' : ''}">${incomplete.length}</dd></div>
      </dl>
      <div class="d-overview-grid"><section class="d-section" data-testid="director-missing-consent"><div class="d-section-heading"><h3>Missing consent forms <span class="d-count">${incomplete.length}</span></h3><button class="d-button" type="button" data-action="remind-all" data-testid="consent-remind-all" ${incomplete.length?'':'disabled'}>Remind all parents</button></div>
        <div class="d-overview-scroll" tabindex="0" aria-label="Children missing consent forms">${incomplete.length ? incomplete.map(child => `<div class="d-attention-row" data-testid="director-overview-profile"><div><strong>${escape(child.displayName)}</strong>${childMeta(seed,child)}<p>Consent form required</p></div>${openChild(child)}</div>`).join('') : '<p class="d-empty">All consent forms are complete.</p>'}</div>
        <p class="d-section-note">Consent must be completed by a guardian. <button type="button" class="d-text-button" data-action="missing-consent" data-testid="director-incomplete-link">View all missing consent forms</button></p></section>
      <section class="d-section"><div class="d-section-heading"><h3>Health notes</h3>${state(`${medical.length} on today's roster`)}</div><div class="d-overview-scroll" data-testid="director-medical-list" tabindex="0" aria-label="All children with health notes">${medical.map(child => `<div class="d-attention-row" data-testid="director-overview-profile"><div><strong>${escape(child.displayName)}</strong>${childMeta(seed,child)}<p>${escape(child.medical)}</p></div>${openChild(child)}</div>`).join('') || '<p class="d-empty">No health notes on today’s roster.</p>'}</div></section></div>
      <section class="d-section d-spaced"><div class="d-section-heading"><h3>Lesson groups</h3>${button('Manage groups', 'view-groups')}</div>${groupTable(seed.groups.slice(0,5))}</section>
      <div class="d-bottom-note">This is the team preview. Changes stay in this browser until you reload.</div>`;
  }

  function childTable(children) {
    return children.length ? `<div class="d-profile-cards">${children.map(child => {
      const group = childGroup(child.id);
      const attendance = seed.attendance.find(row => row.childId === child.id);
      const missing = gaps(child);
      return profileCard('director-child-row',child.displayName,'Guardian: '+(guardian(child)?.name ?? 'Not linked'),childMeta(seed,child)+facts([
        ['Profile',`${state(missing.length ? 'Needs attention' : 'Ready',missing.length ? 'd-warning' : 'd-success')}<span class="d-subline">${escape(missing.join(' · ') || (child.medicalStatus==='alert' ? 'Health note on file' : 'All required details present'))}</span>`],
        ['Today',state(attendance?.release ? 'Released' : attendance?.status==='checked_in' ? 'Checked in' : 'Expected')]
      ]),openChild(child)+button('Alert parent','parent-alert',child.id));
    }).join('')}</div>` : '<div class="d-empty" data-testid="director-empty"><strong>No children match your search.</strong><p>Try a different name or bib, or change the profile filter.</p></div>';
  }

  function groupTable(groups) {
    return groups.length ? `<div class="d-profile-cards">${groups.map(group => profileCard('director-group-row',group.label,'',profileMeta({group:group.label,program:group.program,level:group.level})+facts([
      ['Instructor',escape(seed.instructors.find(person=>person.id===group.instructorId)?.name ?? 'Unassigned')],
      ['Children',`<strong>${members(group).length} / 6</strong><span class="d-subline">${escape(members(group).map(child=>child.displayName).join(', ') || 'No children assigned')}</span>`],
      ['Meeting place',escape(group.meeting || 'Not set')]
    ]),button('View details','group-open',group.id))).join('')}</div>` : '<p class="d-empty" data-testid="director-empty">No groups match your search.</p>';
  }

  function listContent() {
    if (view === 'Children') return childTable(pageRows(seed.children.filter(child => matching([child.displayName, child.alternateName, child.id, childGroup(child.id)?.label, seed.attendance.find(row => row.childId === child.id)?.bib, guardian(child)?.name].join(' ')) && (filter === 'all' || (filter === 'consent' ? child.consentStatus !== 'complete' : filter === 'incomplete' ? gaps(child).length : !gaps(child).length)))));
    if (view === 'Lesson groups') return groupTable(pageRows(seed.groups.filter(group => matching(group.label + ' ' + seed.instructors.find(person => person.id === group.instructorId)?.name))));
    if (view === 'Guardians') {
      const people = pageRows(seed.guardians.filter(person => matching(person.name + ' ' + person.email + ' ' + seed.children.filter(child => child.guardianId === person.id).map(child => child.displayName).join(' '))));
      return people.length ? `<div class="d-guardian-cards">${people.map(person=>`<article class="g-section d-guardian-card" data-testid="director-guardian-row"><div class="d-section-heading"><div><h3>${escape(person.name)}</h3><p>${escape(person.relationship||'Guardian')}</p></div>${button('View details','guardian-open',person.id)}</div><div class="d-guardian-contact"><span>${escape(person.email)}</span><span>${escape(person.phone)}</span></div>${seed.children.filter(child=>child.guardianId===person.id).map(child=>`<div class="g-child-row"><div class="g-child-name"><div class="g-child-title"><strong>${escape(child.displayName)}</strong></div>${childMeta(seed,child)}<small>${child.consentStatus==='complete'?'Consent on file':'Consent form required'}</small></div>${openChild(child)}</div>`).join('')||'<p class="d-empty">No linked children.</p>'}</article>`).join('')}</div>` : '<p class="d-empty" data-testid="director-empty">No guardians match your search.</p>';
    }
    const instructors = pageRows(seed.instructors.filter(person => matching(person.name + ' ' + person.qualification)));
    return instructors.length ? `<div class="d-profile-cards">${instructors.map(person=>profileCard('director-instructor-row',person.name,person.qualification || 'Qualification not set',facts([
      ['Lesson groups',seed.groups.filter(group=>group.instructorId===person.id).map(group=>profileMeta({group:group.label,program:group.program,level:group.level})).join('') || 'No group assigned'],
      ['Children assigned',`${teachingCount(person.id)} / 6`],
      ['Contact',`${escape(person.phone)}<span class="d-subline">${escape(person.email)}</span>`]
    ]),button('View details','instructor-open',person.id))).join('')}</div>` : '<p class="d-empty" data-testid="director-empty">No instructors match your search.</p>';
  }

  function render(nextView = view) {
    const changedView=view!==nextView;
    if (view !== nextView) { page=0; query = ''; if (nextView !== 'Children') filter = 'all'; }
    view = nextView;
    const subtitles = { Children: 'Review profiles, emergency contacts and lesson assignments.', Guardians: 'Keep parent and guardian contact details up to date.', Instructors: 'Manage your teaching team and the children assigned to them.', 'Lesson groups': 'Keep every child with an assigned instructor. Maximum six per instructor.' };
    root.innerHTML = `<div class="d-feedback" role="status" data-testid="director-feedback" ${notice ? '' : 'hidden'}>${escape(notice)}</div>` + (view === 'Overview' ? overview() : `<div class="d-page-heading"><div><h2>${escape(view)}</h2><p>${subtitles[view]}</p></div>${view==='Lesson groups' ? button('Auto-assign','group-autoassign') : ''}${view === 'Guardians' ? '' : `<button type="button" class="d-button d-primary" data-action="add" data-testid="director-add">${view === 'Children' ? 'Add child' : view === 'Instructors' ? 'Add instructor' : 'Create group'}</button>`}</div>
      <section class="d-section"><div class="d-toolbar"><label class="d-search">Search ${view.toLowerCase()}<input type="search" data-testid="director-search" placeholder="${view === 'Children' ? 'Child name, bib or group' : 'Search by name'}" value="${escape(query)}"></label>${view === 'Children' ? `<label>Profile status<select data-testid="director-filter"><option value="all" ${filter === 'all' ? 'selected' : ''}>All profiles</option><option value="consent" ${filter === 'consent' ? 'selected' : ''}>Missing consent forms</option><option value="incomplete" ${filter === 'incomplete' ? 'selected' : ''}>Needs attention</option><option value="ready" ${filter === 'ready' ? 'selected' : ''}>Ready</option></select></label>` : ''}<span class="d-toolbar-note">Fictional records · changes reset on reload</span></div><div data-testid="director-list">${listContent()}${pagination()}</div></section>`);
    if(changedView) document.querySelector('#app-shell > main').scrollTop=0;
  }

  function showAutoAssign() {
    let mode='unassigned',plan=planAssignments(seed),previewPage=0;
    let ready=plan.filter(item=>item.groupId&&item.groupId!==item.previousGroupId);
    dialog.dataset.testid='autoassign-dialog';
    dialog.setAttribute('aria-labelledby','director-dialog-title');
    dialog.innerHTML=`<div class="d-dialog-heading"><h2 id="director-dialog-title">Review automatic assignment</h2><button type="button" class="d-close" data-action="close" data-testid="autoassign-close" aria-label="Close form">×</button></div><div class="d-dialog-body" data-testid="autoassign-preview"><label class="d-auto-mode">Assignment mode<select data-testid="autoassign-mode"><option value="unassigned">Assign ungrouped children</option><option value="rebalance">Rebalance groups before check-in</option></select></label><p data-testid="autoassign-summary"></p><p data-testid="autoassign-rules"></p><div id="autoassign-rows"></div><div class="d-pagination"><button class="d-button" type="button" id="auto-prev" data-testid="autoassign-prev">Previous</button><span id="auto-count" role="status"></span><button class="d-button" type="button" id="auto-next" data-testid="autoassign-next">Next</button></div></div><footer class="d-dialog-footer"><span>Nothing changes until you apply.</span><button type="button" class="d-button d-primary" data-testid="autoassign-apply" ${ready.length?'':'disabled'}>Apply assignments</button></footer>`;
    function preview() {
      const visible=plan.slice(previewPage*25,(previewPage+1)*25);
      dialog.querySelector('[data-testid="autoassign-summary"]').textContent=`${ready.length} ${ready.length===1?'child':'children'} can be assigned${mode==='rebalance'?' to a different group':''}. ${plan.filter(item=>!item.groupId).length} need manual review.`;
      dialog.querySelector('[data-testid="autoassign-rules"]').textContent=(mode==='unassigned'?'Existing assignments stay in place. ':'Checked-in, released and missing children stay in place. Only children still expected can move. ')+'Match recorded ability levels and known program days. Maximum six children per instructor across all groups.';
      dialog.querySelector('[data-testid="autoassign-apply"]').disabled=!ready.length;
      dialog.querySelector('#autoassign-rows').innerHTML=visible.length ? `<table class="d-table"><thead><tr><th>Child</th><th>Ability</th><th>Proposed group / reason</th></tr></thead><tbody>${visible.map(item=>`<tr><td data-label="Child">${escape(item.name)}<span class="d-subline">${escape(item.previousGroupLabel)}</span></td><td data-label="Ability">${escape(item.level||'Not recorded')}</td><td data-label="Proposed group / reason">${escape(item.groupId&&item.groupId===item.previousGroupId?'Keep '+item.groupLabel:item.groupLabel||item.reason)}</td></tr>`).join('')}</tbody></table>` : `<p>${mode==='unassigned'?'Every child already has a group. Select Rebalance groups to review eligible placements.':'No children are eligible for rebalancing. Checked-in, released and missing children stay in place.'}</p>`;
      dialog.querySelector('#auto-prev').disabled=previewPage===0;
      dialog.querySelector('#auto-next').disabled=(previewPage+1)*25>=plan.length;
      dialog.querySelector('#auto-count').textContent=plan.length?`${previewPage*25+1} - ${Math.min((previewPage+1)*25,plan.length)} of ${plan.length}`:'0 children';
    }
    dialog.querySelector('#auto-prev').onclick=()=>{previewPage--;preview();};
    dialog.querySelector('#auto-next').onclick=()=>{previewPage++;preview();};
    dialog.querySelector('[data-testid="autoassign-mode"]').onchange=event=>{mode=event.target.value;plan=planAssignments(seed,{mode});ready=plan.filter(item=>item.groupId&&item.groupId!==item.previousGroupId);previewPage=0;preview();};
    dialog.querySelector('[data-testid="autoassign-apply"]').onclick=()=>{
      const current=planAssignments(seed,{mode});
      if(JSON.stringify(current)!==JSON.stringify(plan)) {dialog.close();showAutoAssign();return;}
      for(const item of ready) seed.attendance.find(row=>row.childId===item.childId).groupId=item.groupId;
      dialog.close();onChange();notice=`${ready.length} children assigned by recorded ability level. ${plan.filter(item=>!item.groupId).length} need manual review.`;notify(notice);render();
    };
    preview();dialog.showModal();
  }

  function showParentAlert(children, bulk=false) {
    const recipients=[...new Set(children.map(child=>child.guardianId))].map(id=>seed.guardians.find(person=>person.id===id)).filter(Boolean);
    const missing=children.filter(child=>!guardian(child));
    dialog.dataset.testid='parent-alert-dialog';
    dialog.setAttribute('aria-labelledby','director-dialog-title');
    dialog.innerHTML=`<form class="d-parent-alert-form"><div class="d-dialog-heading"><h2 id="director-dialog-title">${bulk?'Remind parents about consent':'Alert parent'}</h2><button type="button" class="d-close" data-action="close" data-testid="dialog-close" aria-label="Close form">×</button></div><div class="d-dialog-body g-form"><p class="g-registration-note">Preview only. No real messages will be sent.</p><h3>${recipients.length} ${recipients.length===1?'recipient':'recipients'}</h3><div class="d-recipient-list">${recipients.map(person=>`<p><strong>${escape(person.name)}</strong><span class="d-subline">${escape(person.email)} · ${escape(children.filter(child=>child.guardianId===person.id).map(child=>child.displayName).join(', '))}</span></p>`).join('')||'<p>No linked guardian is available.</p>'}</div>${missing.length?`<p class="d-form-error">${missing.length} children have no linked guardian and cannot receive this preview reminder.</p>`:''}<label>Alert text<textarea rows="4" data-testid="parent-alert-message" required>${bulk?'Please complete the consent form for your child before their next lesson.':''}</textarea></label></div><footer class="d-dialog-footer"><span>Fictional preview activity</span><button type="submit" class="d-button d-primary" data-testid="parent-alert-submit" ${recipients.length?'':'disabled'}>Create preview ${bulk?'reminders':'alert'}</button></footer></form>`;
    dialog.querySelector('form').onsubmit=event=>{
      event.preventDefault();
      const text=dialog.querySelector('[data-testid="parent-alert-message"]').value.trim();
      if(!text) return;
      for(const person of recipients) seed.parentAlerts.push({id:'preview-alert-'+ ++serial,guardianId:person.id,guardianName:person.name,childIds:children.filter(child=>child.guardianId===person.id).map(child=>child.id),text,createdAt:new Date().toISOString()});
      notice=`${recipients.length} preview ${bulk?'reminders':'alert'} created. No real message was sent.`;
      notify(bulk?`Consent reminders created for ${recipients.length} parents.`:`Parent alert created for ${recipients[0].name}.`);
      dialog.close();render();
    };
    dialog.showModal();
  }

  function refreshGroupMembers() {
    const container=dialog.querySelector('[data-testid="group-members"]');
    if(!container) return;
    const level=dialog.querySelector('[data-testid="group-level"]').value;
    container.innerHTML=groupSelection.size ? [...groupSelection].map(id=>{
      const child=seed.children.find(child=>child.id===id);
      const row=seed.attendance.find(row=>row.childId===id);
      return `<div class="d-member-row"><div><strong>${escape(child.displayName)}</strong><span class="d-subline">Bib ${escape(row?.bib||'not assigned')} · ${escape(child.abilityLevel||'Ability not recorded')}</span>${child.abilityLevel&&child.abilityLevel!==level?'<span class="d-state d-warning">Different recorded ability level — manual placement</span>':''}</div><button type="button" class="d-button" data-group-remove="${escape(id)}" data-testid="group-remove-${escape(id)}">Remove</button></div>`;
    }).join(''):'<p>No children selected for this group.</p>';
    const query=dialog.querySelector('[data-testid="group-child-search"]').value.trim().toLowerCase();
    const candidates=seed.children.filter(child=>!groupSelection.has(child.id) && [child.displayName,child.alternateName,seed.attendance.find(row=>row.childId===child.id)?.bib].some(value=>String(value||'').toLowerCase().includes(query)));
    groupCandidates=candidates.slice(0,25);
    candidateIndex=Math.min(candidateIndex,groupCandidates.length-1);
    const listbox=dialog.querySelector('#group-child-options');
    listbox.innerHTML=groupCandidates.map((child,index)=>`<button type="button" role="option" id="group-option-${index}" aria-selected="${index===candidateIndex}" data-combobox-child="${escape(child.id)}" data-testid="group-child-option-${escape(child.id)}"><strong>${escape(child.displayName)}</strong><span>${escape(child.abilityLevel||'Ability not recorded')} · ${escape(childGroup(child.id)?.label||'Unassigned')} · Bib ${escape(seed.attendance.find(row=>row.childId===child.id)?.bib||'not assigned')}</span></button>`).join('')||'<p class="d-empty">No matching children. Try a different name or bib.</p>';
    const search=dialog.querySelector('[data-testid="group-child-search"]');
    listbox.hidden=document.activeElement!==search;
    search.setAttribute('aria-expanded',String(!listbox.hidden));
    if(candidateIndex>=0) search.setAttribute('aria-activedescendant','group-option-'+candidateIndex);
    else search.removeAttribute('aria-activedescendant');
    dialog.querySelector('[data-testid="group-choice-count"]').textContent=`${Math.min(candidates.length,25)} of ${candidates.length} matches. Select a child to add. Changes wait for Save group.`;
  }

  function addGroupChild(id) {
    if(!groupCandidates.some(child=>child.id===id)) return;
    groupSelection.add(id);candidateIndex=-1;
    const search=dialog.querySelector('[data-testid="group-child-search"]');
    search.value='';refreshGroupMembers();search.focus();
    dialog.querySelector('#group-child-options').hidden=true;
    search.setAttribute('aria-expanded','false');
  }

  function pickupFields(adult, index) {
    return `<div class="d-pickup-row" data-pickup-row><div class="d-form-grid"><label>Name<input data-pickup-name data-testid="pickup-${index}-name" value="${escape(adult.name)}"></label><label>Relationship<input data-pickup-relationship data-testid="pickup-${index}-relationship" value="${escape(adult.relationship)}"></label><label>From (optional)<input type="date" data-pickup-from data-testid="pickup-${index}-from" value="${escape(adult.validFrom)}"></label><label>Until (optional)<input type="date" data-pickup-until data-testid="pickup-${index}-until" value="${escape(adult.validUntil)}"></label></div><div class="d-pickup-status"><span data-testid="pickup-${index}-status">${adult.name ? pickupStatus(adult) : 'Enter an adult to authorize pickup'}</span><button type="button" class="d-text-button" data-action="pickup-remove" data-testid="pickup-${index}-remove">Remove adult</button></div></div>`;
  }

  function showDialog(kind, id) {
    const collection = { child: seed.children, guardian: seed.guardians, instructor: seed.instructors, group: seed.groups }[kind];
    const record = collection.find(item => item.id === id);
    let content;
    let title;
    if (kind === 'child') {
      const child = record ?? { consentStatus: 'incomplete' };
      title = record ? child.displayName : 'Add child';
      content = `<div class="d-dialog-summary"><span>Guardian consent</span><strong data-testid="child-consent">${child.consentStatus === 'complete' ? 'Consent on file' : 'Consent needed — guardian action required'}</strong></div><div class="d-form-grid">${field('child-name', 'Child name', child.displayName, 'text', true)}${field('child-birthdate', 'Date of birth', child.birthDate, 'date')}${field('child-alternate-name', 'Other name on registration or consent', child.alternateName)}${select('child-guardian', 'Linked guardian', child.guardianId, [['', 'Not linked'], ...seed.guardians.map(person => [person.id, person.name])])}${select('child-level', 'Recorded ability level', child.abilityLevel ?? '', [['','Not yet recorded'],...[1,2,3,4,5,6].map(n=>['Level '+n,'Level '+n])])}${select('child-group', 'Lesson group', childGroup(id)?.id ?? '', [['', 'Unassigned'], ...seed.groups.map(group => [group.id, group.label])])}<h3 class="d-wide">Emergency contact 1</h3>${field('child-emergency-name', 'Contact name', child.emergencyName, 'text', true)}${field('child-emergency-phone', 'Phone number', child.emergencyPhone, 'tel', true)}<h3 class="d-wide">Emergency contact 2</h3>${field('child-emergency-name2', 'Second contact name', child.emergencyName2)}${field('child-emergency-phone2', 'Second phone number', child.emergencyPhone2, 'tel')}${select('child-medical-status', 'Medical information status', child.medicalStatus ?? '', [['', 'Not yet recorded'], ['none', 'No conditions or allergies reported'], ['alert', 'Medical or allergy alert recorded']])}${textarea('child-medical', 'Medical conditions, allergies and medications', child.medical, 'Include where medication is kept. Record an explicit no-conditions statement when confirmed; blank means missing information.')}<section class="d-wide d-pickups"><h3>Authorized pickup adults</h3><p class="d-help">Permissions apply to the displayed lesson day. This does not record a release.</p><div data-testid="pickup-fields">${(child.pickupAdults?.length ? child.pickupAdults : [{}]).map((adult,index) => pickupFields(adult,index)).join('')}</div>${button('Add pickup adult', 'pickup-add')}</section></div>`;
    } else if (kind === 'guardian') {
      title = 'Edit guardian';
      content = `<p class="d-linked">Linked children: <strong>${escape(seed.children.filter(child => child.guardianId === id).map(child => child.displayName).join(', ') || 'None')}</strong></p><div class="d-form-grid">${field('guardian-name', 'Guardian name', record.name, 'text', true)}${field('guardian-email', 'Email address', record.email, 'email', true)}${field('guardian-phone', 'Phone number', record.phone, 'tel', true)}</div>`;
    } else if (kind === 'instructor') {
      title = record ? 'Edit instructor' : 'Add instructor';
      const qualifications=['In training',...[1,2,3,4].map(n=>'CSIA Level '+n),...[1,2,3,4].map(n=>'CASI Level '+n)];
      if(record?.qualification&&!qualifications.includes(record.qualification)) qualifications.push(record.qualification);
      content = `<div class="d-form-grid">${field('instructor-name', 'Instructor name', record?.name, 'text', true)}${select('instructor-qualification','Qualification',record?.qualification||'',[['','Select qualification'],...qualifications.map(item=>[item,item])])}${field('instructor-email', 'Email address', record?.email, 'email', true)}${field('instructor-phone', 'Phone number', record?.phone, 'tel', true)}</div>`;
    } else {
      title = record ? 'Edit lesson group' : 'Create lesson group';
      content = `<div class="d-form-grid">${field('group-name', 'Group name', record?.label, 'text', true)}${select('group-level', 'Lesson level', record?.level ?? 'Level 1', [1, 2, 3, 4, 5, 6].map(level => ['Level ' + level, 'Level ' + level]))}${select('group-instructor', 'Instructor', record?.instructorId ?? '', [['', 'Select an instructor'], ...seed.instructors.map(person => [person.id, person.name])])}${field('group-meeting', 'Meeting place', record?.meeting)}</div><p class="d-help">An instructor may have up to six children across all their lesson groups. Assign children from their profiles.</p>${record ? `<div class="d-linked"><strong>Children in this group</strong><p>${escape(members(record).map(child => child.displayName).join(', ') || 'No children assigned yet.')}</p></div>` : ''}`;
    }
    if(kind==='child') {
      content=content.replace('<h3 class="d-wide">Emergency contact 2</h3>',field('child-emergency-relationship','Relationship',record?.emergencyRelationship)+'<h3 class="d-wide">Emergency contact 2 (optional)</h3>');
      content=content.replace('<label>Medical information status',field('child-emergency-relationship2','Relationship',record?.emergencyRelationship2)+'<h3 class="d-wide">Health information</h3><label>Medical information status');
      content=content.replace('<section class="d-wide d-pickups">',textarea('child-medications','Medications and where they are kept',record?.medications||'')+field('child-allergies','Allergies',record?.allergies||'')+'<section class="d-wide d-pickups">');
    }
    if(kind==='group') {
      content=content.replace('</div><p class="d-help">',select('group-program','Program day',record?.program||'',[['','Not recorded'],['Saturday','Saturday'],['Sunday','Sunday']])+'</div><p class="d-help">');
      groupSelection=new Set(record?members(record).map(child=>child.id):[]);
      content=content.replace('Assign children from their profiles.','Add or remove children below. Adding a child from another group moves them when you save.');
      content=content.replace(/<div class="d-linked">[\s\S]*?<\/div>/,'');
      candidateIndex=-1;
      content+=`<section class="d-group-children"><h3>Children in this group</h3><div data-testid="group-members"></div><div class="d-combobox"><label for="group-child-search">Find a child to add</label><input id="group-child-search" type="search" role="combobox" aria-autocomplete="list" aria-controls="group-child-options" aria-expanded="false" autocomplete="off" data-testid="group-child-search" placeholder="Name or bib"><div id="group-child-options" role="listbox" aria-label="Matching children" hidden></div></div><p class="d-help" data-testid="group-choice-count" aria-live="polite"></p><p class="d-help">Adding a child from another group moves them only when you save.</p></section>`;
    }
    dialog.dataset.testid = kind + '-dialog';
    dialog.innerHTML = `<form novalidate><div class="d-dialog-heading"><h2 id="director-dialog-title">${escape(title)}</h2><button type="button" class="d-close" data-action="close" data-testid="dialog-close" aria-label="Close form">×</button></div><div class="d-dialog-body g-form">${content}<p class="d-form-error" role="alert" data-testid="form-error" hidden></p></div><footer class="d-dialog-footer"><span>Demo changes reset on reload.</span><div>${button('Cancel', 'close')}<button class="d-button d-primary" type="submit" data-testid="${kind}-save">${kind === 'child' ? 'Save child' : kind === 'guardian' ? 'Save contact' : kind === 'instructor' ? 'Save instructor' : 'Save group'}</button></div></footer></form>`;
    if(kind==='child') {
      for(const name of ['child-emergency-name','child-emergency-phone']) dialog.querySelector(`[name="${name}"]`).required=false;
      const summary=document.createElement('p');summary.className='g-registration-note';
      summary.textContent=`Program: ${programFor(record||{})} · Group: ${childGroup(id)?.label||'Unassigned'}. Consent is completed by the guardian.`;
      dialog.querySelector('.d-dialog-body').prepend(summary);
    }
    dialog.setAttribute('aria-labelledby', 'director-dialog-title');
    dialog.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      save(kind, record, new FormData(event.currentTarget));
    });
    if(kind==='group') refreshGroupMembers();
    dialog.showModal();
  }

  function save(kind, record, data) {
    const value = name => String(data.get(name) ?? '').trim();
    const error = text => { const target = dialog.querySelector('[data-testid="form-error"]'); target.hidden = false; target.textContent = text; };
    const invalid = [...dialog.querySelectorAll('[required]')].find(input => !input.value.trim());
    if (invalid) { error('Complete the required fields before saving.'); invalid.focus(); return; }
    const phone = value(kind === 'child' ? 'child-emergency-phone' : kind + '-phone');
    if (!['group','child'].includes(kind) && !phoneValid(phone)) { error('Enter a valid phone number with 10–15 digits.'); return; }
    const email = dialog.querySelector('input[type="email"]');
    if (email && !email.validity.valid) { error('Enter a valid email address.'); email.focus(); return; }
    if (kind === 'child') {
      const group = seed.groups.find(item => item.id === value('child-group'));
      const assigned = seed.attendance.filter(row => row.childId !== record?.id && seed.groups.find(item => item.id === row.groupId)?.instructorId === group?.instructorId).length;
      if (group && (!group.instructorId || assigned >= 6)) { error(group.instructorId ? 'An instructor can teach a maximum of six children. Choose another group.' : 'Assign an instructor to this group before adding children.'); return; }
      const birthDate = value('child-birthdate');
      if (birthDate && birthDate >= seed.lessonDate) { error('Date of birth must be before the lesson date.'); return; }
      const phone2 = value('child-emergency-phone2');
      const contact1=value('child-emergency-name'),contact2=value('child-emergency-name2');
      if(!((contact1&&phoneValid(phone))||(contact2&&phoneValid(phone2)))) {error('Complete at least one emergency contact with a name and valid phone number.');return;}
      if((contact1||phone)&&(!contact1||!phoneValid(phone))) {error('Complete the first emergency contact or leave it empty.');return;}
      if((contact2||phone2)&&(!contact2||!phoneValid(phone2))) {error('Complete the second emergency contact or leave it empty.');return;}
      const pickupAdults = [...dialog.querySelectorAll('[data-pickup-row]')].map(row => ({ name: row.querySelector('[data-pickup-name]').value.trim(), relationship: row.querySelector('[data-pickup-relationship]').value.trim(), validFrom: row.querySelector('[data-pickup-from]').value, validUntil: row.querySelector('[data-pickup-until]').value })).filter(adult => adult.name);
      if (pickupAdults.some(adult => adult.validFrom && adult.validUntil && adult.validUntil < adult.validFrom)) { error('A pickup end date must be on or after its start date.'); return; }
      const child = record ?? { id: 'demo-child-new-' + ++serial, consentStatus: 'incomplete' };
      Object.assign(child, { displayName: value('child-name'), abilityLevel: value('child-level'), birthDate, guardianId: value('child-guardian'), emergencyName:contact1, emergencyPhone:phone?formatPhone(phone):'',emergencyRelationship:value('child-emergency-relationship'),emergencyRelationship2:value('child-emergency-relationship2'), emergencyName2:contact2, emergencyPhone2: phone2 ? formatPhone(phone2) : '', alternateName: value('child-alternate-name'), medical: value('child-medical'),medications:value('child-medications'),allergies:value('child-allergies'), medicalStatus: value('child-medical-status'), pickupAdults, pickup: pickupAdults.map(adult => adult.name).join('; ') });
      if (!record) seed.children.push(child);
      let attendance = seed.attendance.find(row => row.childId === child.id);
      if (!attendance) { attendance = { childId: child.id, bib: '', status: 'expected', clothing: null }; seed.attendance.push(attendance); }
      attendance.groupId = group?.id ?? '';
      notice = child.displayName + ' updated in the demo.';
    } else if (kind === 'group') {
      const instructorId = value('group-instructor');
      if (!instructorId) { error('Choose an instructor for this group.'); return; }
      if (seed.groups.some(group => group.id !== record?.id && group.label.toLowerCase() === value('group-name').toLowerCase())) { error('A group already uses that name. Choose a different name.'); return; }
      const otherChildren = seed.attendance.filter(row => !groupSelection.has(row.childId) && row.groupId !== record?.id && seed.groups.find(group => group.id === row.groupId)?.instructorId === instructorId).length;
      if (otherChildren + groupSelection.size > 6) { error('An instructor can teach a maximum of six children across their groups.'); return; }
      const group = record ?? { id: 'demo-group-new-' + ++serial };
      Object.assign(group, { label: value('group-name'), level: value('group-level'),program:value('group-program'), meeting: value('group-meeting'), instructorId });
      if (!record) seed.groups.push(group);
      for(const row of seed.attendance) {
        if(groupSelection.has(row.childId)) row.groupId=group.id;
        else if(row.groupId===group.id) row.groupId='';
      }
      notice = group.label + ' saved in the demo.';
    } else {
      const people = kind === 'guardian' ? seed.guardians : seed.instructors;
      if (people.some(person => person.id !== record?.id && person.email.toLowerCase() === value(kind + '-email').toLowerCase())) { error('That email is already used. Open the existing contact to update it.'); return; }
      const person = record ?? { id: 'demo-instructor-new-' + ++serial };
      Object.assign(person, { name: value(kind + '-name'), email: value(kind + '-email'), phone: formatPhone(phone) });
      if (kind === 'instructor') person.qualification = value('instructor-qualification');
      if (!record) people.push(person);
      notice = person.name + ' saved in the demo.';
    }
    dialog.close();
    onChange();
    notify(notice);
    render();
  }

  root.addEventListener('input', event => {
    if (event.target.dataset.testid === 'director-search') { query = event.target.value; page=0; root.querySelector('[data-testid="director-list"]').innerHTML = listContent()+pagination(); }
  });
  root.addEventListener('change', event => {
    if (event.target.dataset.testid === 'director-filter') { filter = event.target.value; page=0; root.querySelector('[data-testid="director-list"]').innerHTML = listContent()+pagination(); }
  });
  root.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const { action, id } = target.dataset;
    if (action === 'page-prev' || action === 'page-next') {page += action==='page-next' ? 1 : -1;root.querySelector('[data-testid="director-list"]').innerHTML=listContent()+pagination();root.querySelector('[data-action="'+(action==='page-next'?'page-prev':'page-next')+'"]').focus();}
    else if (action === 'parent-alert') showParentAlert(seed.children.filter(child=>child.id===id));
    else if (action === 'remind-all') showParentAlert(seed.children.filter(child=>child.consentStatus!=='complete'),true);
    else if (action === 'missing-consent') {filter='consent';onNavigate('Children');}
    else if (action === 'incomplete') { filter = 'incomplete'; onNavigate('Children'); }
    else if (action === 'view-children') { filter = 'all'; onNavigate('Children'); }
    else if (action === 'view-groups') onNavigate('Lesson groups');
    else if (action === 'group-autoassign') showAutoAssign();
    else if (action === 'add') showDialog({ Children: 'child', Instructors: 'instructor', 'Lesson groups': 'group' }[view]);
    else if (action.endsWith('-open')) showDialog(action.replace('-open', ''), id);
  });
  dialog.addEventListener('click', event => {
    if (event.target.closest('[data-action="close"]')) dialog.close();
    if (event.target.closest('[data-action="pickup-add"]')) {
      const container = dialog.querySelector('[data-testid="pickup-fields"]');
      const index = container.querySelectorAll('[data-pickup-row]').length + ++serial;
      container.insertAdjacentHTML('beforeend', pickupFields({}, index));
      container.lastElementChild.querySelector('input').focus();
    }
    if (event.target.closest('[data-action="pickup-remove"]')) event.target.closest('[data-pickup-row]').remove();
    const remove=event.target.closest('[data-group-remove]');
    if(remove) {groupSelection.delete(remove.dataset.groupRemove);refreshGroupMembers();}
    const choice=event.target.closest('[data-combobox-child]');
    if(choice) addGroupChild(choice.dataset.comboboxChild);
  });
  dialog.addEventListener('input',event=>{if(event.target.dataset.testid==='group-child-search') {candidateIndex=-1;refreshGroupMembers();}});
  dialog.addEventListener('focusin',event=>{if(event.target.dataset.testid==='group-child-search') refreshGroupMembers();});
  dialog.addEventListener('keydown',event=>{
    if(event.target.dataset.testid!=='group-child-search') return;
    if(['ArrowDown','ArrowUp','Enter','Escape'].includes(event.key)) event.preventDefault();
    if(event.key==='ArrowDown'||event.key==='ArrowUp') {
      candidateIndex=event.key==='ArrowDown'?Math.min(candidateIndex+1,groupCandidates.length-1):Math.max(0,candidateIndex-1);
      refreshGroupMembers();
      dialog.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'nearest'});
    } else if(event.key==='Enter') {
      const child=groupCandidates[candidateIndex]||(groupCandidates.length===1?groupCandidates[0]:null);
      if(child) addGroupChild(child.id);
      else {candidateIndex=groupCandidates.length?0:-1;refreshGroupMembers();}
    } else if(event.key==='Escape') {
      dialog.querySelector('#group-child-options').hidden=true;event.target.setAttribute('aria-expanded','false');
    }
  });
  dialog.addEventListener('change',event=>{if(event.target.dataset.testid==='group-level') refreshGroupMembers();});
  return { render };
}
