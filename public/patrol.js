const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const icons = {
  alert: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 21 19a1.2 1.2 0 0 1-1 1.8H4A1.2 1.2 0 0 1 3 19L12 3.5Z"/><path d="M12 9v5m0 3h.01"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></svg>',
  place: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4 4"/></svg>',
  people: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3a4.5 4.5 0 0 1 4.5 4.5V20m1-12a3 3 0 0 1 0 5.8m1 2.5a4.5 4.5 0 0 1 4 4.5V20"/></svg>',
  ski: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 4 12 16M18 4 6 20M4 9l8 3 8-3M4 15l8-3 8 3"/></svg>',
  bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"/></svg>',
};

function fact(icon, label, value) {
  return `<div class="p-fact"><span class="p-icon p-icon-soft">${icon}</span><div><h3>${label}</h3><p>${escapeHtml(value || 'Not recorded')}</p></div></div>`;
}

function logRows(entries) {
  return entries.map(entry => `<div class="p-log-row"><time>${escapeHtml(entry.time)}</time><span>${escapeHtml(entry.action)}</span><strong>${escapeHtml(entry.actor)}</strong></div>`).join('');
}

export function createPatrol(root, seed, { onSignOut }) {
  const localSearchLogs = new Map();
  function render() {
    const alerts = (seed.patrolAlerts ?? []).filter(alert => ['School desk', 'Instructor'].includes(alert.source) && alert.active !== false);
    root.innerHTML = `<section class="patrol-shell" aria-label="Patrol workspace">
      <header class="p-topbar">
        <div><p class="p-brand">Patrol workspace</p><h2>Active alerts</h2></div>
        <div class="p-actions">
          <button class="p-icon-button" type="button" aria-label="Notifications" title="Notifications">${icons.bell}</button>
          <button class="p-signout" type="button" data-testid="patrol-sign-out">Sign out</button>
        </div>
      </header>
      <div class="p-content">
        <p class="p-eyebrow">Patrol response board</p>
        <h2 class="p-title">Alerted missing children</h2>
        <p class="p-intro">Active alerts from the school desk and instructors are shown.</p>
        ${alerts.length ? `<div class="p-alert-list">${alerts.map(alert => `<article class="p-alert-card" data-testid="patrol-alert" data-alert-id="${escapeHtml(alert.id)}">
          <div class="p-alert-main">
          <div class="p-alert-head">
            <span class="p-icon p-alert-icon">${icons.alert}</span>
            <div class="p-child"><span class="p-case">${escapeHtml(alert.caseNumber)}</span><h3>${escapeHtml(alert.childName)}</h3><p class="p-alias">Consent form: ${escapeHtml(alert.alternateName)}</p></div>
            <span class="p-status">${escapeHtml(alert.status)}</span>
            <div class="p-child-meta"><span>Child ID <strong>${escapeHtml(alert.childId)}</strong></span><span>Age ${escapeHtml(alert.age)}</span><span>${escapeHtml(alert.group)}</span><span>Desk alert received ${escapeHtml(alert.receivedTime)}</span></div>
            <div class="p-radio-channel" data-testid="patrol-radio-channel"><span>Radio</span><strong>${escapeHtml(alert.radioChannel || 'Not assigned')}</strong></div>
          </div>
          <div class="p-facts">
            ${fact(icons.clock, 'Last seen time', alert.lastSeenTime)}
            ${fact(icons.place, 'Last seen place', alert.lastSeenPlace)}
            ${fact(icons.people, 'Clothing', alert.clothing)}
            ${fact(icons.ski, 'Equipment', alert.equipment)}
          </div>
          ${alert.medical ? `<section class="p-medical"><h3>Medical information</h3><p>${escapeHtml(alert.medical)}</p></section>` : ''}
          <section class="p-search-context"><h3>Search details</h3>
            <p><strong>Visibility:</strong> ${escapeHtml(alert.visibility || 'Not recorded')}</p>
            <p><strong>Injuries:</strong> ${escapeHtml(alert.injuries || 'Not recorded')}</p>
            <p><strong>Clothing confidence:</strong> ${escapeHtml(alert.clothingConfidence || 'Not recorded')}</p>
          </section>
          <section class="p-scan"><h3>Latest lift ticket scan</h3>
            ${alert.liftScan ? `
            <p><strong>Pass:</strong> ${escapeHtml(alert.liftScan.pass)}</p>
            <p><strong>Time:</strong> ${escapeHtml(alert.liftScan.time)}</p>
            <p><strong>Location:</strong> ${escapeHtml(alert.liftScan.location)}</p>
            ` : `<p class="p-unavailable">No scan available. ${escapeHtml(alert.liftScanUnavailableReason || 'Pass details have not been recorded.')}</p>`}
          </section>
          ${alert.emergencyContacts?.length ? `<section class="p-contacts"><h3>Emergency contacts for police handoff</h3>
            ${alert.emergencyContacts.map(contact => `<div class="p-contact"><div><strong>${escapeHtml(contact.name)}</strong><span>${escapeHtml(contact.relationship)}</span></div><div class="p-contact-phone"><a href="tel:${escapeHtml(contact.phone)}">${escapeHtml(contact.phone)}</a><span>${escapeHtml(contact.phoneStatus)}</span></div></div>`).join('')}
          </section>` : ''}
          ${alert.escalation ? `<p class="p-escalation" data-testid="patrol-escalation">${escapeHtml(alert.escalation)}</p>` : ''}
          <section class="p-actions-panel" data-testid="patrol-actions">
            <h3>Actions</h3>
            <div class="p-action-buttons">
              <button class="p-action-button" type="button" data-testid="patrol-request-lift-scan" data-action="lift" data-alert-id="${escapeHtml(alert.id)}">Request lift scan</button>
              <button class="p-action-button p-action-police" type="button" data-testid="patrol-call-police" data-action="police" data-alert-id="${escapeHtml(alert.id)}">Call police (1 hr)</button>
              <button class="p-action-button p-action-copy" type="button" data-testid="patrol-copy-report" data-action="copy" data-alert-id="${escapeHtml(alert.id)}">Copy details for police report</button>
              <button class="p-action-button p-action-found-mobile" type="button" data-testid="patrol-log-found-mobile" data-search-action="found" data-alert-id="${escapeHtml(alert.id)}">Found</button>
            </div>
            <p class="p-family-note">Police lead family communication once engaged.</p>
            <p class="p-action-message" role="status" aria-live="polite" data-testid="patrol-action-message" hidden></p>
          </section>
          </div>
          <div class="p-patrol-logs" data-testid="patrol-logs">
            <section class="p-log-panel" aria-labelledby="system-log-title">
              <div class="p-log-heading"><h3 id="system-log-title">System log</h3><span class="p-log-badge p-automatic">Automatic</span></div>
              <div class="p-log-entries">${logRows(alert.systemLog || [])}</div>
              <p class="p-log-note">App events only. Radio coordination is not captured.</p>
            </section>
            <section class="p-log-panel" aria-labelledby="search-log-title">
              <div class="p-log-heading"><h3 id="search-log-title">Search log</h3><span class="p-log-badge p-patrol-entry">Patrol entry</span></div>
              <p class="p-search-log-intro">Tap to log key actions between radio calls.</p>
              <div class="p-log-actions">
                <button type="button" class="p-log-button p-log-dispatched" data-testid="patrol-log-dispatched" data-search-action="dispatched" data-alert-id="${escapeHtml(alert.id)}">+ Dispatched</button>
                <button type="button" class="p-log-button" data-testid="patrol-log-broadcast" data-search-action="broadcast" data-alert-id="${escapeHtml(alert.id)}">+ Broadcast</button>
                <button type="button" class="p-log-button" data-testid="patrol-log-lift-scan" data-search-action="lift-scan" data-alert-id="${escapeHtml(alert.id)}">+ Lift scan</button>
                <button type="button" class="p-log-button" data-testid="patrol-log-found" data-search-action="found" data-alert-id="${escapeHtml(alert.id)}">+ Found</button>
              </div>
              <div class="p-log-entries" data-testid="patrol-search-log-entries" id="patrol-search-log-${escapeHtml(alert.id)}">${logRows(localSearchLogs.get(alert.id) || alert.searchLog || [])}</div>
              <p class="p-log-note">Entries are demo-only; radio messages are not sent or recorded.</p>
            </section>
          </div>
        </article>`).join('')}</div>` : '<p class="p-empty" data-testid="patrol-empty">No active alerts from the school desk.</p>'}
      </div>
    </section>`;
    root.querySelector('[data-testid="patrol-sign-out"]').addEventListener('click', onSignOut);
    root.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', async () => {
      const selectedAlert = alerts.find(item => item.id === button.dataset.alertId);
      if (!selectedAlert) return;
      const message = root.querySelector('[data-testid="patrol-action-message"]');
      const reveal = text => { message.textContent = text; message.hidden = false; };
      if (button.dataset.action === 'lift') {
        reveal(selectedAlert.liftScan
          ? 'This preview cannot contact the ticket office. No scan request was sent.'
          : 'No scan request was sent: the pass number is unknown and is not linked to the child.');
      } else if (button.dataset.action === 'police') {
        reveal('This preview does not place calls. Follow the displayed escalation time and contact police; police request search and rescue through 911.');
      } else {
        const contacts = (selectedAlert.emergencyContacts ?? []).map(contact =>
          `${contact.name} (${contact.relationship}): ${contact.phone} — ${contact.phoneStatus}`
        ).join('\n');
        const report = [
          `Missing child report · ${selectedAlert.caseNumber}`,
          `Child: ${selectedAlert.childName} (consent form: ${selectedAlert.alternateName}) · ID ${selectedAlert.childId} · age ${selectedAlert.age} · ${selectedAlert.group}`,
          `Last seen: ${selectedAlert.lastSeenTime}, ${selectedAlert.lastSeenPlace}`,
          `Visibility: ${selectedAlert.visibility}`,
          `Clothing: ${selectedAlert.clothing} (${selectedAlert.clothingConfidence})`,
          `Equipment: ${selectedAlert.equipment}`,
          `Injuries: ${selectedAlert.injuries}`,
          `Medical: ${selectedAlert.medical}`,
          `Lift scan: ${selectedAlert.liftScan ? `${selectedAlert.liftScan.time}, ${selectedAlert.liftScan.location}, pass ${selectedAlert.liftScan.pass}` : `Unavailable — ${selectedAlert.liftScanUnavailableReason}`}`,
          `Emergency contacts for police handoff:\n${contacts}`,
          `Escalation: ${selectedAlert.escalation}`,
        ].join('\n');
        try {
          if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(report);
          else {
            const field = document.createElement('textarea');
            field.value = report;
            field.setAttribute('readonly', '');
            field.style.position = 'fixed';
            field.style.opacity = '0';
            root.append(field);
            field.select();
            const copied = document.execCommand('copy');
            field.remove();
            if (!copied) throw new Error('Clipboard unavailable');
          }
          reveal('Police report details copied. Nothing was sent.');
        } catch {
          reveal('Could not copy automatically. You can still read and share the details above by following your procedure.');
        }
      }
    }));
    root.querySelectorAll('[data-search-action]').forEach(button => button.addEventListener('click', () => {
      const selectedAlert = alerts.find(item => item.id === button.dataset.alertId);
      if (!selectedAlert) return;
      const entries = localSearchLogs.get(selectedAlert.id) || [...(selectedAlert.searchLog || [])];
      const [lastHour, lastMinute] = (entries.at(-1)?.time || '2:40').split(':').map(Number);
      const nextMinuteTotal = lastHour * 60 + lastMinute + 1;
      const actionLabels = {
        dispatched: 'Dispatched (4)',
        broadcast: 'Description broadcast',
        'lift-scan': 'Lift scan lookup blocked — pass number unavailable',
        found: 'Found marker — desk confirmation pending',
      };
      const hour = Math.floor(nextMinuteTotal / 60) % 12 || 12;
      const minute = String(nextMinuteTotal % 60).padStart(2, '0');
      entries.push({ time: `${hour}:${minute}`, action: actionLabels[button.dataset.searchAction], actor: 'R. Fournier', type: button.dataset.searchAction });
      localSearchLogs.set(selectedAlert.id, entries);
      if (button.dataset.searchAction === 'found') {
        selectedAlert.status = 'Found';
        selectedAlert.active = false;
        const alertCard = root.querySelector(`.p-alert-card[data-alert-id="${CSS.escape(selectedAlert.id)}"]`);
        const status = alertCard?.querySelector('.p-status');
        if (status) status.textContent = 'Found';
      }
      const entryList = root.querySelector(`#patrol-search-log-${CSS.escape(selectedAlert.id)}`);
      if (entryList) entryList.innerHTML = logRows(entries);
    }));
  }
  return { render, clear() { root.replaceChildren(); } };
}
