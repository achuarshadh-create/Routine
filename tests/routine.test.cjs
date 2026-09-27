const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const html = readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'README.md should contain the routine script');

function loadRoutine({
  at = '2026-09-25T06:15:00Z',
  stored = {},
  notifications = 'unsupported',
  serviceWorker = false,
} = {}) {
  let instant = Date.parse(at);
  const storage = new Map(Object.entries(stored));
  const intervals = [];
  const notices = [];
  const alerts = [];
  const registrations = [];
  const blobs = [];

  // The app reads local clock fields and a UTC storage key. Make both UTC so
  // these cases give the same results on machines in any timezone.
  class ClockDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [instant]));
    }
    getHours() { return this.getUTCHours(); }
    getMinutes() { return this.getUTCMinutes(); }
    getSeconds() { return this.getUTCSeconds(); }
    toLocaleDateString(locale, options) {
      return super.toLocaleDateString(locale, { ...options, timeZone: 'UTC' });
    }
  }

  class Element {
    constructor() {
      this.id = '';
      this.className = '';
      this.children = [];
      this.style = {};
      this.innerText = '';
      this.html = '';
      this.classList = {
        contains: name => this.className.split(/\s+/).includes(name),
        add: name => {
          if (!this.classList.contains(name)) this.className = `${this.className} ${name}`.trim();
        },
        remove: name => {
          this.className = this.className.split(/\s+/).filter(part => part !== name).join(' ');
        },
      };
    }
    get innerHTML() { return this.html; }
    set innerHTML(value) {
      this.html = value;
      this.children = [];
    }
    appendChild(child) { this.children.push(child); }
  }

  const elements = new Map(
    ['routineList', 'currentDate', 'heroBadge', 'heroActivity',
      'heroCountdown', 'progressBar', 'notifBtn'].map(id => [id, new Element()]),
  );
  elements.get('notifBtn').innerText = '🔔 Alerts: Off';
  const list = elements.get('routineList');
  const document = {
    createElement: () => new Element(),
    getElementById: id => elements.get(id) ?? list.children.find(child => child.id === id) ?? null,
    querySelectorAll: selector => selector === '.routine-item' ? list.children : [],
  };
  const localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  };
  const window = {};
  const navigator = {};
  if (notifications !== 'unsupported') {
    class MockNotification {
      constructor(title, options) { notices.push({ title, options }); }
      static requestPermission() { return Promise.resolve(notifications); }
    }
    window.Notification = MockNotification;
  }
  if (serviceWorker) {
    navigator.serviceWorker = {
      register: url => {
        registrations.push(url);
        return Promise.resolve();
      },
    };
  }

  const context = vm.createContext({
    Date: ClockDate,
    document,
    localStorage,
    navigator,
    window,
    Notification: window.Notification,
    alert: message => alerts.push(message),
    setInterval: (fn, delay) => intervals.push({ fn, delay }),
    Blob: class {
      constructor(parts, options) {
        this.parts = parts;
        this.options = options;
        blobs.push(this);
      }
    },
    URL: { createObjectURL: () => 'blob:routine-test' },
  });
  vm.runInContext(script, context, { filename: 'README.md' });

  return {
    context,
    element: id => document.getElementById(id),
    cards: () => list.children,
    active: () => list.children.filter(card => card.classList.contains('active')),
    setTime: value => { instant = Date.parse(value); },
    tick: () => intervals[0].fn(),
    storage,
    intervals,
    notices,
    alerts,
    registrations,
    blobs,
  };
}

test('formats midnight, noon, and single-digit minutes', () => {
  const { context } = loadRoutine();
  assert.equal(context.formatTime(0, 0), '12:00 AM');
  assert.equal(context.formatTime(7, 5), '7:05 AM');
  assert.equal(context.formatTime(12, 0), '12:00 PM');
  assert.equal(context.formatTime(18, 25), '6:25 PM');
});

test('renders all schedule checkpoints and starts one second-based refresh', () => {
  const app = loadRoutine();
  assert.equal(app.cards().length, 14);
  assert.match(app.element('item-1').innerHTML, /6:15 AM/);
  assert.match(app.element('item-1').innerHTML, /Wake & Refresh/);
  assert.match(app.element('item-3').innerHTML, /7:05 AM/);
  assert.match(app.element('item-14').innerHTML, /10:15 PM/);
  assert.match(app.element('item-14').innerHTML, /Sleep & Recovery/);
  assert.deepEqual(app.intervals.map(interval => interval.delay), [1000]);
  assert.equal(app.element('currentDate').innerText, 'Fri, Sep 25');
});

test('restores only checks for the current UTC date', () => {
  const app = loadRoutine({
    stored: {
      'routine_checks_2026-09-24': '[1,3]',
      'routine_checks_2026-09-25': '[2,14]',
    },
  });
  assert.equal(app.element('item-1').classList.contains('completed'), false);
  assert.equal(app.element('item-2').classList.contains('completed'), true);
  assert.equal(app.element('item-14').classList.contains('completed'), true);
});

test('a check saved before UTC midnight does not appear after reloading the next day', () => {
  const yesterday = loadRoutine({ at: '2026-09-25T23:59:00Z' });
  yesterday.context.toggleCheck(14);

  const today = loadRoutine({
    at: '2026-09-26T00:01:00Z',
    stored: Object.fromEntries(yesterday.storage),
  });
  assert.equal(today.element('item-14').classList.contains('completed'), false);
  assert.equal(today.storage.get('routine_checks_2026-09-25'), '[14]');
});

test('checking and unchecking an item persists the selection and keeps the active phase highlighted', () => {
  const app = loadRoutine({ at: '2026-09-25T06:30:00Z' });
  app.context.toggleCheck(1);
  app.context.toggleCheck(2);
  assert.deepEqual(JSON.parse(app.storage.get('routine_checks_2026-09-25')), [1, 2]);
  assert.equal(app.element('item-1').classList.contains('completed'), true);
  assert.deepEqual(app.active().map(card => card.id), ['item-1']);

  app.context.toggleCheck(1);
  assert.deepEqual(JSON.parse(app.storage.get('routine_checks_2026-09-25')), [2]);
  assert.equal(app.element('item-1').classList.contains('completed'), false);
  assert.equal(app.element('item-2').classList.contains('completed'), true);
  assert.deepEqual(app.active().map(card => card.id), ['item-1']);
});

test('uses the next phase at an exact boundary and clears the old highlight', () => {
  const app = loadRoutine({ at: '2026-09-25T06:44:59Z' });
  assert.equal(app.element('heroActivity').innerText, 'Wake & Refresh');
  assert.match(app.element('heroCountdown').innerHTML, /in <span>1 mins<\/span>/);

  app.setTime('2026-09-25T06:45:00Z');
  app.tick();
  assert.equal(app.element('heroActivity').innerText, 'Morning Fuel');
  assert.equal(app.element('progressBar').style.width, '0%');
  assert.match(app.element('heroCountdown').innerHTML, /Commute to DIP Metro.*20 mins/);
  assert.deepEqual(app.active().map(card => card.id), ['item-2']);
});

test('calculates progress and a rounded-up countdown within a phase', () => {
  const app = loadRoutine({ at: '2026-09-25T06:30:30Z' });
  assert.equal(app.element('heroActivity').innerText, 'Wake & Refresh');
  assert.equal(app.element('progressBar').style.width, `${(15.5 / 30) * 100}%`);
  assert.match(app.element('heroCountdown').innerHTML, /Morning Fuel.*15 mins/);
});

test('shows transition state during a gap and removes the previous active highlight', () => {
  const app = loadRoutine({ at: '2026-09-25T07:24:59Z' });
  app.setTime('2026-09-25T07:25:00Z');
  app.tick();
  assert.equal(app.element('heroBadge').innerText, 'In Between');
  assert.equal(app.element('heroActivity').innerText, 'Transition Period');
  assert.equal(app.element('progressBar').style.width, '0%');
  assert.deepEqual(app.active(), []);

  app.setTime('2026-09-25T07:30:00Z');
  app.tick();
  assert.equal(app.element('heroActivity').innerText, 'Red Line Metro Ride');
  assert.deepEqual(app.active().map(card => card.id), ['item-4']);
});

test('tracks overnight sleep across midnight and wraps the next phase to morning', () => {
  const app = loadRoutine({ at: '2026-09-25T22:15:00Z' });
  assert.equal(app.element('heroActivity').innerText, 'Sleep & Recovery');
  assert.equal(app.element('progressBar').style.width, '0%');
  assert.match(app.element('heroCountdown').innerHTML, /Wake & Refresh.*8h 0m/);
  assert.deepEqual(app.active().map(card => card.id), ['item-14']);

  app.setTime('2026-09-26T02:15:00Z');
  app.tick();
  assert.equal(app.element('heroActivity').innerText, 'Sleep & Recovery');
  assert.equal(app.element('progressBar').style.width, '50%');
  assert.match(app.element('heroCountdown').innerHTML, /Wake & Refresh.*4h 0m/);

  app.setTime('2026-09-26T06:15:00Z');
  app.tick();
  assert.equal(app.element('heroActivity').innerText, 'Wake & Refresh');
  assert.deepEqual(app.active().map(card => card.id), ['item-1']);
});

test('does not enable alerts when browser notifications are unavailable', () => {
  const app = loadRoutine();
  app.context.toggleAlerts();
  assert.deepEqual(app.alerts, ['Web notifications not supported on this browser.']);
  assert.equal(app.notices.length, 0);
});

test('denied notification permission leaves alerts off', async () => {
  const app = loadRoutine({ notifications: 'denied' });
  app.context.toggleAlerts();
  await Promise.resolve();
  assert.equal(app.element('notifBtn').innerText, '🔔 Alerts: Off');
  assert.equal(app.notices.length, 0);
});

test('granted notification permission toggles alerts and announces only when enabling', async () => {
  const app = loadRoutine({ notifications: 'granted' });
  app.context.toggleAlerts();
  await Promise.resolve();
  assert.equal(app.element('notifBtn').innerText, '🔔 Alerts: On');
  assert.equal(app.notices.length, 1);
  assert.equal(app.notices[0].title, 'Daily Rhythm');
  assert.equal(app.notices[0].options.body, 'Reminders are now active!');

  app.context.toggleAlerts();
  await Promise.resolve();
  assert.equal(app.element('notifBtn').innerText, '🔔 Alerts: Off');
  assert.equal(app.notices.length, 1);
});

test('registers a generated service worker only when supported', () => {
  const unsupported = loadRoutine();
  assert.deepEqual(unsupported.registrations, []);

  const supported = loadRoutine({ serviceWorker: true });
  assert.deepEqual(supported.registrations, ['blob:routine-test']);
  assert.equal(supported.blobs[0].parts.length, 1);
  assert.equal(supported.blobs[0].parts[0], "self.addEventListener('fetch', function(e) {});");
  assert.equal(supported.blobs[0].options.type, 'application/javascript');
});
