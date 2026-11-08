import { createDirector } from './director.js';
import { createOperations } from './operations.js';
import { createGuardian } from './guardian.js';
import { createPatrol } from './patrol.js';

const workspaces = {
  desk: {
    label: 'School desk', tabs: ['Roster', 'Incidents'],
  },
  guardian: { label: 'Guardian', tabs: ['My children', 'Messages'] },
  director: { label: 'Director', tabs: ['Overview', 'Children', 'Guardians', 'Instructors', 'Lesson groups'] },
  instructor: { label: 'Instructor', tabs: ['Group roster'] },
  patrol: { label: 'Patrol', tabs: ['Active alerts'] },
};

const viewAs = document.querySelector('#view-as');
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
let instructorGroup;
let director;
let operations;
let guardian;
let patrol;

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
    Incidents: 'No incidents recorded for this lesson day.',
    Pickup: 'No pickups recorded for this lesson day.',
    'Incomplete profiles': 'All profiles are complete.',
  };
  message.hidden = matches.length > 0;
  message.textContent = query ? 'No children match that name or bib.' :
    (emptyMessages[tab] ?? 'No children to show.');
}

function renderWorkspace() {
  const workspace = workspaces[role];
  nav.style.setProperty('--tab-count',workspace.tabs.length);
  title.textContent = role === 'guardian' ? 'Hello, Alyssa' : workspace.label + ' workspace';
  sectionTitle.textContent = tab === 'Today' ? 'Today’s roster' : tab;
  searchLabel.hidden = !(role === 'desk' && ['Today', 'Children'].includes(tab));
  standardPanel.hidden = role === 'instructor';
  instructorView.hidden = role !== 'instructor';
  nav.replaceChildren(...workspace.tabs.map(label => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    if (role === 'director') button.dataset.testid = 'director-nav-' + ({ 'Lesson groups': 'groups' }[label] ?? label.toLowerCase());
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
  if (operational) { director.clear?.(); operations.render(role,tab); return; }
  if (role === 'director') {
    director.render(tab);
    return;
  }
  if (role === 'guardian') { guardian.render(tab); return; }
  if (role === 'patrol') { patrol.render(tab); return; }
  renderRoster();
  if (role === 'instructor') renderInstructor();
}

function renderInstructor() {
  const groupRows = rows.filter(row => row.groupId === instructorGroup.id);
  document.querySelector('#offline-status').textContent = instructorGroup.offlineReady
    ? 'Roster saved for offline use' : 'Roster is online only';
  document.querySelector('#instructor-group-title').textContent = `${instructorGroup.label} · ${instructorGroup.instructorName} · ${instructorGroup.level}`;
  document.querySelector('#group-count').textContent = `${groupRows.length} / ${groupRows.length}`;
  instructorRoster.replaceChildren(...groupRows.map((row, index) => {
    const item = instructorItem.content.firstElementChild.cloneNode(true);
    item.querySelector('.instructor-number').textContent = String(index + 1);
    item.querySelector('strong').textContent = row.displayName;
    item.querySelector('.bib').textContent = 'Bib ' + row.bib;
    return item;
  }));
  document.querySelector('#must-know-heading').textContent = `Must know · ${instructorGroup.label} only`;
  const notes = instructorGroup.mustKnow.map(note => {
    const child = rows.find(row => row.id === note.childId);
    const card = document.createElement('article');
    card.className = 'medical-note';
    const heading = document.createElement('strong');
    heading.textContent = `${child?.displayName ?? 'Child'} · ${note.condition}`;
    const detail = document.createElement('p');
    detail.textContent = note.instruction;
    card.append(heading, detail);
    return card;
  });
  document.querySelector('#medical-notes').replaceChildren(...notes);
  const childSelect = radioReport.elements.childId;
  childSelect.replaceChildren(...groupRows.map(row => new Option(row.displayName, row.id)));
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
    function updateRows() {
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
    instructorGroup = seed.groups.find(group => group.id === 'group-14');
    document.querySelector('#lesson-date').textContent = new Intl.DateTimeFormat(
      'en-CA', { dateStyle: 'full', timeZone: 'UTC' }
    ).format(new Date(seed.lessonDate));

    for (const [id, workspace] of Object.entries(workspaces)) {
      viewAs.add(new Option(workspace.label, id));
    }
    viewAs.value = role;
    viewAs.disabled = false;
    viewAs.addEventListener('change', () => {
      role = viewAs.value;
      tab = workspaces[role].tabs[0];
      search.value = '';
      renderWorkspace();
    });
    search.addEventListener('input', renderRoster);
    reportMissing.addEventListener('click', () => {
      radioReport.hidden = !radioReport.hidden;
      if (!radioReport.hidden) radioReport.elements.lastSeen.focus();
    });
    radioReport.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(radioReport);
      const child = rows.find(row => row.id === data.get('childId'));
      document.querySelector('#radio-report-status').textContent =
        `Radio report sent to the desk: ${child.displayName}, last seen at ${data.get('lastSeen')}.`;
      radioReport.reset();
    });
    renderWorkspace();
  } catch (error) {
    console.error(error);
    message.textContent = 'The demo records could not load. Reload to try again.';
  }
}

start();
