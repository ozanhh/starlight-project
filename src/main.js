
/* ============================================
   0. localStorage HOOKS (empty — for you to fill)
   ============================================ */
function saveState() {
  // TODO: implement localStorage
  // Suggested keys to save:
  // - starlight_theme (current palette)
  // - starlight_intensity (background intensity)
  // - starlight_devoirs (array of {id, done})
  // - starlight_objectifs (array of {id, subIndexes done})
  // - starlight_habits (array of {id, dots active})
  // - starlight_carnet ({learned, intent, mood, date})
  // - starlight_sound (current ambient sound)
}

function loadState() {
  // TODO: implement localStorage
  // Called on page load — restore all states
}


/* ============================================
   1. NAV + MENU
   ============================================ */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => { nav.classList.toggle('is-scrolled', window.scrollY > 30); }, { passive: true });

const menuTrigger = document.getElementById('menuTrigger');
const menu = document.getElementById('menu');
const menuBackdrop = document.getElementById('menuBackdrop');
const menuItems = document.querySelectorAll('.menu__item');
const views = document.querySelectorAll('.view');

function openMenu() { menu.classList.add('is-open'); menuBackdrop.classList.add('is-open'); menuTrigger.classList.add('is-open'); }
function closeMenu() { menu.classList.remove('is-open'); menuBackdrop.classList.remove('is-open'); menuTrigger.classList.remove('is-open'); }

menuTrigger.addEventListener('click', () => { menu.classList.contains('is-open') ? closeMenu() : openMenu(); });
menuBackdrop.addEventListener('click', closeMenu);

menuItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const targetView = item.dataset.view;
    menuItems.forEach(i => i.classList.remove('is-active'));
    item.classList.add('is-active');
    views.forEach(v => {
      v.classList.remove('is-active', 'is-in');
      if (v.id === 'view-' + targetView) {
        v.classList.add('is-active');
        requestAnimationFrame(() => { requestAnimationFrame(() => v.classList.add('is-in')); });
        if (targetView === 'dashboard') triggerDashboardAnimations();
        if (targetView === 'agenda') renderCalendar();
        if (targetView === 'objectifs') recalcObjectifs();
        if (targetView === 'devoirs') updateDevoirsProgress();
      }
    });
    closeMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

/* ============================================
   2. PALETTE PANEL
   ============================================ */
const paletteBtn = document.getElementById('paletteBtn');
const palettePanel = document.getElementById('palettePanel');
const paletteBackdrop = document.getElementById('paletteBackdrop');
const paletteClose = document.getElementById('paletteClose');

paletteBtn.addEventListener('click', () => { palettePanel.classList.add('is-open'); paletteBackdrop.classList.add('is-open'); });
paletteClose.addEventListener('click', closePalette);
paletteBackdrop.addEventListener('click', closePalette);
function closePalette() { palettePanel.classList.remove('is-open'); paletteBackdrop.classList.remove('is-open'); }

document.querySelectorAll('.palette-option').forEach(opt => {
  opt.addEventListener('click', () => {
    const theme = opt.dataset.theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.palette-option').forEach(o => o.classList.remove('is-active'));
    opt.classList.add('is-active');
    bgCanvas.setTheme(theme);
    saveState();
  });
});

const intensitySlider = document.getElementById('intensitySlider');
const intensityValue = document.getElementById('intensityValue');
intensitySlider.addEventListener('input', (e) => {
  const v = parseInt(e.target.value);
  intensityValue.textContent = v;
  bgCanvas.setIntensity(v / 100);
  saveState();
});

/* ============================================
   3. DATE
   ============================================ */
const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function updateNavDate() {
  const now = new Date();
  const days = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  const dateStr = `${days[now.getDay()]} ${now.getDate()} ${monthNames[now.getMonth()].slice(0,4).toLowerCase()}.`;
  document.getElementById('navDate').textContent = dateStr;
  const todayEl = document.getElementById('todayDate');
  if (todayEl) todayEl.textContent = `${now.getDate()} ${monthNames[now.getMonth()].slice(0,4).toLowerCase()}.`;
  const carnetNum = document.getElementById('carnetDateNum');
  const carnetMonth = document.getElementById('carnetDateMonth');
  const carnetFull = document.getElementById('carnetDateFull');
  if (carnetNum) carnetNum.textContent = now.getDate();
  if (carnetMonth) carnetMonth.textContent = monthNames[now.getMonth()];
  if (carnetFull) carnetFull.textContent = `${dayNames[now.getDay()]} · ${now.getFullYear()}`;
}
updateNavDate();

/* ============================================
   4. ANIMATED BACKGROUND
   ============================================ */
class BgCanvas {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.particles = []; this.theme = 'hoshi'; this.intensity = 0.7;
    this.mouse = { x: -9999, y: -9999 };
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; }, { passive: true });
    window.addEventListener('touchmove', (e) => { if (e.touches[0]) { this.mouse.x = e.touches[0].clientX; this.mouse.y = e.touches[0].clientY; } }, { passive: true });
    window.addEventListener('mouseleave', () => { this.mouse.x = -9999; this.mouse.y = -9999; });
    this.init(); this.animate();
  }
  resize() {
    this.w = window.innerWidth; this.h = window.innerHeight;
    this.canvas.width = this.w * this.dpr; this.canvas.height = this.h * this.dpr;
    this.canvas.style.width = this.w + 'px'; this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }
  setTheme(theme) { this.theme = theme; this.init(); }
  setIntensity(v) { this.intensity = Math.max(0, Math.min(1, v)); this.init(); }
  getColor() { return getComputedStyle(document.documentElement).getPropertyValue('--particle-color').trim(); }
  getAlpha() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--particle-alpha').trim()) || 0.5; }
  getBaseCount() { if (this.theme === 'sakura') return 50; if (this.theme === 'matcha') return 35; if (this.theme === 'sumi') return 80; if (this.theme === 'yuzu') return 60; return 120; }
  createParticle() {
    const w = this.w, h = this.h;
    if (this.theme === 'sakura') return { x: Math.random()*w, y: Math.random()*h-h, size: 3+Math.random()*4, speedY: 0.3+Math.random()*0.5, rotation: Math.random()*Math.PI*2, rotSpeed: -0.02+Math.random()*0.04, swayAmp: 20+Math.random()*30, swayFreq: 0.005+Math.random()*0.005, baseX: 0, opacity: 0.4+Math.random()*0.4, ox: 0, oy: 0 };
    if (this.theme === 'matcha') return { x: Math.random()*w, y: Math.random()*h, size: 2+Math.random()*3, speedY: -0.15-Math.random()*0.3, rotation: Math.random()*Math.PI*2, rotSpeed: -0.015+Math.random()*0.03, swayAmp: 15+Math.random()*25, swayFreq: 0.004+Math.random()*0.004, opacity: 0.3+Math.random()*0.4, ox: 0, oy: 0 };
    return { x: Math.random()*w, y: Math.random()*h, size: 0.6+Math.random()*1.4, speedY: -0.03-Math.random()*0.05, speedX: -0.02+Math.random()*0.04, twinkle: Math.random()*Math.PI*2, twinkleSpeed: 0.005+Math.random()*0.015, opacity: 0.3+Math.random()*0.6, ox: 0, oy: 0 };
  }
  init() {
    this.particles = [];
    const count = Math.round(this.getBaseCount() * this.intensity);
    for (let i = 0; i < count; i++) { const p = this.createParticle(); if (this.theme === 'sakura' || this.theme === 'matcha') p.baseX = p.x; this.particles.push(p); }
  }
  drawParticle(p) {
    const ctx = this.ctx; const color = this.getColor(); const alphaBase = this.getAlpha() * this.intensity;
    const drawX = p.x + p.ox, drawY = p.y + p.oy;
    ctx.save(); ctx.translate(drawX, drawY);
    if (this.theme === 'sakura') {
      ctx.rotate(p.rotation); const op = p.opacity * alphaBase;
      ctx.fillStyle = `rgba(${color}, ${op})`;
      for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate((Math.PI*2/5)*i); ctx.beginPath(); ctx.ellipse(0, -p.size*0.8, p.size*0.5, p.size*0.9, 0, 0, Math.PI*2); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = `rgba(${color}, ${op*1.5})`; ctx.beginPath(); ctx.arc(0, 0, p.size*0.3, 0, Math.PI*2); ctx.fill();
    } else if (this.theme === 'matcha') {
      ctx.rotate(p.rotation); const op = p.opacity * alphaBase;
      ctx.fillStyle = `rgba(${color}, ${op})`; ctx.beginPath(); ctx.ellipse(0, 0, p.size*0.4, p.size*1.2, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = `rgba(${color}, ${op*0.6})`; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(0, -p.size*1.2); ctx.lineTo(0, p.size*1.2); ctx.stroke();
    } else {
      const tw = (Math.sin(p.twinkle)+1)/2; const op = p.opacity * alphaBase * (0.4+tw*0.6);
      const glowSize = p.size * 5;
      const grad = ctx.createRadialGradient(0,0,0,0,0,glowSize);
      grad.addColorStop(0, `rgba(${color}, ${op*0.5})`); grad.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, glowSize, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = `rgba(${color}, ${op})`; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
  updateParticle(p) {
    const dx = p.x - this.mouse.x, dy = p.y - this.mouse.y;
    const distSq = dx*dx + dy*dy; const radius = 130;
    if (distSq < radius*radius && this.mouse.x > -1000) {
      const dist = Math.sqrt(distSq) || 1; const force = (1 - dist/radius) * 0.8;
      const targetOx = (dx/dist) * force * 30; const targetOy = (dy/dist) * force * 30;
      p.ox += (targetOx - p.ox) * 0.08; p.oy += (targetOy - p.oy) * 0.08;
    } else { p.ox *= 0.92; p.oy *= 0.92; }
    const parallaxX = (this.mouse.x - this.w/2) * -0.005;
    const parallaxY = (this.mouse.y - this.h/2) * -0.005;
    if (this.theme === 'sakura') {
      p.y += p.speedY; p.x = p.baseX + Math.sin(p.y * p.swayFreq) * p.swayAmp + parallaxX; p.rotation += p.rotSpeed;
      if (p.y > this.h + 20) { p.y = -20; p.baseX = Math.random() * this.w; }
    } else if (this.theme === 'matcha') {
      p.y += p.speedY; p.x = p.baseX + Math.sin(p.y * p.swayFreq) * p.swayAmp + parallaxX; p.rotation += p.rotSpeed;
      if (p.y < -20) { p.y = this.h + 20; p.baseX = Math.random() * this.w; }
    } else {
      p.y += p.speedY + parallaxY * 0.3; p.x += p.speedX + parallaxX * 0.3; p.twinkle += p.twinkleSpeed;
      if (p.y < -10) { p.y = this.h + 10; p.x = Math.random() * this.w; }
      if (p.x < -10) p.x = this.w + 10; if (p.x > this.w + 10) p.x = -10;
    }
  }
  animate() {
    const ctx = this.ctx; ctx.clearRect(0, 0, this.w, this.h);
    const isLight = ['sakura','yuzu'].includes(this.theme);
    const grad = ctx.createRadialGradient(this.w/2, this.h/2, 0, this.w/2, this.h/2, Math.max(this.w, this.h) * 0.7);
    if (isLight) { grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.04)'); }
    else { grad.addColorStop(0, 'rgba(255,255,255,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.25)'); }
    ctx.fillStyle = grad; ctx.fillRect(0, 0, this.w, this.h);
    if (this.mouse.x > -1000 && this.intensity > 0.1) {
      const haloGrad = ctx.createRadialGradient(this.mouse.x, this.mouse.y, 0, this.mouse.x, this.mouse.y, 120);
      const color = this.getColor();
      haloGrad.addColorStop(0, `rgba(${color}, ${0.04 * this.intensity})`); haloGrad.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = haloGrad; ctx.beginPath(); ctx.arc(this.mouse.x, this.mouse.y, 120, 0, Math.PI*2); ctx.fill();
    }
    this.particles.forEach(p => { this.updateParticle(p); this.drawParticle(p); });
    requestAnimationFrame(() => this.animate());
  }
}
const bgCanvas = new BgCanvas(document.getElementById('bgCanvas'));

/* ============================================
   5. CALENDAR + YEAR VIEW
   ============================================ */
let currentCalDate = new Date(2024, 7, 17);
const eventsByDay = {
  3: [{time:'14:00 — 16:00',title:'Concours blanc — Maths',sub:'Salle 204'}],
  7: [{time:'10:00 — 12:00',title:'Dissertation philosophie',sub:'Salle 112'}],
  12: [{time:'08:30 — 10:00',title:'Interro vocabulaire japonais',sub:'Salle 305'}],
  15: [{time:'14:00 — 16:00',title:'TP Chimie organique',sub:'Labo 3'}],
  17: [{time:'08:30 — 09:30',title:'Mathématiques — Suites',sub:'Salle 204 · M. Bernard'},{time:'10:00 — 11:30',title:'Philosophie — Descartes',sub:'Salle 112 · Mme Lavoisier'},{time:'14:00 — 16:00',title:'Physique-Chimie — TP',sub:'Labo 3 · M. Tanaka'},{time:'17:00 — 18:00',title:'Étude dirigée',sub:'CDI'}],
  22: [{time:'14:00 — 16:00',title:'Compte-rendu — TP rendu',sub:'Labo 3'}],
  24: [{time:'10:00 — 12:00',title:'Contrôle commun — Maths',sub:'Salle 204'}],
  29: [{time:'08:30 — 10:00',title:'Grand oral — répétition',sub:'Salle 105'}],
};

function renderCalendar() {
  const year = currentCalDate.getFullYear(), month = currentCalDate.getMonth();
  const today = new Date(2024, 7, 17);
  document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
  const firstDay = new Date(year, month, 1), lastDay = new Date(year, month+1, 0);
  const startWeekday = firstDay.getDay(), daysInMonth = lastDay.getDate(), prevLastDay = new Date(year, month, 0).getDate();
  const container = document.getElementById('calendarDays');
  container.innerHTML = '';
  for (let i = startWeekday-1; i >= 0; i--) container.appendChild(createDayCell(prevLastDay - i, true, month-1, year));
  for (let day = 1; day <= daysInMonth; day++) container.appendChild(createDayCell(day, false, month, year, day === 17 && month === 7));
  const totalCells = container.children.length, remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i++) container.appendChild(createDayCell(i, true, month+1, year));
}

function createDayCell(day, isOther, month, year, isToday = false) {
  const cell = document.createElement('div');
  cell.className = 'cal-day';
  if (isOther) cell.classList.add('is-other-month');
  if (isToday) cell.classList.add('is-today');
  const num = document.createElement('div'); num.className = 'cal-day__num'; num.textContent = day; cell.appendChild(num);
  if (!isOther && eventsByDay[day] && month === 7) {
    const dots = document.createElement('div'); dots.className = 'cal-day__dots';
    const count = Math.min(eventsByDay[day].length, 3);
    for (let i = 0; i < count; i++) { const dot = document.createElement('div'); dot.className = 'cal-day__dot'; dots.appendChild(dot); }
    cell.appendChild(dots);
  }
  cell.addEventListener('click', () => {
    document.querySelectorAll('.cal-day').forEach(c => c.classList.remove('is-selected'));
    cell.classList.add('is-selected'); updateDayPanel(day, month, year);
  });
  return cell;
}

function updateDayPanel(day, month, year) {
  document.getElementById('dayPanelNum').textContent = day;
  const date = new Date(year, month, day);
  document.getElementById('dayPanelSub').textContent = `${dayNames[date.getDay()]} · ${monthNames[date.getMonth()]} ${year}`;
  const eventsContainer = document.getElementById('dayPanelEvents');
  eventsContainer.innerHTML = '';
  const events = eventsByDay[day] || [];
  if (events.length === 0) { eventsContainer.innerHTML = '<div style="color: var(--text-mute); font-size: 0.88rem; text-align: center; padding: 2rem 0; line-height: 1.7;">Aucun événement.<br>Une journée libre. ✦</div>'; return; }
  events.forEach(ev => {
    const el = document.createElement('div'); el.className = 'event';
    el.innerHTML = `<div class="event__time">${ev.time}</div><div class="event__title">${ev.title}</div><div class="event__sub">${ev.sub}</div>`;
    eventsContainer.appendChild(el);
  });
}

document.getElementById('prevMonth').addEventListener('click', () => { currentCalDate.setMonth(currentCalDate.getMonth()-1); renderCalendar(); });
document.getElementById('nextMonth').addEventListener('click', () => { currentCalDate.setMonth(currentCalDate.getMonth()+1); renderCalendar(); });

/* YEAR VIEW */
document.querySelectorAll('.view-toggle__btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-toggle__btn').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const view = btn.dataset.agendaView;
    document.getElementById('monthView').style.display = view === 'month' ? 'grid' : 'none';
    document.getElementById('yearView').classList.toggle('is-active', view === 'year');
    document.getElementById('agendaNav').style.display = view === 'month' ? 'flex' : 'none';
    if (view === 'year') renderYearView();
  });
});

function renderYearView() {
  const year = currentCalDate.getFullYear();
  const container = document.getElementById('yearView');
  container.innerHTML = '';
  for (let m = 0; m < 12; m++) {
    const monthDiv = document.createElement('div'); monthDiv.className = 'mini-month';
    monthDiv.innerHTML = `<div class="mini-month__name">${monthNames[m]}</div>`;
    const grid = document.createElement('div'); grid.className = 'mini-month__grid';
    const firstDay = new Date(year, m, 1).getDay(), daysInMonth = new Date(year, m+1, 0).getDate();
    for (let i = 0; i < firstDay; i++) { const empty = document.createElement('div'); empty.className = 'mini-day'; grid.appendChild(empty); }
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDiv = document.createElement('div'); dayDiv.className = 'mini-day'; dayDiv.textContent = d;
      if (m === 7 && eventsByDay[d]) dayDiv.classList.add('has-event');
      if (d === 17 && m === 7) dayDiv.classList.add('is-today');
      grid.appendChild(dayDiv);
    }
    monthDiv.appendChild(grid);
    monthDiv.addEventListener('click', () => { currentCalDate.setMonth(m); document.querySelector('[data-agenda-view="month"]').click(); renderCalendar(); });
    container.appendChild(monthDiv);
  }
}

/* ============================================
   6. DEVOIRS
   ============================================ */
const devoirs = document.querySelectorAll('.devoir');
devoirs.forEach(d => { d.addEventListener('click', () => { d.classList.toggle('done'); d.dataset.done = d.classList.contains('done'); updateDevoirsProgress(); saveState(); }); });

document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    const filter = chip.dataset.filter;
    devoirs.forEach(d => {
      let show = false;
      if (filter === 'all') show = d.dataset.done !== 'true';
      else if (filter === 'done') show = d.dataset.done === 'true';
      else if (filter === 'urgent') show = d.dataset.urgent === 'true' && d.dataset.done !== 'true';
      else show = d.dataset.subject === filter && d.dataset.done !== 'true';
      d.style.display = show ? 'grid' : 'none';
    });
  });
});

function updateDevoirsProgress() {
  const total = devoirs.length, done = document.querySelectorAll('.devoir.done').length;
  const pct = Math.round((done/total)*100);
  document.getElementById('progressPct').textContent = pct;
  document.getElementById('progressLabel').textContent = `${done} / ${total}`;
  const circle = document.getElementById('progressCircle');
  const circumference = 2 * Math.PI * 80;
  circle.style.strokeDashoffset = circumference - (pct/100) * circumference;
}

document.getElementById('newTodoInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && e.target.value.trim()) {
    const list = document.getElementById('devoirsList');
    const newDiv = document.createElement('div'); newDiv.className = 'devoir';
    newDiv.dataset.subject = 'perso'; newDiv.dataset.urgent = 'false'; newDiv.dataset.done = 'false';
    newDiv.innerHTML = `<div class="devoir__check"></div><div class="devoir__body"><div class="devoir__title">${e.target.value.trim()}</div><div class="devoir__meta"><span class="subject-tag">Perso</span><span>Ajouté aujourd'hui</span></div></div><div class="devoir__due">—</div>`;
    newDiv.addEventListener('click', () => { newDiv.classList.toggle('done'); newDiv.dataset.done = newDiv.classList.contains('done'); updateDevoirsProgress(); saveState(); });
    const addTodo = list.querySelector('.add-todo'); list.insertBefore(newDiv, addTodo);
    e.target.value = ''; updateDevoirsProgress(); saveState();
  }
});

/* ============================================
   7. OBJECTIFS
   ============================================ */
document.querySelectorAll('.sub-objectif').forEach(sub => { sub.addEventListener('click', () => { sub.classList.toggle('done'); recalcObjectifs(); saveState(); }); });

function recalcObjectifs() {
  const objectifs = document.querySelectorAll('.objectif');
  let totalSubs = 0, doneSubs = 0;
  objectifs.forEach(obj => {
    const subs = obj.querySelectorAll('.sub-objectif'), done = obj.querySelectorAll('.sub-objectif.done').length;
    const total = subs.length, pct = Math.round((done/total)*100);
    obj.querySelector('.obj-pct').textContent = pct;
    obj.querySelector('.objectif__fill').style.width = pct + '%';
    totalSubs += total; doneSubs += done;
  });
  const overallPct = Math.round((doneSubs/totalSubs)*100);
  document.getElementById('overallPct').textContent = overallPct;
  document.getElementById('overallDone').textContent = doneSubs;
  document.getElementById('overallTotal').textContent = totalSubs;
  document.getElementById('overallFill').style.width = overallPct + '%';
}

/* ============================================
   8. TODO MINI
   ============================================ */
document.querySelectorAll('.todo-mini__item').forEach(item => { item.addEventListener('click', () => { item.classList.toggle('done'); saveState(); }); });

/* ============================================
   9. HABITS
   ============================================ */
let habitsData = [];

function renderHabits() {
  const container = document.getElementById('habitsContainer');
  container.innerHTML = '';
  habitsData.forEach((habit, hi) => {
    const row = document.createElement('div'); row.className = 'habit';
    row.innerHTML = `<div class="habit__name">${habit.name} <span class="kanji">${habit.kanji}</span></div>`;
    const dotsDiv = document.createElement('div'); dotsDiv.className = 'habit__dots';
    habit.dots.forEach((active, di) => {
      const dot = document.createElement('div'); dot.className = 'habit__dot';
      if (active) dot.classList.add('active');
      dot.addEventListener('click', () => {
        dot.classList.toggle('active');
        habitsData[hi].dots[di] = dot.classList.contains('active');
        // recalc streak
        let s = 0;
        for (let i = habit.dots.length - 1; i >= 0; i--) { if (habit.dots[i]) s++; else break; }
        habitsData[hi].streak = s;
        row.querySelector('.habit__streak').textContent = s;
        saveState();
      });
      dotsDiv.appendChild(dot);
    });
    row.appendChild(dotsDiv);
    const streak = document.createElement('div'); streak.className = 'habit__streak'; streak.textContent = habit.streak;
    row.appendChild(streak);
    container.appendChild(row);
  });
}

/* ============================================
   10. CARNET
   ============================================ */
document.querySelectorAll('.carnet-mood__dot').forEach(dot => {
  dot.addEventListener('click', () => {
    document.querySelectorAll('.carnet-mood__dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active'); saveState();
  });
});

const carnetLearned = document.getElementById('carnetLearned');
const carnetIntent = document.getElementById('carnetIntent');
carnetLearned.addEventListener('input', () => { document.getElementById('carnetLearnedCount').textContent = carnetLearned.value.length; saveState(); });
carnetIntent.addEventListener('input', () => { document.getElementById('carnetIntentCount').textContent = carnetIntent.value.length; saveState(); });

/* ============================================
   11. AMBIENT SOUNDS (Web Audio API)
   ============================================ */
class AmbientSound {
  constructor() { this.ctx = null; this.currentSound = null; this.nodes = []; this.masterGain = null; }
  init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); if (this.ctx.state === 'suspended') this.ctx.resume(); }
  stop() {
    if (this.masterGain) { this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime); this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5); }
    setTimeout(() => { this.nodes.forEach(n => { try { n.stop(); } catch(e){} try { n.disconnect(); } catch(e){} }); this.nodes = []; }, 600);
  }
  playRain() {
    this.init(); this.stop();
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource(); noise.buffer = noiseBuffer; noise.loop = true;
    const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 800; filter.Q.value = 0.5;
    this.masterGain = this.ctx.createGain(); this.masterGain.gain.value = 0; this.masterGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 1.5);
    noise.connect(filter); filter.connect(this.masterGain); this.masterGain.connect(this.ctx.destination);
    noise.start(); this.nodes = [noise]; this.currentSound = 'rain';
  }
  playWind() {
    this.init(); this.stop();
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource(); noise.buffer = noiseBuffer; noise.loop = true;
    const filter = this.ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 500; filter.Q.value = 2;
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.1;
    const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 300;
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
    this.masterGain = this.ctx.createGain(); this.masterGain.gain.value = 0; this.masterGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 1.5);
    noise.connect(filter); filter.connect(this.masterGain); this.masterGain.connect(this.ctx.destination);
    noise.start(); lfo.start(); this.nodes = [noise, lfo]; this.currentSound = 'wind';
  }
  playMatcha() {
    this.init(); this.stop();
    this.masterGain = this.ctx.createGain(); this.masterGain.gain.value = 0; this.masterGain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 1.5);
    this.masterGain.connect(this.ctx.destination);
    const freqs = [110, 165, 220, 330];
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
      const gain = this.ctx.createGain(); gain.gain.value = 1 / (i + 1) * 0.5;
      osc.connect(gain); gain.connect(this.masterGain); osc.start(); this.nodes.push(osc);
    });
    // slow LFO for warmth
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.15;
    const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain); lfoGain.connect(this.masterGain.gain); lfo.start(); this.nodes.push(lfo);
    this.currentSound = 'matcha';
  }
  playSilence() { this.stop(); this.currentSound = null; }
}

const ambient = new AmbientSound();
document.querySelectorAll('.sound-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const sound = btn.dataset.sound;
    document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('is-active'));
    if (sound === 'silence') { ambient.playSilence(); }
    else {
      if (ambient.currentSound === sound) { ambient.playSilence(); }
      else {
        btn.classList.add('is-active');
        if (sound === 'rain') ambient.playRain();
        if (sound === 'wind') ambient.playWind();
        if (sound === 'matcha') ambient.playMatcha();
      }
    }
    saveState();
  });
});

/* ============================================
   12. ZEN MODE
   ============================================ */
const zenOverlay = document.getElementById('zenOverlay');
const zenBtn = document.getElementById('zenBtn');
const zenClose = document.getElementById('zenClose');
const zenTimer = document.getElementById('zenTimer');
const zenPhase = document.getElementById('zenPhase');
const zenToggle = document.getElementById('zenToggle');
const zenBreathText = document.getElementById('zenBreathText');
const zenQuote = document.getElementById('zenQuote');

let zenMode = 'free', zenRunning = false, zenSeconds = 0, zenInterval = null, zenIsBreak = false;
const zenQuotes = [
  'Le bambou plie mais ne rompt pas. · 竹は曲がっても折れない',
  'Mille miles commencent par un pas. · 千里の道も一歩から',
  'L\'eau qui coule creuse la pierre. · 滴水穿石',
  'Le silence est l\'élément où se forment les grandes choses. · 沈黙は偉大なものを育む',
];

function openZen() {
  zenOverlay.classList.add('is-active');
  setTimeout(() => zenQuote.classList.add('is-visible'), 2000);
  // rotate quotes
  let qi = 0;
  zenOverlay.dataset.quoteInterval = setInterval(() => {
    qi = (qi + 1) % zenQuotes.length;
    zenQuote.style.opacity = '0';
    setTimeout(() => { zenQuote.textContent = zenQuotes[qi]; zenQuote.style.opacity = '1'; }, 800);
  }, 15000);
}
function closeZen() {
  zenOverlay.classList.remove('is-active');
  zenQuote.classList.remove('is-visible');
  if (zenRunning) toggleZen();
  clearInterval(parseInt(zenOverlay.dataset.quoteInterval));
}

zenBtn.addEventListener('click', openZen);
zenClose.addEventListener('click', closeZen);

document.querySelectorAll('[data-zen-mode]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-zen-mode]').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    zenMode = btn.dataset.zenMode;
    zenSeconds = 0; zenIsBreak = false;
    updateZenDisplay();
    if (zenMode === 'free') zenPhase.textContent = 'Session libre';
    else zenPhase.textContent = 'Pomodoro · Concentration';
  });
});

function toggleZen() {
  zenRunning = !zenRunning;
  zenToggle.textContent = zenRunning ? 'Pause' : 'Commencer';
  if (zenRunning) {
    zenInterval = setInterval(() => {
      zenSeconds++;
      if (zenMode === 'pomodoro') {
        const limit = zenIsBreak ? 300 : 1500;
        if (zenSeconds >= limit) {
          zenIsBreak = !zenIsBreak;
          zenSeconds = 0;
          zenPhase.textContent = zenIsBreak ? 'Pomodoro · Pause' : 'Pomodoro · Concentration';
        }
      }
      updateZenDisplay();
    }, 1000);
  } else { clearInterval(zenInterval); }
}

zenToggle.addEventListener('click', toggleZen);

function updateZenDisplay() {
  const m = Math.floor(zenSeconds / 60), s = zenSeconds % 60;
  zenTimer.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  if (zenMode === 'pomodoro') {
    const limit = zenIsBreak ? 300 : 1500;
    const remaining = limit - zenSeconds;
    const rm = Math.floor(remaining / 60), rs = remaining % 60;
    zenTimer.textContent = `${String(rm).padStart(2,'0')}:${String(rs).padStart(2,'0')}`;
  }
}

// breathing text sync
let breathPhase = 'in';
setInterval(() => {
  breathPhase = breathPhase === 'in' ? 'out' : 'in';
  zenBreathText.textContent = breathPhase === 'in' ? 'Inspirez' : 'Expirez';
}, 4000);

/* ============================================
   13. DASHBOARD ANIMATIONS
   ============================================ */
function triggerDashboardAnimations() {
  document.querySelectorAll('#view-dashboard .line-mask').forEach((el, i) => {
    el.style.setProperty('--i', i);
    setTimeout(() => el.classList.add('is-in'), 50);
  });
  document.querySelectorAll('.stat-card').forEach((card, i) => {
    card.style.opacity = '0'; card.style.transform = 'translateY(20px)';
    setTimeout(() => {
      card.style.transition = 'opacity 700ms var(--ease-quiet), transform 700ms var(--ease-quiet)';
      card.style.opacity = '1'; card.style.transform = 'translateY(0)';
    }, 200 + i * 100);
  });
  setTimeout(() => { document.querySelectorAll('.subject__fill').forEach(fill => { fill.style.width = fill.dataset.fill + '%'; }); }, 600);
}

/* ============================================
   14. KEYBOARD
   ============================================ */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeMenu(); closePalette(); closeZen(); }
  if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    const num = parseInt(e.key);
    if (num >= 1 && num <= 5) { const items = document.querySelectorAll('.menu__item'); if (items[num-1]) items[num-1].click(); }
  }
});

/* ============================================
   15. INIT
   ============================================ */
window.addEventListener('load', () => {
  loadState(); // TODO: will restore from localStorage
  renderHabits();
  renderCalendar();
  updateDayPanel(17, 7, 2024);
  setTimeout(() => { document.getElementById('view-dashboard').classList.add('is-in'); triggerDashboardAnimations(); }, 100);
});


// --- NOUVEAU MODULE HABITUDES (SURCHARGE) ---
function getDateString(date) { return date.toISOString().split('T')[0]; }
let currentHabitView = 'daily';

// Surcharge de saveState et loadState pour la persistance locale
function saveState() { localStorage.setItem('starlight_habits', JSON.stringify(habitsData)); }
function loadState() { const s = localStorage.getItem('starlight_habits'); if (s) { habitsData = JSON.parse(s); } }

// Surcharge de renderHabits pour le Dashboard
function renderHabits() {
  const container = document.getElementById('habitsContainer');
  if (!container) return;
  container.innerHTML = '';
  habitsData.forEach((habit) => {
    const row = document.createElement('div'); row.className = 'habit';
    row.innerHTML = '<div class="habit__name">' + habit.name + ' <span class="kanji">' + (habit.kanji || '習慣') + '</span></div>';
    const dotsDiv = document.createElement('div'); dotsDiv.className = 'habit__dots';
    let streak = 0;
    const today = new Date();
    for (let i = 20; i >= 0; i--) {
      const d = new Date(); d.setDate(today.getDate() - i);
      const dateStr = getDateString(d);
      const dot = document.createElement('div'); dot.className = 'habit__dot';
      if (habit.logs && habit.logs[dateStr]) dot.classList.add('active');
      if (i === 0) dot.classList.add('is-today');
      dot.addEventListener('click', () => {
        if (!habit.logs) habit.logs = {};
        habit.logs[dateStr] = !habit.logs[dateStr];
        if (!habit.logs[dateStr]) delete habit.logs[dateStr];
        saveState(); renderHabits(); renderHabitudesManager();
      });
      dotsDiv.appendChild(dot);
      if (i > 0 && habit.logs && habit.logs[dateStr]) streak++;
    }
    row.appendChild(dotsDiv);
    const streakEl = document.createElement('div'); streakEl.className = 'habit__streak'; streakEl.textContent = streak;
    row.appendChild(streakEl);
    container.appendChild(row);
  });
}

function renderHabitudesManager() {
  const container = document.getElementById('habitsManager');
  if (!container) return;
  container.innerHTML = '';
  habitsData.forEach((habit) => {
    const row = document.createElement('div'); row.className = 'habit-row';
    row.innerHTML = '<div class="habit-row__head"><div class="habit-row__name">' + habit.name + ' <span class="kanji">' + (habit.kanji || '習慣') + '</span></div><button class="habit-delete" data-id="' + habit.id + '">✕</button></div><div class="habit-row__grid" id="habit-grid-' + habit.id + '"></div>';
    container.appendChild(row);
    const grid = row.querySelector('#habit-grid-' + habit.id);
    const today = new Date();
    const cells = (currentHabitView === 'daily') ? 30 : 12;
    for (let i = cells - 1; i >= 0; i--) {
      const d = new Date();
      let key, label;
      if (currentHabitView === 'daily') { d.setDate(today.getDate() - i); key = getDateString(d); label = d.getDate(); }
      else if (currentHabitView === 'weekly') { d.setDate(today.getDate() - (i*7)); key = 'w_' + getDateString(d); label = 'S-' + i; }
      else { d.setMonth(today.getMonth() - i); key = 'm_' + d.getFullYear() + '_' + d.getMonth(); label = (d.getMonth()+1) + 'M'; }
      const cell = document.createElement('div'); cell.className = 'habit-cell';
      if (i === 0) cell.classList.add('today');
      if (habit.logs && habit.logs[key]) cell.classList.add('active');
      cell.textContent = label;
      cell.addEventListener('click', () => {
        if (!habit.logs) habit.logs = {};
        if (habit.logs[key]) delete habit.logs[key]; else habit.logs[key] = true;
        saveState(); renderHabitudesManager(); renderHabits();
      });
      grid.appendChild(cell);
    }
  });
  document.querySelectorAll('.habit-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(e.target.dataset.id);
      habitsData = habitsData.filter(h => h.id !== id);
      saveState(); renderHabitudesManager(); renderHabits();
    });
  });
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'addHabitBtn') {
    const nameInput = document.getElementById('newHabitName');
    const kanjiInput = document.getElementById('newHabitKanji');
    const freqSelect = document.getElementById('newHabitFreq');
    if (nameInput && nameInput.value.trim()) {
      habitsData.push({ id: Date.now(), name: nameInput.value.trim(), kanji: kanjiInput.value.trim() || '習慣', freq: freqSelect.value, logs: {} });
      nameInput.value = ''; kanjiInput.value = '';
      saveState(); renderHabitudesManager(); renderHabits();
    }
  }
  if (e.target.classList.contains('habit-view-btn')) {
    document.querySelectorAll('.habit-view-btn').forEach(b => b.classList.remove('is-active'));
    e.target.classList.add('is-active');
    currentHabitView = e.target.dataset.habitView;
    renderHabitudesManager();
  }
});

document.querySelectorAll('.menu__item').forEach(item => {
  item.addEventListener('click', () => {
    if (item.dataset.view === 'habitudes') renderHabitudesManager();
  });
});
