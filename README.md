<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Daily Rhythm & Commute</title>
  
  <!-- iOS Meta Tags -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Daily Rhythm">
  <meta name="theme-color" content="#0f172a">

  <!-- PWA Web Manifest (Data URI to keep it purely single-file) -->
  <link rel="manifest" href='data:application/manifest+json,{"name":"Daily Rhythm Tracker","short_name":"Rhythm","start_url":".","display":"standalone","background_color":"#0f172a","theme_color":"#0f172a","icons":[{"src":"https://cdn-icons-png.flaticon.com/512/3652/3652191.png","sizes":"512x512","type":"image/png"}]}'>

  <style>
    :root {
      --bg-dark: #0f172a;
      --card-bg: #1e293b;
      --card-border: #334155;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.25);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --active-card: #0369a1;
      --success: #34d399;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      padding: env(safe-area-inset-top, 20px) 16px env(safe-area-inset-bottom, 24px) 16px;
      max-width: 520px;
      margin: 0 auto;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    header {
      padding: 16px 4px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-title h1 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .header-title p {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .btn-icon {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    /* Hero Status Card */
    .hero-card {
      background: linear-gradient(145deg, #1e293b, #0f172a);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      position: relative;
      overflow: hidden;
    }

    .hero-card::after {
      content: '';
      position: absolute;
      top: -30px;
      right: -30px;
      width: 100px;
      height: 100px;
      background: var(--accent-glow);
      filter: blur(40px);
      border-radius: 50%;
    }

    .hero-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--accent);
      font-weight: 700;
      margin-bottom: 6px;
    }

    .hero-title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .hero-countdown {
      font-size: 14px;
      color: var(--text-muted);
    }

    .hero-countdown span {
      color: var(--text-main);
      font-weight: 600;
    }

    .progress-bar-bg {
      background: #334155;
      height: 6px;
      border-radius: 3px;
      margin-top: 16px;
      overflow: hidden;
    }

    .progress-bar-fill {
      background: var(--accent);
      height: 100%;
      width: 0%;
      transition: width 0.4s ease;
    }

    /* Routine List */
    .section-title {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-muted);
      margin-bottom: 12px;
      padding-left: 4px;
    }

    .routine-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex-grow: 1;
    }

    .routine-item {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      transition: all 0.25s ease;
    }

    .routine-item.active {
      border-color: var(--accent);
      background: rgba(3, 105, 161, 0.25);
      box-shadow: 0 0 15px var(--accent-glow);
    }

    .routine-item.completed {
      opacity: 0.55;
    }

    .check-btn {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid var(--card-border);
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
    }

    .routine-item.completed .check-btn {
      background: var(--success);
      border-color: var(--success);
    }

    .check-btn svg {
      display: none;
      width: 12px;
      height: 12px;
      fill: #0f172a;
    }

    .routine-item.completed .check-btn svg {
      display: block;
    }

    .time-slot {
      font-size: 13px;
      font-weight: 700;
      color: var(--accent);
      min-width: 95px;
    }

    .routine-details {
      flex-grow: 1;
    }

    .routine-name {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .routine-desc {
      font-size: 12px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>

  <header>
    <div class="header-title">
      <h1>Daily Rhythm</h1>
      <p id="currentDate">Mon-Fri Routine</p>
    </div>
    <button class="btn-icon" id="notifBtn" onclick="toggleAlerts()">🔔 Alerts: Off</button>
  </header>

  <!-- Live Status Card -->
  <div class="hero-card">
    <div class="hero-label" id="heroBadge">Current Phase</div>
    <div class="hero-title" id="heroActivity">Loading routine...</div>
    <div class="hero-countdown" id="heroCountdown">Next in: <span>--</span></div>
    <div class="progress-bar-bg">
      <div class="progress-bar-fill" id="progressBar"></div>
    </div>
  </div>

  <!-- Routine Timeline -->
  <div class="section-title">Schedule & Checkpoints</div>
  <div class="routine-list" id="routineList"></div>

  <script>
    // Routine definition: times in 24h format (hours, minutes)
    const schedule = [
      { id: 1, start: [6, 15], end: [6, 45], name: "Wake & Refresh", desc: "Hydrate, wash up, morning stretch" },
      { id: 2, start: [6, 45], end: [7, 5],  name: "Morning Fuel", desc: "Quick tea/breakfast, check essentials" },
      { id: 3, start: [7, 5],  end: [7, 25], name: "Commute to DIP Metro", desc: "Walk/ride to DIP Metro Station" },
      { id: 4, start: [7, 30], end: [8, 20], name: "Red Line Metro Ride", desc: "Northbound to World Trade Centre" },
      { id: 5, start: [8, 20], end: [8, 35], name: "Walk to The H Dubai", desc: "Pedestrian path along SZR roundabout" },
      { id: 6, start: [9, 0],  end: [18, 0], name: "Work Hours (The H Dubai)", desc: "Procurement, meetings & operations" },
      { id: 7, start: [18, 0], end: [18, 25],name: "Wrap Up & Metro Walk", desc: "Exit office, walk to WTC Station" },
      { id: 8, start: [18, 25],end: [19, 5], name: "Southbound Metro Ride", desc: "WTC Station back to DIP Station" },
      { id: 9, start: [19, 5], end: [19, 20],name: "Walk Home", desc: "Return to Seven Even Building" },
      { id: 10, start: [19, 20],end: [19, 50],name: "Home Reset", desc: "Change clothes, wash up, decompress" },
      { id: 11, start: [19, 50],end: [20, 40],name: "Dinner & Family Time", desc: "Relaxed meal & catch up together" },
      { id: 12, start: [20, 40],end: [21, 45],name: "Evening Leisure", desc: "Show, hobby, or evening walk" },
      { id: 13, start: [21, 45],end: [22, 15],name: "Prep Tomorrow & Wind Down", desc: "Lay clothes, dim lights, screen-off" },
      { id: 14, start: [22, 15],end: [6, 15],  name: "Sleep & Recovery", desc: "7.5–8 hours restorative rest" }
    ];

    let alertsEnabled = false;

    // Load or reset daily checks based on date
    const todayKey = new Date().toISOString().slice(0, 10);
    let checkedItems = JSON.parse(localStorage.getItem('routine_checks_' + todayKey) || '[]');

    function formatTime(h, m) {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hours = h % 12 || 12;
      const minutes = m < 10 ? '0' + m : m;
      return `${hours}:${minutes} ${ampm}`;
    }

    function renderList() {
      const container = document.getElementById('routineList');
      container.innerHTML = '';

      schedule.forEach(item => {
        const isChecked = checkedItems.includes(item.id);
        const card = document.createElement('div');
        card.className = `routine-item ${isChecked ? 'completed' : ''}`;
        card.id = `item-${item.id}`;

        card.innerHTML = `
          <button class="check-btn" onclick="toggleCheck(${item.id})">
            <svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
          </button>
          <div class="time-slot">${formatTime(item.start[0], item.start[1])}</div>
          <div class="routine-details">
            <div class="routine-name">${item.name}</div>
            <div class="routine-desc">${item.desc}</div>
          </div>
        `;
        container.appendChild(card);
      });
    }

    function toggleCheck(id) {
      if (checkedItems.includes(id)) {
        checkedItems = checkedItems.filter(i => i !== id);
      } else {
        checkedItems.push(id);
      }
      localStorage.setItem('routine_checks_' + todayKey, JSON.stringify(checkedItems));
      renderList();
      updateTracker();
    }

    function updateTracker() {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const currentSeconds = currentMinutes * 60 + now.getSeconds();

      document.getElementById('currentDate').innerText = now.toLocaleDateString('en-US', { 
        weekday: 'short', month: 'short', day: 'numeric' 
      });

      let currentItem = null;
      let nextItem = null;

      for (let i = 0; i < schedule.length; i++) {
        const item = schedule[i];
        let startMin = item.start[0] * 60 + item.start[1];
        let endMin = item.end[0] * 60 + item.end[1];

        // Handle overnight sleep slot
        if (endMin < startMin) {
          if (currentMinutes >= startMin || currentMinutes < endMin) {
            currentItem = item;
            nextItem = schedule[(i + 1) % schedule.length];
            break;
          }
        } else if (currentMinutes >= startMin && currentMinutes < endMin) {
          currentItem = item;
          nextItem = schedule[(i + 1) % schedule.length];
          break;
        }
      }

      // Clear all active highlights
      document.querySelectorAll('.routine-item').forEach(el => el.classList.remove('active'));

      if (currentItem) {
        document.getElementById('heroBadge').innerText = "Current Phase";
        document.getElementById('heroActivity').innerText = currentItem.name;
        
        // Highlight active item in list
        const activeCard = document.getElementById(`item-${currentItem.id}`);
        if (activeCard) activeCard.classList.add('active');

        // Calculate progress & countdown
        let startSec = (currentItem.start[0] * 60 + currentItem.start[1]) * 60;
        let endSec = (currentItem.end[0] * 60 + currentItem.end[1]) * 60;
        let nowSec = currentSeconds;

        if (endSec < startSec) {
          if (nowSec < endSec) nowSec += 24 * 3600;
          endSec += 24 * 3600;
        }

        const totalSec = endSec - startSec;
        const elapsedSec = nowSec - startSec;
        const progress = Math.min(100, Math.max(0, (elapsedSec / totalSec) * 100));
        document.getElementById('progressBar').style.width = `${progress}%`;

        const remainingMin = Math.ceil((endSec - nowSec) / 60);
        const hours = Math.floor(remainingMin / 60);
        const mins = remainingMin % 60;
        const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

        document.getElementById('heroCountdown').innerHTML = `Next: <b>${nextItem ? nextItem.name : 'Next step'}</b> in <span>${timeStr}</span>`;
      } else {
        document.getElementById('heroBadge').innerText = "In Between";
        document.getElementById('heroActivity').innerText = "Transition Period";
        document.getElementById('progressBar').style.width = `0%`;
      }
    }

    function toggleAlerts() {
      if (!("Notification" in window)) {
        alert("Web notifications not supported on this browser.");
        return;
      }
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          alertsEnabled = !alertsEnabled;
          document.getElementById('notifBtn').innerText = alertsEnabled ? "🔔 Alerts: On" : "🔔 Alerts: Off";
          if (alertsEnabled) {
            new Notification("Daily Rhythm", { body: "Reminders are now active!" });
          }
        }
      });
    }

    // Register basic dummy service worker so browsers recognize it as a PWA
    if ('serviceWorker' in navigator) {
      const swCode = `self.addEventListener('fetch', function(e) {});`;
      const blob = new Blob([swCode], { type: 'application/javascript' });
      navigator.serviceWorker.register(URL.createObjectURL(blob)).catch(() => {});
    }

    renderList();
    updateTracker();
    setInterval(updateTracker, 1000);
  </script>
</body>
</html>

