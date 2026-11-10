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
  let role = 'desk', tab = 'Roster', query = '', groupFilter = '', statusFilter = 'all', programFilter = 'all', page = 0, opener;
  const pageSize = 25;
  const number = value => value.toLocaleString('en-CA');
  const notifications=[],deskNotifications=[];
  const currentNotifications=()=>role==='desk'?deskNotifications:notifications;
  const unreadCount=items=>items.filter(item=>!item.read).length;
  const updateAlertTab=()=>{
    const button=document.querySelector(`#workspace-nav [data-testid="${role==='desk'?'desk':'instructor'}-nav-alerts"]`);
    if(!button)return;
    const unread=unreadCount(currentNotifications());
    button.setAttribute('aria-label',`Alerts${unread?`, ${unread} unread`:''}`);
    let badge=button.querySelector('.nav-alert-count');
    if(unread){
      if(!badge){badge=document.createElement('span');badge.className='nav-alert-count';badge.setAttribute('aria-hidden','true');button.append(badge);}
      badge.textContent=unread>9?'9+':String(unread);
    } else badge?.remove();
  };
  function renderNotifications(){
    updateAlertTab();
    const isDesk=role==='desk',items=currentNotifications();
    const panel=root.querySelector(`[data-testid="${isDesk?'desk':'instructor'}-alerts"]`);
    if(!panel)return;
    panel.innerHTML=`<header class="i-notification-heading"><div><h2>Alerts</h2><small>${items.length?`${items.length} update${items.length===1?'':'s'} ${isDesk?'for the school':'for your group'}`:`Updates for ${isDesk?'the school':'your group'}`}</small></div><span class="i-alerts-count">${items.length}</span></header>${items.length?`<div class="i-notification-list" aria-live="polite">${items.map(item=>`<article class="i-notification-item"><span class="i-notification-indicator" aria-hidden="true"></span><span class="i-notification-copy">${e(item.text)}<small>${e(item.time)}</small></span></article>`).join('')}</div>`:`<div class="i-notification-empty"><strong>You’re all caught up</strong><small>No new school alerts.</small></div>`}<footer class="i-notification-footer"><button type="button" class="o-button" data-clear-operational-notifications ${items.length?'':'disabled'}>Clear alerts</button></footer>`;
    panel.querySelector('[data-clear-operational-notifications]').onclick=()=>{items.length=0;renderNotifications();};
  }
  const notify=(text,audience='current')=>{const targetRole=audience==='current'?role:audience;const target=targetRole==='desk'?deskNotifications:notifications;target.unshift({text,time:new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}),read:document.body.classList.contains(targetRole==='desk'?'desk-view':'instructor-view')&&role===targetRole&&tab==='Alerts'});renderNotifications();};
  const guardianSnapshot=()=>JSON.stringify([seed.children.map(child=>[child.id,child.medical,child.medications,child.allergies,child.emergencyName,child.emergencyPhone,child.emergencyRelationship,child.emergencyName2,child.emergencyPhone2,child.emergencyRelationship2,child.pickupAdults,child.consentStatus,child.consentUpdatedAt]),seed.guardians.map(person=>[person.id,person.name,person.phone,person.email,person.relationship])]);
  let priorGuardianSnapshot=guardianSnapshot();
  const knownAlertIds=new Set((seed.patrolAlerts||[]).map(alert=>String(alert.id)));
  const observedAlertStatus=new Map((seed.patrolAlerts||[]).map(alert=>[String(alert.id),String(alert.status||'active').toLowerCase()]));
  window.addEventListener('kestrel:preview-change',()=>{
    const next=guardianSnapshot();
    if(next!==priorGuardianSnapshot){
      for(const alert of seed.patrolAlerts||[]){
        if(alert.active===false||String(alert.status||'').toLowerCase()==='found')continue;
        const child=seed.children.find(record=>String(record.id)===String(alert.childId));
        if(!child)continue;
        alert.emergencyContacts=guardianContacts(child);
        alert.authorizedPickupAdults=(child.pickupAdults||[]).map(adult=>({name:adult.name,relationship:adult.relationship||'Other'}));
        alert.medical=guardianHealth(child);
        alert.guardianUpdateDate=child.consentUpdatedAt||'Not recorded';
        alert.consentStatus=child.consentStatus||'Not recorded';
      }
    }
    priorGuardianSnapshot=next;
    for(const alert of seed.patrolAlerts||[]){
      const id=String(alert.id),status=String(alert.status||'active').toLowerCase(),previous=observedAlertStatus.get(id);
      if(!knownAlertIds.has(id)){
        knownAlertIds.add(id);
        if(alert.active!==false&&status!=='found'&&alert.source==='Instructor')notify(`Missing-child report for ${alert.childName||'a child'} · ${alert.lastSeenPlace||'Review alert details'}`,'desk');
      }
      if(previous&&previous!=='found'&&status==='found'){
        const attendance=seed.attendance.find(row=>String(row.childId)===String(alert.childId));
        const group=seed.groups.find(item=>item.id===attendance?.groupId);
        if(group?.instructorId==='demo-instructor-01')notify(`${alert.childName||'A child'} was marked found by ${alert.foundBy||'staff'}.`,'instructor');
        notify(`${alert.childName||'A child'} was marked found by ${alert.foundBy||'staff'}.`,'desk');
      }
      observedAlertStatus.set(id,status);
    }
  });
  renderNotifications();
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
    return profileMeta({...(program?{program}:{}),...(level?{level}:{}),...(bib?{bib}:{})});
  };
  const guardianHealth = child => [
    child?.medical && `Medical conditions: ${child.medical}`,
    child?.medications && `Medications and location: ${child.medications}`,
    child?.allergies && `Allergies: ${child.allergies}`,
  ].filter(Boolean).join('\n') || 'N/A';
  const guardianContacts = child => [
    {name:child?.emergencyName,relationship:child?.emergencyRelationship||'Guardian / emergency contact',phone:child?.emergencyPhone},
    {name:child?.emergencyName2,relationship:child?.emergencyRelationship2||'Emergency contact',phone:child?.emergencyPhone2},
  ].filter(contact=>contact.name||contact.phone).map(contact=>({...contact,phone:contact.phone||'Not provided',phoneStatus:contact.phone?'Verify before use':'Phone not provided'}));
  const own = () => rows().filter(r => role !== 'instructor' || r.group?.instructorId === 'demo-instructor-01');
  const programDay = row => {const program=String(row.program||row.storeRegistration?.program||row.group?.program||'').toLowerCase();return /\bsat(?:urday)?\b/.test(program)?'sat':/\bsun(?:day)?\b/.test(program)?'sun':'';};
  const activeAdults = child => (child.pickupAdults ?? []).filter(a => (!a.validFrom || a.validFrom <= seed.lessonDate) && (!a.validUntil || a.validUntil >= seed.lessonDate));
  const activePatrolAlert = row => (seed.patrolAlerts ?? []).find(alert => alert.active !== false && alert.status !== 'Found' && [row.childId, row.id].includes(alert.childId));
  const get = id => activeHost.querySelector(`[data-testid="${id}"]`);
  const value = id => get(id).value.trim();
  function sendPatrolAlert(row, report, source) {
    const now = new Date();
    const age = row.birthDate ? Math.max(0, Math.floor((Date.now() - new Date(row.birthDate).getTime()) / 31557600000)) : 'Unknown';
    const clock = now.toLocaleTimeString('en-US', {hour:'numeric',minute:'2-digit'});
    seed.patrolAlerts ??= [];
    const childId = row.id || row.childId;
    const existing = seed.patrolAlerts.find(alert => String(alert.childId) === String(childId) && alert.active !== false && String(alert.status || '').toLowerCase() !== 'found');
    const caseNumber = existing?.caseNumber || `MC-${String(1043 + seed.patrolAlerts.length).padStart(4, '0')}`;
    const instructorName = (seed.instructors ?? []).find(person => person.id === row.group?.instructorId)?.name || 'Instructor';
    const alertRecord = {
      id: existing?.id || `demo-alert-${Date.now()}`, caseNumber, active:true, childId, bib:row.bib || existing?.bib || '',
      childName:row.displayName, alternateName:row.alternateName || row.displayName, age,
      group:`${row.group?.label || 'Group not recorded'} · ${row.group?.level || 'Level not recorded'}`,
      radioChannel:'Channel 4', status:'Searching', source, receivedTime:clock, reportedStaff:source === 'School desk' ? report.staff || '' : source === 'Instructor' ? instructorName : '', reportedViaDeskForm:source === 'School desk', reportedViaForm:['School desk','Instructor'].includes(source),
      lastSeenTime:report.time || 'Not provided', lastSeenPlace:report.place || 'Not provided',
      visibility:'Not recorded', clothing:report.clothing || row.clothing || 'Not recorded',
      clothingConfidence:report.clothing ? `${source} report · unverified` : 'Not confirmed',
      equipment:report.equipment || 'Not recorded', injuries:report.injuries || 'Unknown', medical:guardianHealth(row),
      guardianUpdateDate:row.consentUpdatedAt||'Not recorded',consentStatus:row.consentStatus||'Not recorded',
      authorizedPickupAdults:(row.pickupAdults||[]).map(adult=>({name:adult.name,relationship:adult.relationship||'Other'})),
      liftScan:null, liftScanUnavailableReason:'Pass number is unknown and is not linked to the child.',
      systemLog:existing ? [...(existing.systemLog||[]),{time:clock,action:'Missing alert updated',actor:source}] : [{time:clock,action:'Missing alert sent',actor:source}], searchLog:existing?.searchLog||[],
      emergencyContacts:guardianContacts(row),
      escalation:'Follow the school’s missing-child procedure. Verify details with the desk and patrol lead.',
    };
    if (existing) Object.assign(existing, alertRecord);
    else seed.patrolAlerts.unshift(alertRecord);
    notify(`${existing?'Missing-child report updated':'Missing-child report sent'} for ${row.displayName}.`);
    onChange();
  }
  const close = () => {
    if(activeHost!==dialog) activeHost.innerHTML='<p class="o-empty">Select a child from the roster to review their details.</p>';
    if(dialog.open) dialog.close();
    activeHost=dialog;
  };
  dialog.addEventListener('close', () => { dialog.replaceChildren(); if (opener?.isConnected) opener.focus(); });
  function show(title, body, trigger, allowInline = false, variant = '') {
    if (trigger) opener = trigger;
    const panel=allowInline && role==='desk' && matchMedia('(min-width:1024px)').matches ? root.querySelector('#desk-detail') : null;
    activeHost=panel||dialog;
    const formVariant = ['report','attendance'].includes(variant) && !panel;
    dialog.classList.toggle('o-report-dialog', variant === 'report' && !panel);
    dialog.classList.toggle('o-form-dialog', formVariant);
    const formFooter = variant === 'report'
      ? '<footer class="o-report-footer"><button type="button" class="o-button" data-testid="radio-clear">Clear</button><button type="submit" form="radio-form" class="o-button o-primary" data-testid="radio-save">Save missing-child report</button></footer>'
      : variant === 'attendance'
        ? `<footer class="o-report-footer"><button type="button" class="o-button" data-testid="attendance-clear">Clear</button><button type="submit" form="${body.includes('id="checkin-form"') ? 'checkin-form' : 'pickup-form'}" class="o-button o-primary" data-testid="${body.includes('id="checkin-form"') ? 'checkin-save' : 'pickup-save'}">${body.includes('id="checkin-form"') ? 'Record check-in' : 'Record release'}</button></footer>`
        : '';
    activeHost.innerHTML = `<header><div><p>${role === 'instructor' ? 'My group' : 'School desk'} · ${e(seed.lessonDate)}</p><h2 id="ops-dialog-title">${e(title)}</h2></div>${panel ? button('ops-close','Clear') : '<button type="button" class="o-dialog-close" data-testid="ops-close" aria-label="Close form">×</button>'}</header><div class="o-dialog-body" data-testid="ops-detail">${body}</div>${panel ? '' : formFooter}`;
    get('ops-close').onclick = close;
    if (variant === 'report' && !panel) get('radio-clear').onclick = () => get('radio-form').reset();
    if (variant === 'attendance' && !panel) get('attendance-clear').onclick = () => activeHost.querySelector('form').reset();
    if (!panel && !dialog.open) dialog.showModal();
    get('ops-close').focus();
  }
  function medical(row) {
    if (!row.medical?.trim()) return '<p class="o-warning">Medical information missing</p>';
    return `<p class="${row.medicalStatus === 'alert' ? 'o-health-note' : 'o-note'}">${row.medicalStatus === 'alert' ? '<b>Health note</b><br>' : ''}${e(row.medical)}${row.medications ? '<br>Medications: '+e(row.medications) : ''}${row.allergies ? '<br>Allergies: '+e(row.allergies) : ''}</p>`;
  }
  function detail(row, trigger) {
    let body = `<p class="o-record">${e(row.group?.label || 'Group not assigned')} · <b>Bib ${e(row.bib)}</b></p>${medical(row)}<dl class="o-facts"><div><dt>Current clothing</dt><dd>${e(row.clothing || 'Not recorded')}</dd></div><div><dt>Current equipment</dt><dd>${e(row.equipment || 'Not recorded')}</dd></div><div><dt>Lesson</dt><dd>${e(row.group?.level)} · ${e(row.group?.meeting)}</dd></div></dl>`;
    if (role === 'instructor') {
      body += `<form id="checkin-form" class="o-checkin-form"><h3>Update clothing and equipment</h3>${colorSelect('checkin-jacket','Jacket colour',clothingColor(row.clothing,'jacket'))}${colorSelect('checkin-helmet','Helmet colour',clothingColor(row.clothing,'helmet'))}<label class="o-clothing-notes">Other clothing details (optional)<textarea data-testid="checkin-clothing-notes" rows="2" placeholder="Patterns, logos, or other details">${e(row.clothing?.split(';').slice(1).join(';').trim()||'')}</textarea></label><label class="o-clothing-notes">Skis, poles, and other equipment (optional)<textarea data-testid="checkin-equipment" rows="2" placeholder="Describe equipment the child has today">${e(row.equipment||'')}</textarea></label><p class="o-note">Confirm the child’s clothing and equipment for today.</p><button class="o-button o-primary" data-testid="checkin-save">Save clothing and equipment</button></form>`;
      body += activePatrolAlert(row)
        ? `<p class="o-alert-sent" role="status" data-testid="instructor-alert-status">Alert Sent · Searching</p><p class="o-note">Patrol has not reported this child found.</p>`
        : row.status==='checked_in'&&!row.release ? '' : '<p class="o-note">This child is not checked in today.</p>';
    } else {
      if(activePatrolAlert(row)) body += '<p class="o-alert-sent" role="status">Missing report saved for Patrol.</p>';
      body += `<p class="${row.consentStatus === 'complete' ? 'o-note' : 'o-warning'}">${row.consentStatus === 'complete' ? 'Guardian consent on file' : 'Consent needed'}</p><dl class="o-facts"><div><dt>Emergency contact</dt><dd>${e(row.emergencyName)}<br>${e(row.emergencyPhone)}</dd></div><div><dt>Second emergency contact</dt><dd>${e(row.emergencyName2 || 'Not provided')}<br>${e(row.emergencyPhone2)}</dd></div></dl>`;
      if (row.release) body += `<div class="o-confirmation">Released to ${e(row.release.adult)}<br>Verified by ${e(row.release.staff)}<br><time data-testid="release-time">${e(row.release.time)}</time></div>`;
      if(!activePatrolAlert(row)) body += `<div class="o-detail-actions"><button type="button" class="o-button o-danger o-report-missing" data-testid="desk-report-missing">Report missing</button></div>`;
    }
    show(row.displayName, body, trigger, true);
    if (role === 'desk') get('desk-report-missing')?.addEventListener('click',()=>radio(row,'desk-missing'));
    if(role==='instructor') activeHost.querySelector('#checkin-form')?.addEventListener('submit',event=>{
      event.preventDefault();
      const attendance=seed.attendance.find(item=>item.childId===row.childId);
      if(!attendance||row.status!=='checked_in'||row.release)return;
      attendance.clothing=`${value('checkin-jacket')} jacket, ${value('checkin-helmet')} helmet${value('checkin-clothing-notes')?`; ${value('checkin-clothing-notes')}`:''}`;
      attendance.equipment=get('checkin-equipment').value.trim();
      onChange();close();render('instructor',tab);
    });
  }
  function attendanceAction(row, mode, trigger) {
    const checkin = mode === 'checkin';
    const body = checkin
      ? `<p class="o-note"><strong>${e(row.displayName)}</strong> · ${e(row.group?.label || 'Group not recorded')}</p><form id="checkin-form" class="o-checkin-form">${field('checkin-bib','Bib number',row.bib)}<p class="o-note">Confirm the bib assigned to this child’s group.</p>${colorSelect('checkin-jacket','Jacket colour',clothingColor(row.clothing,'jacket'))}${colorSelect('checkin-helmet','Helmet colour',clothingColor(row.clothing,'helmet'))}<label class="o-clothing-notes">Other clothing details (optional)<textarea data-testid="checkin-clothing-notes" rows="2" placeholder="Patterns, logos, or other details"></textarea></label><label class="o-clothing-notes">Skis, poles, and other equipment (optional)<textarea data-testid="checkin-equipment" rows="2" placeholder="Describe equipment the child has today">${e(row.equipment || '')}</textarea></label><p class="o-note">Confirm the child’s clothing and equipment for today.</p>${row.consentStatus !== 'complete' ? '<p class="o-warning">Guardian consent is required before check-in. Ask the guardian to complete consent; staff cannot override it.</p>' : ''}</form>`
      : `<p class="o-note"><strong>${e(row.displayName)}</strong> · ${e(row.group?.label || 'Group not recorded')}</p><form id="pickup-form"><p>Check the adult's identity against today's authorization before releasing the child.</p><label>Authorized adult<select data-testid="pickup-adult" required><option value="">Choose an adult</option>${activeAdults(row).map((adult,index)=>`<option value="${index}">${e(adult.name)} — ${e(adult.relationship)}</option>`).join('')}</select></label>${field('pickup-staff','Verifying staff')}<label class="o-checkbox"><input type="checkbox" data-testid="pickup-verified" required> I checked this adult's identity and authorization.</label><p class="o-note">An unlisted adult cannot collect this child. Ask the director to resolve authorization.</p>${!activeAdults(row).length ? '<p class="o-warning">No authorized pickup adults are on file. Ask the director to resolve this before release.</p>' : ''}</form>`;
    show(checkin ? 'Check in child' : 'Release child', body, trigger, false, 'attendance');
    if (checkin) get('checkin-save').disabled = row.consentStatus !== 'complete';
    else get('pickup-save').disabled = row.status !== 'checked_in' || Boolean(row.release) || !activeAdults(row).length;
    const form = activeHost.querySelector(checkin ? '#checkin-form' : '#pickup-form');
    if(checkin)get('checkin-bib').addEventListener('input',event=>event.currentTarget.setCustomValidity(''));
    form.addEventListener('submit', event => {
      event.preventDefault();
      const attendance = seed.attendance.find(item=>item.childId===row.childId);
      if (!attendance) return;
      if (checkin) {
        const child = seed.children.find(item=>item.id===row.childId);
        if (child?.consentStatus !== 'complete') return;
        const bibInput=get('checkin-bib');
        const bib=value('checkin-bib');
        const duplicate=seed.attendance.some(item=>item.childId!==row.childId&&item.groupId===attendance.groupId&&String(item.bib).trim().toLowerCase()===bib.toLowerCase());
        bibInput.setCustomValidity(duplicate?'This bib is already assigned to another child in this group.':'');
        if(duplicate){bibInput.reportValidity();return;}
        attendance.bib=bib;
        attendance.clothing = `${value('checkin-jacket')} jacket, ${value('checkin-helmet')} helmet${value('checkin-clothing-notes') ? `; ${value('checkin-clothing-notes')}` : ''}`;
        attendance.status = 'checked_in';
        attendance.equipment = get('checkin-equipment').value.trim();
      } else {
        const adult = activeAdults(rows().find(item=>item.childId===row.childId))[Number(value('pickup-adult'))];
        if (!adult || attendance.release || attendance.status !== 'checked_in' || !get('pickup-verified').checked || !value('pickup-staff')) return;
        attendance.release = {adult:adult.name, staff:value('pickup-staff'),time:new Date().toLocaleTimeString('en-GB',{hour12:false})};
      }
      onChange(); close(); render(role,tab);
    });
  }
  function radio(row, mode = '') {
    const instructor = role === 'instructor';
    const now=new Date();
    const defaultTime=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const deskMissing = mode === 'desk-missing';
    const prefill=child=>({
      place:'',
      clothing:child?.clothing||'N/A',
      equipment:child?.equipment||'N/A',
      concerns:'',
    });
    const initial=instructor ? prefill(row) : deskMissing ? {place:'',clothing:row?.clothing||'',equipment:row?.equipment||'',concerns:''} : {place:'',clothing:'',equipment:'',concerns:''};
    const currentTime=()=>{const now=new Date();return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;};
    const roundedTime=()=>{const [hours,minutes]=currentTime().split(':').map(Number);return `${String(hours).padStart(2,'0')}:${String(Math.floor(minutes/10)*10).padStart(2,'0')}`;};
    const lastSeenField=deskMissing?`<div class="o-time-stepper">${field('radio-time','Last seen time',roundedTime(),'time')}<button type="button" class="o-button" data-testid="radio-time-earlier">Earlier by 10 min</button></div>`:instructor?`${field('radio-time','Last seen time',defaultTime,'time')}<p class="o-note">Defaults to local time; tap to edit. <strong data-testid="radio-time-auto">${e(formatTime12(defaultTime))}</strong></p>`:field('radio-time','Last seen time','','time');
    const reportTitle=instructor||deskMissing?'Report missing child':'Log a received radio report';
    const reportNote=instructor?'This prepares a demo report for Patrol. Call by radio; this app does not transmit radio.':deskMissing?'Review the details, add where and when the child was last seen, then save the report for Patrol. This does not send a radio message.':'Record the report received by the desk.';
    show(reportTitle, `<p class="o-warning">${reportNote}</p><form id="radio-form">${(instructor||deskMissing)&&row ? `<p><strong>${e(row.displayName)}</strong> · Bib ${e(row.bib)} · ${e(row.group?.label||'Group not recorded')}</p>` : `<label>Child<select data-testid="radio-child" required><option value="">Choose a child</option>${(instructor ? own().filter(r=>r.status==='checked_in'&&!r.release) : rows()).map(r=>`<option value="${e(r.childId)}">${e(r.displayName)} · Bib ${e(r.bib)}</option>`).join('')}</select></label>`}${lastSeenField}${deskMissing?'<p class="o-form-error" data-testid="radio-time-error" hidden>Last seen time cannot be in the future.</p>':''}${field('radio-place','Last seen place',initial.place)}${field('radio-clothing','Clothing',initial.clothing)}${field('radio-equipment','Skis, helmet and other equipment',initial.equipment)}${field('radio-injuries','Injuries',initial.concerns)}${instructor ? '' : field('radio-staff',deskMissing?'Reporting staff':'Receiving staff')}${deskMissing?'':`<button class="o-button o-primary" data-testid="radio-save">${instructor?'Save report for Desk and Patrol':'Save received report'}</button>`}</form>`, undefined, false, deskMissing ? 'report' : '');
    if(deskMissing){const time=get('radio-time');time.max=currentTime();time.step=600;get('radio-time-earlier').onclick=()=>{const [hours,minutes]=time.value.split(':').map(Number);const total=Math.max(0,hours*60+minutes-10);time.value=`${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;time.dispatchEvent(new Event('input',{bubbles:true}));};}
    if(instructor)get('radio-time').addEventListener('input',event=>{get('radio-time-auto').textContent=formatTime12(event.target.value);});
    if (instructor && !row) {
      get('radio-child').addEventListener('change',event=>{
        const child=own().find(candidate=>candidate.childId===event.target.value);
        const details=prefill(child);
        get('radio-place').value='';
        get('radio-clothing').value=details.clothing;
        get('radio-equipment').value=details.equipment;
        get('radio-injuries').value='';
      });
    }
    dialog.querySelector('#radio-form').onsubmit = event => {
      event.preventDefault();
      if(deskMissing&&value('radio-time')>currentTime()){get('radio-time-error').hidden=false;get('radio-time').setCustomValidity('Last seen time cannot be in the future.');get('radio-time').reportValidity();return;}
      const child = instructor ? (row || own().find(r=>r.childId===value('radio-child'))) : deskMissing ? row : rows().find(r=>r.childId===value('radio-child'));
      if (!child) return;
      const report = {childId:child.childId, name:child.displayName,bib:child.bib,time:formatTime12(value('radio-time')),place:value('radio-place'),clothing:value('radio-clothing'),equipment:value('radio-equipment'),injuries:value('radio-injuries'),staff:instructor ? '' : value('radio-staff')};
      if (instructor||deskMissing) {
        sendPatrolAlert(child, report, instructor?'Instructor':'School desk');
        if(deskMissing){close();render(role,tab);const status=document.createElement('p');status.className='o-alert-sent';status.setAttribute('role','status');status.textContent=`Missing-child report saved for Patrol for ${child.displayName}.`;root.prepend(status);return;}
        render(role, tab);
        show('Missing child report', `<p class="o-alert o-alert-sent" role="status" data-testid="radio-alert-status">Report saved for Desk and Patrol</p><section data-testid="radio-checklist">${reportBody(report)}<p class="o-note">Radio: <strong>Not sent</strong>. Call Desk and Patrol by physical radio. No radio message was sent.</p></section>`);
      }
      else { seed.incidents.push(report); onChange(); close(); render(role,tab); }
    };
  }
  const reportBody = r => `<h3>${e(r.name)} · Bib ${e(r.bib)}</h3><dl class="o-facts"><div><dt>Last seen</dt><dd>${e(r.time)} · ${e(r.place)}</dd></div><div><dt>Clothing</dt><dd>${e(r.clothing)}</dd></div><div><dt>Equipment</dt><dd>${e(r.equipment)}</dd></div><div><dt>Injuries / concerns</dt><dd>${e(r.injuries)}</dd></div>${r.staff ? `<div><dt>Received by</dt><dd>${e(r.staff)}</dd></div>` : ''}</dl>`;
  function list() {
    const matches = own().filter(row=>(!groupFilter || row.groupId===groupFilter) && (programFilter==='all' || programDay(row)===programFilter) && (statusFilter==='all' || statusFilter==='consent' && row.consentStatus!=='complete' || statusFilter==='medical' && row.medicalStatus==='alert' || statusFilter==='to_release' && row.status==='checked_in' && !row.release || statusFilter==='checked_in' && row.status==='checked_in' && !row.release || statusFilter==='expected' && row.status==='expected' && !row.release) && [row.displayName,row.alternateName,row.bib,row.group?.label,row.id].some(v=>String(v??'').toLowerCase().includes(query.trim().toLowerCase())));
    page = Math.max(0, Math.min(page,Math.ceil(matches.length/pageSize)-1));
    const visible = role==='instructor' ? matches : matches.slice(page*pageSize,(page+1)*pageSize);
    if(role==='instructor') {
      const checkedIn=visible.filter(row=>row.status==='checked_in'&&!row.release);
      const notCheckedIn=visible.filter(row=>row.status!=='checked_in'||row.release);
      const instructorCards=(children,inactive)=>children.map((row,index)=>{const alert=activePatrolAlert(row);return `<article class="o-roster-row o-instructor-card${inactive?' is-not-checked-in-card':''}" data-testid="roster-row"><div class="o-instructor-child${inactive?' is-not-checked-in':''}"><div class="o-instructor-primary"><span class="o-row-number">${String(index+1).padStart(2,'0')}</span><strong dir="auto">${e(row.displayName)}</strong>${alert?'<span class="o-missing-tag">Missing</span>':''}</div>${instructorMetadata(row)}${inactive&&row.release?'<span class="o-instructor-status">Released</span>':''}</div><div class="o-instructor-actions">${alert?'<span class="o-instructor-alert" role="status">Alert Sent · Searching</span><button type="button" class="o-button o-instructor-found" data-testid="instructor-found-'+e(row.childId)+'">Found child</button>':''}<button type="button" class="o-button o-instructor-view-child" data-testid="ops-open-${e(row.childId)}" ${inactive?'disabled aria-label="View child unavailable until checked in"':''}>View child</button></div></article>`;}).join('');
      root.querySelector('#ops-list').innerHTML=instructorCards(checkedIn,false)||'<p class="o-empty">No children are checked in yet.</p>';
      root.querySelector('#not-checked-list').innerHTML=instructorCards(notCheckedIn,true)||'<p class="o-empty">All assigned children are checked in.</p>';
      root.querySelector('[data-testid="instructor-not-checked-count"]').textContent=String(notCheckedIn.length);
    } else {
      root.querySelector('#ops-list').innerHTML = matches.length ? visible.map(row=>{const missing=activePatrolAlert(row);return `<article class="o-roster-row o-desk-child-card" data-testid="desk-child-card-${e(row.childId)}" tabindex="0" role="group" aria-label="${e(row.displayName)} child record; open details"><div class="o-child"><div class="o-child-title"><strong dir="auto">${e(row.displayName)}</strong><span class="o-status">${status(row)}</span>${missing?'<span class="o-missing-tag">Missing</span>':''}</div>${metadata(row)}${row.consentStatus !== 'complete' ? '<span class="o-warning-text">Consent needed</span>' : ''}${row.medicalStatus === 'alert' ? '<span class="o-alert-label">Health note</span>' : ''}</div><div class="o-card-footer"><button type="button" class="o-button o-primary" data-testid="desk-action-${e(row.childId)}" ${row.release ? 'disabled' : ''}>${row.release ? 'Released' : row.status === 'checked_in' ? 'Release' : 'Check-in'}</button></div></article>`;}).join('') : '<p class="o-empty">No children match that search.</p>';
    }
    if(role==='desk') root.querySelectorAll('[data-testid^="desk-report-missing-"],[data-testid^="desk-alert-status-"]').forEach(element=>element.remove());
    for (const row of visible) {
      if(role==='desk') {
        const card=root.querySelector(`[data-testid="desk-child-card-${row.childId}"]`);
        card.onclick=event=>{if(!event.target.closest('button'))detail(row,card);};
        card.onkeydown=event=>{if((event.key==='Enter'||event.key===' ')&&!event.target.closest('button')){event.preventDefault();detail(row,card);}};
        root.querySelector(`[data-testid="desk-action-${row.childId}"]`).onclick=event=>{event.stopPropagation();if(!row.release)attendanceAction(row,row.status==='checked_in'?'release':'checkin',event.currentTarget);};
      } else {
        root.querySelector(`[data-testid="ops-open-${row.childId}"]`)?.addEventListener('click',event=>detail(row,event.currentTarget));
        root.querySelector(`[data-testid="instructor-found-${row.childId}"]`)?.addEventListener('click',()=>{
          const alert=activePatrolAlert(row);if(!alert)return;
          const clock=new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
          alert.active=false;alert.status='Found';alert.foundTime=clock;
          alert.foundBy='Instructor';
          alert.systemLog=[...(alert.systemLog||[]),{time:clock,action:'Child marked found',actor:'Instructor'}];
          onChange();list();
        });
      }
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
    if(role==='instructor'&&tab==='Alerts') notifications.forEach(item=>{item.read=true;});
    if(role==='desk'&&tab==='Alerts') deskNotifications.forEach(item=>{item.read=true;});
    updateAlertTab();
    root.replaceChildren();
    const assigned = own();
    const groupNames = [...new Set(assigned.map(r=>r.group?.label).filter(Boolean))].join(', ');
    const activeAssigned=assigned.filter(r=>r.status==='checked_in'&&!r.release);
    const levelLabel=[...new Set(assigned.map(r=>r.group?.level).filter(Boolean))].join(', ')||'Level not recorded';
    const medicalAlerts=activeAssigned.filter(r=>r.medicalStatus==='alert');
    if(role==='desk'&&tab==='Alerts'){
      root.innerHTML=`<div class="i-alerts-heading"><div><h2>Alerts</h2><p>School updates and missing-child reports.</p></div></div><section class="i-alerts-page" data-testid="desk-alerts" aria-label="School desk alerts"></section>`;
      renderNotifications();
      return;
    }
    if(role==='instructor'&&tab==='Alerts'){
      root.innerHTML=`<div class="i-alerts-heading"><div><h2>Alerts</h2><p>${e(groupNames||'Your assigned group')} · Instructor updates</p></div></div><section class="i-alerts-page" data-testid="instructor-alerts" aria-label="Instructor alerts"></section>`;
      renderNotifications();
      return;
    }
    const medicalPanel = role === 'instructor' ? `<section class="o-medical-list" data-testid="instructor-medical"><header class="o-medical-header"><div><span class="o-medical-eyebrow">Safety overview</span><h3>Medical alerts</h3></div><span class="o-medical-count">${medicalAlerts.length?`${medicalAlerts.length} ${medicalAlerts.length===1?'alert':'alerts'}`:'None today'}</span></header>${medicalAlerts.map(r=>`<article class="o-medical-item"><div class="o-medical-item-heading"><span class="o-medical-mark" aria-hidden="true">!</span><strong>${e(r.displayName)}</strong><span class="o-medical-tag">Medical alert</span></div><p>${e(r.medical)}</p></article>`).join('')||'<p class="o-medical-clear">No medical alerts for children checked in today.</p>'}</section>` : '';
    root.innerHTML = `<div class="o-heading"><div><h2>${role === 'instructor' ? groupNames || 'No group assigned' : tab === 'Pickup' ? 'Verify every pickup' : 'Lesson-day roster'}</h2><p>${role === 'instructor' ? `Alex Morgan · ${e(levelLabel)} · ${e(assigned[0]?.group?.meeting || 'Meeting place not recorded')}` : `${assigned.filter(r=>r.status==='checked_in'&&!r.release).length} checked in · ${assigned.filter(r=>r.status==='expected').length} expected · ${assigned.filter(r=>r.release).length} released`}</p></div></div>${role === 'instructor' ? '' : `<label class="o-search">Find a child<input type="search" placeholder="Name, bib or group" data-testid="roster-search" value="${e(query)}"></label>`}${role === 'desk' ? `<div class="o-filters"><label>Group<select data-testid="roster-group"><option value="">All groups</option>${seed.groups.map(g=>`<option value="${e(g.id)}" ${groupFilter===g.id?'selected':''}>${e(g.label)}</option>`).join('')}</select></label><label>Status<select data-testid="roster-status">${[['all','All children'],['expected','Expected'],['checked_in','Checked in'],['consent','Consent needed'],['medical','Medical alert'],['to_release','To be released']].map(([v,t])=>`<option value="${v}" ${statusFilter===v?'selected':''}>${t}</option>`).join('')}</select></label></div>` : ''}${medicalPanel}${role === 'instructor' ? `<section class="o-group-card" aria-label="Today’s Group"><div class="o-roster-heading"><h3>Today’s Group</h3><span>${activeAssigned.length} checked in</span></div><div class="o-list" id="ops-list"></div></section><section class="o-group-card o-not-checked-card" aria-label="Not Checked In"><div class="o-roster-heading"><h3>Not Checked In</h3><span data-testid="instructor-not-checked-count">0</span></div><div class="o-list" id="not-checked-list"></div></section>` : '<div class="o-list" id="ops-list"></div>'}${role==='desk'?'<div id="ops-pagination" class="o-pagination"></div>':''}${role==='instructor'?'':`<p class="o-footer">Demo edits stay on this page and reset on reload.</p>`}${role==='instructor'?`<div class="instructor-report-cta"><button type="button" class="o-button o-danger" data-testid="instructor-report-missing" ${activeAssigned.length?'':'disabled'}>Report missing child</button></div>`:''}`;
    if(role==='desk') {
      root.querySelector('.o-heading')?.remove();
      const counts=document.createElement('p');counts.className='o-desk-summary';counts.textContent=`${assigned.filter(r=>r.status==='checked_in'&&!r.release).length} checked in · ${assigned.filter(r=>r.status==='expected').length} expected · ${assigned.filter(r=>r.release).length} released`;
      root.querySelector('.o-search').after(counts);
      const label=document.createElement('label');label.textContent='Program day';
      const select=document.createElement('select');select.dataset.testid='roster-program';
      for(const [value,text] of [['all','All days'],['sat','Saturday'],['sun','Sunday']]) select.add(new Option(text,value));
      select.value=programFilter;label.append(select);root.querySelector('.o-filters').append(label);
      select.addEventListener('change',event=>{programFilter=event.target.value;page=0;list();});
    }
    root.querySelector('[data-testid="roster-search"]')?.addEventListener('input',event=>{query=event.target.value;page=0;list();});
    root.querySelector('[data-testid="roster-group"]')?.addEventListener('change',event=>{groupFilter=event.target.value;page=0;list();});
    root.querySelector('[data-testid="roster-status"]')?.addEventListener('change',event=>{statusFilter=event.target.value;page=0;list();});
    root.querySelector('[data-testid="instructor-report-missing"]')?.addEventListener('click',()=>radio());
    if(role==='desk') {
      const layout=document.createElement('div');layout.className='o-desk-layout';
      const rail=document.createElement('section');rail.className='o-desk-roster';rail.dataset.testid='desk-roster';rail.setAttribute('aria-label','Lesson-day roster');
      for(const element of root.querySelectorAll('.o-search,.o-desk-summary,.o-filters,#ops-list,#ops-pagination')) rail.append(element);
      const panel=document.createElement('aside');panel.id='desk-detail';panel.className='o-dialog o-inline-detail';panel.dataset.testid='desk-detail';panel.setAttribute('aria-label','Selected child details');
      panel.innerHTML='<p class="o-empty">Select a child from the roster to review their details.</p>';
      layout.append(rail,panel);root.insertBefore(layout,root.querySelector('.o-footer'));
    }
    list();
  }
  return {render, clear(){root.replaceChildren();query='';groupFilter='';statusFilter='all';programFilter='all';page=0;close();}};
}
