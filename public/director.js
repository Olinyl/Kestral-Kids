import { planAssignments } from './grouping.js';

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
  const gaps = child => [child.consentStatus !== 'complete' && 'Consent needed', (!child.emergencyName || !phoneValid(child.emergencyPhone ?? '')) && 'First emergency contact incomplete', (!child.emergencyName2 || !phoneValid(child.emergencyPhone2 ?? '')) && 'Second emergency contact incomplete', (!child.medicalStatus || !child.medical?.trim()) && 'Medical information missing', !(child.pickupAdults ?? []).some(adult => adult.name && pickupStatus(adult) === 'Authorized') && 'Pickup permission missing', !guardian(child) && 'Guardian missing', !childGroup(child.id) && 'Group not assigned'].filter(Boolean);
  const matching = text => text.toLowerCase().includes(query.trim().toLowerCase());
  const field = (name, label, value = '', type = 'text', required = false) => `<label>${label}<input name="${name}" type="${type}" value="${escape(value)}" data-testid="${name}" ${required ? 'required' : ''}></label>`;
  const select = (name, label, selected, options) => `<label>${label}<select name="${name}" data-testid="${name}">${options.map(([id, text]) => `<option value="${escape(id)}" ${id === selected ? 'selected' : ''}>${escape(text)}</option>`).join('')}</select></label>`;
  const textarea = (name, label, value, help = '') => `<label class="d-wide">${label}<textarea name="${name}" rows="3" data-testid="${name}">${escape(value)}</textarea>${help ? `<span class="d-help">${help}</span>` : ''}</label>`;
  const openChild = child => button('View profile', 'child-open', child.id);

  function overview() {
    const incomplete = seed.children.filter(child => gaps(child).length);
    const checked = seed.attendance.filter(row => row.status === 'checked_in' && !row.release).length;
    const medical = seed.children.filter(child => child.medicalStatus === 'alert' && child.medical?.trim() && seed.attendance.some(row => row.childId === child.id));
    return `<div class="d-page-heading"><div><h2>School overview</h2><p>Start with the children who need your attention.</p></div>${button('View all children', 'view-children', '', 'd-primary')}</div>
      <dl class="d-totals" aria-label="Lesson day summary">
        <div><dt>Children today</dt><dd data-testid="director-today-count">${seed.attendance.length}</dd></div>
        <div><dt>Checked in</dt><dd data-testid="director-checked-count">${checked}<span> / ${seed.attendance.length}</span></dd></div>
        <div><dt>Lesson groups</dt><dd data-testid="director-group-count">${seed.groups.length}</dd></div>
        <div><dt>Profiles need attention</dt><dd class="${incomplete.length ? 'd-amber-text' : ''}">${incomplete.length}</dd></div>
      </dl>
      <div class="d-overview-grid"><section class="d-section"><div class="d-section-heading"><h3>Needs attention <span class="d-count">${incomplete.length}</span></h3><button class="d-text-button" type="button" data-action="incomplete" data-testid="director-incomplete-link">View incomplete profiles</button></div>
        ${incomplete.length ? incomplete.slice(0,5).map(child => `<div class="d-attention-row"><div><strong>${escape(child.displayName)}</strong><p>${gaps(child).map(escape).join(' · ')}</p></div>${openChild(child)}</div>`).join('') : '<p class="d-empty">All profiles are complete.</p>'}
        <p class="d-section-note">Consent must be completed by a guardian before a profile is ready.</p></section>
      <section class="d-section"><div class="d-section-heading"><h3>Medical alerts</h3>${state(`${medical.length} on today's roster`)}</div>${medical.slice(0,5).map(child => `<div class="d-attention-row"><div><strong>${escape(child.displayName)}</strong><p>${escape(child.medical)}</p></div>${openChild(child)}</div>`).join('') || '<p class="d-empty">No medical alerts on today’s roster.</p>'}</section></div>
      <section class="d-section d-spaced"><div class="d-section-heading"><h3>Lesson groups</h3>${button('Manage groups', 'view-groups')}</div>${groupTable(seed.groups.slice(0,5))}</section>
      <div class="d-bottom-note">This is the team preview. Changes stay in this browser until you reload.</div>`;
  }

  function childTable(children) {
    return children.length ? `<div class="d-table-wrap"><table class="d-table"><thead><tr><th>Child</th><th>Group & bib</th><th>Profile</th><th>Today</th><th><span class="d-sr-only">Actions</span></th></tr></thead><tbody>${children.map(child => {
      const group = childGroup(child.id);
      const attendance = seed.attendance.find(row => row.childId === child.id);
      const missing = gaps(child);
      return `<tr data-testid="director-child-row"><td data-label="Child"><strong>${escape(child.displayName)}</strong><span class="d-subline">${escape(guardian(child)?.name ?? 'No linked guardian')}</span></td><td data-label="Group & bib">${escape(group?.label ?? 'Unassigned')}<span class="d-subline">${attendance?.bib ? 'Bib ' + escape(attendance.bib) : 'No bib assigned'}</span></td><td data-label="Profile">${state(missing.length ? 'Needs attention' : 'Ready', missing.length ? 'd-warning' : 'd-success')}<span class="d-subline">${escape(missing.join(' · ') || (child.medicalStatus === 'alert' ? 'Medical alert on file' : 'All required details present'))}</span></td><td data-label="Today">${state(attendance?.release ? 'Released' : attendance?.status === 'checked_in' ? 'Checked in' : 'Expected')}</td><td class="d-row-action">${openChild(child)}</td></tr>`;
    }).join('')}</tbody></table></div>` : '<div class="d-empty" data-testid="director-empty"><strong>No children match your search.</strong><p>Try a different name or bib, or change the profile filter.</p></div>';
  }

  function groupTable(groups) {
    return groups.length ? `<div class="d-table-wrap"><table class="d-table"><thead><tr><th>Group</th><th>Instructor</th><th>Children</th><th>Meeting place</th><th><span class="d-sr-only">Actions</span></th></tr></thead><tbody>${groups.map(group => `<tr data-testid="director-group-row"><td data-label="Group"><strong>${escape(group.label)}</strong><span class="d-subline">${escape(group.level ?? 'Not set')}</span></td><td data-label="Instructor">${escape(seed.instructors.find(person => person.id === group.instructorId)?.name ?? 'Unassigned')}</td><td data-label="Children"><strong>${members(group).length} / 6</strong><span class="d-subline">${view==='Lesson groups' ? members(group).map(child=>button('Edit '+child.displayName,'child-open',child.id,'d-child-link')).join(' ') || 'No children assigned' : escape(members(group).map(child=>child.displayName).join(', ') || 'No children assigned')}</span></td><td data-label="Meeting place">${escape(group.meeting || 'Not set')}</td><td class="d-row-action">${button('Edit group', 'group-open', group.id)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="d-empty" data-testid="director-empty">No groups match your search.</p>';
  }

  function listContent() {
    if (view === 'Children') return childTable(pageRows(seed.children.filter(child => matching([child.displayName, child.alternateName, child.id, childGroup(child.id)?.label, seed.attendance.find(row => row.childId === child.id)?.bib, guardian(child)?.name].join(' ')) && (filter === 'all' || (filter === 'incomplete' ? gaps(child).length : !gaps(child).length)))));
    if (view === 'Lesson groups') return groupTable(pageRows(seed.groups.filter(group => matching(group.label + ' ' + seed.instructors.find(person => person.id === group.instructorId)?.name))));
    if (view === 'Guardians') {
      const people = pageRows(seed.guardians.filter(person => matching(person.name + ' ' + person.email + ' ' + seed.children.filter(child => child.guardianId === person.id).map(child => child.displayName).join(' '))));
      return people.length ? `<div class="d-table-wrap"><table class="d-table"><thead><tr><th>Guardian</th><th>Contact</th><th>Children and registration</th><th><span class="d-sr-only">Actions</span></th></tr></thead><tbody>${people.map(person => `<tr data-testid="director-guardian-row"><td data-label="Guardian"><strong>${escape(person.name)}</strong>${person.relationship?`<span class="d-subline">${escape(person.relationship)}</span>`:''}</td><td data-label="Contact">${escape(person.phone)}<span class="d-subline">${escape(person.email)}</span></td><td data-label="Children and registration">${seed.children.filter(child => child.guardianId === person.id).map(child=>{const registration=child.storeRegistration;const group=childGroup(child.id);return `<div class="d-guardian-child"><strong>${escape(child.displayName)}</strong><span class="d-subline">Born ${escape(child.birthDate||'Not set')}${registration?` · ${escape(registration.program)} · Level ${escape(registration.level)}`:''}${group?` · ${escape(group.label)}`:''}</span><span class="d-subline">${child.consentStatus==='complete'?`Consent on file${child.consentUpdatedAt?` · last updated ${escape(child.consentUpdatedAt)}`:''}`:'Consent form required'}</span>${registration?.childNotes?`<span class="d-subline">Store note: ${escape(registration.childNotes)}</span>`:''}</div>`}).join('') || 'No linked children'}</td><td class="d-row-action">${button('Edit contact', 'guardian-open', person.id)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="d-empty" data-testid="director-empty">No guardians match your search.</p>';
    }
    const instructors = pageRows(seed.instructors.filter(person => matching(person.name + ' ' + person.qualification)));
    return instructors.length ? `<div class="d-table-wrap"><table class="d-table"><thead><tr><th>Instructor</th><th>Lesson groups</th><th>Children assigned</th><th>Contact</th><th><span class="d-sr-only">Actions</span></th></tr></thead><tbody>${instructors.map(person => `<tr data-testid="director-instructor-row"><td data-label="Instructor"><strong>${escape(person.name)}</strong><span class="d-subline">${escape(person.qualification || 'Qualification not set')}</span></td><td data-label="Lesson groups">${escape(seed.groups.filter(group => group.instructorId === person.id).map(group => group.label).join(', ') || 'No group assigned')}</td><td data-label="Children assigned">${teachingCount(person.id)} / 6</td><td data-label="Contact">${escape(person.phone)}<span class="d-subline">${escape(person.email)}</span></td><td class="d-row-action">${button('Edit instructor', 'instructor-open', person.id)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="d-empty" data-testid="director-empty">No instructors match your search.</p>';
  }

  function render(nextView = view) {
    if (view !== nextView) { page=0; query = ''; if (nextView !== 'Children') filter = 'all'; }
    view = nextView;
    const subtitles = { Children: 'Review profiles, emergency contacts and lesson assignments.', Guardians: 'Keep parent and guardian contact details up to date.', Instructors: 'Manage your teaching team and the children assigned to them.', 'Lesson groups': 'Keep every child with an assigned instructor. Maximum six per instructor.' };
    root.innerHTML = `<div class="d-feedback" role="status" data-testid="director-feedback" ${notice ? '' : 'hidden'}>${escape(notice)}</div>` + (view === 'Overview' ? overview() : `<div class="d-page-heading"><div><h2>${escape(view)}</h2><p>${subtitles[view]}</p></div>${view==='Lesson groups' ? button('Auto-assign','group-autoassign') : ''}${view === 'Guardians' ? '' : `<button type="button" class="d-button d-primary" data-action="add" data-testid="director-add">${view === 'Children' ? 'Add child' : view === 'Instructors' ? 'Add instructor' : 'Create group'}</button>`}</div>
      <section class="d-section"><div class="d-toolbar"><label class="d-search">Search ${view.toLowerCase()}<input type="search" data-testid="director-search" placeholder="${view === 'Children' ? 'Child name, bib or group' : 'Search by name'}" value="${escape(query)}"></label>${view === 'Children' ? `<label>Profile status<select data-testid="director-filter"><option value="all" ${filter === 'all' ? 'selected' : ''}>All profiles</option><option value="incomplete" ${filter === 'incomplete' ? 'selected' : ''}>Needs attention</option><option value="ready" ${filter === 'ready' ? 'selected' : ''}>Ready</option></select></label>` : ''}<span class="d-toolbar-note">Fictional records · changes reset on reload</span></div><div data-testid="director-list">${listContent()}${pagination()}</div></section>`);
  }

  function showAutoAssign() {
    let plan=planAssignments(seed), previewPage=0;
    const ready=plan.filter(item=>item.groupId);
    dialog.dataset.testid='autoassign-dialog';
    dialog.setAttribute('aria-labelledby','director-dialog-title');
    dialog.innerHTML=`<div class="d-dialog-heading"><h2 id="director-dialog-title">Review automatic assignment</h2>${button('Close','close')}</div><div class="d-dialog-body" data-testid="autoassign-preview"><p><strong>${ready.length} ${ready.length===1?'child':'children'} can be assigned.</strong> ${plan.length-ready.length} remain unassigned.</p><p>Match recorded ability levels only. Existing assignments stay in place. Maximum six children per instructor across all groups.</p><div id="autoassign-rows"></div><div class="d-pagination"><button class="d-button" type="button" id="auto-prev" data-testid="autoassign-prev">Previous</button><span id="auto-count" role="status"></span><button class="d-button" type="button" id="auto-next" data-testid="autoassign-next">Next</button></div></div><footer class="d-dialog-footer"><span>Nothing changes until you apply.</span><button class="d-button d-primary" data-testid="autoassign-apply" ${ready.length?'':'disabled'}>Apply assignments</button></footer>`;
    function preview() {
      const visible=plan.slice(previewPage*25,(previewPage+1)*25);
      dialog.querySelector('#autoassign-rows').innerHTML=visible.length ? `<table class="d-table"><thead><tr><th>Child</th><th>Ability</th><th>Proposed group / reason</th></tr></thead><tbody>${visible.map(item=>`<tr><td data-label="Child">${escape(item.name)}</td><td data-label="Ability">${escape(item.level||'Not recorded')}</td><td data-label="Proposed group / reason">${escape(item.groupLabel||item.reason)}</td></tr>`).join('')}</tbody></table>` : '<p>Every child already has a group. No assignments to propose.</p>';
      dialog.querySelector('#auto-prev').disabled=previewPage===0;
      dialog.querySelector('#auto-next').disabled=(previewPage+1)*25>=plan.length;
      dialog.querySelector('#auto-count').textContent=plan.length?`${previewPage*25+1} - ${Math.min((previewPage+1)*25,plan.length)} of ${plan.length}`:'0 children';
    }
    dialog.querySelector('#auto-prev').onclick=()=>{previewPage--;preview();};
    dialog.querySelector('#auto-next').onclick=()=>{previewPage++;preview();};
    dialog.querySelector('[data-testid="autoassign-apply"]').onclick=()=>{
      const current=planAssignments(seed);
      if(JSON.stringify(current)!==JSON.stringify(plan)) {dialog.close();showAutoAssign();return;}
      for(const item of ready) seed.attendance.find(row=>row.childId===item.childId).groupId=item.groupId;
      dialog.close();onChange();notice=`${ready.length} children assigned by recorded ability level. ${plan.length-ready.length} remain unassigned.`;render();
    };
    preview();dialog.showModal();
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
    const select=dialog.querySelector('[data-testid="group-child-choice"]');
    select.innerHTML='<option value="">Choose a child</option>'+candidates.slice(0,25).map(child=>`<option value="${escape(child.id)}">${escape(child.displayName)} · ${escape(child.abilityLevel||'Ability not recorded')} · ${escape(childGroup(child.id)?.label||'Unassigned')}</option>`).join('');
    dialog.querySelector('[data-testid="group-choice-count"]').textContent=`${Math.min(candidates.length,25)} of ${candidates.length} matches. Search to find any child.`;
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
      content = `<div class="d-dialog-summary"><span>Guardian consent</span><strong data-testid="child-consent">${child.consentStatus === 'complete' ? 'Consent on file' : 'Consent needed — guardian action required'}</strong></div><div class="d-form-grid">${field('child-name', 'Child name', child.displayName, 'text', true)}${field('child-birthdate', 'Date of birth', child.birthDate, 'date')}${field('child-alternate-name', 'Other name on registration or consent', child.alternateName)}<p class="d-record-id d-wide" data-testid="child-record-id">Child ID: ${escape(child.id ?? 'Assigned when saved')}</p>${select('child-guardian', 'Linked guardian', child.guardianId, [['', 'Not linked'], ...seed.guardians.map(person => [person.id, person.name])])}${select('child-level', 'Recorded ability level', child.abilityLevel ?? '', [['','Not yet recorded'],...[1,2,3,4,5,6].map(n=>['Level '+n,'Level '+n])])}${select('child-group', 'Lesson group', childGroup(id)?.id ?? '', [['', 'Unassigned'], ...seed.groups.map(group => [group.id, group.label])])}<h3 class="d-wide">Emergency contact 1</h3>${field('child-emergency-name', 'Contact name', child.emergencyName, 'text', true)}${field('child-emergency-phone', 'Phone number', child.emergencyPhone, 'tel', true)}<h3 class="d-wide">Emergency contact 2</h3>${field('child-emergency-name2', 'Second contact name', child.emergencyName2)}${field('child-emergency-phone2', 'Second phone number', child.emergencyPhone2, 'tel')}${select('child-medical-status', 'Medical information status', child.medicalStatus ?? '', [['', 'Not yet recorded'], ['none', 'No conditions or allergies reported'], ['alert', 'Medical or allergy alert recorded']])}${textarea('child-medical', 'Medical conditions, allergies and medications', child.medical, 'Include where medication is kept. Record an explicit no-conditions statement when confirmed; blank means missing information.')}<section class="d-wide d-pickups"><h3>Authorized pickup adults</h3><p class="d-help">Permissions apply to the displayed lesson day. This does not record a release.</p><div data-testid="pickup-fields">${(child.pickupAdults?.length ? child.pickupAdults : [{}]).map((adult,index) => pickupFields(adult,index)).join('')}</div>${button('Add pickup adult', 'pickup-add')}</section></div>`;
    } else if (kind === 'guardian') {
      title = 'Edit guardian';
      content = `<p class="d-linked">Linked children: <strong>${escape(seed.children.filter(child => child.guardianId === id).map(child => child.displayName).join(', ') || 'None')}</strong></p><div class="d-form-grid">${field('guardian-name', 'Guardian name', record.name, 'text', true)}${field('guardian-email', 'Email address', record.email, 'email', true)}${field('guardian-phone', 'Phone number', record.phone, 'tel', true)}</div>`;
    } else if (kind === 'instructor') {
      title = record ? 'Edit instructor' : 'Add instructor';
      content = `<div class="d-form-grid">${field('instructor-name', 'Instructor name', record?.name, 'text', true)}${field('instructor-qualification', 'Qualification', record?.qualification)}${field('instructor-email', 'Email address', record?.email, 'email', true)}${field('instructor-phone', 'Phone number', record?.phone, 'tel', true)}</div>`;
    } else {
      title = record ? 'Edit lesson group' : 'Create lesson group';
      content = `<div class="d-form-grid">${field('group-name', 'Group name', record?.label, 'text', true)}${select('group-level', 'Lesson level', record?.level ?? 'Level 1', [1, 2, 3, 4, 5, 6].map(level => ['Level ' + level, 'Level ' + level]))}${select('group-instructor', 'Instructor', record?.instructorId ?? '', [['', 'Select an instructor'], ...seed.instructors.map(person => [person.id, person.name])])}${field('group-meeting', 'Meeting place', record?.meeting)}</div><p class="d-help">An instructor may have up to six children across all their lesson groups. Assign children from their profiles.</p>${record ? `<div class="d-linked"><strong>Children in this group</strong><p>${escape(members(record).map(child => child.displayName).join(', ') || 'No children assigned yet.')}</p></div>` : ''}`;
    }
    if(kind==='group') {
      groupSelection=new Set(record?members(record).map(child=>child.id):[]);
      content=content.replace('Assign children from their profiles.','Add or remove children below. Adding a child from another group moves them when you save.');
      content=content.replace(/<div class="d-linked">[\s\S]*?<\/div>/,'');
      content+=`<section class="d-group-children"><h3>Children in this group</h3><div data-testid="group-members"></div><label>Find a child to add<input type="search" data-testid="group-child-search" placeholder="Name or bib"></label><label>Matching children<select data-testid="group-child-choice"></select></label><p class="d-help" data-testid="group-choice-count"></p><button type="button" class="d-button" data-testid="group-child-add">Add to group</button><p class="d-help">Membership changes are saved with the group. Edit child details from their name in the Lesson groups list.</p></section>`;
    }
    dialog.dataset.testid = kind + '-dialog';
    dialog.innerHTML = `<form novalidate><div class="d-dialog-heading"><h2 id="director-dialog-title">${escape(title)}</h2><button type="button" class="d-close" data-action="close" data-testid="dialog-close" aria-label="Close dialog">Close</button></div><div class="d-dialog-body">${content}<p class="d-form-error" role="alert" data-testid="form-error" hidden></p></div><footer class="d-dialog-footer"><span>Demo changes reset on reload.</span><div>${button('Cancel', 'close')}<button class="d-button d-primary" type="submit" data-testid="${kind}-save">${kind === 'child' ? 'Save child' : kind === 'guardian' ? 'Save contact' : kind === 'instructor' ? 'Save instructor' : 'Save group'}</button></div></footer></form>`;
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
    if (kind !== 'group' && !phoneValid(phone)) { error('Enter a valid phone number with 10–15 digits.'); return; }
    const email = dialog.querySelector('input[type="email"]');
    if (email && !email.validity.valid) { error('Enter a valid email address.'); email.focus(); return; }
    if (kind === 'child') {
      const group = seed.groups.find(item => item.id === value('child-group'));
      const assigned = seed.attendance.filter(row => row.childId !== record?.id && seed.groups.find(item => item.id === row.groupId)?.instructorId === group?.instructorId).length;
      if (group && (!group.instructorId || assigned >= 6)) { error(group.instructorId ? 'An instructor can teach a maximum of six children. Choose another group.' : 'Assign an instructor to this group before adding children.'); return; }
      const birthDate = value('child-birthdate');
      if (birthDate && birthDate >= seed.lessonDate) { error('Date of birth must be before the lesson date.'); return; }
      const phone2 = value('child-emergency-phone2');
      if (phone2 && !phoneValid(phone2)) { error('Enter a valid phone number for the second emergency contact.'); return; }
      const pickupAdults = [...dialog.querySelectorAll('[data-pickup-row]')].map(row => ({ name: row.querySelector('[data-pickup-name]').value.trim(), relationship: row.querySelector('[data-pickup-relationship]').value.trim(), validFrom: row.querySelector('[data-pickup-from]').value, validUntil: row.querySelector('[data-pickup-until]').value })).filter(adult => adult.name);
      if (pickupAdults.some(adult => adult.validFrom && adult.validUntil && adult.validUntil < adult.validFrom)) { error('A pickup end date must be on or after its start date.'); return; }
      const child = record ?? { id: 'demo-child-new-' + ++serial, consentStatus: 'incomplete' };
      Object.assign(child, { displayName: value('child-name'), abilityLevel: value('child-level'), birthDate, guardianId: value('child-guardian'), emergencyName: value('child-emergency-name'), emergencyPhone: formatPhone(phone), emergencyName2: value('child-emergency-name2'), emergencyPhone2: phone2 ? formatPhone(phone2) : '', alternateName: value('child-alternate-name'), medical: value('child-medical'), medicalStatus: value('child-medical-status'), pickupAdults, pickup: pickupAdults.map(adult => adult.name).join('; ') });
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
      Object.assign(group, { label: value('group-name'), level: value('group-level'), meeting: value('group-meeting'), instructorId });
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
    if(event.target.closest('[data-testid="group-child-add"]')) {
      const id=dialog.querySelector('[data-testid="group-child-choice"]').value;
      if(id) {groupSelection.add(id);refreshGroupMembers();}
    }
  });
  dialog.addEventListener('input',event=>{if(event.target.dataset.testid==='group-child-search') refreshGroupMembers();});
  dialog.addEventListener('change',event=>{if(event.target.dataset.testid==='group-level') refreshGroupMembers();});
  return { render };
}
