import {childMeta, lessonDetails, profileMeta} from './profile-ui.js';
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const e = escape;
const field = (id, label, value = '', type = 'text') => `<label>${label}<input data-testid="${id}" name="${id}" type="${type}" ${type==='time'?'step="60"':''} value="${e(value)}" required></label>`;
const formatTime12 = value => {
  const match=/^(\d{1,2}):(\d{2})$/.exec(value||'');
  if(!match)return value||'N/A';
  const hour=Number(match[1]);
  return `${hour%12||12}:${match[2]} ${hour<12?'AM':'PM'}`;
};
const clothingColor = (text, item) => new RegExp(`([a-z]+)\\s+${item}`, 'i').exec(text || '')?.[1]?.toLowerCase() || '';
const colorSelect = (id,label,selected) => `<label>${label}<select data-testid="${id}" required><option value="">Choose a colour</option>${['Black','Blue','Brown','Green','Grey','Navy','Orange','Peach','Pink','Purple','Red','Teal','White','Yellow'].map(color=>`<option value="${color.toLowerCase()}" ${selected===color.toLowerCase()?'selected':''}>${color}</option>`).join('')}</select></label>`;
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
  const metadata = row => childMeta(seed,{...row,id:row.childId});
  const instructorMetadata = row => {
    const {program,level,bib}=lessonDetails(seed,{...row,id:row.childId});
    return profileMeta({program,level,bib});
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
    const childId=row.id || row.childId;
    const existing=seed.patrolAlerts.find(alert=>String(alert.childId)===String(childId)&&alert.active!==false&&String(alert.status||'').toLowerCase()!=='found');
    const caseNumber = existing?.caseNumber || `MC-${String(1043 + seed.patrolAlerts.length).padStart(4, '0')}`;
    const alertRecord={
      id: existing?.id || `demo-alert-${Date.now()}`, caseNumber, active:true, childId,
      childName:row.displayName, alternateName:row.alternateName || row.displayName, age,
      group:`${row.group?.label || 'Group not recorded'} · ${row.group?.level || 'Level not recorded'}`,
      radioChannel:'Channel 4', status:'Searching', source, receivedTime:clock,
      lastSeenTime:report.time || 'Not provided', lastSeenPlace:report.place || 'Not provided',
      visibility:'Not recorded', clothing:report.clothing || row.clothing || 'Not recorded',
      clothingConfidence:report.clothing ? `${source} report · unverified` : 'Not confirmed',
      equipment:report.equipment || 'Not recorded', injuries:report.injuries || 'Unknown', medical:row.medical || '',
      liftScan:null, liftScanUnavailableReason:'Pass number is unknown and is not linked to the child.',
      systemLog:existing ? [...(existing.systemLog||[]),{time:clock,action:'Missing alert updated',actor:source}] : [{time:clock,action:'Missing alert sent',actor:source}], searchLog:existing?.searchLog||[],
      emergencyContacts:[row.emergencyName && {name:row.emergencyName,relationship:'Emergency contact',phone:row.emergencyPhone || 'Not provided',phoneStatus:'Verify before use'},row.emergencyName2 && {name:row.emergencyName2,relationship:'Emergency contact',phone:row.emergencyPhone2 || 'Not provided',phoneStatus:'Verify before use'}].filter(Boolean),
      escalation:'Follow the school’s missing-child procedure. Verify details with the desk and patrol lead.',
    };
    if(existing) Object.assign(existing,alertRecord);
    else seed.patrolAlerts.unshift(alertRecord);
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
    activeHost.innerHTML = `<header><div><p>${role === 'instructor' ? 'My group' : 'School desk'} · ${e(seed.lessonDate)}</p><h2 id="ops-dialog-title">${e(title)}</h2></div>${panel ? button('ops-close','Clear') : '<button type="button" class="o-dialog-close" data-testid="ops-close" aria-label="Close form">×</button>'}</header><div class="o-dialog-body" data-testid="ops-detail">${body}</div>`;
    get('ops-close').onclick = close;
    if (!panel && !dialog.open) dialog.showModal();
    get('ops-close').focus();
  }
  function medical(row) {
    if (!row.medical?.trim()) return '<p class="o-warning">Medical information missing</p>';
    return `<p class="${row.medicalStatus === 'alert' ? 'o-health-note' : 'o-note'}">${row.medicalStatus === 'alert' ? '<b>Health note</b><br>' : ''}${e(row.medical)}${row.medications ? '<br>Medications: '+e(row.medications) : ''}${row.allergies ? '<br>Allergies: '+e(row.allergies) : ''}</p>`;
  }
  function detail(row, trigger) {
    selected = row.childId;
    let body = `<p class="o-record">${e(row.group?.label || 'Group not assigned')} · <b>Bib ${e(row.bib)}</b></p>${medical(row)}<dl class="o-facts"><div><dt>Current clothing</dt><dd>${e(row.clothing || 'Not recorded')}</dd></div><div><dt>Current equipment</dt><dd>${e(row.equipment || 'Not recorded')}</dd></div><div><dt>Lesson</dt><dd>${e(row.group?.level)} · ${e(row.group?.meeting)}</dd></div></dl>`;
    if (role === 'instructor') {
      body += `<form id="checkin-form" class="o-checkin-form"><h3>Update clothing and equipment</h3>${colorSelect('checkin-jacket','Jacket colour',clothingColor(row.clothing,'jacket'))}${colorSelect('checkin-helmet','Helmet colour',clothingColor(row.clothing,'helmet'))}<label class="o-clothing-notes">Other clothing details (optional)<textarea data-testid="checkin-clothing-notes" rows="2" placeholder="Patterns, logos, or other details">${e(row.clothing?.split(';').slice(1).join(';').trim()||'')}</textarea></label><label class="o-clothing-notes">Skis, poles, and other equipment (optional)<textarea data-testid="checkin-equipment" rows="2" placeholder="Describe equipment the child has today">${e(row.equipment||'')}</textarea></label><p class="o-note">Confirm the child’s clothing and equipment for today.</p><button class="o-button o-primary" data-testid="checkin-save">Save clothing and equipment</button></form>`;
      body += activePatrolAlert(row)
        ? `<p class="o-alert-sent" role="status" data-testid="instructor-alert-status">Alert Sent · Searching</p><p class="o-note">Patrol has not reported this child found.</p>`
        : row.status==='checked_in'&&!row.release ? '' : '<p class="o-note">This child is not checked in today.</p>';
    } else {
      body += `<p class="${row.consentStatus === 'complete' ? 'o-note' : 'o-warning'}">${row.consentStatus === 'complete' ? 'Guardian consent on file' : 'Consent needed'}</p><dl class="o-facts"><div><dt>Emergency contact</dt><dd>${e(row.emergencyName)}<br>${e(row.emergencyPhone)}</dd></div><div><dt>Second emergency contact</dt><dd>${e(row.emergencyName2 || 'Not provided')}<br>${e(row.emergencyPhone2)}</dd></div></dl>`;
      if (row.release) body += `<div class="o-confirmation">Released to ${e(row.release.adult)}<br>Verified by ${e(row.release.staff)}<br><time data-testid="release-time">${e(row.release.time)}</time></div>`;
      else {
        body += `<form id="checkin-form" class="o-checkin-form"><h3>${row.status === 'checked_in' ? 'Update clothing and equipment' : 'Drop-off'}</h3>${colorSelect('checkin-jacket','Jacket colour',clothingColor(row.clothing,'jacket'))}${colorSelect('checkin-helmet','Helmet colour',clothingColor(row.clothing,'helmet'))}<label class="o-clothing-notes">Other clothing details (optional)<textarea data-testid="checkin-clothing-notes" rows="2" placeholder="Patterns, logos, or other details"></textarea></label><label class="o-clothing-notes">Skis, poles, and other equipment (optional)<textarea data-testid="checkin-equipment" rows="2" placeholder="Describe equipment the child has today">${e(row.equipment || '')}</textarea></label><p class="o-note">Confirm the child’s clothing and equipment for today.</p>${row.consentStatus !== 'complete' ? '<p class="o-warning">Guardian consent is required before check-in. Ask the guardian to complete consent; staff cannot override it.</p>' : ''}<button class="o-button o-primary" data-testid="checkin-save" ${row.consentStatus !== 'complete' ? 'disabled' : ''}>${row.status === 'checked_in' ? 'Save clothing and equipment' : 'Record check-in'}</button></form>`;
        const adults = activeAdults(row);
        body += `<form id="pickup-form"><h3>Verify pickup</h3><p>Check the adult's identity against today's authorization before releasing the child.</p><label>Authorized adult<select data-testid="pickup-adult" required><option value="">Choose an adult</option>${adults.map((a,i)=>`<option value="${i}">${e(a.name)} — ${e(a.relationship)}</option>`).join('')}</select></label>${field('pickup-staff','Verifying staff')}<label class="o-checkbox"><input type="checkbox" data-testid="pickup-verified" required> I checked this adult's identity and authorization.</label><p class="o-note">An unlisted adult cannot collect this child. Ask the director to resolve authorization.</p><button class="o-button o-primary" data-testid="pickup-save" ${row.status !== 'checked_in' || !adults.length ? 'disabled' : ''}>Record release</button>${row.status !== 'checked_in' ? '<p class="o-warning">This child has not checked in.</p>' : ''}</form>`;
      }
    }
    show(row.displayName, body, trigger, true);
    activeHost.querySelector('#checkin-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const child = seed.children.find(child=>child.id===selected);
      if (role !== 'instructor' && child?.consentStatus !== 'complete') return;
      const attendance = seed.attendance.find(a=>a.childId===selected);
      if(!attendance)return;
      attendance.clothing = `${value('checkin-jacket')} jacket, ${value('checkin-helmet')} helmet${value('checkin-clothing-notes') ? `; ${value('checkin-clothing-notes')}` : ''}`;
      attendance.equipment = get('checkin-equipment').value.trim();
      if(role!=='instructor') attendance.status = 'checked_in';
      onChange();
      const savedChildId=selected;
      render(role,tab);
      if(role==='instructor') close();
      else detail(rows().find(r=>r.childId===savedChildId));
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
    const now=new Date();
    const defaultTime=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const prefill=child=>({
      place:'',
      clothing:child?.clothing||'N/A',
      equipment:child?.equipment||'N/A',
      concerns:child?.medical ? `Medical: ${child.medical}` : 'N/A',
    });
    const initial=instructor ? prefill(row) : {place:'',clothing:'',equipment:'',concerns:''};
    show(instructor ? 'Report missing child' : 'Log a received radio report', `<p class="o-warning">${instructor ? 'This prepares a demo report for Patrol. Call by radio; this app does not transmit radio.' : 'Record the report received by the desk.'}</p><form id="radio-form">${instructor && row ? `<p>${e(row.displayName)} · Bib ${e(row.bib)}</p>` : `<label>Child<select data-testid="radio-child" required><option value="">Choose a child</option>${(instructor ? own().filter(r=>r.status==='checked_in'&&!r.release) : rows()).map(r=>`<option value="${e(r.childId)}">${e(r.displayName)} · Bib ${e(r.bib)}</option>`).join('')}</select></label>`}${field('radio-time','Last seen time',instructor?defaultTime:'','time')}${instructor?`<p class="o-note">Defaults to local time; edit if the child was last seen earlier. <strong data-testid="radio-time-auto">${e(formatTime12(defaultTime))}</strong></p>`:''}${field('radio-place','Last seen place',instructor?'':initial.place)}${field('radio-clothing','Confirmed clothing',initial.clothing)}${field('radio-equipment','Skis, helmet and other equipment',initial.equipment)}${field('radio-injuries','Injuries or concerns',initial.concerns)}${instructor ? '' : field('radio-staff','Receiving staff')}<button class="o-button o-primary" data-testid="radio-save">${instructor ? 'Save report for Desk and Patrol' : 'Save received report'}</button></form>`);
    if (instructor && !row) {
      get('radio-child').addEventListener('change',event=>{
        const child=own().find(candidate=>candidate.childId===event.target.value);
        const details=prefill(child);
        get('radio-place').value='';
        get('radio-clothing').value=details.clothing;
        get('radio-equipment').value=details.equipment;
        get('radio-injuries').value=details.concerns;
      });
    }
    dialog.querySelector('#radio-form').onsubmit = event => {
      event.preventDefault();
      const child = instructor ? (row || own().find(r=>r.childId===value('radio-child'))) : rows().find(r=>r.childId===value('radio-child'));
      if (!child) return;
      const report = {childId:child.childId, name:child.displayName,bib:child.bib,time:formatTime12(value('radio-time')),place:value('radio-place'),clothing:value('radio-clothing'),equipment:value('radio-equipment'),injuries:value('radio-injuries'),staff:instructor ? '' : value('radio-staff')};
      if (instructor) {
        sendPatrolAlert(child, report, 'Instructor');
        render(role, tab);
        show('Missing child report', `<p class="o-alert o-alert-sent" role="status" data-testid="radio-alert-status">Report saved for Desk and Patrol</p><section data-testid="radio-checklist">${reportBody(report)}<p class="o-note">Radio: <strong>Not sent</strong>. Call Desk and Patrol by physical radio. No radio message was sent.</p></section>`);
      }
      else { seed.incidents.push(report); onChange(); close(); render(role,tab); }
    };
  }
  const reportBody = r => `<h3>${e(r.name)} · Bib ${e(r.bib)}</h3><dl class="o-facts"><div><dt>Last seen</dt><dd>${e(r.time)} · ${e(r.place)}</dd></div><div><dt>Clothing</dt><dd>${e(r.clothing)}</dd></div><div><dt>Equipment</dt><dd>${e(r.equipment)}</dd></div><div><dt>Injuries / concerns</dt><dd>${e(r.injuries)}</dd></div>${r.staff ? `<div><dt>Received by</dt><dd>${e(r.staff)}</dd></div>` : ''}</dl>`;
  function list() {
    const matches = own().filter(row=>(!groupFilter || row.groupId===groupFilter) && (statusFilter==='all' || statusFilter==='consent' && row.consentStatus!=='complete' || statusFilter==='medical' && row.medicalStatus==='alert' || statusFilter==='to_release' && row.status==='checked_in' && !row.release || statusFilter==='checked_in' && row.status==='checked_in' && !row.release || statusFilter==='expected' && row.status==='expected' && !row.release) && [row.displayName,row.alternateName,row.bib,row.group?.label,row.id].some(v=>String(v??'').toLowerCase().includes(query.trim().toLowerCase())));
    page = Math.max(0, Math.min(page,Math.ceil(matches.length/pageSize)-1));
    const visible = role==='instructor' ? matches : matches.slice(page*pageSize,(page+1)*pageSize);
    if(role==='instructor') {
      const checkedIn=visible.filter(row=>row.status==='checked_in'&&!row.release);
      const notCheckedIn=visible.filter(row=>row.status!=='checked_in'||row.release);
      const instructorCards=(children,inactive)=>children.map((row,index)=>`<article class="o-roster-row o-instructor-card${inactive?' is-not-checked-in-card':''}" data-testid="roster-row"><div class="o-instructor-child${inactive?' is-not-checked-in':''}"><div class="o-instructor-primary"><span class="o-row-number">${String(index+1).padStart(2,'0')}</span><strong dir="auto">${e(row.displayName)}</strong></div>${instructorMetadata(row)}${activePatrolAlert(row)?'<span class="o-instructor-alert" role="status">Alert Sent · Searching</span>':''}${inactive?`<span class="o-instructor-status">${row.release?'Released':'Not checked in'}</span>`:''}</div><button type="button" class="o-button o-instructor-view-child" data-testid="ops-open-${e(row.childId)}">View child</button></article>`).join('');
      root.querySelector('#ops-list').innerHTML=instructorCards(checkedIn,false)||'<p class="o-empty">No children are checked in yet.</p>';
      root.querySelector('#not-checked-list').innerHTML=instructorCards(notCheckedIn,true)||'<p class="o-empty">All assigned children are checked in.</p>';
      root.querySelector('[data-testid="instructor-not-checked-count"]').textContent=String(notCheckedIn.length);
    } else {
      root.querySelector('#ops-list').innerHTML = matches.length ? visible.map(row=>`<article class="o-roster-row" data-testid="roster-row"><div class="o-child"><strong dir="auto">${e(row.displayName)}</strong>${metadata(row)}${row.medicalStatus === 'alert' ? '<span class="o-alert-label">Health note</span>' : ''}</div><span class="o-status">${status(row)}${row.consentStatus !== 'complete' ? '<br><span class="o-warning-text">Consent needed</span>' : ''}</span><div class="o-row-actions">${button('ops-open-'+row.childId,tab === 'Pickup' ? (row.release ? 'View release' : 'Verify pickup') : 'View details')}${tab !== 'Pickup' ? `<button type="button" class="o-button o-danger" data-testid="desk-report-missing-${e(row.childId)}" ${activePatrolAlert(row) ? 'disabled' : ''}>Report missing child</button><span class="o-alert-sent" role="status" data-testid="desk-alert-status-${e(row.childId)}" ${activePatrolAlert(row) ? '' : 'hidden'}>Alert Sent · Searching</span>` : ''}</div></article>`).join('') : '<p class="o-empty">No children match that search.</p>';
    }
    for (const row of visible) {
      root.querySelector(`[data-testid="ops-open-${row.childId}"]`)?.addEventListener('click',event=>detail(row,event.currentTarget));
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
    const groupNames = [...new Set(assigned.map(r=>r.group?.label).filter(Boolean))].join(', ');
    const activeAssigned=assigned.filter(r=>r.status==='checked_in'&&!r.release);
    const levelLabel=[...new Set(assigned.map(r=>r.group?.level).filter(Boolean))].join(', ')||'Level not recorded';
    const medicalAlerts=activeAssigned.filter(r=>r.medicalStatus==='alert');
    const medicalPanel = role === 'instructor' ? `<section class="o-medical-list" data-testid="instructor-medical"><header class="o-medical-header"><div><span class="o-medical-eyebrow">Safety overview</span><h3>Medical alerts</h3></div><span class="o-medical-count">${medicalAlerts.length?`${medicalAlerts.length} ${medicalAlerts.length===1?'alert':'alerts'}`:'None today'}</span></header>${medicalAlerts.map(r=>`<article class="o-medical-item"><div class="o-medical-item-heading"><span class="o-medical-mark" aria-hidden="true">!</span><strong>${e(r.displayName)}</strong><span class="o-medical-tag">Medical alert</span></div><p>${e(r.medical)}</p></article>`).join('')||'<p class="o-medical-clear">No medical alerts for children checked in today.</p>'}</section>` : '';
    root.innerHTML = `<div class="o-heading"><div><h2>${role === 'instructor' ? groupNames || 'No group assigned' : tab === 'Pickup' ? 'Verify every pickup' : 'Lesson-day roster'}</h2><p>${role === 'instructor' ? `Alex Morgan · ${e(levelLabel)} · ${e(assigned[0]?.group?.meeting || 'Meeting place not recorded')}` : `${assigned.filter(r=>r.status==='checked_in'&&!r.release).length} checked in · ${assigned.filter(r=>r.status==='expected').length} expected · ${assigned.filter(r=>r.release).length} released`}</p></div></div>${role === 'instructor' ? '' : `<label class="o-search">Find a child<input type="search" placeholder="Name, bib or group" data-testid="roster-search" value="${e(query)}"></label>`}${role === 'desk' ? `<div class="o-filters"><label>Group<select data-testid="roster-group"><option value="">All groups</option>${seed.groups.map(g=>`<option value="${e(g.id)}" ${groupFilter===g.id?'selected':''}>${e(g.label)}</option>`).join('')}</select></label><label>Status<select data-testid="roster-status">${[['all','All children'],['expected','Expected'],['checked_in','Checked in'],['consent','Consent needed'],['medical','Medical alert'],['to_release','To be released']].map(([v,t])=>`<option value="${v}" ${statusFilter===v?'selected':''}>${t}</option>`).join('')}</select></label></div>` : ''}${medicalPanel}${role === 'instructor' ? `<section class="o-group-card" aria-label="Today’s group"><div class="o-roster-heading"><h3>Today’s group</h3><span>${activeAssigned.length} checked in</span></div><div class="o-list" id="ops-list"></div></section><section class="o-group-card o-not-checked-card" aria-label="Not checked in"><div class="o-roster-heading"><h3>Not checked in</h3><span data-testid="instructor-not-checked-count">0</span></div><div class="o-list" id="not-checked-list"></div></section>` : '<div class="o-list" id="ops-list"></div>'}${role==='desk'?'<div id="ops-pagination" class="o-pagination"></div>':''}${role==='instructor'?'':`<p class="o-footer">Demo edits stay on this page and reset on reload.</p>`}${role==='instructor'?`<div class="instructor-report-cta"><button type="button" class="o-button o-danger" data-testid="instructor-report-missing" ${activeAssigned.length?'':'disabled'}>Report missing child</button></div>`:''}`;
    root.querySelector('[data-testid="roster-search"]')?.addEventListener('input',event=>{query=event.target.value;page=0;list();});
    root.querySelector('[data-testid="roster-group"]')?.addEventListener('change',event=>{groupFilter=event.target.value;page=0;list();});
    root.querySelector('[data-testid="roster-status"]')?.addEventListener('change',event=>{statusFilter=event.target.value;page=0;list();});
    root.querySelector('[data-testid="instructor-report-missing"]')?.addEventListener('click',()=>radio());
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
