const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

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
