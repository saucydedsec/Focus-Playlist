const STORAGE_KEY = "focus-playlist-state-v2";
const todayKey = new Date().toISOString().slice(0, 10);

const moods = [
  {
    id: "rain",
    title: "Rain Room",
    description: "Soft rain texture for reading, coding, and deep study.",
    colors: ["#77d8c1", "#3d7f95"],
    file: "audio/rain.mp3",
  },
  {
    id: "cafe",
    title: "Cafe Table",
    description: "Warm low hum for planning sessions and assignment work.",
    colors: ["#f3c86b", "#c86c58"],
    file: "audio/cafe.mp3",
  },
  {
    id: "night",
    title: "Night Drive",
    description: "Dark synth pad for late-night focus and quiet momentum.",
    colors: ["#8d7cff", "#1e2a57"],
    file: "audio/night.mp3",
  },
  {
    id: "lofi",
    title: "Lo-fi Glow",
    description: "Mellow beat-like pulse for steady study energy.",
    colors: ["#f08aa0", "#9955a5"],
    file: "audio/lofi.mp3",
  },
  {
    id: "forest",
    title: "Forest Desk",
    description: "Green airy ambience for calm notes and long reading blocks.",
    colors: ["#a5d86f", "#2f806b"],
    file: "audio/forest.mp3",
  },
];

const presets = [15, 25, 45, 60];
const themes = ["midnight", "sunset", "forest", "pink", "ocean"];
const defaultState = {
  mood: "rain",
  mixMood: "none",
  minutes: 25,
  volume: 65,
  mixVolume: 45,
  sessions: 0,
  goalMinutes: 90,
  theme: "midnight",
  favorites: [],
  history: [],
  playing: false,
  task: "",
};

let state = loadState();
let remainingSeconds = state.minutes * 60;
let timerId = null;
let breakId = null;
let breakSeconds = 60;
let audio = {
  primary: new Audio(),
  mix: new Audio(),
};

const elements = {
  body: document.body,
  albumArt: document.querySelector("#albumArt"),
  moodTitle: document.querySelector("#moodTitle"),
  moodDescription: document.querySelector("#moodDescription"),
  timeDisplay: document.querySelector("#timeDisplay"),
  sessionLabel: document.querySelector("#sessionLabel"),
  playButton: document.querySelector("#playButton"),
  resetButton: document.querySelector("#resetButton"),
  volumeInput: document.querySelector("#volumeInput"),
  minutesInput: document.querySelector("#minutesInput"),
  mixInput: document.querySelector("#mixInput"),
  mixVolumeInput: document.querySelector("#mixVolumeInput"),
  moodGrid: document.querySelector("#moodGrid"),
  presetRow: document.querySelector("#presetRow"),
  themeRow: document.querySelector("#themeRow"),
  visualizer: document.querySelector("#visualizer"),
  streakCount: document.querySelector("#streakCount"),
  taskInput: document.querySelector("#taskInput"),
  goalInput: document.querySelector("#goalInput"),
  goalText: document.querySelector("#goalText"),
  goalProgress: document.querySelector("#goalProgress"),
  historyList: document.querySelector("#historyList"),
  exportButton: document.querySelector("#exportButton"),
  clearDataButton: document.querySelector("#clearDataButton"),
  breakScreen: document.querySelector("#breakScreen"),
  breakCountdown: document.querySelector("#breakCountdown"),
  skipBreakButton: document.querySelector("#skipBreakButton"),
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return { ...defaultState };

  try {
    return { ...defaultState, ...JSON.parse(saved), playing: false };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, playing: false }));
}

function getMood(id) {
  return moods.find((mood) => mood.id === id) || moods[0];
}

function getSortedMoods() {
  return [...moods].sort((a, b) => {
    const aFavorite = state.favorites.includes(a.id);
    const bFavorite = state.favorites.includes(b.id);
    if (aFavorite === bFavorite) return 0;
    return aFavorite ? -1 : 1;
  });
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

function getTodayHistory() {
  return state.history.filter((entry) => entry.date === todayKey);
}

function getTodayMinutes() {
  return getTodayHistory().reduce((total, entry) => total + entry.minutes, 0);
}

function renderVisualizer() {
  elements.visualizer.innerHTML = Array.from({ length: 18 }, (_, index) => {
    const height = 22 + ((index * 17) % 50);
    const delay = (index % 6) * 90;
    return `<span class="bar" style="--bar-height: ${height}px; animation-delay: ${delay}ms;"></span>`;
  }).join("");
}

function renderMixOptions() {
  elements.mixInput.innerHTML = [
    '<option value="none">No mix</option>',
    ...moods.map((mood) => `<option value="${mood.id}">${mood.title}</option>`),
  ].join("");
}

function renderMoodCards() {
  elements.moodGrid.innerHTML = getSortedMoods()
    .map((mood) => {
      const isFavorite = state.favorites.includes(mood.id);
      return `
        <button class="mood-card ${mood.id === state.mood ? "active" : ""} ${isFavorite ? "favorite" : ""}" type="button" data-mood="${mood.id}" style="--mood-a: ${mood.colors[0]}; --mood-b: ${mood.colors[1]};">
          <span class="mood-top">
            <span class="mood-icon" aria-hidden="true"></span>
            <span class="favorite-dot" data-favorite="${mood.id}" aria-label="Toggle favorite">${isFavorite ? "Fav" : "Add"}</span>
          </span>
          <span>
            <strong>${mood.title}</strong>
            <span>${mood.description}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderPresets() {
  elements.presetRow.innerHTML = presets
    .map((minutes) => `<button class="preset-button ${state.minutes === minutes ? "active" : ""}" type="button" data-preset="${minutes}">${minutes} min</button>`)
    .join("");
}

function renderThemes() {
  elements.themeRow.innerHTML = themes
    .map((theme) => `<button class="theme-button ${state.theme === theme ? "active" : ""}" type="button" data-theme="${theme}">${theme}</button>`)
    .join("");
}

function renderGoal() {
  const todayMinutes = getTodayMinutes();
  const percent = Math.min((todayMinutes / state.goalMinutes) * 100, 100);
  elements.goalText.textContent = `${todayMinutes} / ${state.goalMinutes} min`;
  elements.goalProgress.style.width = `${percent}%`;
  elements.goalInput.value = state.goalMinutes;
}

function renderHistory() {
  const recent = state.history.slice(0, 8);
  if (recent.length === 0) {
    elements.historyList.innerHTML = '<li class="empty-history">Complete a session to see your focus log.</li>';
    return;
  }

  elements.historyList.innerHTML = recent
    .map((entry) => {
      const mix = entry.mixMood && entry.mixMood !== "none" ? ` + ${entry.mixMood}` : "";
      return `
        <li>
          <strong>${entry.minutes} min - ${entry.mood}${mix}</strong>
          <span>${entry.task || "Untitled focus"} - ${entry.time}</span>
        </li>
      `;
    })
    .join("");
}

function render() {
  const mood = getMood(state.mood);
  const mixMood = state.mixMood === "none" ? null : getMood(state.mixMood);
  const title = mixMood ? `${mood.title} + ${mixMood.title}` : mood.title;
  const description = mixMood ? `${mood.description} Mixed with ${mixMood.title.toLowerCase()}.` : mood.description;

  elements.body.className = `theme-${state.theme}`;
  elements.body.classList.toggle("is-playing", state.playing);
  elements.albumArt.style.setProperty("--mood-a", mood.colors[0]);
  elements.albumArt.style.setProperty("--mood-b", mixMood ? mixMood.colors[0] : mood.colors[1]);
  elements.moodTitle.textContent = title;
  elements.moodDescription.textContent = description;
  elements.timeDisplay.textContent = formatTime(remainingSeconds);
  elements.sessionLabel.textContent = `${state.minutes} minute focus session`;
  elements.playButton.textContent = state.playing ? "Pause" : "Play";
  elements.volumeInput.value = state.volume;
  elements.minutesInput.value = state.minutes;
  elements.mixInput.value = state.mixMood;
  elements.mixVolumeInput.value = state.mixVolume;
  elements.taskInput.value = state.task;
  elements.streakCount.textContent = `${state.sessions} sessions`;
  elements.visualizer.classList.toggle("playing", state.playing);

  renderMoodCards();
  renderPresets();
  renderThemes();
  renderGoal();
  renderHistory();
}

function updateAudioMood() {
  const primaryMood = getMood(state.mood);
  const mixMood = state.mixMood === "none" ? null : getMood(state.mixMood);

  if (!audio.primary.src.endsWith(primaryMood.file)) {
    audio.primary.src = primaryMood.file;
    audio.primary.loop = true;
  }

  if (mixMood && !audio.mix.src.endsWith(mixMood.file)) {
    audio.mix.src = mixMood.file;
    audio.mix.loop = true;
  }

  audio.primary.volume = state.playing ? state.volume / 100 : 0;
  audio.mix.volume = state.playing && mixMood ? (state.volume / 100) * (state.mixVolume / 100) : 0;
}

async function start() {
  state.playing = true;
  updateAudioMood();
  elements.sessionLabel.textContent = "Loading audio...";
  elements.playButton.disabled = true;

  try {
    await audio.primary.play();
    if (state.mixMood !== "none") {
      await audio.mix.play();
    } else {
      audio.mix.pause();
    }
  } catch {
    state.playing = false;
    elements.playButton.disabled = false;
    elements.sessionLabel.textContent = "Audio file could not play";
    render();
    return;
  }

  elements.playButton.disabled = false;
  clearInterval(timerId);
  timerId = setInterval(() => {
    remainingSeconds -= 1;

    if (remainingSeconds <= 0) {
      completeSession();
      return;
    }

    render();
  }, 1000);
  render();
}

function pause() {
  state.playing = false;
  clearInterval(timerId);
  timerId = null;
  updateAudioMood();
  audio.primary.pause();
  audio.mix.pause();
  saveState();
  render();
}

function reset() {
  pause();
  remainingSeconds = state.minutes * 60;
  render();
}

function completeSession() {
  const mood = getMood(state.mood);
  const mix = state.mixMood === "none" ? null : getMood(state.mixMood);
  const completed = {
    date: todayKey,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    minutes: state.minutes,
    mood: mood.title,
    mixMood: mix ? mix.title : "none",
    task: state.task.trim(),
  };

  state.sessions += 1;
  state.history.unshift(completed);
  state.history = state.history.slice(0, 40);
  remainingSeconds = state.minutes * 60;
  pause();
  startBreak();
}

function startBreak() {
  breakSeconds = 60;
  elements.breakScreen.classList.add("open");
  elements.breakScreen.setAttribute("aria-hidden", "false");
  elements.breakCountdown.textContent = `${breakSeconds} seconds`;
  clearInterval(breakId);
  breakId = setInterval(() => {
    breakSeconds -= 1;
    elements.breakCountdown.textContent = `${breakSeconds} seconds`;
    if (breakSeconds <= 0) closeBreak();
  }, 1000);
}

function closeBreak() {
  clearInterval(breakId);
  breakId = null;
  elements.breakScreen.classList.remove("open");
  elements.breakScreen.setAttribute("aria-hidden", "true");
}

function setMinutes(minutes) {
  state.minutes = minutes;
  remainingSeconds = minutes * 60;
  saveState();
  render();
}

function toggleFavorite(id) {
  if (state.favorites.includes(id)) {
    state.favorites = state.favorites.filter((favorite) => favorite !== id);
  } else {
    state.favorites.push(id);
  }
  saveState();
  renderMoodCards();
}

function exportHistory() {
  const payload = JSON.stringify(state.history, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "focus-playlist-history.json";
  link.click();
  URL.revokeObjectURL(url);
}

function clearSavedData() {
  pause();
  localStorage.removeItem(STORAGE_KEY);
  state = { ...defaultState };
  remainingSeconds = state.minutes * 60;
  render();
}

elements.playButton.addEventListener("click", () => {
  if (state.playing) pause();
  else start();
});

elements.resetButton.addEventListener("click", reset);
elements.skipBreakButton.addEventListener("click", closeBreak);
elements.exportButton.addEventListener("click", exportHistory);
elements.clearDataButton.addEventListener("click", clearSavedData);

elements.volumeInput.addEventListener("input", (event) => {
  state.volume = Number(event.target.value);
  updateAudioMood();
  saveState();
});

elements.mixVolumeInput.addEventListener("input", (event) => {
  state.mixVolume = Number(event.target.value);
  updateAudioMood();
  saveState();
});

elements.minutesInput.addEventListener("input", (event) => {
  setMinutes(Number(event.target.value));
});

elements.goalInput.addEventListener("input", (event) => {
  state.goalMinutes = Number(event.target.value);
  saveState();
  renderGoal();
});

elements.taskInput.addEventListener("input", (event) => {
  state.task = event.target.value;
  saveState();
});

elements.mixInput.addEventListener("change", (event) => {
  state.mixMood = event.target.value;
  updateAudioMood();
  saveState();
  render();
});

elements.moodGrid.addEventListener("click", (event) => {
  const favorite = event.target.closest("[data-favorite]");
  if (favorite) {
    event.stopPropagation();
    toggleFavorite(favorite.dataset.favorite);
    return;
  }

  const button = event.target.closest("[data-mood]");
  if (!button) return;
  state.mood = button.dataset.mood;
  updateAudioMood();
  saveState();
  render();
});

elements.presetRow.addEventListener("click", (event) => {
  const button = event.target.closest("[data-preset]");
  if (!button) return;
  setMinutes(Number(button.dataset.preset));
});

elements.themeRow.addEventListener("click", (event) => {
  const button = event.target.closest("[data-theme]");
  if (!button) return;
  state.theme = button.dataset.theme;
  saveState();
  render();
});

document.addEventListener("keydown", (event) => {
  const tagName = event.target.tagName;
  if (tagName === "INPUT" || tagName === "SELECT") return;

  if (event.code === "Space") {
    event.preventDefault();
    if (state.playing) pause();
    else start();
  }

  if (event.key.toLowerCase() === "r") {
    reset();
  }

  if (/^[1-5]$/.test(event.key)) {
    const mood = moods[Number(event.key) - 1];
    state.mood = mood.id;
    updateAudioMood();
    saveState();
    render();
  }
});

window.addEventListener("beforeunload", saveState);

renderVisualizer();
renderMixOptions();
render();
