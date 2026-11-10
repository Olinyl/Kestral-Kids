import {expect,test} from '@playwright/test';
import {planAssignments} from '../public/grouping.js';

test('rebalancing preserves checked-in and missing children while spreading expected children',()=>{
  const seed={instructors:[{id:'i1'},{id:'i2'}],groups:[{id:'g1',label:'Group 1',level:'Level 1',instructorId:'i1'},{id:'g2',label:'Group 2',level:'Level 1',instructorId:'i2'}],children:Array.from({length:6},(_,i)=>({id:'c'+i,displayName:'Child '+i,abilityLevel:'Level 1'})),attendance:Array.from({length:6},(_,i)=>({childId:'c'+i,groupId:'g1',status:i===0?'checked_in':'expected'})),patrolAlerts:[{childId:'c1',active:true}]};
  expect(planAssignments(seed)).toHaveLength(0);
  const plan=planAssignments(seed,{mode:'rebalance'});
  expect(plan.map(item=>item.childId)).not.toContain('c0');
  expect(plan.map(item=>item.childId)).not.toContain('c1');
  expect(plan.some(item=>item.groupId==='g2')).toBeTruthy();
  expect(seed.attendance.every(row=>row.groupId==='g1')).toBeTruthy();
  expect(plan.filter(item=>item.groupId==='g1').length+2).toBeLessThanOrEqual(6);
});
