import { createDirector } from './director.js';
import { createOperations } from './operations.js';
import { createGuardian } from './guardian.js';
import { createPatrol } from './patrol.js';
import { createAlertStore, createSharedAlerts } from './alerts.js';

const workspaces = {
  desk: {
    label: 'School desk', tabs: ['Roster', 'Alerts'],
  },
  guardian: { label: 'Guardian', tabs: ['My children', 'Alerts'] },
  director: { label: 'Director', tabs: ['Overview', 'Children', 'Instructors', 'Lesson groups', 'Alerts'] },
  instructor: { label: 'Instructor', tabs: ['Group roster', 'Alerts'] },
  patrol: { label: 'Patrol', tabs: ['Active alerts', 'Alerts'] },
};

const accountMenu = document.querySelector('[data-testid="account-menu"]');
const accountDialog = document.querySelector('#account-switcher');
const authDialog = document.querySelector('#account-auth-dialog');
const accountWorkspace = document.querySelector('#account-workspace');
const nav = document.querySelector('nav');
const title = document.querySelector('h1');
const sectionTitle = document.querySelector('#section-title');
const roster = document.querySelector('#roster');
const template = document.querySelector('#roster-item');
const searchLabel = document.querySelector('.search');
const search = searchLabel.querySelector('input');
const message = document.querySelector('#message');

const requestedView = new URLSearchParams(window.location.search).get('view');
let role = Object.hasOwn(workspaces, requestedView) ? requestedView : 'desk';
let tab = workspaces[role].tabs[0];
let rows = [];
let director;
let operations;
let guardian;
let patrol;
let sharedAlerts;
let sharedAlertRoot;
let refreshAlertBadge=()=>{};
let activeAccount;
let saveOwnDetails=()=>{};
let refreshOwnDetails=()=>{};
let signedOut=false;
const accounts=[];
const escapeAccount=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function switchAccount(account) {
  activeAccount=account;account.signedIn=true;signedOut=false;
  role=account.role;tab=workspaces[role].tabs[0];
  if(account.role==='guardian') guardian.setAccount?.(account);
  accountDialog.close();authDialog.close();
  search.value='';renderWorkspace();
  document.querySelector('#app-shell > main').scrollTop=0;
}

function accountChoices(inDialog=false) {
  return accounts.map(account=>`<button type="button" class="account-choice" data-account-id="${escapeAccount(account.id)}" data-account-role="${account.role}" data-testid="account-${inDialog?'choice':'continue'}-${account.id}"><span class="account-avatar" aria-hidden="true">${escapeAccount(account.name.split(' ').map(n=>n[0]).slice(0,2).join(''))}</span><span><strong>${escapeAccount(account.name)}</strong><small>${escapeAccount(workspaces[account.role].label)} · ${account.sample?'Demo account':'Preview account'} · ${account.signedIn?'Signed in':'Signed out'}</small></span><span class="account-state">${account===activeAccount&&!signedOut?'Current':account.signedIn?'Switch':'Sign in'}</span></button>`).join('');
}

function signOutAccount() {
  if(activeAccount) activeAccount.signedIn=false;
  signedOut=true;accountDialog.close();renderWorkspace();
}

function openAccountMenu() {
  refreshOwnDetails();
  accountDialog.innerHTML=`<div class="d-dialog-heading"><h2 id="account-switcher-title">Accounts</h2><button type="button" class="d-close" data-account-close aria-label="Close accounts">×</button></div><div class="d-dialog-body"><p class="account-preview-note">Demo profiles let you preview each workspace. They are not real sign-ins.</p><div class="account-choices">${accountChoices(true)}</div></div><footer class="d-dialog-footer"><div><button type="button" class="d-button" data-account-create data-testid="account-create">Create account</button><button type="button" class="d-button" data-account-login>Sign in</button></div><button type="button" class="d-button" data-account-signout data-testid="account-sign-out" ${signedOut?'disabled':''}>Sign out</button></footer>`;
  if(activeAccount&&!signedOut){
    const body=accountDialog.querySelector('.d-dialog-body');
    body.insertAdjacentHTML('afterbegin',`<form class="g-form" data-testid="account-details-form"><h3>Your details</h3><label>Full name<input name="name" autocomplete="name" required maxlength="150" data-testid="account-detail-name" value="${escapeAccount(activeAccount.name)}"></label><label>Email<input name="email" type="email" autocomplete="email" required data-testid="account-detail-email" value="${escapeAccount(activeAccount.email)}"></label><label>Phone<input name="phone" type="tel" autocomplete="tel" data-testid="account-detail-phone" value="${escapeAccount(activeAccount.phone||'')}"></label><p class="d-form-error" data-testid="account-details-error" role="alert" hidden></p><p data-testid="account-details-status" role="status"></p><button class="d-button d-primary" data-testid="account-details-save">Save details</button><p class="account-preview-note">Preview changes reset on reload. Real email changes will require verification.</p></form><h3>Demo accounts</h3>`);
    body.querySelector('form').onsubmit=event=>{
      event.preventDefault();const form=event.currentTarget;
      const data={name:form.elements.name.value.trim(),email:form.elements.email.value.trim().toLowerCase(),phone:form.elements.phone.value.trim()};
      const error=form.querySelector('[role="alert"]');const fail=text=>{error.textContent=text;error.hidden=false;};
      if(!data.name)return fail('Enter your name.');
      if(accounts.some(account=>account!==activeAccount&&account.email.toLowerCase()===data.email))return fail('This email belongs to another preview account.');
      if(data.phone&&!/^\+?[\d\s().-]+$/.test(data.phone)||data.phone&&(data.phone.replace(/\D/g,'').length<10||data.phone.replace(/\D/g,'').length>15))return fail('Enter a complete phone number.');
      try{saveOwnDetails(data);}catch(problem){fail(problem.message);return;}error.hidden=true;form.querySelector('[role="status"]').textContent='Your details were saved in this preview.';
      accountDialog.querySelector('.account-choices').innerHTML=accountChoices(true);
      accountMenu.querySelector('.account-avatar').textContent=data.name.split(' ').map(n=>n[0]).slice(0,2).join('');
    };
  }
  accountDialog.showModal();
}

function renderAccountPage() {
  accountWorkspace.innerHTML=`<section class="g-section account-page"><h2>${signedOut?'Choose an account':'Your account'}</h2><p class="account-preview-note">${signedOut?'Continue with another signed-in demo profile, or sign in.':'Switch between the demo profiles to preview each workspace.'}</p><div class="account-choices">${accountChoices()}</div><div class="account-actions"><button type="button" class="d-button d-primary" data-account-create data-testid="account-page-create">Create account</button><button type="button" class="d-button" data-account-login>Sign in</button>${signedOut?'':'<button type="button" class="d-button" data-account-signout>Sign out</button>'}</div><p class="account-preview-note">Preview only. Accounts and edits reset when this page reloads.</p></section>`;
}

function openAccountAuth(kind,account) {
  const creating=kind==='create';
  accountDialog.close();
  authDialog.innerHTML=`<form class="account-auth-form"><div class="d-dialog-heading"><h2 id="account-auth-title">${creating?'Create account':'Sign in'}</h2><button type="button" class="d-close" data-account-close aria-label="Close account form">×</button></div><div class="d-dialog-body g-form"><p class="g-registration-note">Preview only. No real account is created or password saved.</p>${creating?'<label>Full name<input name="displayName" autocomplete="name" required data-testid="account-name"></label>':''}<label>Email<input name="email" type="email" autocomplete="email" required value="${escapeAccount(account?.email||'')}" data-testid="account-email"></label><label>Password<input name="password" type="password" autocomplete="${creating?'new-password':'current-password'}" minlength="8" required data-testid="account-password"></label>${creating?'<label>Confirm password<input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required data-testid="account-confirm"></label><p class="account-preview-note">New preview accounts open as Guardians. School staff access is assigned by the school.</p>':''}<p class="d-form-error" role="alert" data-testid="account-auth-error" hidden></p>${!creating&&account?.sample?'<button type="button" class="d-button" data-use-demo>Use this demo account without a password</button>':''}</div><footer class="d-dialog-footer"><span>Real sign-up will use Piezas.</span><button type="submit" class="d-button d-primary" data-testid="account-submit">${creating?'Create preview account':'Sign in to preview'}</button></footer></form>`;
  authDialog.querySelector('[data-use-demo]')?.addEventListener('click',()=>switchAccount(account));
  authDialog.querySelector('form').onsubmit=event=>{
    event.preventDefault();
    const form=event.currentTarget,error=authDialog.querySelector('[data-testid="account-auth-error"]');
    const email=form.elements.email.value.trim().toLowerCase();
    const fail=text=>{error.textContent=text;error.hidden=false;};
    if(creating) {
      if(form.elements.password.value!==form.elements.confirmPassword.value) {fail('The passwords do not match.');return;}
      if(accounts.some(person=>person.email.toLowerCase()===email)) {fail('That preview email already exists. Choose Sign in instead.');return;}
      const profile={id:'guardian-preview-'+accounts.length,role:'guardian',name:form.elements.displayName.value.trim(),email,sample:false,signedIn:true};
      if(!profile.name) {fail('Enter your name.');return;}
      form.reset();
      authDialog.innerHTML=`<div class="d-dialog-heading"><h2 id="account-auth-title">Verify your email</h2><button type="button" class="d-close" data-account-close aria-label="Close account form">×</button></div><div class="d-dialog-body g-form"><p>In the real app, a verification link will be sent to <strong>${escapeAccount(profile.email)}</strong> before this account can sign in.</p><p class="g-registration-note">Preview only. No email was sent and no real account was created.</p><button type="button" class="d-button d-primary" data-testid="account-preview-verify">Preview email verified</button></div>`;
      authDialog.querySelector('[data-testid="account-preview-verify"]').onclick=()=>{accounts.push(profile);switchAccount(profile);};
    } else {
      const profile=accounts.find(person=>person.email.toLowerCase()===email);
      if(!profile) {fail('This preview cannot verify real sign-ins. Use a demo account or create a preview account.');return;}
      form.reset();switchAccount(profile);
    }
  };
  authDialog.showModal();
}

accountMenu.onclick=openAccountMenu;
document.addEventListener('click',event=>{
  const choice=event.target.closest('[data-account-id]');
  if(choice) {const account=accounts.find(person=>person.id===choice.dataset.accountId);if(account) account.signedIn?switchAccount(account):openAccountAuth('signin',account);}
  if(event.target.closest('[data-account-create]')) openAccountAuth('create');
  if(event.target.closest('[data-account-login]')) openAccountAuth('signin');
  if(event.target.closest('[data-account-signout]')) signOutAccount();
  if(event.target.closest('[data-account-close]')) event.target.closest('dialog').close();
});
authDialog.addEventListener('close',()=>authDialog.querySelector('form')?.reset());

function visibleRows() {
  switch (role) {
    case 'guardian':
      return rows.filter(row => row.guardianId === 'demo-guardian-01');
    case 'director':
      return rows.filter(row => row.consentStatus === 'incomplete');
    case 'instructor':
      return rows.filter(row => row.instructorId === 'demo-instructor-01');
    case 'desk':
      return ['Today', 'Children'].includes(tab) ? rows : [];
    default:
      return [];
  }
}

function renderRoster() {
  const query = searchLabel.hidden ? '' : search.value.trim().toLowerCase();
  const matches = visibleRows().filter(row =>
    row.displayName.toLowerCase().includes(query) || row.bib.includes(query)
  );
  roster.replaceChildren(...matches.map(row => {
    const item = template.content.firstElementChild.cloneNode(true);
    item.querySelector('strong').textContent = row.displayName;
    item.querySelector('.group').textContent = row.groupLabel;
    item.querySelector('.bib').textContent = 'Bib ' + row.bib;
    const status = item.querySelector('.status');
    status.textContent = role === 'desk' || role === 'instructor'
      ? (row.status === 'checked_in' ? 'Checked in' : 'Expected')
      : (row.consentStatus === 'complete' ? 'Consent on file' : 'Consent needed');
    return item;
  }));
  const emptyMessages = {
    'Active alerts': 'No active alerts for this lesson day.',
    Pickup: 'No pickups recorded for this lesson day.',
    'Incomplete profiles': 'All profiles are complete.',
  };
  message.hidden = matches.length > 0;
  message.textContent = query ? 'No children match that name or bib.' :
    (emptyMessages[tab] ?? 'No children to show.');
}

function renderWorkspace() {
  queueMicrotask(()=>refreshAlertBadge());
  sharedAlerts?.close();
  if(sharedAlertRoot)sharedAlertRoot.hidden=true;
  document.body.classList.toggle('signed-out',signedOut);
  accountMenu.querySelector('[data-current-role]').textContent=signedOut?'Accounts':workspaces[role].label;
  accountMenu.querySelector('.account-avatar').textContent=signedOut?'A':activeAccount?.name.split(' ').map(n=>n[0]).slice(0,2).join('')||'A';
  accountMenu.setAttribute('aria-label',signedOut?'Choose an account':'Your account, '+workspaces[role].label);
  nav.parentElement.hidden=signedOut;
  window.dispatchEvent(new Event('kestrel:account-view'));
  accountWorkspace.hidden=true;
  if(signedOut) {
    sharedAlerts?.clear();
    operations.clear();guardian.clear();patrol.clear();
    for(const id of ['director','operations','patrol','guardian','starter-panel','live-workspace']) document.querySelector('#'+id).hidden=true;
    accountWorkspace.hidden=false;title.textContent='Welcome to Kestrel Kids';renderAccountPage();return;
  }
  const workspace = workspaces[role];
  nav.style.setProperty('--tab-count',workspace.tabs.length);
  title.textContent = role === 'guardian' ? `Hello, ${guardian?.accountHolder ?? ''}` : workspace.label + ' workspace';
  title.hidden=role==='desk';
  document.querySelector('#lesson-date').hidden=role==='desk';
  sectionTitle.textContent = tab === 'Today' ? 'Today’s roster' : tab;
  searchLabel.hidden = true;
  nav.replaceChildren(...workspace.tabs.map(label => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label',label);
    if (role === 'instructor' && label === 'Alerts') button.dataset.testid = 'instructor-nav-alerts';
    if (role === 'desk' && label === 'Alerts') button.dataset.testid = 'desk-nav-alerts';
    const shortLabel=label==='Instructors'?'Team':label==='Lesson groups'?'Groups':label;
    button.innerHTML=`<span class="nav-label-full">${label}</span><span class="nav-label-short">${shortLabel}</span>`;
    if (role === 'director') button.dataset.testid = 'director-nav-' + ({ 'Lesson groups': 'groups' }[label] ?? label.toLowerCase());
    if (role === 'guardian' && label === 'Alerts') button.dataset.testid = 'guardian-nav-alerts';
    if (label === tab) button.setAttribute('aria-current', 'page');
    button.addEventListener('click', () => {
      tab = label;
      search.value = '';
      renderWorkspace();
      nav.querySelector('[aria-current]').focus();
    });
    return button;
  }));
  const operational = ['desk', 'instructor'].includes(role);
  operations.clear();
  guardian.clear();
  patrol.clear();
  roster.replaceChildren();
  document.querySelector('#starter-panel').hidden = role === 'director' || operational || role === 'guardian' || role === 'patrol';
  search.toggleAttribute('data-testid', !operational);
  if (!operational) search.dataset.testid = 'roster-search';
  document.querySelector('#operations').hidden = !operational;
  document.querySelector('#patrol').hidden = role !== 'patrol';
  document.querySelector('#guardian').hidden = role !== 'guardian';
  document.querySelector('#director').hidden = role !== 'director';
  document.body.classList.toggle('director-view', role === 'director');
  document.body.classList.toggle('instructor-view', role === 'instructor');
  document.body.classList.toggle('desk-view', role === 'desk');
  document.body.classList.toggle('guardian-view', role === 'guardian');
  document.body.classList.toggle('patrol-view', role === 'patrol');
  if(tab==='Alerts') {
    for(const id of ['director','operations','patrol','guardian','starter-panel','live-workspace'])document.querySelector('#'+id).hidden=true;
    sharedAlertRoot.hidden=false;
    sharedAlerts.enter();
    sharedAlerts.render();
    return;
  }
  sharedAlerts?.clear();
  if(tab==='Account') {
    for(const id of ['director','operations','patrol','guardian','starter-panel','live-workspace']) document.querySelector('#'+id).hidden=true;
    accountWorkspace.hidden=false;renderAccountPage();return;
  }
  if (operational) { director.clear?.(); operations.render(role,tab); return; }
  if (role === 'director') {
    director.render(tab);
    return;
  }
  if (role === 'guardian') { guardian.render(tab); return; }
  if (role === 'patrol') { patrol.render(tab); return; }
  renderRoster();
}

async function start() {
  try {
    const response = await fetch('/demo-fixture.json');
    if (!response.ok) throw new Error('Fixture unavailable');
    let seed = await response.json();
    if (location.pathname === '/prototype') {
      const {prototypeSeed,addPrototypeControls} = await import('/prototype-fixtures.js');
      const mode = new URLSearchParams(location.search).get('data') || 'demo';
      seed = prototypeSeed(seed,mode);
      addPrototypeControls(mode);
    }
    const alertStore=createAlertStore(seed);
    sharedAlertRoot=document.createElement('section');sharedAlertRoot.id='shared-alerts';sharedAlertRoot.hidden=true;document.querySelector('.workspace').append(sharedAlertRoot);
    const alertContext=()=>({id:activeAccount?.id||role,role,name:activeAccount?.name||'',guardianId:guardian?.accountId||activeAccount?.guardianId,instructorId:activeAccount?.instructorId||seed.instructors[0]?.id});
    function updateRows() {
      for(const account of accounts){
        if(account.sample&&account.role==='guardian'&&!account.guardianId&&seed.guardians.length){account.guardianId=seed.guardians[0].id;guardian?.setAccount(account);}
        const record=account.role==='guardian'?seed.guardians.find(person=>person.id===account.guardianId):account.role==='instructor'?seed.instructors.find(person=>person.id===account.instructorId):null;
        if(record)Object.assign(account,{name:record.name,email:record.email,phone:record.phone});
      }
      const groups = new Map(seed.groups.map(group => [group.id, group]));
      const children = new Map(seed.children.map(child => [child.id, child]));
      rows = seed.attendance.map(attendance => {
      const group = groups.get(attendance.groupId);
      return {
        ...attendance,
        ...children.get(attendance.childId),
        groupLabel: group?.label ?? 'Unassigned',
        instructorId: group?.instructorId,
      };
      });
      window.dispatchEvent(new Event('kestrel:preview-change'));
      refreshAlertBadge();
    }
    updateRows();
    operations = createOperations(document.querySelector('#operations'), seed, {onChange: updateRows,alerts:{store:alertStore}});
    director = createDirector(document.querySelector('#director'), seed, {
      onChange: updateRows,
      onNavigate: next => { tab = next; renderWorkspace(); },
      alerts:{store:alertStore,context:()=>({id:'director',role:'director',name:accounts.find(a=>a.role==='director')?.name||'Director'}),visible:()=>role==='director'&&!signedOut},
    });
    guardian = createGuardian(document.querySelector('#guardian'), seed, {onChange:updateRows});
    patrol = createPatrol(document.querySelector('#patrol'), seed, {
      onSignOut: signOutAccount,
      onChange: updateRows,
    });
    for(const [id,name] of Object.entries({guardian:guardian.accountHolder,director:'Taylor Reed',desk:'Jordan Lee',instructor:'Alex Morgan',patrol:'Robin Fournier'})) accounts.push({id,role:id,name,email:id+'@example.test',sample:true,signedIn:true});
    Object.assign(accounts.find(account=>account.role==='guardian'),{guardianId:guardian.accountId,email:seed.guardians[0]?.email || 'guardian@example.test'});
    const instructorAccount=accounts.find(account=>account.role==='instructor');
    if(seed.instructors[0])Object.assign(instructorAccount,{instructorId:seed.instructors[0].id,name:seed.instructors[0].name,email:seed.instructors[0].email||instructorAccount.email,phone:seed.instructors[0].phone||''});
    const parentAccount=accounts.find(account=>account.role==='guardian');
    parentAccount.phone=seed.guardians.find(person=>person.id===parentAccount.guardianId)?.phone||'';
    refreshOwnDetails=()=>{
      const record=activeAccount?.role==='guardian'?seed.guardians.find(person=>person.id===activeAccount.guardianId):activeAccount?.role==='instructor'?seed.instructors.find(person=>person.id===activeAccount.instructorId):null;
      if(record)Object.assign(activeAccount,{name:record.name,email:record.email,phone:record.phone});
    };
    saveOwnDetails=data=>{
      const people=activeAccount.role==='guardian'?seed.guardians:activeAccount.role==='instructor'?seed.instructors:[];
      const ownId=activeAccount.role==='guardian'?activeAccount.guardianId:activeAccount.instructorId;
      if(people.some(person=>person.id!==ownId&&person.email?.toLowerCase()===data.email))throw new Error('This email belongs to another profile.');
      Object.assign(activeAccount,data);
      const record=activeAccount.role==='guardian'?seed.guardians.find(person=>person.id===activeAccount.guardianId):activeAccount.role==='instructor'?seed.instructors.find(person=>person.id===activeAccount.instructorId):null;
      if(record)Object.assign(record,data);
      if(activeAccount.role==='guardian')guardian.setAccount(activeAccount);
      updateRows();
    };
    accountDialog.addEventListener('close',()=>{if(!signedOut)renderWorkspace();});
    activeAccount=accounts.find(account=>account.role===role);
    refreshAlertBadge=()=>{
      if(signedOut)return;
      const button=[...nav.querySelectorAll('button')].find(button=>button.querySelector('.nav-label-full')?.textContent==='Alerts');
      if(!button)return;
      const unread=alertStore.unread(alertContext());button.setAttribute('aria-label',unread?`Alerts, ${unread} unread`:'Alerts');
      let badge=button.querySelector('.nav-alert-count');
      if(unread){if(!badge){badge=document.createElement('span');badge.className='nav-alert-count';badge.setAttribute('aria-hidden','true');button.append(badge);}badge.textContent=unread>9?'9+':String(unread);}else badge?.remove();
    };
    sharedAlerts=createSharedAlerts(sharedAlertRoot,seed,{
      store:alertStore,getContext:alertContext,onChange:updateRows,
      onOpen(link){
        if(!link)return;
        if(link.kind==='patrol'){
          if(role!=='patrol')return;
          tab='Active alerts';renderWorkspace();
          document.querySelector(`.p-alert-card[data-alert-id="${CSS.escape(link.incidentId)}"]`)?.scrollIntoView({block:'nearest'});
          return;
        }
        if(role==='guardian'){
          if(!seed.children.some(child=>child.id===link.childId&&child.guardianId===guardian.accountId))return;
          tab='My children';renderWorkspace();
          document.querySelector(`[data-consent="${CSS.escape(link.childId)}"]`)?.click();
        }else if(role==='director'){
          tab='Children';renderWorkspace();director.openChild(link.childId);
        }else if(['desk','instructor'].includes(role)){
          tab=workspaces[role].tabs[0];renderWorkspace();operations.openChild(link.childId);
        }
      },
    });
    document.addEventListener('click',event=>{
      if(!event.target.closest('[data-search-action="found"],[data-found-confirm]'))return;
      queueMicrotask(()=>{if(role==='patrol'&&tab==='Active alerts'&&(seed.patrolAlerts||[]).some(record=>record.active===false&&String(record.status).toLowerCase()==='found')){updateRows();renderWorkspace();}});
    });
    document.querySelector('#lesson-date').textContent = new Intl.DateTimeFormat(
      'en-CA', { dateStyle: 'full', timeZone: 'UTC' }
    ).format(new Date(seed.lessonDate));

    search.addEventListener('input', renderRoster);
    renderWorkspace();
  } catch (error) {
    console.error(error);
    message.textContent = 'The demo records could not load. Reload to try again.';
  }
}

start();
