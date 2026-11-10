import {storeImport} from './store-import.js';
import {applyRegistrationImport} from './registration-import.js';

export const demoModes = [
  ['demo', 'Prepared demo'],
  ['registration', 'Empty registration roster'],
  ['imports', '300 sample registrations only'],
  ['200', '200 prepared children'],
  ['1000', '1,000 prepared children'],
  ['worst', 'Long names and other edge cases'],
  ['empty', 'Empty school'],
  ['one', 'One prepared child'],
];

// Local preview only. This module is excluded from both published build folders.
export function prototypeSeed(base, mode) {
  if (mode === 'demo') return base;
  if (mode === 'registration' || mode === 'imports') {
    const seed = {...base, children:[], attendance:[], guardians:[], patrolAlerts:[], incidents:[]};
    if (mode === 'imports') applyRegistrationImport(seed, storeImport);
    return seed;
  }
  const count = {empty:0,one:1,worst:200,'200':200,'1000':1000}[mode] ?? 200;
  const seed = {lessonDate:base.lessonDate,roles:base.roles,patrolAlerts:structuredClone(base.patrolAlerts ?? []),children:[],attendance:[],groups:[],guardians:[],instructors:[],incidents:[]};
  const first = ['Avery','Jordan','Riley','Morgan','Taylor','Sam','Alex','Charlie','Jamie','Casey'];
  const last = ['Patel','Martin','Wilson','Lee','Garcia','Campbell','Brown','Ahmed','Murphy','Tremblay'];
  const extremes = ['Aleksandra Wiśniewska-Kowalczyk','Jo','王秀英','نور الهدى عبد الرحمن',"Seán O'Brien-Ó Súilleabháin",'👩🏽‍💻 Priya','Christopher Alexander Montgomery III'];
  for(let i=0;i<Math.ceil(count/6);i++) {
    const original = base.groups[i];
    const instructor = {...(base.instructors[i] ?? base.instructors[0]),id:base.instructors[i]?.id ?? 'prototype-instructor-'+i,name:base.instructors[i]?.name ?? 'Instructor '+(i+1),email:'instructor'+(i+1)+'@example.test',phone:'+1 604 555 '+String(2000+i).padStart(4,'0'),qualification:'CSIA Level '+(i%3+1)};
    seed.instructors.push(instructor);
    seed.groups.push({id:original?.id ?? 'prototype-group-'+i,label:original?.label ?? 'Group '+String(i+1).padStart(3,'0'),level:'Level '+(i%6+1),meeting:mode==='worst'&&i===1?'Upper mountain learning centre — north entrance meeting flag':original?.meeting ?? 'Meeting flag '+(i+1),instructorId:instructor.id});
  }
  for(let i=0;i<count;i++) {
    const source=base.children[i] ?? base.children[0];
    const registration=storeImport[i] ?? {child:first[i%10]+' '+last[Math.floor(i/10)%10],birthDate:`${2015+i%8}-${String(i%12+1).padStart(2,'0')}-${String(i%27+1).padStart(2,'0')}`,accountHolder:'Guardian '+(i+1),relationship:'Guardian',email:'guardian'+(i+1)+'@example.test',phone:'+1 604 555 '+String(1000+i).padStart(4,'0'),program:'Kestrel Kids, Saturday',level:String(i%6+1)};
    const child={...source,id:base.children[i]?.id ?? 'prototype-child-'+String(i+1).padStart(4,'0'),displayName:registration?.child ?? first[i%10]+' '+last[Math.floor(i/10)%10],birthDate:registration?.birthDate,guardianId:'prototype-guardian-'+i,consentStatus:i===1||i%10===9?'incomplete':'complete',pickupAdults:structuredClone(source.pickupAdults),storeRegistration:registration};
    if (i>=2) {child.medicalStatus=i%17===0?'alert':'none';child.medical=child.medicalStatus==='alert'?'Asthma. Inhaler in jacket pocket.':'No conditions or allergies reported.';}
    child.emergencyName=registration.accountHolder;
    child.emergencyPhone=registration.phone;
    child.emergencyName2='Emergency contact '+(i+1);
    child.emergencyPhone2='+1 604 555 '+String(3000+i).padStart(4,'0');
    child.alternateName='';
    child.consentUpdatedAt=child.consentStatus==='complete'?'2026-11-06':'';
    child.pickupAdults=[{name:registration.accountHolder,relationship:registration.relationship,validFrom:'',validUntil:''},{name:child.emergencyName2,relationship:'Family friend',validFrom:'',validUntil:''}];
    child.pickup=child.pickupAdults.map(adult=>adult.name).join('; ');
    if(mode==='worst' && i>=2 && i<9) child.displayName=extremes[i-2];
    if(i===count-1 && count>1) child.displayName='Zara Winters';
    child.abilityLevel=seed.groups[Math.floor(i/6)].level;
    seed.children.push(child);
    seed.guardians.push({id:child.guardianId,name:registration?.accountHolder ?? 'Guardian '+(i+1),relationship:registration?.relationship,email:registration?.email ?? 'guardian'+i+'@example.test',phone:registration?.phone ?? '+1 604 555 0101'});
    seed.attendance.push({childId:child.id,groupId:seed.groups[Math.floor(i/6)].id,bib:String(1000+i),status:i%3===0?'checked_in':'expected',clothing:['Green jacket, white helmet','Blue jacket, black helmet','Red jacket, blue helmet'][i%3]});
  }
  return seed;
}
