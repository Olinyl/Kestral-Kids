import { Piezas, createReportProblemRoute } from '@piezas/sdk';

const appId = '5f6d96c7-a11c-489f-a1f8-bcc5734401b7';
export const sessionCookie = 'kestrel_session';
const piezas = new Piezas({apiKey:process.env.PIEZAS_API_KEY,apiBaseUrl:process.env.PIEZAS_API_URL || 'https://api.piezas.ai',appId});
const definitions = {
  app_member_profile:{fields:{userId:{type:'text',required:true},email:{type:'email',required:true},displayName:{type:'text',required:true},role:{type:'select',options:['instructor','desk','patrol','director'],required:true},active:{type:'boolean'}}},
  instructor_group:{fields:{label:{type:'text',required:true},level:{type:'integer',required:true},meeting:{type:'text'},instructorUserId:{type:'text',required:true}}},
  child_profile:{fields:{stableId:{type:'text',required:true},displayName:{type:'text',required:true},alternateName:{type:'text'},birthDate:{type:'date'},guardianName:{type:'text'},guardianPhone:{type:'text'},guardianEmail:{type:'email'},medical:{type:'longtext'},medications:{type:'longtext'},allergies:{type:'longtext'},emergencyName:{type:'text'},emergencyPhone:{type:'text'},emergencyRelationship:{type:'text'},emergencyName2:{type:'text'},emergencyPhone2:{type:'text'},emergencyRelationship2:{type:'text'},pickupAdults:{type:'longtext'},consentStatus:{type:'text'},consentUpdatedAt:{type:'text'}}},
  attendance:{fields:{childRecordId:{type:'text',required:true},groupRecordId:{type:'text',required:true},bib:{type:'text',required:true},clothing:{type:'text'},equipment:{type:'text'},status:{type:'text'}}},
  missing_child_report:{fields:{childRecordId:{type:'text',required:true},groupRecordId:{type:'text',required:true},childName:{type:'text',required:true},bib:{type:'text',required:true},lastSeenTime:{type:'text'},lastSeenPlace:{type:'text',required:true},clothing:{type:'text'},equipment:{type:'text'},injuries:{type:'text'},medical:{type:'longtext'},emergencyContacts:{type:'longtext'},authorizedPickupAdults:{type:'longtext'},guardianUpdateDate:{type:'text'},consentStatus:{type:'text'},reporterUserId:{type:'text',required:true},reporterName:{type:'text',required:true},foundAt:{type:'datetime'},foundByUserId:{type:'text'},foundByName:{type:'text'},foundByRole:{type:'text'}}},
};
let entitiesPromise;
const entities = () => entitiesPromise ??= piezas.defineEntities(definitions);
async function listAll(client) {
  const rows=[]; let offset=0;
  while(true) { const page=await client.list({limit:100,offset}); rows.push(...page.data); if(page.data.length<100) return rows; offset+=page.data.length; }
}
const parseCookie = request => Object.fromEntries((request.headers.get('cookie')||'').split(';').map(v=>v.trim().split(/=(.*)/s).slice(0,2)).filter(v=>v.length===2));
async function session(request) {
  const token=parseCookie(request)[sessionCookie];
  if(!token) return null;
  const result=await piezas.users.getSession(token);
  if(!result.valid || !result.user) return null;
  const {app_member_profile}=await entities();
  const profiles=await listAll(app_member_profile);
  const profile=profiles.find(r=>r.data.userId===result.user.id && r.data.active!==false);
  if(!profile) return null;
  return {token,user:result.user,profile:profile.data};
}
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8',...headers}});
const formatTime12=value=>{
  const match=/^(\d{1,2}):(\d{2})$/.exec(String(value||''));
  if(!match)return String(value||'');
  const hour=Number(match[1]);
  if(hour>23||Number(match[2])>59)return '';
  return `${hour%12||12}:${match[2]} ${hour<12?'AM':'PM'}`;
};
const guardianHealth=child=>[
  child?.medical&&`Medical conditions: ${child.medical}`,
  child?.medications&&`Medications and location: ${child.medications}`,
  child?.allergies&&`Allergies: ${child.allergies}`,
].filter(Boolean).join('\n')||'N/A';
const guardianContacts=child=>[
  {name:child?.emergencyName||child?.guardianName,relationship:child?.emergencyRelationship||'Guardian / emergency contact',phone:child?.emergencyPhone||child?.guardianPhone,email:child?.guardianEmail},
  {name:child?.emergencyName2,relationship:child?.emergencyRelationship2||'Emergency contact',phone:child?.emergencyPhone2},
].filter(contact=>contact.name||contact.phone).map(contact=>({...contact,phone:contact.phone||'Not provided',phoneStatus:contact.phone?'Verify before use':'Phone not provided'}));
const parseJsonList=value=>{if(Array.isArray(value))return value;try{const parsed=JSON.parse(value||'[]');return Array.isArray(parsed)?parsed:[];}catch{return [];}};
async function withCurrentGuardianDetails(entityClient,reports){
  const ids=[...new Set(reports.map(report=>report.data.childRecordId).filter(Boolean))];
  const current=new Map((await Promise.all(ids.map(async id=>{try{return [id,(await entityClient.get(id)).data];}catch{return [id,null];}}))).filter(([,child])=>child));
  return reports.map(report=>{
    const child=current.get(report.data.childRecordId);
    const fresh=child?{medical:guardianHealth(child),emergencyContacts:JSON.stringify(guardianContacts(child)),authorizedPickupAdults:JSON.stringify(parseJsonList(child.pickupAdults).filter(adult=>adult&&adult.name)),guardianUpdateDate:child.consentUpdatedAt||'Not recorded',consentStatus:child.consentStatus||'Not recorded'}:{};
    return {id:report.id,...report.data,...fresh,status:report.status};
  });
}
async function handle(request) {
  const url=new URL(request.url);
  try {
    if(url.pathname==='/api/live/sign-in' && request.method==='POST') {
      const {email,password}=await request.json();
      const result=await piezas.users.signIn({email,password});
      if(result.mfa) return json({mfa:true,challengeToken:result.mfa.challengeToken,factors:result.mfa.factors});
      if(!result.session) return json({error:'Sign-in could not be completed.'},401);
      const {app_member_profile}=await entities();
      const profiles=await listAll(app_member_profile);
      const profile=profiles.find(r=>r.data.userId===result.user.id && r.data.active!==false);
      if(!profile) return json({error:'Your account does not have an active staff role. Ask the app administrator.'},403);
      return json({user:{email:result.user.email,displayName:profile.data.displayName,role:profile.data.role}},200,{'Set-Cookie':`${sessionCookie}=${result.session.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${url.protocol==='https:'?'; Secure':''}`});
    }
    if(url.pathname==='/api/live/mfa' && request.method==='POST') {
      const {challengeToken,code}=await request.json(); const result=await piezas.users.completeMfaChallenge(challengeToken,code);
      if(!result.session) return json({error:'The verification code was not accepted.'},401);
      const {app_member_profile}=await entities(); const p=(await listAll(app_member_profile)).find(r=>r.data.userId===result.user.id&&r.data.active!==false);
      if(!p) return json({error:'No active staff role is assigned.'},403);
      return json({user:{email:result.user.email,displayName:p.data.displayName,role:p.data.role}},200,{'Set-Cookie':`${sessionCookie}=${result.session.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${url.protocol==='https:'?'; Secure':''}`});
    }
    if(url.pathname==='/api/live/sign-out' && request.method==='POST') {
      const s=await session(request); if(s) await piezas.users.signOut(s.token);
      return json({ok:true},200,{'Set-Cookie':`${sessionCookie}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`});
    }
    if(url.pathname==='/api/live/me' && request.method==='GET') {
      const s=await session(request); return s?json({user:{email:s.user.email,displayName:s.profile.displayName,role:s.profile.role}}):json({user:null});
    }
    if(url.pathname==='/api/live/dashboard' && request.method==='GET') {
      const s=await session(request); if(!s) return json({error:'Sign in required.'},401);
      const e=await entities();
      if(s.profile.role==='instructor') {
        const groups=(await listAll(e.instructor_group)).filter(r=>r.data.instructorUserId===s.user.id);
        const groupIds=new Set(groups.map(g=>g.id));
        const attendance=(await listAll(e.attendance)).filter(a=>groupIds.has(a.data.groupRecordId));
        const childIds=new Set(attendance.map(a=>a.data.childRecordId));
        const children=(await listAll(e.child_profile)).filter(c=>childIds.has(c.id));
        const reports=(await listAll(e.missing_child_report)).filter(r=>groupIds.has(r.data.groupRecordId)&&(r.status!=='found'||r.data.foundAt));
        return json({role:s.profile.role,displayName:s.profile.displayName,groups:groups.map(g=>({id:g.id,...g.data})),children:children.map(c=>({id:c.id,...c.data})),attendance:attendance.map(a=>({id:a.id,...a.data})),reports:await withCurrentGuardianDetails(e.child_profile,reports)});
      }
      if(s.profile.role==='director') {
        const reports=(await listAll(e.missing_child_report)).filter(r=>r.status==='found'&&r.data.foundAt);
        return json({role:s.profile.role,displayName:s.profile.displayName,reports:await withCurrentGuardianDetails(e.child_profile,reports)});
      }
      if(!['desk','patrol'].includes(s.profile.role)) return json({error:'This staff role cannot access operational reports.'},403);
      const reports=(await listAll(e.missing_child_report)).filter(r=>r.status!=='found');
      return json({role:s.profile.role,reports:await withCurrentGuardianDetails(e.child_profile,reports)});
    }
    if(url.pathname==='/api/live/attendance' && request.method==='POST') {
      const s=await session(request); if(!s || s.profile.role!=='instructor') return json({error:'Instructor sign-in required.'},403);
      const body=await request.json();
      const clothing=String(body.clothing||'').trim();
      const equipment=String(body.equipment||'').trim();
      if(!body.childRecordId || !clothing || clothing.length>500 || equipment.length>500) return json({error:'Enter valid clothing and equipment details.'},400);
      const e=await entities();
      const groups=(await listAll(e.instructor_group)).filter(group=>group.data.instructorUserId===s.user.id);
      const groupIds=new Set(groups.map(group=>group.id));
      const assignment=(await listAll(e.attendance)).find(row=>row.data.childRecordId===body.childRecordId && groupIds.has(row.data.groupRecordId));
      if(!assignment) return json({error:'You can only update children in your assigned group.'},403);
      await e.attendance.update(assignment.id,{data:{clothing,equipment}});
      return json({ok:true,childRecordId:body.childRecordId,clothing,equipment});
    }
    if(url.pathname==='/api/live/reports' && request.method==='POST') {
      const s=await session(request); if(!s) return json({error:'Sign in required.'},401);
      if(!['instructor','desk'].includes(s.profile.role)) return json({error:'Only instructors and desk staff can file a report.'},403);
      const body=await request.json(); const e=await entities();
      const groups=await listAll(e.instructor_group);
      const attendance=await listAll(e.attendance);
      const assignments=attendance.filter(a=>a.data.childRecordId===body.childRecordId);
      const assignment=assignments.find(a=>{
        const assignedGroup=groups.find(g=>g.id===a.data.groupRecordId);
        return assignedGroup && (s.profile.role==='desk' || assignedGroup.data.instructorUserId===s.user.id);
      });
      if(!assignment) return json({error:'You can only report a child from your assigned group.'},403);
      if(s.profile.role==='instructor' && (assignment.data.status!=='checked_in' || assignment.data.release)) return json({error:'You can only report a child who is checked in today.'},409);
      const group=groups.find(g=>g.id===assignment.data.groupRecordId);
      const child=(await e.child_profile.get(body.childRecordId)).data;
      const reportedAt=new Date().toISOString();
      const lastSeenTime=formatTime12(body.lastSeenTime)||String(body.lastSeenTime||'N/A');
      const reportData={...body,lastSeenTime,reportedAt,childName:child.displayName,bib:assignment.data.bib,groupRecordId:group.id,reporterUserId:s.user.id,reporterName:s.profile.displayName,childRecordId:body.childRecordId,medical:guardianHealth(child),emergencyContacts:JSON.stringify(guardianContacts(child)),authorizedPickupAdults:JSON.stringify(parseJsonList(child.pickupAdults).filter(adult=>adult&&adult.name)),guardianUpdateDate:child.consentUpdatedAt||'Not recorded',consentStatus:child.consentStatus||'Not recorded'};
      const existing=(await listAll(e.missing_child_report)).find(report=>report.data.childRecordId===body.childRecordId&&String(report.status||'').toLowerCase()!=='found');
      const report=existing
        ? await e.missing_child_report.update(existing.id,{title:`Missing child · ${child.displayName}`,status:'active',data:reportData})
        : await e.missing_child_report.create({title:`Missing child · ${child.displayName}`,status:'active',data:reportData});
      return json({id:report.id,status:report.status,updated:Boolean(existing),childName:child.displayName,bib:assignment.data.bib,reportedAt,lastSeenTime,radioReminder:'Call Desk and Patrol by physical radio. This app saves and shares the report; it does not transmit radio.'},existing?200:201);
    }
    if(url.pathname==='/api/live/reports/found' && request.method==='POST') {
      const s=await session(request); if(!s || !['instructor','desk','patrol'].includes(s.profile.role)) return json({error:'Staff sign-in required.'},403);
      const {id}=await request.json(); const e=await entities();
      const report=(await listAll(e.missing_child_report)).find(item=>item.id===id);
      if(!report||String(report.status||'').toLowerCase()==='found') return json({error:'This missing-child report is no longer active.'},404);
      if(s.profile.role==='instructor') {
        const groups=(await listAll(e.instructor_group)).filter(group=>group.data.instructorUserId===s.user.id);
        if(!groups.some(group=>group.id===report.data.groupRecordId)) return json({error:'You can only resolve reports from your assigned group.'},403);
      }
      const foundAt=new Date().toISOString();
      await e.missing_child_report.update(id,{status:'found',data:{...report.data,foundAt,foundByUserId:s.user.id,foundByName:s.profile.displayName,foundByRole:s.profile.role}});
      return json({ok:true,foundAt,childName:report.data.childName,foundByName:s.profile.displayName});
    }
    return null;
  } catch(error) { console.error('Live workflow error:',error.message); return json({error:'The live workflow could not complete. Try again or contact the app administrator.'},500); }
}
export const liveHandler=handle;
export const reportProblemRoute=()=>createReportProblemRoute({piezas,sessionCookie,identify:async request=>{const s=await session(request);return s?{id:s.user.id,email:s.user.email,name:s.profile.displayName}:undefined;}});
export async function initializeLive() { if(!process.env.PIEZAS_API_KEY) throw new Error('PIEZAS_API_KEY is required for the live workflow.'); await entities(); }
