import {normalizeRegistrations} from './registration-csv.js';
export {parseRegistrationCsv,registrationCsv} from './registration-csv.js';

// Preview adapter: all original role components share these same fixture arrays.
// Real imports must run with a verified staff session through Piezas.
export function applyRegistrationImport(seed,input,actor='Director') {
 const rows=normalizeRegistrations(input);
 const existingFor=row=>seed.children.find(child=>child.sourceOrder===row.orderNumber);
 for(const row of rows){
  const child=existingFor(row);
  if(child&&(child.displayName!==row.child||child.birthDate!==row.birthDate||child.storeRegistration?.email!==row.email||child.program!==row.program||child.abilityLevel!=='Level '+row.level))throw new Error(`Order ${row.orderNumber}: identity, program or ability changed. Review this registration before re-importing.`);
  const id='import-child-'+encodeURIComponent(row.orderNumber);
  if(!child&&seed.children.some(child=>child.id===id))throw new Error(`Order ${row.orderNumber}: child identifier already exists. Review before importing.`);
 }
 let added=0,updated=0;
 for(const row of rows){
  const existing=existingFor(row);
  if(existing){
   if(existing.storeRegistration.childNotes!==row.childNotes||existing.storeRegistration.phone!==row.phone){existing.storeRegistration={...row};existing.registrationNeedsReview=true;updated++;}
   continue;
  }
  let parent=seed.guardians.find(person=>person.email?.toLowerCase()===row.email);
  if(!parent){parent={id:'import-guardian-'+encodeURIComponent(row.email),name:row.accountHolder,email:row.email,phone:row.phone,relationship:row.relationship,source:'Registration import',ownershipVerified:false};seed.guardians.push(parent);}
  const child={id:'import-child-'+encodeURIComponent(row.orderNumber),sourceOrder:row.orderNumber,displayName:row.child,birthDate:row.birthDate,program:row.program,abilityLevel:'Level '+row.level,guardianId:parent.id,storeRegistration:{...row},registrationNeedsReview:Boolean(row.childNotes)||row.contactNeedsReview,consentStatus:'incomplete',medicalStatus:'',medical:'',medications:'',allergies:'',pickupAdults:[],emergencyName:'',emergencyPhone:''};
  seed.children.push(child);
  const lesson=new Date(seed.lessonDate+'T12:00:00Z');
  const day=row.program==='Saturday'?6:0;
  lesson.setUTCDate(lesson.getUTCDate()+(day-lesson.getUTCDay()+7)%7);
  seed.attendance.push({childId:child.id,lessonDate:lesson.toISOString().slice(0,10),groupId:'',bib:'',status:'expected',clothing:'',equipment:''});
  added++;
 }
 const batch={at:new Date().toISOString(),actor,added,updated,unchanged:rows.length-added-updated,total:rows.length};
 (seed.importBatches??=[]).push(batch);
 return batch;
}
