
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
