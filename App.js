/* ============================================================
   RYAN GAMES 3.0 — app.js
   ============================================================ */

'use strict';

// ─── STATE ────────────────────────────────────────────────────
const State = {
  lang:         () => localStorage.getItem('rg_lang')    || 'pt-br',
  theme:        () => localStorage.getItem('rg_theme')   || 'dark',
  favorites:    () => JSON.parse(localStorage.getItem('rg_favorites'))   || [],
  clicks:       () => JSON.parse(localStorage.getItem('rg_clicks'))      || {},
  achievements: () => JSON.parse(localStorage.getItem('rg_achievements'))|| {},
  visits:       () => parseInt(localStorage.getItem('rg_visits'))        || 0,

  save: {
    lang:         (v)   => localStorage.setItem('rg_lang', v),
    theme:        (v)   => localStorage.setItem('rg_theme', v),
    favorites:    (arr) => localStorage.setItem('rg_favorites', JSON.stringify(arr)),
    clicks:       (obj) => localStorage.setItem('rg_clicks', JSON.stringify(obj)),
    achievements: (obj) => localStorage.setItem('rg_achievements', JSON.stringify(obj)),
    visits:       (n)   => localStorage.setItem('rg_visits', n),
  }
};

// ─── GLOBAL DATA (loaded from JSON) ───────────────────────────
let DATA = null;

// ─── TRANSLATIONS ─────────────────────────────────────────────
const T = {
  'pt-br': {
    nav_games:        'JOGOS',
    nav_achievements: 'CONQUISTAS',
    nav_news:         'NOVIDADES',
    nav_about:        'SOBRE',
    hero_eyebrow:     '// PORTAL DE JOGOS v3.0',
    hero_title_1:     'RYAN',
    hero_title_2:     'GAMES',
    hero_sub:         'Sua coleção de jogos favoritos em um só lugar.',
    hero_btn_main:    'Ver Jogos',
    hero_btn_sec:     'Conquistas',
    section_games:    'BIBLIOTECA',
    title_games:      'Jogos',
    section_ach:      'PROGRESSO',
    title_ach:        'Conquistas',
    section_news:     'ATUALIZAÇÕES',
    title_news:       'Novidades',
    section_about:    'PROJETO',
    title_about:      'Sobre',
    tab_all:          'Todos',
    tab_fav:          'Favoritos',
    search_ph:        'Buscar jogo...',
    filter_all:       'Todos',
    click_lbl:        'visitas',
    visit_btn:        'Jogar →',
    featured:         'EM DESTAQUE',
    no_results:       'Nenhum jogo encontrado.',
    no_fav:           'Nenhum favorito ainda. Clique na ⭐ para adicionar.',
    ach_locked:       'Bloqueada',
    ach_unlocked_lbl: 'Desbloqueada',
    ach_unlock_msg:   '🏅 Conquista desbloqueada!',
    about_p1:         'O Ryan Games 3.0 é um portal pessoal criado para reunir os melhores links de jogos em um único lugar, com sistema de favoritos, conquistas e muito mais.',
    about_p2:         'Desenvolvido e mantido por Ryan com foco em performance, design moderno e experiência de usuário de alto nível.',
    stat_games:       'Jogos',
    stat_favs:        'Favoritos',
    stat_visits:      'Visitas',
    settings_title:   'Configurações',
    cfg_lang:         'Idioma',
    cfg_theme:        'Tema',
    cfg_theme_btn:    'Alternar',
    cfg_reset_ach:    'Resetar Conquistas',
    cfg_clear:        'Limpar Todos os Dados',
    cfg_reset_btn:    'Resetar',
    cfg_clear_btn:    'Limpar Tudo',
    toast_theme_dark: '⚫ Modo Escuro ativado',
    toast_theme_light:'☀️ Modo Claro ativado',
    toast_reset_ach:  '🔄 Conquistas resetadas',
    toast_cleared:    '🗑️ Dados apagados',
    footer_status:    'Online',
    footer_copy:      '© 2025 Ryan Games 3.0 — Todos os direitos reservados',
  },
  'en': {
    nav_games:        'GAMES',
    nav_achievements: 'ACHIEVEMENTS',
    nav_news:         'NEWS',
    nav_about:        'ABOUT',
    hero_eyebrow:     '// GAMES PORTAL v3.0',
    hero_title_1:     'RYAN',
    hero_title_2:     'GAMES',
    hero_sub:         'Your favorite games collection in one place.',
    hero_btn_main:    'Browse Games',
    hero_btn_sec:     'Achievements',
    section_games:    'LIBRARY',
    title_games:      'Games',
    section_ach:      'PROGRESS',
    title_ach:        'Achievements',
    section_news:     'UPDATES',
    title_news:       'What\'s New',
    section_about:    'PROJECT',
    title_about:      'About',
    tab_all:          'All',
    tab_fav:          'Favorites',
    search_ph:        'Search game...',
    filter_all:       'All',
    click_lbl:        'visits',
    visit_btn:        'Play →',
    featured:         'FEATURED',
    no_results:       'No games found.',
    no_fav:           'No favorites yet. Click the ⭐ to add one.',
    ach_locked:       'Locked',
    ach_unlocked_lbl: 'Unlocked',
    ach_unlock_msg:   '🏅 Achievement unlocked!',
    about_p1:         'Ryan Games 3.0 is a personal portal created to gather the best game links in one place, with favorites, achievements, and more.',
    about_p2:         'Developed and maintained by Ryan with a focus on performance, modern design, and top-tier user experience.',
    stat_games:       'Games',
    stat_favs:        'Favorites',
    stat_visits:      'Visits',
    settings_title:   'Settings',
    cfg_lang:         'Language',
    cfg_theme:        'Theme',
    cfg_theme_btn:    'Toggle',
    cfg_reset_ach:    'Reset Achievements',
    cfg_clear:        'Clear All Data',
    cfg_reset_btn:    'Reset',
    cfg_clear_btn:    'Clear All',
    toast_theme_dark: '⚫ Dark Mode activated',
    toast_theme_light:'☀️ Light Mode activated',
    toast_reset_ach:  '🔄 Achievements reset',
    toast_cleared:    '🗑️ Data cleared',
    footer_status:    'Online',
    footer_copy:      '© 2025 Ryan Games 3.0 — All rights reserved',
  }
};

const t = (key) => (T[State.lang()] || T['pt-br'])[key] || key;

// ─── DOM HELPERS ───────────────────────────────────────────────
const el  = (id) => document.getElementById(id);
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ─── TOAST ────────────────────────────────────────────────────
function showToast(message) {
  const container = el('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3000);
  });
}

// ─── THEME ────────────────────────────────────────────────────
function applyTheme(theme) {
  document.body.classList.toggle('light-mode', theme === 'light');
}

function toggleTheme() {
  const next = State.theme() === 'dark' ? 'light' : 'dark';
  State.save.theme(next);
  applyTheme(next);
  showToast(next === 'dark' ? t('toast_theme_dark') : t('toast_theme_light'));
}

// ─── LANGUAGE ─────────────────────────────────────────────────
function applyLang(lang) {
  State.save.lang(lang);
  qsa('[data-t]').forEach(el => {
    const key = el.getAttribute('data-t');
    if (el.tagName === 'INPUT') el.placeholder = t(key);
    else el.textContent = t(key);
  });
  qsa('[data-t-ph]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-t-ph'));
  });
  // Re-render dynamic sections
  if (DATA) {
    renderGames();
    renderAchievements();
    renderNews();
    renderAbout();
    updateStats();
  }
}

// ─── MOBILE MENU ──────────────────────────────────────────────
function initMobileMenu() {
  const btn  = el('hamburger');
  const menu = el('nav-links');
  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    menu.classList.toggle('open');
  });
  // Close on nav link click
  qsa('a', menu).forEach(a => {
    a.addEventListener('click', () => {
      btn.classList.remove('open');
      menu.classList.remove('open');
    });
  });
}

// ─── MODAL ────────────────────────────────────────────────────
function initModal() {
  const overlay = el('settings-modal');
  el('settings-btn').addEventListener('click', () => overlay.classList.add('open'));
  el('modal-close').addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });

  el('toggle-theme-btn').addEventListener('click', toggleTheme);

  el('lang-select').addEventListener('change', e => applyLang(e.target.value));

  el('reset-ach-btn').addEventListener('click', () => {
    State.save.achievements({});
    renderAchievements();
    showToast(t('toast_reset_ach'));
  });

  el('clear-data-btn').addEventListener('click', () => {
    localStorage.clear();
    showToast(t('toast_cleared'));
    setTimeout(() => location.reload(), 1200);
  });
}

// ─── GAMES RENDERING ──────────────────────────────────────────
let activeTab    = 'all';
let activeFilter = 'all';
let searchQuery  = '';

function createGameCard(game) {
  const favorites = State.favorites();
  const clicks    = State.clicks();
  const isFav     = favorites.includes(game.id);
  const count     = clicks[game.id] || 0;

  const card = document.createElement('div');
  card.className = 'game-card';
  card.style.animationDelay = '0ms';

  card.innerHTML = `
    ${game.featured ? `<div class="featured-badge" data-t="featured">${t('featured')}</div>` : ''}
    <div class="game-card-top">
      <div class="game-icon-wrap">${game.icon}</div>
      <div class="game-meta">
        <div class="game-name">${game.name}</div>
        <div class="game-category">${game.category}</div>
      </div>
      <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${game.id}" title="Favorito" aria-label="Favorito">
        ${isFav ? '★' : '☆'}
      </button>
    </div>
    <div class="game-card-footer">
      <span class="click-count">${count} ${t('click_lbl')}</span>
      <span class="visit-btn">${t('visit_btn')}</span>
    </div>
  `;

  // Click to open
  card.addEventListener('click', (e) => {
    if (e.target.closest('.fav-btn')) return;
    handleGameClick(game);
  });

  // Favorite
  card.querySelector('.fav-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(game.id, e.currentTarget);
  });

  return card;
}

function handleGameClick(game) {
  const clicks = State.clicks();
  clicks[game.id] = (clicks[game.id] || 0) + 1;
  State.save.clicks(clicks);
  checkAchievements();
  window.open(game.url, '_blank', 'noopener,noreferrer');
  renderGames(); // update counter
}

function toggleFavorite(id, btn) {
  let favs = State.favorites();
  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
    btn.classList.remove('active');
    btn.textContent = '☆';
  } else {
    favs.push(id);
    btn.classList.add('active');
    btn.textContent = '★';
  }
  State.save.favorites(favs);
  checkAchievements();
  updateStats();
  renderGames();
}

function getFilteredGames() {
  const favorites = State.favorites();
  let games = DATA.games;

  if (activeTab === 'fav') {
    games = games.filter(g => favorites.includes(g.id));
  }
  if (activeFilter !== 'all') {
    games = games.filter(g => g.category === activeFilter);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    games = games.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q)
    );
  }
  return games;
}

function renderGames() {
  const grid    = el('games-grid');
  const favCount = State.favorites().length;

  // Update tab badge
  const badge = qs('.tab-badge', el('tab-fav'));
  if (badge) badge.textContent = favCount;

  grid.innerHTML = '';
  const games = getFilteredGames();

  if (games.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'no-results';
    const msg = activeTab === 'fav' ? t('no_fav') : t('no_results');
    empty.innerHTML = `<div class="no-icon">🎮</div><p>${msg}</p>`;
    grid.appendChild(empty);
    return;
  }

  games.forEach((game, i) => {
    const card = createGameCard(game);
    card.style.animationDelay = `${i * 40}ms`;
    grid.appendChild(card);
  });
}

function renderFilterChips() {
  const container = el('filter-chips');
  container.innerHTML = '';

  const categories = ['all', ...DATA.categories];
  categories.forEach(cat => {
    const chip = document.createElement('button');
    chip.className = `chip ${cat === activeFilter ? 'active' : ''}`;
    chip.textContent = cat === 'all' ? t('filter_all') : cat;
    chip.addEventListener('click', () => {
      activeFilter = cat;
      qsa('.chip', container).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderGames();
    });
    container.appendChild(chip);
  });
}

function initGamesSection() {
  // Tabs
  el('tab-all').addEventListener('click', () => {
    activeTab = 'all';
    el('tab-all').classList.add('active');
    el('tab-fav').classList.remove('active');
    renderGames();
  });
  el('tab-fav').addEventListener('click', () => {
    activeTab = 'fav';
    el('tab-fav').classList.add('active');
    el('tab-all').classList.remove('active');
    renderGames();
  });

  // Search
  el('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderGames();
  });

  renderFilterChips();
  renderGames();
}

// ─── ACHIEVEMENTS ──────────────────────────────────────────────
function checkAchievements() {
  const achs    = State.achievements();
  const clicks  = State.clicks();
  const favs    = State.favorites();
  const visits  = State.visits();
  const totalClicks = Object.keys(clicks).length;

  const triggers = {
    always:     true,
    click:      totalClicks >= 1,
    clicks_5:   totalClicks >= 5,
    favorites_3:favs.length >= 3,
    visits_5:   visits >= 5,
    all:        false, // evaluated after others
  };

  // Count unlockable (non-"all") achievements
  const nonAllAchs = DATA.achievements.filter(a => a.trigger !== 'all');
  const allUnlocked = nonAllAchs.every(a => achs[a.id]);
  triggers.all = allUnlocked;

  let newUnlock = false;
  DATA.achievements.forEach(ach => {
    if (!achs[ach.id] && triggers[ach.trigger]) {
      achs[ach.id] = true;
      newUnlock = true;
    }
  });

  if (newUnlock) {
    State.save.achievements(achs);
    showToast(t('ach_unlock_msg'));
    renderAchievements();
  }
}

function renderAchievements() {
  const container = el('achievements-grid');
  const achs = State.achievements();
  container.innerHTML = '';

  DATA.achievements.forEach(ach => {
    const unlocked = !!achs[ach.id];
    const lang = State.lang();
    const title = lang === 'en' ? ach.title_en : ach.title_pt;
    const desc  = lang === 'en' ? ach.desc_en  : ach.desc_pt;

    const card = document.createElement('div');
    card.className = `ach-card ${unlocked ? 'unlocked' : ''}`;
    card.innerHTML = `
      <div class="ach-icon-wrap">${unlocked ? ach.icon : '🔒'}</div>
      <div class="ach-info">
        <div class="ach-title">${title}</div>
        <div class="ach-desc">${unlocked ? desc : (lang === 'en' ? 'Unlock to reveal.' : 'Desbloqueie para revelar.')}</div>
      </div>
      <div class="ach-status">${unlocked ? t('ach_unlocked_lbl') : t('ach_locked')}</div>
    `;
    container.appendChild(card);
  });
}

// ─── NEWS ──────────────────────────────────────────────────────
function renderNews() {
  const container = el('news-grid');
  container.innerHTML = '';
  const lang = State.lang();

  DATA.news.forEach(item => {
    const title   = lang === 'en' ? item.title_en   : item.title_pt;
    const content = lang === 'en' ? item.content_en : item.content_pt;

    const card = document.createElement('div');
    card.className = 'news-card';
    card.innerHTML = `
      <div class="news-tag">${item.tag}</div>
      <div class="news-title">${title}</div>
      <span class="news-date">${item.date}</span>
      <div class="news-content">${content}</div>
    `;
    container.appendChild(card);
  });
}

// ─── ABOUT ────────────────────────────────────────────────────
function renderAbout() {
  const p1 = el('about-p1');
  const p2 = el('about-p2');
  if (p1) p1.textContent = t('about_p1');
  if (p2) p2.textContent = t('about_p2');
}

// ─── STATS ────────────────────────────────────────────────────
function updateStats() {
  const gamesCount = el('stat-games');
  const favsCount  = el('stat-favs');
  const visitsCount= el('stat-visits');
  if (gamesCount) gamesCount.textContent = DATA.games.length;
  if (favsCount)  favsCount.textContent  = State.favorites().length;
  if (visitsCount)visitsCount.textContent= State.visits();
}

// ─── VISIT COUNTER ─────────────────────────────────────────────
function incrementVisit() {
  const v = State.visits() + 1;
  State.save.visits(v);
}

// ─── FULL TRANSLATE (static elements) ─────────────────────────
function translateStatic(lang) {
  el('lang-select').value = lang;
  qsa('[data-t]').forEach(node => {
    const key = node.getAttribute('data-t');
    if (node.tagName === 'INPUT') node.placeholder = T[lang]?.[key] || key;
    else node.textContent = T[lang]?.[key] || key;
  });
}

// ─── INIT ──────────────────────────────────────────────────────
async function init() {
  // Load JSON data
  const response = await fetch('data.json');
  DATA = await response.json();

  // Apply persisted settings
  applyTheme(State.theme());
  el('lang-select').value = State.lang();

  // Static translations
  translateStatic(State.lang());

  // Increment visit
  incrementVisit();
  checkAchievements();

  // Render all sections
  initGamesSection();
  renderAchievements();
  renderNews();
  renderAbout();
  updateStats();

  // Init UI
  initMobileMenu();
  initModal();
}

document.addEventListener('DOMContentLoaded', init);
