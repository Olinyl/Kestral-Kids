import {profileMeta} from './profile-ui.js';

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

function patrolGroupMeta(value) {
  const [group, ...levelParts] = String(value ?? '').split('·').map(part => part.trim());
  const level = levelParts.join(' · ').replace(/^level\s*/i, 'Level ');
  return profileMeta({group, level});
}

export function createPatrol(root, seed, { onSignOut }) {
  const localSearchLogs = new Map();
  function render() {
    const alerts = (seed.patrolAlerts ?? []).filter(alert => ['School desk', 'Instructor'].includes(alert.source) && alert.active !== false);
    root.innerHTML = `<section class="patrol-shell" aria-label="Patrol workspace">
      <div class="p-content">
        ${alerts.length ? `<div class="p-alert-carousel" data-testid="patrol-alert-carousel">
          ${alerts.length > 1 ? `<div class="p-carousel-controls p-carousel-controls-desktop" aria-label="Alert navigation">
            <button type="button" data-testid="patrol-alert-previous" aria-label="Previous alert" disabled>‹ Previous</button>
            <span data-testid="patrol-alert-position-desktop" aria-live="polite">Alert 1 of ${alerts.length}</span>
            <button type="button" data-testid="patrol-alert-next" aria-label="Next alert">Next ›</button>
          </div>` : ''}
          <div class="p-alert-list" data-testid="patrol-alert-list" aria-label="Active missing child alerts" tabindex="0">${alerts.map(alert => `<article class="p-alert-card" data-testid="patrol-alert" data-alert-id="${escapeHtml(alert.id)}">
          <div class="p-alert-main">
          <div class="p-alert-head">
            <span class="p-icon p-alert-icon">${icons.alert}</span>
            <div class="p-child"><div class="p-child-heading-row"><span class="p-case">${escapeHtml(alert.caseNumber)}</span><span class="p-status${alert.status === 'Found' ? ' p-status-found' : ''}">${escapeHtml(alert.status)}</span>${patrolGroupMeta(alert.group)}</div><h3>${escapeHtml(alert.childName)}</h3><div class="p-child-quick-meta"><span>Age ${escapeHtml(alert.age)}</span><span>Desk alert received ${escapeHtml(alert.receivedTime)}</span></div></div>
            ${alert.program ? `<div class="p-child-meta">${profileMeta({program:alert.program})}</div>` : ''}
          </div>
          <div class="p-left-column">
          <div class="p-facts">
            ${fact(icons.clock, 'Last seen time', alert.lastSeenTime)}
            ${fact(icons.place, 'Last seen place', alert.lastSeenPlace)}
            ${fact(icons.people, 'Clothing', alert.clothing)}
            ${fact(icons.ski, 'Equipment', alert.equipment)}
          </div>
          <section class="p-search-context"><h3>Search details</h3>
            <p><strong>Visibility:</strong> ${escapeHtml(alert.visibility || 'Not recorded')}</p>
            <p><strong>Injuries:</strong> ${escapeHtml(alert.injuries || 'Not recorded')}</p>
            <p><strong>Clothing confidence:</strong> ${escapeHtml(alert.clothingConfidence || 'Not recorded')}</p>
          </section>
          <section class="p-scan" data-testid="patrol-lift-scan"><h3>Latest lift ticket scan</h3>
            <div data-testid="patrol-lift-scan-details" aria-live="polite">${alert.liftScan ? `
            <p class="p-scan-summary">${escapeHtml(alert.liftScan.pass)} · ${escapeHtml(alert.liftScan.time)}</p>
            ` : `<p class="p-unavailable">Request lift scan if needed.</p>`}</div>
          </section>
          </div>
          <div class="p-right-column">
          ${alert.medical ? `<section class="p-medical"><h3>Medical information</h3><p>${escapeHtml(alert.medical)}</p></section>` : ''}
          ${alert.emergencyContacts?.length ? `<section class="p-contacts"><h3>Emergency contacts for police handoff</h3>
            ${alert.emergencyContacts.map(contact => `<div class="p-contact"><div><strong>${escapeHtml(contact.name)}</strong><span>${escapeHtml(contact.relationship)}</span></div><div class="p-contact-phone"><a href="tel:${escapeHtml(contact.phone)}">${escapeHtml(contact.phone)}</a><span>${escapeHtml(contact.phoneStatus)}</span></div></div>`).join('')}
          </section>` : ''}
          <section class="p-actions-panel" data-testid="patrol-actions">
            <h3>Actions</h3>
            <div class="p-action-buttons">
              <button class="p-action-button" type="button" data-testid="patrol-request-lift-scan" data-action="lift" data-alert-id="${escapeHtml(alert.id)}" ${alert.liftScanRequested ? 'disabled' : ''}>${alert.liftScanRequested ? 'Lift scan requested' : 'Request lift scan'}</button>
              <button class="p-action-button p-action-found" type="button" data-testid="patrol-log-found-mobile" data-search-action="found" data-alert-id="${escapeHtml(alert.id)}">Found / Resolved</button>
              <button class="p-action-button p-action-copy" type="button" data-testid="patrol-copy-report" data-action="copy" data-alert-id="${escapeHtml(alert.id)}">Copy details for police report</button>
              <button class="p-action-button p-action-police" type="button" data-testid="patrol-call-police" disabled aria-disabled="true">Call police (1 hr)</button>
            </div>
            <div class="p-found-confirmation" data-testid="patrol-found-confirmation" role="group" aria-labelledby="patrol-found-confirm-title-${escapeHtml(alert.id)}" hidden>
              <strong id="patrol-found-confirm-title-${escapeHtml(alert.id)}">Confirm this child has been found and close the alert?</strong>
              <div><button class="p-found-cancel" type="button" data-found-cancel>Cancel</button><button class="p-found-confirm" type="button" data-found-confirm>Confirm</button></div>
            </div>
            <p class="p-action-message" role="status" aria-live="polite" data-testid="patrol-action-message" hidden></p>
          </section>
          </div>
          </div>
          <div class="p-patrol-logs" data-testid="patrol-logs">
            <section class="p-log-panel p-system-log-panel" aria-labelledby="system-log-title">
              <div class="p-log-heading"><h3 id="system-log-title">System log</h3><span class="p-log-badge p-automatic">Automatic</span></div>
              <div class="p-log-entries" data-testid="patrol-system-log-entries" tabindex="0" aria-label="System log entries">${logRows(alert.systemLog || [])}</div>
              <p class="p-log-note">App events only. Radio coordination is not captured.</p>
            </section>
            <section class="p-log-panel p-search-log-panel" aria-labelledby="search-log-title">
              <div class="p-log-heading"><h3 id="search-log-title">Search log</h3><span class="p-log-badge p-patrol-entry">Patrol entry</span></div>
              <div class="p-log-actions">
                <button type="button" class="p-log-button p-log-dispatched" data-testid="patrol-log-dispatched" data-search-action="dispatched" data-alert-id="${escapeHtml(alert.id)}">+ Dispatched</button>
                <button type="button" class="p-log-button" data-testid="patrol-log-broadcast" data-search-action="broadcast" data-alert-id="${escapeHtml(alert.id)}">+ Broadcast</button>
                <button type="button" class="p-log-button" data-testid="patrol-log-lift-scan" data-search-action="lift-scan" data-alert-id="${escapeHtml(alert.id)}">+ Lift scan</button>
                <button type="button" class="p-log-button" data-testid="patrol-log-found" data-search-action="found" data-alert-id="${escapeHtml(alert.id)}">+ Found</button>
              </div>
              <div class="p-log-entries p-search-log-entries" data-testid="patrol-search-log-entries" id="patrol-search-log-${escapeHtml(alert.id)}" tabindex="0" aria-label="Search log entries">${logRows(localSearchLogs.get(alert.id) || alert.searchLog || [])}</div>
              <p class="p-log-note">Entries are demo-only; radio messages are not sent or recorded.</p>
            </section>
          </div>
        </article>`).join('')}</div>
          ${alerts.length > 1 ? `<div class="p-carousel-pagination-mobile" aria-label="Alert pages">
            <span data-testid="patrol-alert-position-mobile" aria-live="polite">Alert 1 of ${alerts.length}</span>
            <div class="p-carousel-dots">${alerts.map((alert,index) => `<button type="button" class="p-carousel-dot" data-testid="patrol-alert-dot-${index + 1}" data-alert-index="${index}" aria-label="Show alert ${index + 1} of ${alerts.length}" aria-current="${index === 0 ? 'true' : 'false'}"></button>`).join('')}</div>
          </div>` : ''}
        </div>` : '<p class="p-empty" data-testid="patrol-empty">No active alerts from the school desk.</p>'}
      </div>
    </section>`;
    const alertTrack = root.querySelector('[data-testid="patrol-alert-list"]');
    if (alertTrack && alerts.length > 1) {
      const previous = root.querySelector('[data-testid="patrol-alert-previous"]');
      const next = root.querySelector('[data-testid="patrol-alert-next"]');
      const desktopPosition = root.querySelector('[data-testid="patrol-alert-position-desktop"]');
      const mobilePosition = root.querySelector('[data-testid="patrol-alert-position-mobile"]');
      const dots = [...root.querySelectorAll('.p-carousel-dot')];
      const scrollStep = () => alertTrack.clientWidth + (parseFloat(getComputedStyle(alertTrack).columnGap) || 0);
      const updatePosition = () => {
        const index = Math.max(0, Math.min(alerts.length - 1, Math.round(alertTrack.scrollLeft / scrollStep())));
        const label = `Alert ${index + 1} of ${alerts.length}`;
        if (desktopPosition) desktopPosition.textContent = label;
        if (mobilePosition) mobilePosition.textContent = label;
        dots.forEach((dot,dotIndex) => dot.setAttribute('aria-current', String(dotIndex === index)));
        previous.disabled = index === 0;
        next.disabled = index === alerts.length - 1;
      };
      previous.addEventListener('click', () => alertTrack.scrollBy({left:-scrollStep(), behavior:'smooth'}));
      next.addEventListener('click', () => alertTrack.scrollBy({left:scrollStep(), behavior:'smooth'}));
      dots.forEach(dot => dot.addEventListener('click', () => {
        const targetIndex = Number(dot.dataset.alertIndex);
        const currentIndex = Math.round(alertTrack.scrollLeft / scrollStep());
        alertTrack.scrollBy({left:(targetIndex - currentIndex) * scrollStep(), behavior:'smooth'});
      }));
      alertTrack.addEventListener('scroll', () => requestAnimationFrame(updatePosition), {passive:true});
      updatePosition();
    }
    root.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', async () => {
      const selectedAlert = alerts.find(item => item.id === button.dataset.alertId);
      if (!selectedAlert) return;
      const card = button.closest('.p-alert-card');
      const message = card?.querySelector('[data-testid="patrol-action-message"]');
      const reveal = text => { message.textContent = text; message.hidden = false; };
      if (button.dataset.action === 'lift') {
        if (!selectedAlert.liftScanRequested) {
          const clickedAt = new Date();
          const pass = `P-${Math.floor(100000 + Math.random() * 900000)}`;
          const time = clickedAt.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'});
          selectedAlert.liftScan = {pass, time};
          selectedAlert.liftScanRequested = true;
          const scanDetails = card?.querySelector('[data-testid="patrol-lift-scan-details"]');
          if (scanDetails) scanDetails.innerHTML = `<p class="p-scan-summary">${escapeHtml(pass)} · ${escapeHtml(time)}</p>`;
          button.textContent = 'Lift scan requested';
          button.disabled = true;
          if (message) {
            message.textContent = '';
            message.hidden = true;
          }
        }
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
          reveal('Police report details copied.');
        } catch {
          reveal('Could not copy automatically. You can still read and share the details above by following your procedure.');
        }
      }
    }));
    root.querySelectorAll('[data-testid="patrol-log-found-mobile"]').forEach(foundButton => foundButton.addEventListener('click', event => {
      if (foundButton.dataset.confirmed === 'true') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const card = foundButton.closest('.p-alert-card');
      const confirmation = card?.querySelector('[data-testid="patrol-found-confirmation"]');
      if (confirmation) {
        confirmation.hidden = false;
        confirmation.querySelector('[data-found-confirm]')?.focus();
      }
    }));
    root.querySelectorAll('[data-found-confirm]').forEach(confirmButton => confirmButton.addEventListener('click', () => {
      const card = confirmButton.closest('.p-alert-card');
      const confirmation = confirmButton.closest('[data-testid="patrol-found-confirmation"]');
      const foundButton = card?.querySelector('[data-testid="patrol-log-found-mobile"]');
      if (confirmation) confirmation.hidden = true;
      if (foundButton) {
        foundButton.dataset.confirmed = 'true';
        foundButton.click();
        delete foundButton.dataset.confirmed;
        foundButton.disabled = true;
      }
    }));
    root.querySelectorAll('[data-found-cancel]').forEach(cancelButton => cancelButton.addEventListener('click', () => {
      const card = cancelButton.closest('.p-alert-card');
      const confirmation = cancelButton.closest('[data-testid="patrol-found-confirmation"]');
      if (confirmation) confirmation.hidden = true;
      card?.querySelector('[data-testid="patrol-log-found-mobile"]')?.focus();
    }));
    root.querySelectorAll('[data-search-action]').forEach(button => button.addEventListener('click', () => {
      const selectedAlert = alerts.find(item => item.id === button.dataset.alertId);
      if (!selectedAlert) return;
      const entries = localSearchLogs.get(selectedAlert.id) || [...(selectedAlert.searchLog || [])];
      const clickedAt = new Date();
      const time = `${clickedAt.getHours() % 12 || 12}:${String(clickedAt.getMinutes()).padStart(2, '0')}`;
      const actionLabels = {
        dispatched: 'Dispatched (4)',
        broadcast: 'Description broadcast',
        'lift-scan': 'Lift scan lookup blocked — pass number unavailable',
        found: 'Found marker — desk confirmation pending',
      };
      entries.push({ time, action: actionLabels[button.dataset.searchAction], actor: 'R. Fournier', type: button.dataset.searchAction });
      localSearchLogs.set(selectedAlert.id, entries);
      if (button.dataset.searchAction === 'found') {
        selectedAlert.status = 'Found';
        selectedAlert.active = false;
        const alertCard = root.querySelector(`.p-alert-card[data-alert-id="${CSS.escape(selectedAlert.id)}"]`);
        const status = alertCard?.querySelector('.p-status');
        if (status) {
          status.textContent = 'Found';
          status.classList.add('p-status-found');
        }
      }
      const entryList = root.querySelector(`#patrol-search-log-${CSS.escape(selectedAlert.id)}`);
      if (entryList) entryList.innerHTML = logRows(entries);
    }));
  }
  return { render, clear() { root.replaceChildren(); } };
}
