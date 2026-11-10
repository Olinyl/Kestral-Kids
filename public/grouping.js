// UI-side planning for the fictional-data preview. No records are saved here.
export function planAssignments(seed, {mode='unassigned'} = {}) {
  const groups=new Map(seed.groups.map(group=>[group.id,group]));
  const instructors=new Set(seed.instructors.map(person=>person.id));
  const children=new Map(seed.children.map(child=>[child.id,child]));
  const day=value=>String(value||'').match(/Saturday|Sunday/i)?.[0].toLowerCase();
  const sameDay=(group,child)=>!day(group.program)||!day(child.storeRegistration?.program||child.program)||day(group.program)===day(child.storeRegistration?.program||child.program);
  const protectedRow=row=>Boolean(row.release)||row.status==='checked_in'||(seed.patrolAlerts||[]).some(alert=>alert.active!==false&&alert.childId===row.childId);
  // Existing placements are eligible only when their current group can safely keep them.
  const movable=new Set(mode==='rebalance'?seed.attendance.filter(row=>{
    const group=groups.get(row.groupId),child=children.get(row.childId);
    return group&&child&&!protectedRow(row)&&group.level===child.abilityLevel&&instructors.has(group.instructorId)&&sameDay(group,child);
  }).map(row=>row.childId):[]);
  const counts=new Map(), groupCounts=new Map();
  for(const row of seed.attendance) {
    const group=groups.get(row.groupId);
    if(group&&!movable.has(row.childId)) {counts.set(group.instructorId,(counts.get(group.instructorId)||0)+1);groupCounts.set(group.id,(groupCounts.get(group.id)||0)+1);}
  }
  const plan=[];
  const roster=[...seed.attendance].sort((a,b)=>Number(movable.has(b.childId))-Number(movable.has(a.childId)));
  for(const row of roster) {
    if(groups.has(row.groupId)&&!movable.has(row.childId)) continue;
    const child=children.get(row.childId);
    if(!child) continue;
    const entry={childId:child.id,name:child.displayName,level:child.abilityLevel||'',previousGroupId:row.groupId||'',previousGroupLabel:groups.get(row.groupId)?.label||'Unassigned',groupId:'',groupLabel:'',reason:''};
    if(protectedRow(row)) entry.reason='Checked in, released or under an active alert — manual review required';
    else if(!/^Level [1-6]$/.test(child.abilityLevel||'')) entry.reason='No recorded ability level';
    else {
      const matching=seed.groups.filter(group=>group.level===child.abilityLevel && instructors.has(group.instructorId)&&sameDay(group,child));
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
