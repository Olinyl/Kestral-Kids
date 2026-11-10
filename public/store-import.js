// Fictional online-store registration export used only in the local prototype.
const firstNames = ['Owen','Maya','Noah','Ava','Liam','Sofia','Ethan','Amara','Leo','Isla','Theo','Mila','Arjun','Zoe','Finn','Nora','Mateo','Ivy','Jack','Layla'];
const lastNames = ['Parr','Chen','Singh','Martin','Wilson','Campbell','Brown','Ahmed','Tremblay','Patel','Murphy','MacDonald','Lee','Garcia','Nguyen','Robinson','Thompson','Wong','Johnson','Clark'];
const accountNames = ['Melissa','Alyssa','Priya','Jordan','Taylor','Morgan','Jamie','Alex','Sam','Casey'];
const relationships = ['Mother','Father','Guardian','Aunt','Uncle','Grandparent'];
const notes = ['Gets cold easily.','Prefers a quick break after lunch.','Uses a left-handed ski pole grip.','Can be shy in a new group.','Please remind them to drink water.','No additional notes.',''];

export const storeImport = Array.from({length:200},(_,index)=>{
  const n=index+1;
  const first=firstNames[index%firstNames.length];
  const last=lastNames[Math.floor(index/firstNames.length)%lastNames.length];
  const account=accountNames[index%accountNames.length];
  const accountLast=lastNames[(Math.floor(index/10)+3)%lastNames.length];
  const day=String((index%27)+1).padStart(2,'0');
  const month=String((Math.floor(index/27)%12)+1).padStart(2,'0');
  const year=2015+(index%8);
  return {
    orderNumber:`KM-2025-${String(118204+index).padStart(6,'0')}`,
    child:`${first} ${last}`,
    birthDate:`${year}-${month}-${day}`,
    program:`Kestrel Kids, ${index%2?'Sunday':'Saturday'}`,
    level:String((index%6)+1),
    accountHolder:`${account} ${accountLast}`,
    relationship:relationships[index%relationships.length],
    phone:`416-555-${String(1400+index).padStart(4,'0')}`,
    email:`${account.toLowerCase()}.${last.toLowerCase()}${n}@example.test`,
    childNotes:notes[index%notes.length],
  };
});

// A paired household makes the multiple-children account visible in the Guardian demo.
storeImport[0] = {...storeImport[0],child:'Owen Parr',accountHolder:'Melissa Parr',relationship:'Mother'};
storeImport[1] = {...storeImport[1],child:'Maya Parr',accountHolder:'Melissa Parr',relationship:'Mother'};
