import {lessonDetails,profileMeta,relationshipOptions,phoneValid,formatPhone,medicalStatusFromDetails} from './profile-ui.js';
const childMeta=(seed,child)=>{const {bib,...details}=lessonDetails(seed,child);return profileMeta(details);};
export function createGuardian(root, seed, {onChange = () => {}} = {}) {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let selected = null;
  const consentDialog=document.createElement('dialog');
  consentDialog.className='d-dialog g-consent-dialog';
  consentDialog.setAttribute('aria-labelledby','guardian-consent-title');
  document.body.append(consentDialog);
  const consentDates = {};
  let accountId = seed.guardians[0]?.id;
  let accountHolder = seed.guardians[0]?.name || 'Guardian';
  let children = [];
  const readAlertIds=new Set();
  const programFor = child => lessonDetails(seed,child).program || 'Program not recorded';
  const updatedDate = child => consentDates[child.id] || (child.consentStatus === 'complete' && child.consentUpdatedAt ? new Intl.DateTimeFormat('en-CA',{timeZone:'UTC',year:'numeric',month:'short',day:'numeric'}).format(new Date(child.consentUpdatedAt+'T00:00:00Z')) : '');
  function render(tab) {
    children=seed.children.filter(child=>child.guardianId===accountId);
    accountHolder=seed.guardians.find(person=>person.id===accountId)?.name || accountHolder;
    if(!children.length&&tab!=='Alerts') {root.innerHTML='<section class="g-home"><section class="g-section"><h2>My children</h2><p>No registrations linked to this preview account.</p></section></section>';return;}
    const alerts=(seed.parentAlerts||[]).filter(alert=>alert.guardianId===accountId);
    if(tab==='Alerts') alerts.forEach(alert=>readAlertIds.add(alert.id));
    const unreadAlerts=alerts.filter(alert=>!readAlertIds.has(alert.id));
    const alertTab=document.querySelector('#workspace-nav [data-testid="guardian-nav-alerts"]');
    if(alertTab){
      alertTab.setAttribute('aria-label',`Alerts${unreadAlerts.length?`, ${unreadAlerts.length} unread`:''}`);
      let badge=alertTab.querySelector('.nav-alert-count');
      if(unreadAlerts.length){if(!badge){badge=document.createElement('span');badge.className='nav-alert-count';badge.setAttribute('aria-hidden','true');alertTab.append(badge);}badge.textContent=unreadAlerts.length>9?'9+':String(unreadAlerts.length);}
      else badge?.remove();
    }
    const active = children.find(child => child.id === selected) || children[0];
    const nextLessonDate=child=>{const base=new Date(seed.lessonDate+'T00:00:00Z');const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];const target=days.findIndex(day=>programFor(child).includes(day));if(target<0)return null;const offset=(target-base.getUTCDay()+7)%7;base.setUTCDate(base.getUTCDate()+offset);return base;};
    const programs=[...new Map(children.map(child=>[programFor(child),children.filter(item=>programFor(item)===programFor(child))])).entries()];
    root.innerHTML = `<section class="g-home">${tab === 'Alerts' ? `<div class="i-alerts-heading"><div><h2>Alerts</h2><p>Messages from your school.</p></div></div><section class="i-alerts-page" data-testid="guardian-alerts" aria-label="Guardian alerts"><header class="i-notification-heading"><div><h2>School messages</h2><small>${alerts.length?`${alerts.length} message${alerts.length===1?'':'s'}`:'Updates from your school'}</small></div><span class="i-alerts-count">${alerts.length}</span></header>${alerts.length?`<div class="i-notification-list" aria-live="polite">${alerts.map(alert=>`<article class="i-notification-item"><span class="i-notification-indicator" aria-hidden="true"></span><span class="i-notification-copy">${esc(alert.text)}<small>School message · ${esc(new Date(alert.createdAt).toLocaleString())}</small></span></article>`).join('')}</div>`:'<div class="i-notification-empty"><strong>No alerts yet</strong><small>School updates will appear here.</small></div>'}</section>` : `<h2>Next lessons</h2><article class="g-schedule-card"><div class="g-shared-times"><span>Check-in <strong>8:30–9:15 AM</strong></span><span>Lessons start <strong>9:30 AM</strong></span></div>${programs.map(([program,members])=>`<div class="g-program-row">${profileMeta({program:program==='Program not recorded'?'':program})}<span>${nextLessonDate(members[0]) ? new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(nextLessonDate(members[0])) : 'Date to be confirmed'}</span><span>${members.map(child=>esc(child.displayName)).join(', ')}</span></div>`).join('')}</article><h2 class="g-children-heading">My children</h2>`}
      ${tab === 'My children' ? children.map(child => `<div class="g-child-row"><button class="g-child ${active?.id===child.id?'selected':''}" data-child="${esc(child.id)}"><span class="g-child-name"><span class="g-child-title"><strong>${esc(child.displayName)}</strong></span>${child.consentStatus==='complete'?`<small>Consent on file. Last updated: ${esc(updatedDate(child))}</small>`:`<span class="g-alert-inline">Consent form required</span>`}</span></button>${childMeta(seed,child)}<button class="g-button secondary g-review" data-consent="${esc(child.id)}">${child.consentStatus==='complete'?'Review or edit consent':'Fill consent form'}</button></div>`).join('') : ''}
      </section>`;
    if (tab === 'My children') {
      const home = root.querySelector('.g-home');
      const lessons = document.createElement('section');
      lessons.className = 'g-section';
      lessons.setAttribute('aria-label', 'Next lessons');
      home.prepend(lessons);
      lessons.append(home.querySelector('h2'), home.querySelector('.g-schedule-card'));
      const profiles = document.createElement('section');
      profiles.className = 'g-section';
      profiles.setAttribute('aria-label', 'My children');
      home.append(profiles);
      profiles.append(home.querySelector('.g-children-heading'), ...home.querySelectorAll('.g-child-row'));
    }
    root.querySelectorAll('[data-child]').forEach(button => button.onclick=()=>{selected=button.dataset.child;render(tab)});
    root.querySelectorAll('[data-consent]').forEach(button=>{button.onclick=event=>{event.stopPropagation();consent(children.find(child=>child.id===button.dataset.consent));};button.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();consent(children.find(child=>child.id===button.dataset.consent));}}});
  }
  function consent(child) {
      const template=document.createElement('template');
      template.innerHTML = `<section class="g-home"><div class="g-form-heading"><div><h2>${esc(child.displayName)}</h2><p>Consent form</p></div></div><form class="g-form"><div class="g-registration-note">These details come from registration and cannot be changed here.</div><div class="g-locked"><label>Child’s name<input value="${esc(child.displayName)}" readonly></label><label>Date of birth<input value="${esc(child.birthDate)}" readonly></label></div><h3>Emergency contacts</h3><p>Complete at least one emergency contact. A second contact is optional.</p><div class="g-contact"><label>Contact 1 name<input value="${esc(child.emergencyName)}"></label><label>Phone number<input type="tel" value="${esc(child.emergencyPhone)}"></label><label>Relationship<input placeholder="For example, parent"></label></div><div class="g-contact"><label>Contact 2 name (optional)<input placeholder="Full name"></label><label>Phone number<input type="tel" placeholder="Phone number"></label><label>Relationship<input placeholder="For example, family friend"></label></div><h3>Health information</h3><label>Medical conditions<textarea placeholder="List medical conditions">${esc(child.medical)}</textarea></label><label>Medications and where they are kept<textarea placeholder="List medications and where each is kept"></textarea></label><label>Allergies<input placeholder="List allergies or enter none"></label><h3>Authorized pickup adults</h3><p>Add each adult as <strong>name (relationship)</strong>.</p><div class="g-tags" data-tags><div class="g-tag-list" aria-live="polite"></div><input data-tag-input placeholder="Type a name and relationship, then press Enter"></div><h3>Consent</h3><aside class="g-use"><strong>How your child’s information is used</strong><p>Contact and health details help the school care for your child, respond to emergencies, and release them only to an adult you authorize. Medical details are shared with staff and patrol who need them to support your child’s safety.</p></aside><label class="g-check g-required-check"><input type="checkbox" data-required-check> I confirm the information above is accurate</label><label class="g-check g-required-check"><input type="checkbox" data-required-check> I understand medical details are shared with the staff and patrol who need them</label><label class="g-check g-optional-check"><input type="checkbox"> I give permission for photos <span>(optional)</span></label><label>Guardian signature<input placeholder="Type full name"></label><label>Date<input type="date"></label></form></section>`;
      template.content.querySelectorAll('.g-contact label:last-child').forEach((label,index)=>{
        const select=document.createElement('select');
        select.innerHTML=relationshipOptions(index ? child.emergencyRelationship2 : child.emergencyRelationship);
        label.replaceChild(select,label.querySelector('input'));
      });
      const pickup=template.content.querySelector('.g-tags');
      pickup.className='g-authorized-adults';
      pickup.previousElementSibling.textContent='Add each person with their relationship.';
      pickup.innerHTML=`<div class="g-authorized-entry"><label>Adult name<input data-pickup-name placeholder="Full name"></label><label>Relationship<select data-pickup-relationship>${relationshipOptions()}</select></label><button type="button" class="d-button" data-pickup-add>Add</button></div><div class="g-authorized-list" data-pickup-list aria-live="polite"></div>`;
      const formTemplate=template.content.querySelector('.g-form');
      consentDialog.innerHTML=`<form class="g-dialog-form g-form"><header class="d-dialog-heading"><div><p>Consent form</p><h2 id="guardian-consent-title">${esc(child.displayName)}</h2></div><button type="button" class="d-close" aria-label="Close consent form">×</button></header><div class="d-dialog-body"><div class="g-form-content">${formTemplate.innerHTML}</div></div><footer class="d-dialog-footer"><div><button type="button" class="d-button g-clear">Clear</button><button class="d-button d-primary" type="submit">${child.consentStatus==='complete'?'Save changes':'Submit consent'}</button></div></footer></form>`;
    consentDialog.querySelector('.d-close').onclick=()=>consentDialog.close();
    if(!consentDialog.open) consentDialog.showModal();
    const pickupName=consentDialog.querySelector('[data-pickup-name]'),pickupRelationship=consentDialog.querySelector('[data-pickup-relationship]'),pickupList=consentDialog.querySelector('[data-pickup-list]');
    const pickupRecords = new WeakMap();
    const addPickupAdult = (name, relationship, saved) => {
      const row = document.createElement('div');
      row.className = 'g-authorized-row';
      row.innerHTML = `<span><strong>${esc(name)}</strong><small>${esc(relationship || 'Relationship not recorded')}</small></span><button type="button" class="d-button" aria-label="Remove ${esc(name)}">Remove</button>`;
      pickupRecords.set(row, saved ? {...saved} : {name, relationship});
      row.querySelector('button').onclick = () => row.remove();
      pickupList.append(row);
    };
    consentDialog.querySelector('[data-pickup-add]').onclick=()=>{pickupName.classList.remove('g-invalid');pickupRelationship.classList.remove('g-invalid');if(!pickupName.value.trim()||!pickupRelationship.value){if(!pickupName.value.trim())pickupName.classList.add('g-invalid');if(!pickupRelationship.value)pickupRelationship.classList.add('g-invalid');return;}addPickupAdult(pickupName.value.trim(),pickupRelationship.value);pickupName.value='';pickupRelationship.value='';pickupName.focus();};
    const form=consentDialog.querySelector('form');
    consentDialog.querySelector('.g-clear').onclick=()=>{
      form.querySelectorAll('input:not([readonly]),textarea,select').forEach(input=>{if(input.type==='checkbox') input.checked=false; else input.value='';input.classList.remove('g-invalid');});
      pickupList.replaceChildren();form.querySelectorAll('.g-error').forEach(error=>error.remove());
      consentDialog.querySelector('.d-dialog-body').scrollTo({top:0,behavior:'smooth'});
    };
    const fields=['displayName','birthDate','emergencyName','emergencyPhone','emergencyRelationship','emergencyName2','emergencyPhone2','emergencyRelationship2','medical','medications','allergies','pickupInput','pickupRelationship','confirmAccuracy','confirmSharing','photoPermission','guardianSignature','consentDate'];
    const required=new Set(['guardianSignature','consentDate']);
    form.querySelectorAll('input,textarea,select').forEach((input,index)=>{
      const name=fields[index]; input.name=name;input.dataset.testid='consent-'+name;
      input.required=required.has(name);
      if(input.type==='checkbox') input.checked=Boolean(child[name]);
      else if(name!=='pickupInput') input.value=child[name]||'';
    });
    for(const adult of child.pickupAdults||[]) addPickupAdult(adult.name,adult.relationship,adult);
    form.noValidate=true;
    const today=new Date();
    const dateInput=form.querySelector('input[type=date]');
    if(dateInput && !dateInput.value) dateInput.value=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
    form.addEventListener('input',event=>{
      event.target.classList.remove('g-invalid');
    });
    form.onsubmit=event=>{
      event.preventDefault();
      form.querySelectorAll('.g-error').forEach(error=>error.remove());
      form.querySelectorAll('.g-contact input').forEach(input=>input.setCustomValidity(''));
      const contacts=[...form.querySelectorAll('.g-contact')];
      const contactComplete=contacts.map(section=>[...section.querySelectorAll('input,select')].map(input=>input.value.trim()));
      const errors=[];
      const mark=element=>element?.classList.add('g-invalid');
      if(!contactComplete.some(contact=>contact.every(Boolean))){errors.push('Complete at least one emergency contact, including their name, phone number and relationship.');const partialIndex=contactComplete.findIndex(contact=>contact.some(Boolean));const target=partialIndex<0?0:partialIndex;contacts[target].querySelectorAll('input,select').forEach((input,index)=>{if(!contactComplete[target][index])mark(input);});}
      for(const [index,contact] of contactComplete.entries()){
        if(contact.some(Boolean)&&!contact.every(Boolean)){errors.push(`Finish all details for emergency contact ${index+1}.`);contacts[index].querySelectorAll('input,select').forEach((input,i)=>{if(!contact[i])mark(input);});}
        if(contact[1]&&!phoneValid(contact[1])){errors.push(`Enter a valid phone number for emergency contact ${index+1}.`);mark(contacts[index].querySelectorAll('input')[1]);}
      }
      const conditions=form.querySelector('textarea[placeholder="List medical conditions"]'),medications=form.querySelector('textarea[placeholder="List medications and where each is kept"]'),allergies=form.querySelector('input[placeholder="List allergies or enter none"]'),signature=form.querySelector('input[placeholder="Type full name"]'),date=form.querySelector('input[type=date]');
      if(!conditions.value.trim()){errors.push('Enter medical conditions or write “None”.');mark(conditions);}
      if(!medications.value.trim()){errors.push('Enter medications and where they are kept, or write “None”.');mark(medications);}
      if(!allergies.value.trim()){errors.push('Enter allergies or write “None”.');mark(allergies);}
      if(!pickupList.children.length){errors.push('Add at least one authorized pickup adult.');mark(form.querySelector('.g-authorized-adults'));}
      if(signature && !signature.value.trim()){errors.push('Enter your signature.');mark(signature);}
      if(date && !date.value){errors.push('Enter the signature date.');mark(date);}
      form.querySelectorAll('[data-required-check]').forEach(input=>{if(!input.checked){errors.push('Confirm both required statements.');mark(input);}});
      if(errors.length){const message=document.createElement('div');message.className='g-error';message.setAttribute('role','alert');message.innerHTML='<strong>Please complete these items:</strong><ul>'+errors.map(error=>`<li>${esc(error)}</li>`).join('')+'</ul>';consentDialog.querySelector('.g-form-content').prepend(message);consentDialog.querySelector('.d-dialog-body').scrollTo({top:0,behavior:'smooth'});message.focus?.();return;}
      consentDates[child.id]=new Intl.DateTimeFormat('en-CA',{timeZone:'UTC',year:'numeric',month:'short',day:'numeric'}).format(new Date());
      for(const name of fields.slice(2)) {
        if(name==='pickupInput'||name==='pickupRelationship') continue;
        const input=form.elements.namedItem(name);
        child[name]=input.type==='checkbox'?input.checked:input.type==='tel'?formatPhone(input.value):input.value.trim();
      }
      child.pickupAdults=[...pickupList.querySelectorAll('.g-authorized-row')].map(row=>pickupRecords.get(row));
      child.pickup=child.pickupAdults.map(adult=>adult.name).join('; ');
      child.consentStatus='complete';child.consentUpdatedAt=new Date().toISOString().slice(0,10);child.medicalStatus=medicalStatusFromDetails(child);onChange();consentDialog.close();render('My children');
    };
  }
  return {render,get accountHolder(){return accountHolder;},get accountId(){return accountId;},setAccount(profile){
    accountId=profile.guardianId || profile.id;
    let person=seed.guardians.find(person=>person.id===accountId);
    if(!person && profile.sample){accountHolder=profile.name;selected=null;return;}
    if(!person){person={id:accountId,name:profile.name,email:profile.email,phone:'',relationship:'Guardian'};seed.guardians.push(person);}
    profile.guardianId=person.id;accountHolder=person.name;selected=null;
  },clear(){root.replaceChildren();if(consentDialog.open)consentDialog.close()}};
}
