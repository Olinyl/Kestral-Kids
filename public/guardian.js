export function createGuardian(root, seed) {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let selected = null;
  const consentDates = {};
  const updatedDate = child => consentDates[child.id] || (child.consentStatus === 'complete' && child.consentUpdatedAt ? new Intl.DateTimeFormat('en-CA',{timeZone:'UTC',year:'numeric',month:'short',day:'numeric'}).format(new Date(child.consentUpdatedAt+'T00:00:00Z')) : '');
  function render(tab) {
    const children = seed.children.filter(child => child.guardianId === 'demo-guardian-01');
    const active = children.find(child => child.id === selected) || children[0];
    root.innerHTML = `<section class="g-home"><p class="g-eyebrow">PARENT / GUARDIAN</p><h2>${tab === 'My children' ? 'Your children' : 'Consent form'}</h2><p class="g-intro">Children registered through your Kestrel Kids store account.</p>
      ${children.map(child => `<div class="g-child-row"><button class="g-child ${active?.id===child.id?'selected':''}" data-child="${esc(child.id)}"><span class="g-child-name"><strong>${esc(child.displayName)}</strong><span class="g-state ${child.consentStatus==='complete'?'done':''}">${child.consentStatus==='complete'?'Profile complete':'Consent needed'}</span><small>Born ${esc(child.birthDate)}</small>${updatedDate(child)?`<small>Consent last updated ${esc(updatedDate(child))}</small>`:''}</span></button>${child.consentStatus==='complete'?`<button class="g-button secondary g-review" data-consent="${esc(child.id)}">Review or edit consent</button>`:''}</div>`).join('')}
      ${active && active.consentStatus!=='complete' ? `<article class="g-profile"><div class="g-profile-head"><div><p class="g-eyebrow">CHILD PROFILE</p><h3>${esc(active.displayName)}</h3><p>Date of birth · ${esc(active.birthDate)}</p>${consentDates[active.id]?`<p class="g-updated">Consent last updated ${esc(consentDates[active.id])}</p>`:''}</div><span class="g-state">Action needed</span></div>
      ${active.consentStatus!=='complete'?`<div class="g-alert" role="status"><strong>Consent form needed</strong><p>Complete the consent form to finish ${esc(active.displayName)}’s profile.</p><button class="g-button" data-consent="${esc(active.id)}">Complete consent</button></div>`:`<div class="g-consent"><h4>Consent details</h4><p>Emergency contacts, medical information, allergies, pickup adults, photo choice and signature are on file.</p><button class="g-button secondary" data-consent="${esc(active.id)}">Review or edit consent</button></div>`}</article>`:''}</section>`;
    root.querySelectorAll('[data-child]').forEach(button => button.onclick=()=>{selected=button.dataset.child;render(tab)});
    root.querySelectorAll('[data-consent]').forEach(button=>{button.onclick=event=>{event.stopPropagation();consent(children.find(child=>child.id===button.dataset.consent));};button.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();consent(children.find(child=>child.id===button.dataset.consent));}}});
  }
  function consent(child) {
      root.innerHTML = `<section class="g-home"><button class="g-back" data-back>← Your children</button><p class="g-eyebrow">CONSENT FORM</p><h2>${esc(child.displayName)}</h2><form class="g-form"><div class="g-registration-note">These details come from registration and cannot be changed here.</div><div class="g-locked"><label>Child’s name<input value="${esc(child.displayName)}" readonly></label><label>Date of birth<input value="${esc(child.birthDate)}" readonly></label></div><h3>Emergency contacts</h3><p>Provide a name, phone number and relationship for each contact.</p><div class="g-contact"><label>Contact 1 name<input value="${esc(child.emergencyName)}"></label><label>Phone number<input type="tel" value="${esc(child.emergencyPhone)}"></label><label>Relationship<input placeholder="For example, parent"></label></div><div class="g-contact"><label>Contact 2 name<input placeholder="Full name"></label><label>Phone number<input type="tel" placeholder="Phone number"></label><label>Relationship<input placeholder="For example, family friend"></label></div><h3>Health information</h3><label>Medical conditions<textarea placeholder="List medical conditions">${esc(child.medical)}</textarea></label><label>Medications and where they are kept<textarea placeholder="List medications and where each is kept"></textarea></label><label>Allergies<input placeholder="List allergies or enter none"></label><h3>Authorized pickup adults</h3><p>Add each adult as <strong>name (relationship)</strong>.</p><div class="g-tags" data-tags><div class="g-tag-list" aria-live="polite"></div><input data-tag-input placeholder="Type a name and relationship, then press Enter"></div><label class="g-check"><input type="checkbox"> I give permission for photos</label><label>Guardian signature<input placeholder="Type full name"></label><label>Date<input type="date"></label><button class="g-button" type="submit">Save consent</button></form></section>`;
    root.querySelector('[data-back]').onclick=()=>render('My children');
    const tagInput=root.querySelector('[data-tag-input]'), tags=root.querySelector('.g-tag-list');
    tagInput.addEventListener('keydown',event=>{if(event.key==='Enter'&&tagInput.value.trim()){event.preventDefault();const tag=document.createElement('span');tag.className='g-tag';tag.textContent=tagInput.value.trim();const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Remove '+tagInput.value.trim());remove.onclick=()=>tag.remove();tag.append(remove);tags.append(tag);tagInput.value='';}});
    const form=root.querySelector('form');
    const fields=['displayName','birthDate','emergencyName','emergencyPhone','emergencyRelationship','emergencyName2','emergencyPhone2','emergencyRelationship2','medical','medications','allergies','pickupInput','photoPermission','guardianSignature','consentDate'];
    const required=new Set(['emergencyName','emergencyPhone','emergencyRelationship','emergencyName2','emergencyPhone2','emergencyRelationship2','guardianSignature','consentDate']);
    form.querySelectorAll('input,textarea').forEach((input,index)=>{
      const name=fields[index]; input.name=name;input.dataset.testid='consent-'+name;
      input.required=required.has(name);
      if(input.type==='checkbox') input.checked=Boolean(child[name]);
      else if(name!=='pickupInput') input.value=child[name]||'';
    });
    const priorAdults=child.pickupAdults||[];
    for(const adult of priorAdults) {tagInput.value=adult.name+' ('+adult.relationship+')';tagInput.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}));}
    form.noValidate=true;
    const today=new Date();
    form.querySelector('input[type=date]').value=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
    form.addEventListener('input',event=>{
      event.target.classList.remove('g-invalid');
      if(event.target.type==='tel'){
        const digits=event.target.value.replace(/\D/g,'').slice(0,11);
        event.target.value=digits.length>10?`+${digits[0]} ${digits.slice(1,4)} ${digits.slice(4,7)} ${digits.slice(7)}`:digits.length>6?`${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`:digits.length>3?`${digits.slice(0,3)}-${digits.slice(3)}`:digits;
      }
    });
    form.onsubmit=event=>{
      event.preventDefault();
      form.querySelectorAll('.g-error').forEach(error=>error.remove());
      form.querySelectorAll('.g-contact input').forEach(input=>input.setCustomValidity(''));
      if(tagInput.value.trim()) tagInput.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}));
      const contacts=[...form.querySelectorAll('.g-contact')];
      const contactComplete=contacts.map(section=>[...section.querySelectorAll('input')].map(input=>input.value.trim()));
      const errors=[];
      const mark=element=>element?.classList.add('g-invalid');
      if(!contactComplete.some(contact=>contact.every(Boolean))){errors.push('Complete at least one emergency contact, including their name, phone number and relationship.');const partialIndex=contactComplete.findIndex(contact=>contact.some(Boolean));const target=partialIndex<0?0:partialIndex;contacts[target].querySelectorAll('input').forEach((input,index)=>{if(!contactComplete[target][index])mark(input);});}
      for(const [index,contact] of contactComplete.entries()){
        if(contact.some(Boolean)&&!contact.every(Boolean)){errors.push(`Finish all details for emergency contact ${index+1}.`);contacts[index].querySelectorAll('input').forEach((input,i)=>{if(!contact[i])mark(input);});}
        if(contact[1]){const digits=contact[1].replace(/\D/g,'');if(!(digits.length===10||(digits.length===11&&digits.startsWith('1')))){errors.push(`Enter a valid phone number for emergency contact ${index+1}.`);mark(contacts[index].querySelectorAll('input')[1]);}}
      }
      const conditions=form.querySelector('textarea[placeholder="List medical conditions"]'),medications=form.querySelector('textarea[placeholder="List medications and where each is kept"]'),allergies=form.querySelector('input[placeholder="List allergies or enter none"]'),tagsBox=form.querySelector('.g-tags'),signature=form.querySelector('input[placeholder="Type full name"]'),date=form.querySelector('input[type=date]');
      if(!conditions.value.trim()){errors.push('Enter medical conditions or write “None”.');mark(conditions);}
      if(!medications.value.trim()){errors.push('Enter medications and where they are kept, or write “None”.');mark(medications);}
      if(!allergies.value.trim()){errors.push('Enter allergies or write “None”.');mark(allergies);}
      if(!form.querySelector('.g-tag-list').children.length){errors.push('Add at least one authorized pickup adult.');mark(tagsBox);}
      if(!signature.value.trim()){errors.push('Enter your signature.');mark(signature);}
      if(!date.value){errors.push('Enter the signature date.');mark(date);}
      if(errors.length){const message=document.createElement('div');message.className='g-error';message.setAttribute('role','alert');message.innerHTML='<strong>Please complete these items:</strong><ul>'+errors.map(error=>`<li>${esc(error)}</li>`).join('')+'</ul>';form.prepend(message);message.scrollIntoView({behavior:'smooth',block:'center'});return;}
      consentDates[child.id]=new Intl.DateTimeFormat('en-CA',{timeZone:'UTC',year:'numeric',month:'short',day:'numeric'}).format(new Date());
      for(const name of fields.slice(2)) {
        if(name==='pickupInput') continue;
        const input=form.elements.namedItem(name);
        child[name]=input.type==='checkbox'?input.checked:input.value.trim();
      }
      child.pickupAdults=[...tags.querySelectorAll('.g-tag')].map(tag=>{
        const text=tag.firstChild.textContent.trim();const match=/^(.*) \((.*)\)$/.exec(text);
        const name=match?match[1]:text, relationship=match?match[2]:'Authorized adult';
        return {...priorAdults.find(adult=>adult.name===name),name,relationship};
      });
      child.consentStatus='complete';render('My children');
    };
  }
  return {render,clear(){root.replaceChildren()}};
}
