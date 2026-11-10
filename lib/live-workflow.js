import { Piezas, createReportProblemRoute } from '@piezas/sdk';

const appId = '5f6d96c7-a11c-489f-a1f8-bcc5734401b7';
export const sessionCookie = 'kestrel_session';
const piezas = new Piezas({apiKey:process.env.PIEZAS_API_KEY,apiBaseUrl:process.env.PIEZAS_API_URL || 'https://api.piezas.ai',appId});
const definitions = {
  app_member_profile:{fields:{userId:{type:'text',required:true},email:{type:'email',required:true},displayName:{type:'text',required:true},role:{type:'select',options:['instructor','desk','patrol'],required:true},active:{type:'boolean'}}},
  instructor_group:{fields:{label:{type:'text',required:true},level:{type:'integer',required:true},meeting:{type:'text'},instructorUserId:{type:'text',required:true}}},
  child_profile:{fields:{stableId:{type:'text',required:true},displayName:{type:'text',required:true},alternateName:{type:'text'},birthDate:{type:'date'},medical:{type:'longtext'}}},
  attendance:{fields:{childRecordId:{type:'text',required:true},groupRecordId:{type:'text',required:true},bib:{type:'text',required:true},clothing:{type:'text'},status:{type:'text'}}},
  missing_child_report:{fields:{childRecordId:{type:'text',required:true},groupRecordId:{type:'text',required:true},childName:{type:'text',required:true},bib:{type:'text',required:true},lastSeenTime:{type:'text'},lastSeenPlace:{type:'text',required:true},clothing:{type:'text'},equipment:{type:'text'},injuries:{type:'text'},reporterUserId:{type:'text',required:true},reporterName:{type:'text',required:true}}},
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
        const reports=(await listAll(e.missing_child_report)).filter(r=>groupIds.has(r.data.groupRecordId)&&r.status!=='found');
        return json({role:s.profile.role,displayName:s.profile.displayName,groups:groups.map(g=>({id:g.id,...g.data})),children:children.map(c=>({id:c.id,...c.data})),attendance:attendance.map(a=>({id:a.id,...a.data})),reports:reports.map(r=>({id:r.id,...r.data,status:r.status}))});
      }
      if(!['desk','patrol'].includes(s.profile.role)) return json({error:'This staff role cannot access operational reports.'},403);
      const reports=(await listAll(e.missing_child_report)).filter(r=>r.status!=='found');
      return json({role:s.profile.role,reports:reports.map(r=>({id:r.id,...r.data,status:r.status}))});
    }
    if(url.pathname==='/api/live/reports' && request.method==='POST') {
      const s=await session(request); if(!s) return json({error:'Sign in required.'},401);
      if(!['instructor','desk'].includes(s.profile.role)) return json({error:'Only instructors and desk staff can file a report.'},403);
      const body=await request.json(); const e=await entities();
      const groups=await listAll(e.instructor_group);
      const attendance=await listAll(e.attendance);
      const assignment=attendance.find(a=>a.data.childRecordId===body.childRecordId);
      if(!assignment) return json({error:'That child is not on today’s assigned roster.'},403);
      const group=groups.find(g=>g.id===assignment.data.groupRecordId);
      if(!group || (s.profile.role==='instructor' && group.data.instructorUserId!==s.user.id)) return json({error:'You can only report a child from your assigned group.'},403);
      const child=(await e.child_profile.get(body.childRecordId)).data;
      const report=await e.missing_child_report.create({title:`Missing child · ${child.displayName}`,status:'active',data:{...body,childName:child.displayName,bib:assignment.data.bib,groupRecordId:group.id,reporterUserId:s.user.id,reporterName:s.profile.displayName,childRecordId:body.childRecordId}});
      return json({id:report.id,status:report.status,childName:child.displayName,bib:assignment.data.bib,radioReminder:'Call Desk and Patrol by physical radio. This app saves and shares the report; it does not transmit radio.'},201);
    }
    if(url.pathname==='/api/live/reports/found' && request.method==='POST') {
      const s=await session(request); if(!s || !['desk','patrol'].includes(s.profile.role)) return json({error:'Desk or Patrol sign-in required.'},403);
      const {id}=await request.json(); const {missing_child_report}=await entities(); await missing_child_report.update(id,{status:'found'}); return json({ok:true});
    }
    return null;
  } catch(error) { console.error('Live workflow error:',error.message); return json({error:'The live workflow could not complete. Try again or contact the app administrator.'},500); }
}
export const liveHandler=handle;
export const reportProblemRoute=()=>createReportProblemRoute({piezas,sessionCookie,identify:async request=>{const s=await session(request);return s?{id:s.user.id,email:s.user.email,name:s.profile.displayName}:undefined;}});
export async function initializeLive() { if(!process.env.PIEZAS_API_KEY) throw new Error('PIEZAS_API_KEY is required for the live workflow.'); await entities(); }
