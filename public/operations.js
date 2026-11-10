const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const e = escape;
const field = (id, label, value = '', type = 'text') => `<label>${label}<input data-testid="${id}" name="${id}" type="${type}" value="${e(value)}" required></label>`;
const button = (id, label, primary = false) => `<button type="button" class="o-button ${primary ? 'o-primary' : ''}" data-testid="${id}">${label}</button>`;
const status = row => row.release ? 'Released' : row.status === 'checked_in' ? 'Checked in' : 'Expected';

export function createOperations(root, seed, {onChange}) {
  let role = 'desk', tab = 'Roster', query = '', groupFilter = '', statusFilter = 'all', page = 0, selected, opener;
  const pageSize = 25;
  const number = value => value.toLocaleString('en-CA');
  const dialog = document.createElement('dialog');
  let activeHost = dialog;
  dialog.className = 'o-dialog';
  dialog.dataset.testid = 'ops-dialog';
  dialog.setAttribute('aria-labelledby', 'ops-dialog-title');
  document.body.append(dialog);
  const rows = () => {
    const children = new Map(seed.children.map(child => [child.id,child]));
    const groups = new Map(seed.groups.map(group => [group.id,group]));
    return seed.attendance.map(att => ({...children.get(att.childId),...att,group:groups.get(att.groupId)}));
  };
  const own = () => rows().filter(r => role !== 'instructor' || r.group?.instructorId === 'demo-instructor-01');
  const activeAdults = child => (child.pickupAdults ?? []).filter(a => (!a.validFrom || a.validFrom <= seed.lessonDate) && (!a.validUntil || a.validUntil >= seed.lessonDate));
  const activePatrolAlert = row => (seed.patrolAlerts ?? []).find(alert => alert.active !== false && alert.status !== 'Found' && [row.childId, row.id].includes(alert.childId));
  const get = id => activeHost.querySelector(`[data-testid="${id}"]`);
  const value = id => get(id).value.trim();
  function sendPatrolAlert(row, report, source) {
    const now = new Date();
    const age = row.birthDate ? Math.max(0, Math.floor((Date.now() - new Date(row.birthDate).getTime()) / 31557600000)) : 'Unknown';
    const clock = now.toLocaleTimeString('en-US', {hour:'numeric',minute:'2-digit'});
    seed.patrolAlerts ??= [];
    const caseNumber = `MC-${String(1043 + seed.patrolAlerts.length).padStart(4, '0')}`;
    seed.patrolAlerts.unshift({
      id: `demo-alert-${Date.now()}`, caseNumber, active:true, childId:row.id || row.childId,
      childName:row.displayName, alternateName:row.alternateName || row.displayName, age,
      group:`${row.group?.label || 'Group not recorded'} · ${row.group?.level || 'Level not recorded'}`,
      radioChannel:'Channel 4', status:'Searching', source, receivedTime:clock,
      lastSeenTime:report.time || 'Not provided', lastSeenPlace:report.place || 'Not provided',
      visibility:'Not recorded', clothing:report.clothing || row.clothing || 'Not recorded',
      clothingConfidence:report.clothing ? `${source} report · unverified` : 'Not confirmed',
      equipment:report.equipment || 'Not recorded', injuries:report.injuries || 'Unknown', medical:row.medical || '',
      liftScan:null, liftScanUnavailableReason:'Pass number is unknown and is not linked to the child.',
      systemLog:[{time:clock,action:'Missing alert sent',actor:source}], searchLog:[],
      emergencyContacts:[row.emergencyName && {name:row.emergencyName,relationship:'Emergency contact',phone:row.emergencyPhone || 'Not provided',phoneStatus:'Verify before use'},row.emergencyName2 && {name:row.emergencyName2,relationship:'Emergency contact',phone:row.emergencyPhone2 || 'Not provided',phoneStatus:'Verify before use'}].filter(Boolean),
      escalation:'Follow the school’s missing-child procedure. Verify details with the desk and patrol lead.',
    });
    onChange();
  }
  const close = () => {
    if(activeHost!==dialog) {activeHost.innerHTML='<p class="o-empty">Select a child from the roster to review their details.</p>';selected=undefined;}
    if(dialog.open) dialog.close();
    activeHost=dialog;
  };
  dialog.addEventListener('close', () => { dialog.replaceChildren(); if (opener?.isConnected) opener.focus(); });
  function show(title, body, trigger, allowInline = false) {
    if (trigger) opener = trigger;
    const panel=allowInline && role==='desk' && matchMedia('(min-width:1024px)').matches ? root.querySelector('#desk-detail') : null;
    activeHost=panel||dialog;
    activeHost.innerHTML = `<header><div><p>${role === 'instructor' ? 'My group' : 'School desk'} · ${e(seed.lessonDate)}</p><h2 id="ops-dialog-title">${e(title)}</h2></div>${button('ops-close',panel?'Clear':'Back')}</header><div class="o-dialog-body" data-testid="ops-detail">${body}</div>`;
    get('ops-close').onclick = close;
    if (!panel && !dialog.open) dialog.showModal();
    get('ops-close').focus();
  }
  function medical(row) {
    if (!row.medical?.trim()) return '<p class="o-warning">Medical information missing</p>';
    return `<p class="${row.medicalStatus === 'alert' ? 'o-alert' : 'o-note'}">${row.medicalStatus === 'alert' ? '<b>Medical alert</b><br>' : ''}${e(row.medical)}</p>`;
  }
  function detail(row, trigger) {
    selected = row.childId;
    let body = `<p class="o-record">${e(row.id)} · ${e(row.group?.label)} · <b>Bib ${e(row.bib)}</b></p>${medical(row)}<dl class="o-facts"><div><dt>Current clothing</dt><dd>${e(row.clothing || 'Not recorded')}</dd></div><div><dt>Lesson</dt><dd>${e(row.group?.level)} · ${e(row.group?.meeting)}</dd></div></dl>`;
    if (role === 'instructor') {
      body += activePatrolAlert(row)
        ? `<p class="o-alert-sent" role="status" data-testid="instructor-alert-status">Alert Sent · Searching</p><p class="o-note">Patrol has not reported this child found.</p>`
        : `<p class="o-note">Submit a missing-child alert to the Patrol preview. Demo alerts stay in this browser session.</p><button type="button" class="o-button o-danger" data-testid="radio-start">Report missing child</button>`;
    } else {
      body += `<p class="${row.consentStatus === 'complete' ? 'o-note' : 'o-warning'}">${row.consentStatus === 'complete' ? 'Guardian consent on file' : 'Consent needed'}</p><dl class="o-facts"><div><dt>Emergency contact</dt><dd>${e(row.emergencyName)}<br>${e(row.emergencyPhone)}</dd></div><div><dt>Second emergency contact</dt><dd>${e(row.emergencyName2 || 'Not provided')}<br>${e(row.emergencyPhone2)}</dd></div></dl>`;
      if (row.release) body += `<div class="o-confirmation">Released to ${e(row.release.adult)}<br>Verified by ${e(row.release.staff)}<br><time data-testid="release-time">${e(row.release.time)}</time></div>`;
      else {
        body += `<form id="checkin-form"><h3>${row.status === 'checked_in' ? 'Update clothing' : 'Drop-off'}</h3>${field('checkin-clothing','Current clothing and helmet',row.clothing || '')}<p class="o-note">Confirm what the child is wearing today.</p>${row.consentStatus !== 'complete' ? '<p class="o-warning">Guardian consent is required before check-in. Ask the guardian to complete consent; staff cannot override it.</p>' : ''}<button class="o-button o-primary" data-testid="checkin-save" ${row.consentStatus !== 'complete' ? 'disabled' : ''}>${row.status === 'checked_in' ? 'Save clothing' : 'Record check-in'}</button></form>`;
        const adults = activeAdults(row);
        body += `<form id="pickup-form"><h3>Verify pickup</h3><p>Check the adult's identity against today's authorization before releasing the child.</p><label>Authorized adult<select data-testid="pickup-adult" required><option value="">Choose an adult</option>${adults.map((a,i)=>`<option value="${i}">${e(a.name)} — ${e(a.relationship)}</option>`).join('')}</select></label>${field('pickup-staff','Verifying staff')}<label class="o-checkbox"><input type="checkbox" data-testid="pickup-verified" required> I checked this adult's identity and authorization.</label><p class="o-note">An unlisted adult cannot collect this child. Ask the director to resolve authorization.</p><button class="o-button o-primary" data-testid="pickup-save" ${row.status !== 'checked_in' || !adults.length ? 'disabled' : ''}>Record release</button>${row.status !== 'checked_in' ? '<p class="o-warning">This child has not checked in.</p>' : ''}</form>`;
      }
    }
    show(row.displayName, body, trigger, true);
    if (role === 'instructor') get('radio-start').onclick = () => radio(row);
    activeHost.querySelector('#checkin-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const child = seed.children.find(child=>child.id===selected);
      if (child?.consentStatus !== 'complete') return;
      const attendance = seed.attendance.find(a=>a.childId===selected);
      attendance.clothing = value('checkin-clothing'); attendance.status = 'checked_in';
      onChange(); render(role,tab); detail(rows().find(r=>r.childId===selected));
    });
    activeHost.querySelector('#pickup-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const attendance = seed.attendance.find(a=>a.childId===selected);
      const adult = activeAdults(rows().find(r=>r.childId===selected))[Number(value('pickup-adult'))];
      if (!adult || attendance.release || attendance.status !== 'checked_in' || !get('pickup-verified').checked || !value('pickup-staff')) return;
      attendance.release = {adult:adult.name, staff:value('pickup-staff'),time:new Date().toLocaleTimeString('en-GB',{hour12:false})};
      onChange(); render(role,tab); detail(rows().find(r=>r.childId===selected));
    });
  }
  function radio(row) {
    const instructor = role === 'instructor';
    show(instructor ? 'Report missing child' : 'Log a received radio report', `<p class="o-warning">${instructor ? 'This sends a demo alert to the Patrol screen in this preview.' : 'Record the report received by the desk.'}</p><form id="radio-form">${instructor ? `<p>${e(row.displayName)} · Bib ${e(row.bib)}</p>` : `<label>Child<select data-testid="radio-child" required><option value="">Choose a child</option>${rows().map(r=>`<option value="${e(r.childId)}">${e(r.displayName)} · Bib ${e(r.bib)}</option>`).join('')}</select></label>`}${field('radio-time','Last seen time','','time')}${field('radio-place','Last seen place')}${field('radio-clothing','Confirmed clothing',row?.clothing || '')}${field('radio-equipment','Skis, helmet and other equipment')}${field('radio-injuries','Injuries or concerns (write unknown if unconfirmed)')}${instructor ? '' : field('radio-staff','Receiving staff')}<button class="o-button ${instructor ? 'o-danger' : 'o-primary'}" data-testid="radio-save">${instructor ? 'Send alert now' : 'Save received report'}</button></form>`);
    dialog.querySelector('#radio-form').onsubmit = event => {
      event.preventDefault();
      const child = instructor ? row : rows().find(r=>r.childId===value('radio-child'));
      if (!child) return;
      const report = {childId:child.childId, name:child.displayName,bib:child.bib,time:value('radio-time'),place:value('radio-place'),clothing:value('radio-clothing'),equipment:value('radio-equipment'),injuries:value('radio-injuries'),staff:instructor ? '' : value('radio-staff')};
      if (instructor) {
        sendPatrolAlert(child, report, 'Instructor');
        render(role, tab);
        show('Missing child alert', `<p class="o-alert o-alert-sent" role="status" data-testid="radio-alert-status">Alert Sent</p>${reportBody(report)}<p class="o-note">The Patrol preview will show this alert when you switch to Patrol.</p>`);
      }
      else { seed.incidents.push(report); onChange(); close(); render(role,tab); }
    };
  }
  const reportBody = r => `<h3>${e(r.name)} · Bib ${e(r.bib)}</h3><dl class="o-facts"><div><dt>Last seen</dt><dd>${e(r.time)} · ${e(r.place)}</dd></div><div><dt>Clothing</dt><dd>${e(r.clothing)}</dd></div><div><dt>Equipment</dt><dd>${e(r.equipment)}</dd></div><div><dt>Injuries / concerns</dt><dd>${e(r.injuries)}</dd></div>${r.staff ? `<div><dt>Received by</dt><dd>${e(r.staff)}</dd></div>` : ''}</dl>`;
  function list() {
    const matches = own().filter(row=>(!groupFilter || row.groupId===groupFilter) && (statusFilter==='all' || statusFilter==='consent' && row.consentStatus!=='complete' || statusFilter==='medical' && row.medicalStatus==='alert' || statusFilter==='to_release' && row.status==='checked_in' && !row.release || statusFilter==='checked_in' && row.status==='checked_in' && !row.release || statusFilter==='expected' && row.status==='expected' && !row.release) && [row.displayName,row.alternateName,row.bib,row.group?.label,row.id].some(v=>String(v??'').toLowerCase().includes(query.trim().toLowerCase())));
    page = Math.max(0, Math.min(page,Math.ceil(matches.length/pageSize)-1));
    const visible = role==='instructor' ? matches : matches.slice(page*pageSize,(page+1)*pageSize);
    root.querySelector('#ops-list').innerHTML = matches.length ? visible.map((row,index)=>role==='instructor' ? `<article class="o-roster-row" data-testid="roster-row"><button class="o-instructor-child" data-testid="ops-open-${e(row.childId)}"><span class="o-row-number">${index+1}</span><strong dir="auto">${e(row.displayName)}</strong>${activePatrolAlert(row) ? '<span class="o-instructor-alert" role="status" data-testid="instructor-alert-status">Alert Sent · Searching</span>' : ''}<span class="bib">Bib ${e(row.bib)}</span></button></article>` : `<article class="o-roster-row" data-testid="roster-row"><div class="o-child"><strong dir="auto">${e(row.displayName)}</strong><span>${e(row.group?.label)} · ${e(row.group?.level)}</span>${row.medicalStatus === 'alert' ? '<span class="o-alert-label">Medical alert</span>' : ''}</div><span class="bib">Bib ${e(row.bib)}</span><span class="o-status">${status(row)}${row.consentStatus !== 'complete' ? '<br><span class="o-warning-text">Consent needed</span>' : ''}</span><div class="o-row-actions">${button('ops-open-'+row.childId,tab === 'Pickup' ? (row.release ? 'View release' : 'Verify pickup') : 'View child')}${tab !== 'Pickup' ? `<button type="button" class="o-button o-danger" data-testid="desk-report-missing-${e(row.childId)}" ${activePatrolAlert(row) ? 'disabled' : ''}>Report missing child</button><span class="o-alert-sent" role="status" data-testid="desk-alert-status-${e(row.childId)}" ${activePatrolAlert(row) ? '' : 'hidden'}>Alert Sent · Searching</span>` : ''}</div></article>`).join('') : '<p class="o-empty">No children match that search.</p>';
    for (const row of visible) {
      root.querySelector(`[data-testid="ops-open-${row.childId}"]`).onclick = event=>detail(row,event.currentTarget);
      root.querySelector(`[data-testid="desk-report-missing-${row.childId}"]`)?.addEventListener('click', event => {
        sendPatrolAlert(row, {time:new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}),place:'Not provided by school desk',clothing:row.clothing || '',equipment:'Not recorded',injuries:'Unknown'}, 'School desk');
        event.currentTarget.disabled = true;
        const status = event.currentTarget.parentElement.querySelector(`[data-testid="desk-alert-status-${CSS.escape(row.childId)}"]`);
        if (status) status.hidden = false;
      });
    }
    const pager=root.querySelector('#ops-pagination');
    if(pager) {
      pager.innerHTML=`<span role="status" data-testid="roster-page-summary">${matches.length ? number(page*pageSize+1)+'–'+number(Math.min((page+1)*pageSize,matches.length)) : '0'} of ${number(matches.length)} children</span><div><button class="o-button" data-testid="roster-prev" ${page===0?'disabled':''}>Previous</button><button class="o-button" data-testid="roster-next" ${(page+1)*pageSize>=matches.length?'disabled':''}>Next</button></div>`;
      pager.querySelector('[data-testid="roster-prev"]').onclick=()=>{page--;list();root.querySelector('[data-testid="roster-next"]').focus();};
      pager.querySelector('[data-testid="roster-next"]').onclick=()=>{page++;list();root.querySelector('[data-testid="roster-prev"]').focus();};
    }
  }
  function render(nextRole,nextTab) {
    role=nextRole; tab=nextTab;
    root.replaceChildren();
    if (role === 'desk' && tab === 'Incidents') {
      root.innerHTML = `<div class="o-heading"><div><h2>Radio reports</h2><p>One record of the details received at the desk.</p></div>${button('desk-radio-new','Log radio report',true)}</div><p class="o-warning">Contact patrol by radio. Saving here does not send a notification.</p>${seed.incidents.length ? seed.incidents.map(r=>`<article class="o-incident" data-testid="incident-row">${reportBody(r)}</article>`).join('') : '<div class="o-empty">No radio reports recorded for this lesson day.</div>'}`;
      root.querySelector('[data-testid="desk-radio-new"]').onclick=()=>radio();
      return;
    }
    const assigned = own();
    const groupNames = [...new Set(assigned.map(r=>r.group?.label))].join(', ');
    root.innerHTML = `<div class="o-heading"><div><h2>${role === 'instructor' ? groupNames || 'No group assigned' : tab === 'Pickup' ? 'Verify every pickup' : 'Lesson-day roster'}</h2><p>${role === 'instructor' ? `Alex Morgan · ${assigned.length} of 6 children · ${e(assigned[0]?.group?.meeting || 'Ask the director for your assignment')}` : `${assigned.filter(r=>r.status==='checked_in'&&!r.release).length} checked in · ${assigned.filter(r=>r.status==='expected').length} expected · ${assigned.filter(r=>r.release).length} released`}</p></div></div>${role === 'instructor' ? '<p class="o-note">Your assigned children only. Open a child for medical information and radio details.</p>' : `<label class="o-search">Find a child<input type="search" placeholder="Name, bib or group" data-testid="roster-search" value="${e(query)}"></label>`}${role === 'desk' ? `<div class="o-filters"><label>Group<select data-testid="roster-group"><option value="">All groups</option>${seed.groups.map(g=>`<option value="${e(g.id)}" ${groupFilter===g.id?'selected':''}>${e(g.label)}</option>`).join('')}</select></label><label>Status<select data-testid="roster-status">${[['all','All children'],['expected','Expected'],['checked_in','Checked in'],['consent','Consent needed'],['medical','Medical alert'],['to_release','To be released']].map(([v,t])=>`<option value="${v}" ${statusFilter===v?'selected':''}>${t}</option>`).join('')}</select></label></div>` : `<div class="o-roster-heading"><h3>Today’s group</h3><span>${assigned.length} / 6</span></div>`}<div class="o-list" id="ops-list"></div>${role==='desk'?'<div id="ops-pagination" class="o-pagination"></div>':`<section class="o-medical-list" data-testid="instructor-medical"><h3>Must know · your group only</h3>${assigned.filter(r=>r.medicalStatus==='alert').map(r=>`<div class="o-medical-item"><strong>${e(r.displayName)}</strong><p>${e(r.medical)}</p></div>`).join('')||'<p>No medical alerts recorded for your group.</p>'}</section>`}<p class="o-footer">Demo edits stay on this page and reset on reload.${role === 'instructor' ? ' Keep your radio with you; offline access is not available.' : ''}</p>`;
    root.querySelector('[data-testid="roster-search"]')?.addEventListener('input',event=>{query=event.target.value;page=0;list();});
    root.querySelector('[data-testid="roster-group"]')?.addEventListener('change',event=>{groupFilter=event.target.value;page=0;list();});
    root.querySelector('[data-testid="roster-status"]')?.addEventListener('change',event=>{statusFilter=event.target.value;page=0;list();});
    if(role==='desk') {
      const layout=document.createElement('div');layout.className='o-desk-layout';
      const rail=document.createElement('section');rail.className='o-desk-roster';rail.dataset.testid='desk-roster';rail.setAttribute('aria-label','Lesson-day roster');
      for(const element of root.querySelectorAll('.o-search,.o-filters,#ops-list,#ops-pagination')) rail.append(element);
      const panel=document.createElement('aside');panel.id='desk-detail';panel.className='o-dialog o-inline-detail';panel.dataset.testid='desk-detail';panel.setAttribute('aria-label','Selected child details');
      panel.innerHTML='<p class="o-empty">Select a child from the roster to review their details.</p>';
      layout.append(rail,panel);root.insertBefore(layout,root.querySelector('.o-footer'));
    }
    list();
  }
  return {render, clear(){root.replaceChildren();query='';groupFilter='';statusFilter='all';page=0;close();}};
}
