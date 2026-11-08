const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const e = escape;
const field = (id, label, value = '', type = 'text') => `<label>${label}<input data-testid="${id}" name="${id}" type="${type}" value="${e(value)}" required></label>`;
const button = (id, label, primary = false) => `<button type="button" class="o-button ${primary ? 'o-primary' : ''}" data-testid="${id}">${label}</button>`;
const status = row => row.release ? 'Released' : row.status === 'checked_in' ? 'Checked in' : 'Expected';

export function createOperations(root, seed, {onChange}) {
  let role = 'desk', tab = 'Today', query = '', selected, opener;
  const dialog = document.createElement('dialog');
  dialog.className = 'o-dialog';
  dialog.setAttribute('aria-labelledby', 'ops-dialog-title');
  document.body.append(dialog);
  const rows = () => seed.attendance.map(att => ({...seed.children.find(c => c.id === att.childId), ...att, group: seed.groups.find(g => g.id === att.groupId)}));
  const own = () => rows().filter(r => role !== 'instructor' || r.group?.instructorId === 'demo-instructor-01');
  const activeAdults = child => (child.pickupAdults ?? []).filter(a => (!a.validFrom || a.validFrom <= seed.lessonDate) && (!a.validUntil || a.validUntil >= seed.lessonDate));
  const get = id => dialog.querySelector(`[data-testid="${id}"]`);
  const value = id => get(id).value.trim();
  const close = () => dialog.close();
  dialog.addEventListener('close', () => { dialog.replaceChildren(); if (opener?.isConnected) opener.focus(); });
  function show(title, body, trigger) {
    if (trigger) opener = trigger;
    dialog.innerHTML = `<header><div><p>${role === 'instructor' ? 'My group' : 'School desk'} · ${e(seed.lessonDate)}</p><h2 id="ops-dialog-title">${e(title)}</h2></div>${button('ops-close','Close')}</header><div class="o-dialog-body" data-testid="ops-detail">${body}</div>`;
    get('ops-close').onclick = close;
    if (!dialog.open) dialog.showModal();
    else get('ops-close').focus();
  }
  function medical(row) {
    if (!row.medical?.trim()) return '<p class="o-warning">Medical information missing</p>';
    return `<p class="${row.medicalStatus === 'alert' ? 'o-alert' : 'o-note'}">${row.medicalStatus === 'alert' ? '<b>Medical alert</b><br>' : ''}${e(row.medical)}</p>`;
  }
  function detail(row, trigger) {
    selected = row.childId;
    let body = `<p class="o-record">${e(row.id)} · ${e(row.group?.label)} · <b>Bib ${e(row.bib)}</b></p>${medical(row)}<dl class="o-facts"><div><dt>Current clothing</dt><dd>${e(row.clothing || 'Not recorded')}</dd></div><div><dt>Lesson</dt><dd>${e(row.group?.level)} · ${e(row.group?.meeting)}</dd></div></dl>`;
    if (role === 'instructor') {
      body += `<p class="o-note">Use your radio for urgent help. This preview cannot send reports or work offline.</p>${button('radio-start','Prepare radio checklist',true)}`;
    } else {
      body += `<p class="${row.consentStatus === 'complete' ? 'o-note' : 'o-warning'}">${row.consentStatus === 'complete' ? 'Guardian consent on file' : 'Consent needed'}</p><dl class="o-facts"><div><dt>Emergency contact</dt><dd>${e(row.emergencyName)}<br>${e(row.emergencyPhone)}</dd></div><div><dt>Second emergency contact</dt><dd>${e(row.emergencyName2 || 'Not provided')}<br>${e(row.emergencyPhone2)}</dd></div></dl>`;
      if (row.release) body += `<div class="o-confirmation">Released to ${e(row.release.adult)}<br>Verified by ${e(row.release.staff)}<br><time data-testid="release-time">${e(row.release.time)}</time></div>`;
      else if (tab === 'Pickup') {
        const adults = activeAdults(row);
        body += `<form id="pickup-form"><h3>Verify pickup</h3><p>Check the adult's identity against today's authorization before releasing the child.</p><label>Authorized adult<select data-testid="pickup-adult" required><option value="">Choose an adult</option>${adults.map((a,i)=>`<option value="${i}">${e(a.name)} — ${e(a.relationship)}</option>`).join('')}</select></label>${field('pickup-staff','Verifying staff')}<label class="o-checkbox"><input type="checkbox" data-testid="pickup-verified" required> I checked this adult's identity and authorization.</label><p class="o-note">An unlisted adult cannot collect this child. Ask the director to resolve authorization.</p><button class="o-button o-primary" data-testid="pickup-save" ${row.status !== 'checked_in' || !adults.length ? 'disabled' : ''}>Record release</button>${row.status !== 'checked_in' ? '<p class="o-warning">This child has not checked in.</p>' : ''}</form>`;
      } else {
        body += `<form id="checkin-form"><h3>${row.status === 'checked_in' ? 'Update clothing' : 'Check-in'}</h3>${field('checkin-clothing','Current clothing and helmet',row.clothing || '')}<p class="o-note">Confirm what the child is wearing today.</p>${row.consentStatus !== 'complete' ? '<p class="o-warning">Check-in consent policy is awaiting the owner’s decision.</p>' : ''}<button class="o-button o-primary" data-testid="checkin-save" ${row.consentStatus !== 'complete' ? 'disabled' : ''}>${row.status === 'checked_in' ? 'Save clothing' : 'Record check-in'}</button></form>`;
      }
    }
    show(row.displayName, body, trigger);
    if (role === 'instructor') get('radio-start').onclick = () => radio(row);
    dialog.querySelector('#checkin-form')?.addEventListener('submit', event => {
      event.preventDefault();
      if (row.consentStatus !== 'complete') return;
      const attendance = seed.attendance.find(a=>a.childId===selected);
      attendance.clothing = value('checkin-clothing'); attendance.status = 'checked_in';
      onChange(); render(role,tab); detail(rows().find(r=>r.childId===selected));
    });
    dialog.querySelector('#pickup-form')?.addEventListener('submit', event => {
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
    show(instructor ? 'Missing-child radio checklist' : 'Log a received radio report', `<p class="o-warning">${instructor ? 'Not sent. Read this information over your radio.' : 'Record the radio report you received. Contact patrol by radio; this log does not notify them.'}</p><form id="radio-form">${instructor ? `<p>${e(row.displayName)} · Bib ${e(row.bib)}</p>` : `<label>Child<select data-testid="radio-child" required><option value="">Choose a child</option>${rows().map(r=>`<option value="${e(r.childId)}">${e(r.displayName)} · Bib ${e(r.bib)}</option>`).join('')}</select></label>`}${field('radio-time','Last seen time','','time')}${field('radio-place','Last seen place')}${field('radio-clothing','Confirmed clothing',row?.clothing || '')}${field('radio-equipment','Skis, helmet and other equipment')}${field('radio-injuries','Injuries or concerns (write unknown if unconfirmed)')}${instructor ? '' : field('radio-staff','Receiving staff')}<button class="o-button o-primary" data-testid="radio-save">${instructor ? 'Prepare checklist' : 'Save received report'}</button></form>`);
    dialog.querySelector('#radio-form').onsubmit = event => {
      event.preventDefault();
      const child = instructor ? row : rows().find(r=>r.childId===value('radio-child'));
      if (!child) return;
      const report = {childId:child.childId, name:child.displayName,bib:child.bib,time:value('radio-time'),place:value('radio-place'),clothing:value('radio-clothing'),equipment:value('radio-equipment'),injuries:value('radio-injuries'),staff:instructor ? '' : value('radio-staff')};
      if (instructor) show('Ready to read over your radio', `<div data-testid="radio-checklist"><p class="o-warning"><b>Not sent.</b> Use your radio to contact the desk or patrol.</p>${reportBody(report)}${medical(child)}<p class="o-record">Child ID: ${e(child.id)}</p></div>`);
      else { seed.incidents.push(report); onChange(); close(); render(role,tab); }
    };
  }
  const reportBody = r => `<h3>${e(r.name)} · Bib ${e(r.bib)}</h3><dl class="o-facts"><div><dt>Last seen</dt><dd>${e(r.time)} · ${e(r.place)}</dd></div><div><dt>Clothing</dt><dd>${e(r.clothing)}</dd></div><div><dt>Equipment</dt><dd>${e(r.equipment)}</dd></div><div><dt>Injuries / concerns</dt><dd>${e(r.injuries)}</dd></div>${r.staff ? `<div><dt>Received by</dt><dd>${e(r.staff)}</dd></div>` : ''}</dl>`;
  function list() {
    const matches = own().filter(row=>[row.displayName,row.alternateName,row.bib,row.group?.label,row.id].some(v=>String(v??'').toLowerCase().includes(query.toLowerCase())));
    root.querySelector('#ops-list').innerHTML = matches.length ? matches.map(row=>`<article class="o-roster-row" data-testid="roster-row"><div class="o-child"><strong>${e(row.displayName)}</strong><span>${e(row.group?.label)} · ${e(row.group?.level)}</span>${row.medicalStatus === 'alert' ? '<span class="o-alert-label">Medical alert</span>' : ''}</div><span class="bib">Bib ${e(row.bib)}</span><span class="o-status">${status(row)}${row.consentStatus !== 'complete' && role === 'desk' ? '<br><span class="o-warning-text">Consent needed</span>' : ''}</span>${button('ops-open-'+row.childId,tab === 'Pickup' ? (row.release ? 'View release' : 'Verify pickup') : 'View child')}</article>`).join('') : '<p class="o-empty">No children match that search.</p>';
    for (const row of matches) root.querySelector(`[data-testid="ops-open-${row.childId}"]`).onclick = event=>detail(row,event.currentTarget);
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
    root.innerHTML = `<div class="o-heading"><div><h2>${role === 'instructor' ? groupNames || 'No group assigned' : tab === 'Pickup' ? 'Verify every pickup' : 'Lesson-day roster'}</h2><p>${role === 'instructor' ? `Alex Morgan · ${assigned.length} of 6 children · ${e(assigned[0]?.group?.meeting || 'Ask the director for your assignment')}` : `${assigned.filter(r=>r.status==='checked_in'&&!r.release).length} checked in · ${assigned.filter(r=>r.status==='expected').length} expected · ${assigned.filter(r=>r.release).length} released`}</p></div></div>${role === 'instructor' ? '<p class="o-note">Your assigned children only. Open a child for medical information and radio details.</p>' : `<label class="o-search">Find a child<input type="search" placeholder="Name, bib or group" data-testid="roster-search" value="${e(query)}"></label>`}<div class="o-list" id="ops-list"></div><p class="o-footer">Demo edits stay on this page and reset on reload.${role === 'instructor' ? ' Keep your radio with you; offline access is not available.' : ''}</p>`;
    root.querySelector('[data-testid="roster-search"]')?.addEventListener('input',event=>{query=event.target.value;list();});
    list();
  }
  return {render, clear(){root.replaceChildren();query='';close();}};
}
