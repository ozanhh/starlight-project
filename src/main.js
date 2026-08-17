let habitsData = [];
let currentHabitView = 'daily';

function saveState() { localStorage.setItem('starlight_habits', JSON.stringify(habitsData)); }
function loadState() { const s = localStorage.getItem('starlight_habits'); if (s) { habitsData = JSON.parse(s); } }

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
        if (targetView === 'habitudes') renderHabitudesManager();
      }
    });
    closeMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

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
  });
});

const intensitySlider = document.getElementById('intensitySlider');
const intensityValue = document.getElementById('intensityValue');
intensitySlider.addEventListener('input', (e) => {
  const v = parseInt(e.target.value);
  intensityValue.textContent = v;
  bgCanvas.setIntensity(v / 100);
});

const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
function updateNavDate() {
  const now = new Date();
  const days = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  document.getElementById('navDate').textContent = `${days[now.getDay()]} ${now.getDate()} ${monthNames[now.getMonth()].slice(0,4).toLowerCase()}.`;
  const todayEl = document.getElementById('todayDate');
  if (todayEl) todayEl.textContent = `${now.getDate()} ${monthNames[now.getMonth()].slice(0,4).toLowerCase()}.`;
  const carnetNum = document.getElementById('carnetDateNum');
  if (carnetNum) carnetNum.textContent = now.getDate();
}
updateNavDate();

class BgCanvas {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.particles = []; this.theme = 'hoshi'; this.intensity = 0.7;
    this.mouse = { x: -9999, y: -9999 };
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; }, { passive: true });
    window.addEventListener('mouseleave', () => { this.mouse.x = -9999; this.mouse.y = -9999; });
    this.init(); this.animate();
  }
  resize() { this.w = window.innerWidth; this.h = window.innerHeight; this.canvas.width = this.w * this.dpr; this.canvas.height = this.h * this.dpr; this.canvas.style.width = this.w + 'px'; this.canvas.style.height = this.h + 'px'; this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); }
  setTheme(theme) { this.theme = theme; this.init(); }
  setIntensity(v) { this.intensity = Math.max(0, Math.min(1, v)); this.init(); }
  getColor() { return getComputedStyle(document.documentElement).getPropertyValue('--particle-color').trim(); }
  getAlpha() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--particle-alpha').trim()) || 0.5; }
  getBaseCount() { return 120; }
  createParticle() { return { x: Math.random()*this.w, y: Math.random()*this.h, size: 0.6+Math.random()*1.4, speedY: -0.03-Math.random()*0.05, speedX: -0.02+Math.random()*0.04, twinkle: Math.random()*Math.PI*2, twinkleSpeed: 0.005+Math.random()*0.015, opacity: 0.3+Math.random()*0.6, ox: 0, oy: 0 }; }
  init() { this.particles = []; const count = Math.round(this.getBaseCount() * this.intensity); for (let i = 0; i < count; i++) this.particles.push(this.createParticle()); }
  drawParticle(p) { const ctx = this.ctx; const color = this.getColor(); const alphaBase = this.getAlpha() * this.intensity; const drawX = p.x + p.ox, drawY = p.y + p.oy; ctx.save(); ctx.translate(drawX, drawY); const tw = (Math.sin(p.twinkle)+1)/2; const op = p.opacity * alphaBase * (0.4+tw*0.6); const glowSize = p.size * 5; const grad = ctx.createRadialGradient(0,0,0,0,0,glowSize); grad.addColorStop(0, `rgba(${color}, ${op*0.5})`); grad.addColorStop(1, `rgba(${color}, 0)`); ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, glowSize, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = `rgba(${color}, ${op})`; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI*2); ctx.fill(); ctx.restore(); }
  updateParticle(p) { p.y += p.speedY; p.x += p.speedX; p.twinkle += p.twinkleSpeed; if (p.y < -10) { p.y = this.h + 10; p.x = Math.random() * this.w; } if (p.x < -10) p.x = this.w + 10; if (p.x > this.w + 10) p.x = -10; }
  animate() { const ctx = this.ctx; ctx.clearRect(0, 0, this.w, this.h); const grad = ctx.createRadialGradient(this.w/2, this.h/2, 0, this.w/2, this.h/2, Math.max(this.w, this.h) * 0.7); grad.addColorStop(0, 'rgba(255,255,255,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.25)'); ctx.fillStyle = grad; ctx.fillRect(0, 0, this.w, this.h); this.particles.forEach(p => { this.updateParticle(p); this.drawParticle(p); }); requestAnimationFrame(() => this.animate()); }
}
const bgCanvas = new BgCanvas(document.getElementById('bgCanvas'));

let currentCalDate = new Date(2024, 7, 17);
const eventsByDay = { 17: [{time:'08:30',title:'Maths',sub:'Salle 204'}] };
function renderCalendar() { document.getElementById('currentMonth').textContent = `${monthNames[currentCalDate.getMonth()]} ${currentCalDate.getFullYear()}`; document.getElementById('calendarDays').innerHTML = ''; }
document.getElementById('prevMonth').addEventListener('click', () => { currentCalDate.setMonth(currentCalDate.getMonth()-1); renderCalendar(); });
document.getElementById('nextMonth').addEventListener('click', () => { currentCalDate.setMonth(currentCalDate.getMonth()+1); renderCalendar(); });

const devoirs = document.querySelectorAll('.devoir');
devoirs.forEach(d => { d.addEventListener('click', () => { d.classList.toggle('done'); updateDevoirsProgress(); }); });
function updateDevoirsProgress() { const total = devoirs.length, done = document.querySelectorAll('.devoir.done').length; const pct = Math.round((done/total)*100); document.getElementById('progressPct').textContent = pct; document.getElementById('progressLabel').textContent = `${done} / ${total}`; const circle = document.getElementById('progressCircle'); const circumference = 2 * Math.PI * 80; circle.style.strokeDashoffset = circumference - (pct/100) * circumference; }

document.querySelectorAll('.sub-objectif').forEach(sub => { sub.addEventListener('click', () => { sub.classList.toggle('done'); recalcObjectifs(); }); });
function recalcObjectifs() { /* basic recalc */ }

function triggerDashboardAnimations() { document.querySelectorAll('.stat-card').forEach((card, i) => { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }); document.querySelectorAll('.subject__fill').forEach(fill => { fill.style.width = fill.dataset.fill + '%'; }); }

// --- NOUVEAU MODULE HABITUDES ---
function getDateString(date) { return date.toISOString().split('T')[0]; }

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

window.addEventListener('load', () => {
  loadState();
  renderCalendar();
  renderHabits();
  setTimeout(() => { document.getElementById('view-dashboard').classList.add('is-in'); triggerDashboardAnimations(); }, 100);
});
