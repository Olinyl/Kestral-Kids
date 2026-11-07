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

let role = 'desk';
let tab = 'Today';
let rows = [];

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
    renderWorkspace();
  } catch (error) {
    console.error(error);
    message.textContent = 'The demo records could not load. Reload to try again.';
  }
}

start();
