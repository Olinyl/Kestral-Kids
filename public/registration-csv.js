export const REGISTRATION_COLUMNS={orderNumber:'Order number',child:'Child',birthDate:'Birth date',program:'Program',level:'Level',accountHolder:'Account holder',relationship:'Relationship',phone:'Phone',email:'Email',childNotes:'Anything we should know about your child?'};
export const validPhone=value=>/^\+?[\d\s().-]+$/.test(String(value))&&String(value).replace(/\D/g,'').length>=10&&String(value).replace(/\D/g,'').length<=15;
export function normalizeRegistrations(rows) {
 if(!Array.isArray(rows)||!rows.length||rows.length>5000) throw new Error('Choose a registration file with 1–5,000 rows.');
 const identifiers=new Set();
 return rows.map((raw,index)=>{
  const row=Object.fromEntries(Object.entries(REGISTRATION_COLUMNS).map(([key,heading])=>[key,String(raw[key]??raw[heading]??'').trim()]));
  const problem=text=>{throw new Error(`Row ${index+1}: ${text}`);};
  for(const key of ['orderNumber','child','birthDate','program','level','accountHolder','email']) if(!row[key]) problem(`${REGISTRATION_COLUMNS[key]} is required.`);
  if(row.orderNumber.length>100||row.child.length>150||row.accountHolder.length>150||row.childNotes.length>4000) problem('A field is longer than the supported import limit.');
  const date=new Date(row.birthDate+'T12:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(row.birthDate)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==row.birthDate||date.getUTCFullYear()<2000||date.getUTCFullYear()>2026) problem('Birth date must be a valid date such as 2017-06-14.');
  if(!/^[1-6]$/.test(row.level)) problem('Ability level must be 1–6.');
  const days=['Saturday','Sunday'].filter(day=>new RegExp(`\\b${day}\\b`,'i').test(row.program));
  if(days.length!==1) problem('Program must identify Saturday or Sunday.');
  const firstLesson=days[0]==='Saturday'?'2026-12-12':'2026-12-13';
  const age=2026-Number(row.birthDate.slice(0,4))-(firstLesson.slice(5)<row.birthDate.slice(5)?1:0);
  if(age<5||age>12)problem('This program is for children aged 5–12 at the first lesson. Review the registration.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) problem('Account-holder email is not valid.');
  // The case supplies an order number but no individual registration id. Require
  // one child per source order in this preview rather than guessing sibling links.
  if(identifiers.has(row.orderNumber)) problem('This order number appears more than once. Review the source registration before importing.');
  identifiers.add(row.orderNumber);
  return {...row,email:row.email.toLowerCase(),program:days[0],relationship:row.relationship==='[No Data]'?'':row.relationship,contactNeedsReview:!validPhone(row.phone)};
 });
}
export function parseRegistrationCsv(text) {
 if(typeof text!=='string'||text.length>5_000_000) throw new Error('Choose a CSV file smaller than 5 MB.');
 const rows=[];let row=[],field='',quoted=false;
 const source=text.replace(/^\uFEFF/,'');
 for(let i=0;i<source.length;i++) {
  const char=source[i];
  if(char==='"') {if(quoted&&source[i+1]==='"'){field+='"';i++;}else if(!field||quoted)quoted=!quoted;else throw new Error('The CSV has a misplaced quotation mark.');}
  else if(char===','&&!quoted){row.push(field);field='';}
  else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&source[i+1]==='\n')i++;row.push(field);if(row.some(value=>value.trim()))rows.push(row);row=[];field='';}
  else field+=char;
 }
 if(quoted) throw new Error('The CSV has an unclosed quotation mark.');
 row.push(field);if(row.some(value=>value.trim()))rows.push(row);
 if(rows.length<2) throw new Error('The CSV needs a heading row and at least one registration.');
 const headings=rows.shift().map(value=>value.trim());
 if(new Set(headings).size!==headings.length)throw new Error('The CSV contains duplicate column headings.');
 const expected=Object.values(REGISTRATION_COLUMNS);
 for(const heading of expected.filter(h=>!['Relationship','Phone','Anything we should know about your child?'].includes(h)))if(!headings.includes(heading))throw new Error(`The CSV needs a “${heading}” column.`);
 return normalizeRegistrations(rows.map((values,index)=>{if(values.length!==headings.length)throw new Error(`Row ${index+2} has a different number of columns.`);return Object.fromEntries(headings.map((heading,i)=>[heading,values[i]]));}));
}
export function registrationCsv(rows) {
 const quote=value=>'"'+String(value??'').replaceAll('"','""')+'"';
 return Object.values(REGISTRATION_COLUMNS).map(quote).join(',')+'\r\n'+rows.map(row=>Object.keys(REGISTRATION_COLUMNS).map(key=>quote(row[key])).join(',')).join('\r\n');
}
