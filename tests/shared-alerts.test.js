import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAlertStore} from '../public/alerts.js';
const fixture=()=>JSON.parse(readFileSync(new URL('../demo-fixture.json',import.meta.url),'utf8'));
const director={id:'director',role:'director'},desk={id:'desk',role:'desk'},teacher={id:'instructor',role:'instructor',instructorId:'demo-instructor-01'},parent={id:'guardian',role:'guardian',guardianId:'demo-guardian-01'},otherParent={id:'other',role:'guardian',guardianId:'demo-guardian-02'},patrol={id:'patrol',role:'patrol'};
test('instructor recipients are scoped and a crafted foreign group is rejected atomically',()=>{
 const seed=fixture(),store=createAlertStore(seed);
 assert.deepEqual(store.groupsFor(teacher).map(g=>g.id),['spruce-3']);
 assert.throws(()=>store.send(teacher,{category:'Lesson delayed',groupIds:['cedar-1'],message:'Meet at the flag.'}),/assigned/i);
 assert.equal(store.list(parent).filter(n=>n.type==='group').length,0);
 store.send(teacher,{category:'Lesson delayed',groupIds:['spruce-3'],message:'Meet at the flag.'});
 assert.equal(store.list(parent).filter(n=>n.type==='group').length,1);
 assert.equal(store.list(otherParent).filter(n=>n.type==='group').length,0);
 assert.equal(store.list(patrol).filter(n=>n.type==='group').length,0);
});
test('Director and Desk support school-wide notices and read state belongs to each recipient',()=>{
 const seed=fixture(),store=createAlertStore(seed);
 const notice=store.send(desk,{category:'Early pickup — weather',groupIds:seed.groups.map(g=>g.id),message:'Collect at the kids’ centre.'});
 store.markRead(parent,notice.id);
 assert.equal(store.list(parent).find(n=>n.id===notice.id).read,true);
 assert.equal(store.list(otherParent).find(n=>n.id===notice.id).read,false);
 assert.ok(store.list(director).some(n=>n.id===notice.id));
 assert.throws(()=>store.send(parent,{category:'Lesson delayed',groupIds:['spruce-3']}),/permission/i);
});
test('an active case survives reading and clearing; Patrol loses its closed notification and link',()=>{
 const seed=fixture(),store=createAlertStore(seed),notice=store.list(patrol).find(n=>n.type==='incident');assert.ok(notice);
 store.markRead(patrol,notice.id);store.clear(patrol);assert.ok(store.list(patrol).some(n=>n.id===notice.id));
 seed.patrolAlerts[0].active=false;seed.patrolAlerts[0].status='Found';
 assert.equal(store.list(patrol).length,0);assert.throws(()=>store.open(patrol,notice.id),/available/i);
});
test('a new parent account has no inherited family alerts',()=>{
 const seed=fixture(),store=createAlertStore(seed);store.send(director,{category:'Group update',groupIds:seed.groups.map(g=>g.id),message:'School update.'});
 assert.deepEqual(store.list({id:'new-parent',role:'guardian',guardianId:'not-linked'}),[]);
});
