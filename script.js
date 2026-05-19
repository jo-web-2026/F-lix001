const STORAGE_KEY = "felix-study-state-v1";
const STORAGE_VERSION = 2;
let DAY_KEY = getLocalDayKey();

const subjects = {
  slovencina: {
    name: "Slovenčina",
    icon: "📖",
    color: "#ff922b",
    streak: 3,
  },
  biologia: {
    name: "Biológia",
    icon: "🌿",
    color: "#58c96f",
    streak: 5,
  },
  chemia: {
    name: "Chémia",
    icon: "⚗",
    color: "#a86bff",
    streak: 2,
  },
  anglictina: {
    name: "Angličtina",
    icon: "Aa",
    color: "#35a9ff",
    streak: 4,
  },
};

const badges = [
  {
    name: "Bronzový Félix",
    minutes: 30,
    color: "#bd7136",
    medal: "★",
    image: "assets/felix/badge-bronze-felix.png",
    extra: "",
  },
  {
    name: "Strieborný Félix",
    minutes: 90,
    color: "#c7c8ca",
    medal: "✦",
    image: "assets/felix/badge-silver-felix.png",
    extra: "🎧",
  },
  {
    name: "Zlatý Félix",
    minutes: 180,
    color: "#f6b73f",
    medal: "★",
    image: "assets/felix/badge-gold-felix.png",
    extra: "👑",
  },
];

const messages = [
  "Ešte 10 min a máš bronz! 🐾",
  "Félix je na teba hrdý! 💛",
  "Dnes ideš na zlato! 🏆",
  "Sárka, maturita sa dá zvládnuť krok po kroku.",
];

const defaultState = {
  day: DAY_KEY,
  selectedSubject: "slovencina",
  duration: 25 * 60,
  remaining: 25 * 60,
  dailyMinutes: 0,
  streak: 0,
  shouldIncrementStreakToday: false,
  subjects: {
    slovencina: 0,
    biologia: 0,
    chemia: 0,
    anglictina: 0,
  },
};

let state = loadState();
let timer = null;
let isRunning = false;
let lastTick = Date.now();

const els = {
  appScreen: document.querySelector(".app-screen"),
  subjectGrid: document.querySelector("#subjectGrid"),
  selectedHint: document.querySelector("#selectedHint"),
  timerDisplay: document.querySelector("#timerDisplay"),
  timerMode: document.querySelector("#timerMode"),
  timerNote: document.querySelector("#timerNote"),
  timerRing: document.querySelector(".timer-ring"),
  startPauseBtn: document.querySelector("#startPauseBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  changeTimeBtn: document.querySelector("#changeTimeBtn"),
  badgeList: document.querySelector("#badgeList"),
  subjectDetailsGrid: document.querySelector("#subjectDetailsGrid"),
  currentBadgeLabel: document.querySelector("#currentBadgeLabel"),
  dailyMinutes: document.querySelector("#dailyMinutes"),
  dailyProgressBar: document.querySelector("#dailyProgressBar"),
  dailyPercent: document.querySelector("#dailyPercent"),
  streakTop: document.querySelector("#streakTop"),
  streakDays: document.querySelector("#streakDays"),
  messageStack: document.querySelector("#messageStack"),
  shareMinutes: document.querySelector("#shareMinutes"),
  shareBadge: document.querySelector("#shareBadge"),
  shareBtn: document.querySelector("#shareBtn"),
};

const viewNames = ["home", "stats", "badges", "profile"];

function getLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYesterdayKey(dayKey = DAY_KEY) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return getLocalDayKey(new Date(year, month - 1, day - 1));
}

function buildDayState(saved = {}) {
  return {
    ...defaultState,
    ...saved,
    day: DAY_KEY,
    subjects: { ...defaultState.subjects, ...saved.subjects },
    remaining: Number.isFinite(saved.remaining) ? saved.remaining : saved.duration || defaultState.duration,
  };
}

function calculateStreak(saved) {
  const days = saved?.days || {};
  const today = days[DAY_KEY];
  const yesterday = days[getYesterdayKey()];

  if (today?.dailyMinutes > 0) return saved.streak || today.streak || 1;
  if (yesterday?.dailyMinutes > 0) return saved.streak || yesterday.streak || 1;
  return 0;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return buildDayState();

    if (saved.version === STORAGE_VERSION) {
      const today = saved.days?.[DAY_KEY];
      const studiedYesterday = (saved.days?.[getYesterdayKey()]?.dailyMinutes || 0) > 0;
      if (today) {
        return buildDayState({
          ...today,
          streak: calculateStreak(saved),
          shouldIncrementStreakToday: today.dailyMinutes === 0 && studiedYesterday,
        });
      }

      return buildDayState({
        selectedSubject: saved.lastSelectedSubject || defaultState.selectedSubject,
        duration: saved.lastDuration || defaultState.duration,
        remaining: saved.lastDuration || defaultState.duration,
        streak: calculateStreak(saved),
        shouldIncrementStreakToday: studiedYesterday,
      });
    }

    if (saved.day === DAY_KEY) return buildDayState(saved);
    const studiedYesterday = saved.day === getYesterdayKey() && saved.dailyMinutes > 0;

    return buildDayState({
      selectedSubject: saved.selectedSubject || defaultState.selectedSubject,
      duration: saved.duration || defaultState.duration,
      remaining: saved.duration || defaultState.duration,
      streak: studiedYesterday ? saved.streak || 1 : 0,
      shouldIncrementStreakToday: studiedYesterday,
    });
  } catch {
    return buildDayState();
  }
}

function saveState() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    saved = {};
  }

  const days = saved.version === STORAGE_VERSION ? { ...saved.days } : {};
  days[DAY_KEY] = {
    day: DAY_KEY,
    selectedSubject: state.selectedSubject,
    duration: state.duration,
    remaining: state.remaining,
    dailyMinutes: state.dailyMinutes,
    streak: state.streak,
    subjects: { ...state.subjects },
  };

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: STORAGE_VERSION,
      activeDay: DAY_KEY,
      streak: state.streak,
      lastSelectedSubject: state.selectedSubject,
      lastDuration: state.duration,
      days,
    })
  );
}

function ensureCurrentDay() {
  const currentDay = getLocalDayKey();
  if (currentDay === DAY_KEY) return false;

  window.clearInterval(timer);
  timer = null;
  isRunning = false;
  DAY_KEY = currentDay;
  state = loadState();
  render();
  return true;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function getBadge(minutes = state.dailyMinutes) {
  return [...badges].reverse().find((badge) => minutes >= badge.minutes) || null;
}

function selectSubject(key) {
  ensureCurrentDay();
  if (!subjects[key] || key === state.selectedSubject) return;
  state.selectedSubject = key;
  saveState();
  render();
}

function renderSubjects() {
  els.subjectGrid.innerHTML = Object.entries(subjects)
    .map(([key, subject]) => {
      const selected = key === state.selectedSubject ? "is-selected" : "";
      return `
        <button class="subject-card ${selected}" type="button" data-subject="${key}" style="--subject: ${subject.color}">
          <span class="icon">${subject.icon}</span>
          <strong>${subject.name}</strong>
        </button>
      `;
    })
    .join("");

  els.subjectGrid.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => selectSubject(button.dataset.subject));
  });
}

function createSubjectDetailCard(key, subject) {
  const minutes = state.subjects[key] || 0;
  const percent = Math.min(100, Math.round((minutes / 90) * 100));

  return `
    <article class="detail-card glass-card ${key === state.selectedSubject ? "is-selected" : ""}" data-subject-detail="${key}" style="--subject: ${subject.color}; --subject-progress: ${percent}%">
      <div class="detail-top">
      <div class="detail-nav">
        <span aria-hidden="true">←</span>
        <h2>${subject.name}</h2>
        <span aria-hidden="true">⋮</span>
      </div>
      <div class="detail-main">
        <div class="mini-ring"><span>${subject.icon}</span></div>
        <div class="study-stat">
          <span>Dnes</span>
          <strong>${minutes} min</strong>
          <small>z 90 min</small>
          <b>🔥 ${subject.streak} dňový streak</b>
        </div>
      </div>
    </div>
    </article>
  `;
}

function renderSubjectDetails() {
  const subject = subjects[state.selectedSubject];
  els.selectedHint.textContent = `${subject.name} pripravená`;
  els.subjectDetailsGrid.innerHTML = Object.entries(subjects)
    .map(([key, item]) => createSubjectDetailCard(key, item))
    .join("");

  els.subjectDetailsGrid.querySelectorAll("[data-subject-detail]").forEach((card) => {
    card.addEventListener("click", () => selectSubject(card.dataset.subjectDetail));
  });
}

function renderBadges() {
  const current = getBadge();
  els.currentBadgeLabel.textContent = current ? current.name : "Dnes ešte bez odznaku";
  els.badgeList.innerHTML = badges
    .map((badge) => {
      const earned = state.dailyMinutes >= badge.minutes;
      return `
        <article class="badge-item ${earned ? "is-earned" : ""}" style="--badge: ${badge.color}">
          <div class="medal">${badge.medal}</div>
          <div class="badge-copy">
            <h3>${badge.name}</h3>
            <strong>${badge.minutes === 180 ? "180 min+" : `${badge.minutes} min`}</strong>
            <span>učenia</span>
          </div>
          <div class="badge-dog">
            <img src="${badge.image}" alt="" />
            <b>${earned ? "✓" : badge.extra}</b>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderDailyProgress() {
  const percent = Math.min(100, Math.round((state.dailyMinutes / 180) * 100));
  const current = getBadge();
  els.dailyMinutes.textContent = state.dailyMinutes;
  els.dailyProgressBar.style.width = `${percent}%`;
  els.dailyPercent.textContent = `${percent}%`;
  els.streakTop.textContent = state.streak;
  els.streakDays.textContent = state.streak;
  els.shareMinutes.textContent = state.dailyMinutes;
  els.shareBadge.textContent = current ? current.name.toUpperCase() : "FÉLIX ČAKÁ";
}

function renderMessages() {
  const minutesToBronze = Math.max(0, 30 - state.dailyMinutes);
  const dynamicMessages = [...messages];
  if (minutesToBronze > 0) {
    dynamicMessages[0] = `Ešte ${minutesToBronze} min a máš bronz! 🐾`;
  }
  els.messageStack.innerHTML = dynamicMessages.map((message) => `<p>${message}</p>`).join("");
}

function renderTimer() {
  els.timerDisplay.textContent = formatTime(state.remaining);
  const progress = 100 - Math.round((state.remaining / state.duration) * 100);
  els.timerRing.style.setProperty("--timer-progress", progress);
  els.startPauseBtn.textContent = isRunning ? "PAUZA" : state.remaining === state.duration ? "ŠTART" : "POKRAČUJ";
  els.startPauseBtn.classList.toggle("is-running", isRunning);
  els.timerMode.textContent = isRunning ? "Félix drží tempo" : "Sústreď sa";
  els.timerNote.textContent = isRunning ? "Sárka, ideš krásne!" : "Čas na sústredenie!";
}

function render() {
  renderSubjects();
  renderSubjectDetails();
  renderBadges();
  renderDailyProgress();
  renderMessages();
  renderTimer();
}

function getViewFromHash() {
  const hash = window.location.hash.replace("#", "");
  return viewNames.includes(hash) ? hash : "home";
}

function showView(view, updateHash = true) {
  const nextView = viewNames.includes(view) ? view : "home";
  document.querySelectorAll("[data-view]").forEach((section) => {
    section.classList.toggle("is-view-active", section.dataset.view === nextView);
  });

  document.querySelectorAll(".bottom-nav a").forEach((link) => {
    const isActive = link.dataset.tab === nextView;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  els.appScreen.scrollTo({ top: 0, behavior: "smooth" });
  if (updateHash && window.location.hash !== `#${nextView}`) {
    history.replaceState(null, "", `#${nextView}`);
  }
}

function addStudyMinute() {
  if (state.dailyMinutes === 0) {
    state.streak = state.shouldIncrementStreakToday ? state.streak + 1 : Math.max(state.streak, 1);
    state.shouldIncrementStreakToday = false;
  }
  state.dailyMinutes += 1;
  state.subjects[state.selectedSubject] = (state.subjects[state.selectedSubject] || 0) + 1;
  saveState();
  renderSubjectDetails();
  renderBadges();
  renderDailyProgress();
  renderMessages();
}

function completeSession() {
  stopTimer();
  state.remaining = state.duration;
  els.timerMode.textContent = "Hotovo!";
  els.timerNote.textContent = "Félix práve vrtí chvostíkom.";
  saveState();
  render();
}

function tick() {
  if (ensureCurrentDay()) return;

  const now = Date.now();
  const elapsed = Math.floor((now - lastTick) / 1000);
  if (elapsed <= 0) return;

  lastTick = now;
  const beforeMinute = Math.floor((state.duration - state.remaining) / 60);
  state.remaining = Math.max(0, state.remaining - elapsed);
  const afterMinute = Math.floor((state.duration - state.remaining) / 60);

  if (afterMinute > beforeMinute) {
    for (let i = beforeMinute; i < afterMinute; i += 1) addStudyMinute();
  }

  if (state.remaining <= 0) {
    completeSession();
    return;
  }

  saveState();
  renderTimer();
}

function startTimer() {
  ensureCurrentDay();
  if (isRunning) return;
  isRunning = true;
  lastTick = Date.now();
  timer = window.setInterval(tick, 1000);
  renderTimer();
}

function stopTimer() {
  isRunning = false;
  window.clearInterval(timer);
  timer = null;
  renderTimer();
}

function resetTimer() {
  ensureCurrentDay();
  stopTimer();
  state.remaining = state.duration;
  saveState();
  renderTimer();
}

function changeDuration() {
  ensureCurrentDay();
  const options = [15, 25, 45, 60];
  const currentMinutes = Math.round(state.duration / 60);
  const next = options[(options.indexOf(currentMinutes) + 1) % options.length] || 25;
  stopTimer();
  state.duration = next * 60;
  state.remaining = state.duration;
  saveState();
  renderTimer();
}

async function shareSuccess() {
  const current = getBadge();
  const text = `Dnes som študovala ${state.dailyMinutes} min. ${current ? current.name.toUpperCase() : "Félix ma ešte čaká"} #FelixStudy`;
  if (navigator.share) {
    try {
      await navigator.share({ title: "FÉLIX STUDY", text });
      return;
    } catch {
      // Sharing can be cancelled by the user.
    }
  }
  await navigator.clipboard?.writeText(text);
  els.shareBtn.textContent = "✓";
  window.setTimeout(() => {
    els.shareBtn.textContent = "↗";
  }, 1200);
}

els.startPauseBtn.addEventListener("click", () => {
  if (isRunning) stopTimer();
  else startTimer();
});

els.resetBtn.addEventListener("click", resetTimer);
els.changeTimeBtn.addEventListener("click", changeDuration);
els.shareBtn.addEventListener("click", shareSuccess);

document.querySelectorAll(".bottom-nav a").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showView(link.dataset.tab);
  });
});

window.addEventListener("hashchange", () => showView(getViewFromHash(), false));

if ("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

render();
showView(getViewFromHash(), false);
