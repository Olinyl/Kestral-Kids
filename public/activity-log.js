export function recordActivity(seed,{actor,action,childName='',details=''}) {
  seed.activityLog ??= [];
  seed.activityLog.unshift({
    id:`activity-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    actor,
    action,
    childName,
    details,
    changedAt:new Date().toISOString(),
  });
}
