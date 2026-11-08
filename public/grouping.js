// UI-side planning for the fictional-data preview. No records are saved here.
export function planAssignments(seed) {
  const groups=new Map(seed.groups.map(group=>[group.id,group]));
  const instructors=new Set(seed.instructors.map(person=>person.id));
  const children=new Map(seed.children.map(child=>[child.id,child]));
  const counts=new Map(), groupCounts=new Map();
  for(const row of seed.attendance) {
    const group=groups.get(row.groupId);
    if(group) {counts.set(group.instructorId,(counts.get(group.instructorId)||0)+1);groupCounts.set(group.id,(groupCounts.get(group.id)||0)+1);}
  }
  const plan=[];
  for(const row of seed.attendance) {
    if(groups.has(row.groupId)) continue;
    const child=children.get(row.childId);
    if(!child) continue;
    const entry={childId:child.id,name:child.displayName,level:child.abilityLevel||'',groupId:'',groupLabel:'',reason:''};
    if(row.release) entry.reason='Already released';
    else if(!/^Level [1-6]$/.test(child.abilityLevel||'')) entry.reason='No recorded ability level';
    else {
      const matching=seed.groups.filter(group=>group.level===child.abilityLevel && instructors.has(group.instructorId));
      const available=matching.filter(group=>(counts.get(group.instructorId)||0)<6).sort((a,b)=>(groupCounts.get(a.id)||0)-(groupCounts.get(b.id)||0)||a.label.localeCompare(b.label));
      const group=available[0];
      if(!group) entry.reason=matching.length?'No capacity at this ability level':'No matching group with an instructor';
      else {
        entry.groupId=group.id;entry.groupLabel=group.label;
        counts.set(group.instructorId,(counts.get(group.instructorId)||0)+1);
        groupCounts.set(group.id,(groupCounts.get(group.id)||0)+1);
      }
    }
    plan.push(entry);
  }
  return plan;
}
