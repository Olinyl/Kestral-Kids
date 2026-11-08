const workspaces = {
  desk: {
    label: 'School desk', tabs: ['Today', 'Children', 'Pickup', 'Incidents'],
  },
  guardian: { label: 'Guardian', tabs: ['My children'] },
  director: { label: 'Director', tabs: ['Incomplete profiles'] },
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
const standardPanel = document.querySelector('.panel');
const instructorView = document.querySelector('#instructor-view');
const instructorRoster = document.querySelector('#instructor-roster');
const instructorItem = document.querySelector('#instructor-roster-item');
const radioReport = document.querySelector('#radio-report');
const reportMissing = document.querySelector('#report-missing');

let role = 'desk';
let tab = 'Today';
let rows = [];
let instructorGroup;

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
  title.textContent = workspace.label + ' workspace';
  sectionTitle.textContent = tab === 'Today' ? 'Today’s roster' : tab;
  searchLabel.hidden = !(role === 'desk' && ['Today', 'Children'].includes(tab));
  standardPanel.hidden = role === 'instructor';
  instructorView.hidden = role !== 'instructor';
  nav.replaceChildren(...workspace.tabs.map(label => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    if (label === tab) button.setAttribute('aria-current', 'page');
    button.addEventListener('click', () => {
      tab = label;
      search.value = '';
      renderWorkspace();
      nav.querySelector('[aria-current]').focus();
    });
    return button;
  }));
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
    const seed = await response.json();
    const groups = new Map(seed.groups.map(group => [group.id, group]));
    const children = new Map(seed.children.map(child => [child.id, child]));
    rows = seed.attendance.map(attendance => {
      const group = groups.get(attendance.groupId);
      return {
        ...attendance,
        ...children.get(attendance.childId),
        groupLabel: group.label,
        instructorId: group.instructorId,
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
