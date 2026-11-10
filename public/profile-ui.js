const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const relationshipGroups = [
  ['Immediate family', ['Spouse', 'Partner/Significant Other', 'Parent', 'Mother', 'Father', 'Child', 'Sibling']],
  ['Extended family and guardians', ['Grandparent', 'Aunt/Uncle', 'Cousin', 'Legal Guardian']],
  ['Other relationships', ['Friend', 'Neighbour', 'Co-worker', 'Other']],
];

export function relationshipOptions(selected = '') {
  const groups = relationshipGroups.map(([label, choices]) =>
    `<optgroup label="${escape(label)}">${choices.map(choice =>
      `<option value="${escape(choice)}"${choice === selected ? ' selected' : ''}>${escape(choice)}</option>`
    ).join('')}</optgroup>`
  );
  const saved = selected && !relationshipGroups.some(([, choices]) => choices.includes(selected))
    ? `<option value="${escape(selected)}" selected>${escape(selected)}</option>`
    : '';
  return '<option value="">Choose a relationship</option>' + saved + groups.join('');
}

export function phoneValid(value) {
  const phone = String(value ?? '').trim();
  return /^\+?[\d\s().-]+$/.test(phone) && /^\d{10,15}$/.test(phone.replace(/\D/g, ''));
}

export function formatPhone(value) {
  const phone = String(value ?? '').trim();
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const national = !phone.startsWith('+') && digits.length === 10
    ? digits
    : digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : null;
  return national ? `+1 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}` : '+' + digits;
}

export function medicalStatusFromDetails({medical, medications, allergies}) {
  const details = [medical, medications, allergies].map(value => String(value ?? '').trim()).filter(Boolean);
  if (!details.length) return '';
  const noDetails = /^(?:none(?: reported)?|no (?:known )?(?:medical )?(?:conditions(?: or allergies)?|medications|allergies)(?: reported(?: by (?:the )?guardian)?)?)[.!]?$/i;
  return details.some(value => !noDetails.test(value)) ? 'alert' : 'none';
}

export function lessonDetails(seed, child) {
  const attendance=seed.attendance.find(row=>row.childId===child.id);
  const group=seed.groups.find(group=>group.id===attendance?.groupId);
  return {
    group:group?.label || '',
    program:(child.program || child.storeRegistration?.program || group?.program || '').replace(/^Kestrel Kids,\s*/i,''),
    level:child.abilityLevel || group?.level || '',
    bib:attendance?.bib || '',
  };
}

export function profileMeta(values) {
  const labels={group:'Group',program:'Program',level:'Level',bib:'Bib'};
  const missing={group:'Unassigned',program:'Not recorded',level:'Not recorded',bib:'Not assigned'};
  const colorClass=(key,value)=>{
    if(!value) return ' profile-meta-unknown';
    if(key==='group') {
      const name=String(value).split('·')[0].trim().toLowerCase();
      const hash=[...name].reduce((hash,char)=>(hash*31+char.codePointAt(0))>>>0,0);
      return ' profile-group-tone-'+hash%9;
    }
    if(key==='program') {
      const saturday=/\bsat(?:urday)?\b/i.test(value),sunday=/\bsun(?:day)?\b/i.test(value);
      return saturday!==sunday ? (saturday ? ' profile-program-saturday' : ' profile-program-sunday') : '';
    }
    return '';
  };
  return `<dl class="profile-meta">${Object.entries(values).map(([key,value])=>`<div class="profile-meta-item profile-meta-${key}${key==='bib' ? ' bib' : ''}${colorClass(key,value)}" data-testid="profile-${key}"><dt${key!=='bib' ? ' class="profile-meta-label"' : ''}>${labels[key]}</dt>${key==='bib'?' ':''}<dd>${escape(value || missing[key])}</dd></div>`).join('')}</dl>`;
}

export const childMeta = (seed,child) => profileMeta(lessonDetails(seed,child));
