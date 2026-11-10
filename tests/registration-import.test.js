import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyRegistrationImport,parseRegistrationCsv,registrationCsv} from '../public/registration-import.js';
import {storeImport} from '../public/store-import.js';
const fixture=()=>({lessonDate:'2026-12-12',children:[],guardians:[],attendance:[]});
test('300 registrations populate original shared records without invented consent, pickup or groups',()=>{
 const seed=fixture();const rows=parseRegistrationCsv(registrationCsv(storeImport));
 assert.equal(applyRegistrationImport(seed,rows).added,300);
 assert.equal(seed.children.length,300);assert.equal(seed.attendance.length,300);
 assert.equal(seed.attendance.filter(row=>row.lessonDate==='2026-12-12').length,150);
 assert.equal(seed.attendance.filter(row=>row.lessonDate==='2026-12-13').length,150);
 assert.equal(new Set(seed.children.map(child=>child.program)).size,2);
 assert.ok(seed.children.every(child=>child.consentStatus==='incomplete'&&child.pickupAdults.length===0&&!child.medical));
 assert.ok(seed.attendance.every(row=>!row.groupId&&!row.bib&&row.status==='expected'));
 assert.equal(applyRegistrationImport(seed,rows).unchanged,300);
 assert.equal(seed.children.length,300);
});
test('re-import preserves care, group, bib and release while flagging changed source notes',()=>{
 const seed=fixture();applyRegistrationImport(seed,storeImport);
 const child=seed.children[0],attendance=seed.attendance[0];
 Object.assign(child,{consentStatus:'complete',medical:'Asthma',pickupAdults:[{name:'Verified adult'}]});
 Object.assign(attendance,{groupId:'group-14',bib:'14-237',release:{adult:'Verified adult'}});
 const rows=structuredClone(storeImport);rows[0].childNotes='Updated registration context';
 assert.equal(applyRegistrationImport(seed,rows).updated,1);
 assert.equal(child.consentStatus,'complete');assert.equal(child.medical,'Asthma');assert.equal(child.pickupAdults.length,1);
 assert.equal(attendance.bib,'14-237');assert.equal(attendance.release.adult,'Verified adult');assert.equal(child.registrationNeedsReview,true);
});
test('invalid or conflicting rows leave the roster untouched',()=>{
 const seed=fixture();applyRegistrationImport(seed,storeImport.slice(0,2));const before=structuredClone(seed);
 const rows=structuredClone(storeImport);rows[1].child='Changed identity';
 assert.throws(()=>applyRegistrationImport(seed,rows),/identity/);assert.deepEqual(seed,before);
 const bad=structuredClone(storeImport);bad[200].level='9';assert.throws(()=>applyRegistrationImport(seed,bad),/Ability/);assert.deepEqual(seed,before);
});
