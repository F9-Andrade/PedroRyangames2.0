/* ============================================================
   NEXUS GAMING — app.js
   A lightweight, premium, client-side gaming hub controller.
   ============================================================ */

// ─── STATE MANAGEMENT ─────────────────────────────────────────
let games = [];
let favorites = [];
let recentPlays = [];
let playCounts = {};
let ratings = {};

let activeCategory = 'all';
let searchQuery = '';
let sortMode = 'name_asc';

let spotlightIndex = -1;
let spotlightFiltered = [];
let currentGame = null;
let gameLoadTimer = null;

const NON_PLAYABLE_GAME_IDS = new Set(['img', 'js', 'themebgs']);

const TITLE_OVERRIDES = {
  '1on1soccer': '1 on 1 Soccer',
  '1v1lol': '1v1.LOL',
  '2drocketleague': '2D Rocket League',
  '60sburgerrun': '60s Burger Run',
  'adarkroom': 'A Dark Room',
  'adofai': 'A Dance of Fire and Ice',
  'asciispace': 'ASCII Space',
  'baldis-basics': "Baldi's Basics",
  'baldisbasics': "Baldi's Basics",
  'btd': 'Bloons TD',
  'btd2': 'Bloons TD 2',
  'btd3': 'Bloons TD 3',
  'btd4': 'Bloons TD 4',
  'btd5': 'Bloons TD 5',
  'btd6': 'Bloons TD 6',
  'cmm-client': 'CMM Client',
  'csgoclicker': 'CS:GO Clicker',
  'fnaf': 'Five Nights at Freddy\'s',
  'fnaf2': 'Five Nights at Freddy\'s 2',
  'fnaf3': 'Five Nights at Freddy\'s 3',
  'fnaf4': 'Five Nights at Freddy\'s 4',
  'gba': 'GBA Emulator',
  'gdlite': 'GD Lite',
  'iwbtc': 'I Wanna Be The Creator',
  'mcclassic': 'Minecraft Classic',
  'ngon': 'n-gon',
  'ovo': 'OvO',
  'ovo2': 'OvO 2',
  'q1k3': 'Q1K3',
  'r3': 'R3',
  'tu46': 'TU-46',
  'tu95': 'TU-95',
  'wbwwb': 'We Become What We Behold',
  'xx142-b2.exe': 'xx142-b2.exe',
  'xx142b2exe': 'xx142-b2.exe'
};

const TITLE_WORDS = [
  'achievement', 'unlocked', 'adventure', 'capitalist', 'amazing', 'rope', 'police',
  'among', 'assessment', 'examination', 'awesome', 'tanks', 'back', 'country',
  'basketball', 'legends', 'stars', 'basket', 'random', 'black', 'hole', 'square',
  'blood', 'tournament', 'robber', 'bounce', 'boxing', 'physics', 'breaking', 'bank',
  'bubble', 'shooter', 'burger', 'frights', 'burrito', 'bison', 'captain', 'callisto',
  'cell', 'machine', 'champion', 'island', 'chibi', 'knight', 'chroma', 'incident',
  'chrome', 'dino', 'clicker', 'heroes', 'cluster', 'rush', 'color', 'switch',
  'commodore', 'connect', 'cookie', 'crossy', 'road', 'cube', 'field', 'mayhem',
  'cut', 'holiday', 'time', 'travel', 'death', 'deepest', 'sword', 'doge', 'miner',
  'doodle', 'jump', 'dragon', 'ball', 'evolution', 'draw', 'hill', 'drift', 'boss',
  'hunters', 'drive', 'mad', 'duck', 'life', 'earn', 'die', 'edge', 'found',
  'emulator', 'escaping', 'prison', 'evil', 'glitch', 'factory', 'balls', 'forever',
  'fancy', 'pants', 'adventures', 'fireboy', 'watergirl', 'forest', 'temple',
  'flappy', 'bird', 'plane', 'flight', 'simulator', 'flippy', 'fish', 'fluid',
  'friday', 'night', 'funkin', 'friendly', 'fire', 'fruit', 'ninja', 'funny',
  'racing', 'shooter', 'maker', 'geometry', 'dash', 'rash', 'getaway', 'shootout',
  'gladi', 'hoppers', 'gold', 'digger', 'google', 'snake', 'gopher', 'kart',
  'grind', 'craft', 'guilty', 'gear', 'gun', 'redux', 'happy', 'wheels', 'helix',
  'highway', 'traffic', 'climb', 'idle', 'breakout', 'infiltrating', 'airship',
  'jetpack', 'joyride', 'just', 'fall', 'knife', 'hit', 'last', 'horizon', 'lazy',
  'learn', 'fly', 'line', 'rider', 'little', 'alchemy', 'lows', 'madalin', 'cars',
  'classic', 'merge', 'round', 'racers', 'metroid', 'zero', 'mission', 'minecraft',
  'tower', 'defence', 'minesweeper', 'monkey', 'mart', 'monster', 'tracks',
  'motoroad', 'ocarina', 'offline', 'online', 'paradise', 'omnom', 'pack',
  'bunchas', 'papa', 'burgeria', 'freezeria', 'pizzeria', 'paper', 'particle',
  'pizza', 'pokemon', 'push', 'radius', 'raid', 'red', 'retro', 'bowl', 'college',
  'haunt', 'riddle', 'school', 'transfer', 'rise', 'higher', 'blocks', 'rocket',
  'league', 'rooftop', 'snipers', 'russian', 'card', 'driver', 'scrap', 'metal',
  'shuttle', 'deck', 'sketchbook', 'skibidi', 'toilet', 'attack', 'sleeping',
  'beauty', 'slither', 'slope', 'snow', 'battle', 'rider', 'soccer', 'solitaire',
  'soundboard', 'space', 'company', 'garden', 'huggers', 'invaders', 'sprinter',
  'stack', 'stealing', 'diamond', 'stickman', 'hook', 'boost', 'golf', 'survival',
  'subway', 'surfers', 'super', 'hot', 'mario', 'meat', 'smash', 'bros', 'flash',
  'tanuki', 'sunset', 'run', 'tetris', 'final', 'earth', 'impossible', 'quiz',
  'there', 'is', 'no', 'thirty', 'dollar', 'website', 'this', 'only', 'level',
  'tiny', 'fishing', 'tomb', 'mask', 'top', 'speed', 'master', 'town', 'scaper',
  'universal', 'paperclips', 'wall', 'watermelon', 'weave', 'silk', 'wordle',
  'world', 'hardest', 'yohoho', 'zombs', 'royale', 'game', 'io', 'lol', 'of', 'the'
].sort((a, b) => b.length - a.length);

// ─── THEME & CATEGORY CONFIG ──────────────────────────────────
const CATEGORY_NAMES = {
  'esportes_corrida': 'Corrida & Esportes',
  'acao_tiro': 'Ação & Tiro',
  'plataforma_aventura': 'Plataforma & Aventura',
  'mente_puzzle': 'Mente & Puzzle',
  'casual_clicker': 'Casual & Clicker'
};

const CATEGORY_EMOJIS = {
  'esportes_corrida': '🏎️',
  'acao_tiro': '🔫',
  'plataforma_aventura': '🏃',
  'mente_puzzle': '🧠',
  'casual_clicker': '🎮'
};

// Custom game emoji overrides to make the catalog look gorgeous
const GAME_EMOJIS = {
  '1v1lol': '🔫',
  '2048': '🔢',
  'adarkroom': '🏚️',
  'asteroids': '☄️',
  'baldisbasics': '🏫',
  'basketballlegends': '🏀',
  'basketballstars': '🏀',
  'basketbrosio': '🏀',
  'basketrandom': '🏀',
  'bitlife': '🧬',
  'boxingrandom': '🥊',
  'breaklock': '🔒',
  'breakout': '🧱',
  'btd4': '🎈',
  'chess': '♟️',
  'chromedino': '🦖',
  'cookieclicker': '🍪',
  'crossyroad': '🐔',
  'csgoclicker': '🔫',
  'cuttherope': '🟢',
  'cuttheropeholiday': '🎄',
  'cuttheropetimetravel': '⏳',
  'doodlejump': '🧗',
  'doom': '👹',
  'drifthunters': '🏎️',
  'drivemad': '🛻',
  'ducklife': '🦆',
  'ducklife2': '🦆',
  'ducklife3': '🦆',
  'ducklife4': '🦆',
  'ducklife5': '🦆',
  'earntodie': '🧟',
  'eggycar': '🥚',
  'flappybird': '🐦',
  'fridaynightfunkin': '🎤',
  'fruitninja': '🍉',
  'geometrydash': '🔺',
  'googlesnake': '🐍',
  'littlealchemy': '🧪',
  'monkeymart': '🐒',
  'motox3m': '🏍️',
  'pacman': '🍕',
  'paperio': '🧻',
  'retrobowl': '🏈',
  'run3': '🏃',
  'slitherio': '🐍',
  'slope': '🌀',
  'slope2': '🌀',
  'snake': '🐍',
  'soccerrandom': '⚽',
  'solitaire': '🃏',
  'subwaysurfers': '🛹',
  'subwaysurfersny': '🛹',
  'subwaysurferssingapore': '🛹',
  'tetris': '🧱',
  'timeshooter': '⏱️',
  'timeshooter2': '⏱️',
  'timeshooter3': '⏱️',
  'tinyfishing': '🎣',
  'tombofthemask': '⚡',
  'tunnelrush': '🌀',
  'vex3': '🏃',
  'vex4': '🏃',
  'vex5': '🏃',
  'vex6': '🏃',
  'webecomewhatwebehold': '📺',
  'worldshardestgame2': '🟥'
};

const getGameEmoji = (game) => {
  return GAME_EMOJIS[game.id] || CATEGORY_EMOJIS[game.category] || '🎮';
};

function normalizeGameEntry(game) {
  const id = String(game.id || '').trim();
  return {
    ...game,
    id,
    name: getCleanGameName(game),
    url: normalizeAssetPath(game.url),
    image: normalizeAssetPath(game.image)
  };
}

function normalizeAssetPath(value) {
  return String(value || '').trim().replace(/\\/g, '/').replace(/^\.?\//, '');
}

function isPlayableGame(game) {
  return game.id && game.url && !NON_PLAYABLE_GAME_IDS.has(game.id);
}

function getCleanGameName(game) {
  const id = String(game.id || '').trim();
  const rawName = String(game.name || '').trim();

  if (TITLE_OVERRIDES[id]) return TITLE_OVERRIDES[id];
  if (rawName && isReadableGameName(rawName)) return rawName;

  return titleFromId(id);
}

function isReadableGameName(name) {
  const tokens = name.split(/\s+/).filter(Boolean);
  if (tokens.length < 3) return true;

  const tinyTokens = tokens.filter(token => /^[A-Za-z0-9]{1,2}$/.test(token)).length;
  const alternatingCaseChunks = tokens.filter(token => /^[A-Z][a-z]?$/.test(token)).length;

  return (tinyTokens / tokens.length) < 0.55 && (alternatingCaseChunks / tokens.length) < 0.55;
}

function titleFromId(id) {
  const normalized = String(id || '')
    .replace(/\.exe$/i, ' exe')
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([0-9])/gi, '$1 $2')
    .replace(/([0-9])([a-z])/gi, '$1 $2')
    .trim();

  const chunks = normalized.split(/\s+/).flatMap(segmentTitleWords);
  return chunks.map(formatTitleToken).join(' ') || 'Jogo';
}

function segmentTitleWords(segment) {
  if (!segment || segment.length <= 3 || /\d/.test(segment)) return [segment];

  const lower = segment.toLowerCase();
  const result = [];
  let index = 0;

  while (index < lower.length) {
    const match = TITLE_WORDS.find(word => lower.startsWith(word, index));
    if (!match) {
      result.push(lower.slice(index));
      break;
    }

    result.push(match);
    index += match.length;
  }

  return result;
}

function formatTitleToken(token) {
  const normalized = String(token || '').toLowerCase();
  const upperTokens = new Set(['2d', '3d', 'csgo', 'gba', 'gd', 'io', 'lol', 'td', 'tu', 'xx']);
  if (upperTokens.has(normalized)) return normalized.toUpperCase();
  if (/^[0-9]+[a-z]+$/i.test(token)) return token.toUpperCase();
  if (normalized === 'and') return '&';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

function encodeGameUrl(url) {
  const normalized = normalizeAssetPath(url);
  if (!normalized) return '';
  return normalized.split('/').map((part, i) => {
    if (i === 0 && !part.includes(' ')) return part;
    return encodeURIComponent(part);
  }).join('/');
}

function getPlayableGames() {
  return games.filter(isPlayableGame);
}

function getGameOfTheDay() {
  const playable = getPlayableGames();
  if (playable.length === 0) return null;
  const dateIndex = Math.floor(new Date().setHours(0, 0, 0, 0) / 8.64e7);
  return playable[dateIndex % playable.length];
}

const GAME_LOAD_TIMEOUT_MS = 45000;

function setPlayerStatus(mode, message) {
  const status = document.getElementById('player-status');
  const iframe = document.getElementById('theater-iframe');
  const title = document.getElementById('player-status-title');
  const msg = document.getElementById('player-status-message');
  if (!status) return;

  if (mode === 'hidden') {
    status.hidden = true;
    status.classList.remove('loading', 'error');
    if (iframe) iframe.style.visibility = '';
    return;
  }

  status.hidden = false;
  status.classList.toggle('loading', mode === 'loading');
  status.classList.toggle('error', mode === 'error');
  if (iframe) iframe.style.visibility = mode === 'loading' ? 'hidden' : '';

  if (title) {
    title.textContent = mode === 'error' ? 'Não foi possível carregar' : 'Carregando jogo...';
  }
  if (msg) {
    msg.textContent = message || (mode === 'error'
      ? 'Tente recarregar ou abrir em uma nova aba.'
      : 'Preparando o player...');
  }
}

function clearGameLoadTimer() {
  if (gameLoadTimer) {
    clearTimeout(gameLoadTimer);
    gameLoadTimer = null;
  }
}

function openCurrentGameInNewTab() {
  if (!currentGame) return;
  const url = encodeGameUrl(currentGame.url);
  window.open(new URL(url, window.location.href).href, '_blank', 'noopener,noreferrer');
}

function isFileProtocol() {
  return window.location.protocol === 'file:';
}

function initFileProtocolWarning() {
  if (!isFileProtocol()) return;

  const banner = document.getElementById('file-protocol-banner');
  const link = document.getElementById('file-protocol-local-link');
  const dismiss = document.getElementById('file-protocol-dismiss');

  if (link) {
    link.href = 'http://localhost:5500';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }

  if (banner && sessionStorage.getItem('nexus_file_banner_dismissed') !== '1') {
    banner.hidden = false;
  }

  dismiss?.addEventListener('click', () => {
    if (banner) banner.hidden = true;
    sessionStorage.setItem('nexus_file_banner_dismissed', '1');
  });
}

function showFileProtocolGameError() {
  setPlayerStatus(
    'error',
    'Este jogo (Unity/Godot/WebGL) não roda com arquivo local. Use iniciar-servidor.bat e abra http://localhost:5500 no navegador.'
  );
  showToast('⚠️ Inicie o servidor local (veja o aviso no topo da página).', 'error');
}

// ─── INITIALIZATION ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initFileProtocolWarning();
  loadLocalStorage();
  fetchGames();
  setupEventListeners();
  setupKeyboardShortcuts();
});

// Load storage variables
function loadLocalStorage() {
  favorites = JSON.parse(localStorage.getItem('nexus_favorites')) || [];
  recentPlays = JSON.parse(localStorage.getItem('nexus_history')) || [];
  playCounts = JSON.parse(localStorage.getItem('nexus_plays')) || {};
  ratings = JSON.parse(localStorage.getItem('nexus_ratings')) || {};
  
  updateFavoritesCounter();
}

// Fetch games.json config list
async function fetchGames() {
  try {
    let rawGames = [];
    if (window.GAMES_LIST && window.GAMES_LIST.length > 0) {
      rawGames = window.GAMES_LIST;
    } else {
      const response = await fetch('games.json');
      if (!response.ok) throw new Error('Não foi possível carregar a lista de jogos.');
      rawGames = await response.json();
    }

    games = rawGames
      .map(normalizeGameEntry)
      .filter(isPlayableGame);
    
    sortGames();
    
    // Set statistics
    document.getElementById('total-games-stat').textContent = games.length;
    document.getElementById('total-favorites-stat').textContent = favorites.length;
    
    let totalPlays = Object.values(playCounts).reduce((a, b) => a + b, 0);
    document.getElementById('total-played-stat').textContent = totalPlays;
    
    // Generate UI layouts
    renderGamesGrid();
    renderRecentBar();
    renderGameOfTheDay();
  } catch (error) {
    console.error(error);
    showToast('Erro ao carregar os jogos: ' + error.message, 'error');
  }
}

// ─── UI RENDER FUNCTIONS ──────────────────────────────────────

// Main games library layout builder
function renderGamesGrid() {
  const grid = document.getElementById('games-grid');
  const countBadge = document.getElementById('games-found-count');
  grid.innerHTML = '';
  
  const filtered = getFilteredAndSortedGames();
  
  // Update count indicator
  if (activeCategory === 'favorites') {
    countBadge.textContent = `${filtered.length} favoritos salvos`;
  } else {
    countBadge.textContent = `${filtered.length} jogos encontrados`;
  }
  
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎮</div>
        <div class="empty-title">Nenhum jogo encontrado</div>
        <div class="empty-desc">Tente alterar os filtros ou pesquisar por outro termo.</div>
      </div>
    `;
    return;
  }
  
  filtered.forEach(game => {
    const isFav = favorites.includes(game.id);
    const emoji = getGameEmoji(game);
    const plays = playCounts[game.id] || 0;
    const rating = ratings[game.id] || 0;
    const catName = CATEGORY_NAMES[game.category] || 'Casual';
    
    const card = document.createElement('div');
    card.className = 'game-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('data-id', game.id);
    
    // Render stars HTML
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      starsHtml += `<span class="star-interactive ${rating >= i ? 'on' : ''}" data-score="${i}" data-game-id="${game.id}">★</span>`;
    }
    
    const safeName = escapeHTML(game.name);
    const safeImage = game.image ? escapeHTML(encodeGameUrl(game.image)) : '';
    const hasImage = game.image && game.image.trim() !== "";
    const bannerHtml = hasImage 
      ? `<div class="card-banner">
           <img src="${safeImage}" class="card-banner-img" alt="${safeName}" loading="lazy" onerror="this.src=''; this.classList.add('error');" />
           <div class="card-banner-fallback">${emoji}</div>
         </div>`
      : `<div class="card-banner no-img">
           <div class="card-banner-fallback" style="display:flex;">${emoji}</div>
         </div>`;
         
    card.innerHTML = `
      ${game.featured ? `<div class="card-featured-badge">Destaque</div>` : ''}
      ${bannerHtml}
      <button class="fav-btn ${isFav ? 'active' : ''}" data-game-id="${escapeHTML(game.id)}" title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
        ${isFav ? '★' : '☆'}
      </button>
      <div class="card-body">
        <h3 class="game-name">${safeName}</h3>
        <span class="game-category-tag">${catName}</span>
        <div class="card-rating-row">
          ${starsHtml}
          <span class="rating-avg-text">${rating > 0 ? `${rating}/5` : 'Avaliar'}</span>
        </div>
      </div>
      <div class="card-footer">
        <span class="play-count-badge">👁️ ${plays} jogados</span>
        <button class="btn-play-card" data-play-id="${game.id}">Jogar →</button>
      </div>
    `;
    
    grid.appendChild(card);
  });
  
  // Re-bind click listeners for stars and play action
  bindGridCardEvents(grid);
}

// Bind dynamic actions specifically to cards in the grid
function bindGridCardEvents(container) {
  // Favorite buttons
  container.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gameId = btn.getAttribute('data-game-id');
      toggleFavorite(gameId);
    });
  });
  
  // Interactive stars
  container.querySelectorAll('.star-interactive').forEach(star => {
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      const gameId = star.getAttribute('data-game-id');
      const score = parseInt(star.getAttribute('data-score'));
      rateGame(gameId, score);
    });
  });
  
  // Card click or Play button click launches the game
  container.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      const gameId = card.getAttribute('data-id');
      launchGame(gameId);
    });
  });
  
  container.querySelectorAll('.btn-play-card').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gameId = btn.getAttribute('data-play-id');
      launchGame(gameId);
    });
  });
}

// Recently played horizontal slider bar
function renderRecentBar() {
  const bar = document.getElementById('recent-played-bar');
  const list = document.getElementById('recent-games-list');
  list.innerHTML = '';
  
  if (recentPlays.length === 0) {
    bar.style.display = 'none';
    return;
  }
  
  bar.style.display = 'flex';
  
  // Map recent plays IDs back to actual game objects
  const recentGames = recentPlays
    .map(id => games.find(g => g.id === id))
    .filter(Boolean);
    
  recentGames.forEach(game => {
    const item = document.createElement('div');
    item.className = 'recent-item';
    item.innerHTML = `
      <span class="recent-item-icon">${getGameEmoji(game)}</span>
      <span>${game.name}</span>
    `;
    item.addEventListener('click', () => launchGame(game.id));
    list.appendChild(item);
  });
}

// Game of the day algorithm (deterministic choose based on day index)
function renderGameOfTheDay() {
  const container = document.getElementById('game-of-the-day-card');
  const game = getGameOfTheDay();
  if (!game) return;
  
  const isFav = favorites.includes(game.id);
  const emoji = getGameEmoji(game);
  
  const safeName = escapeHTML(game.name);
  const imageUrl = game.image ? encodeGameUrl(game.image) : '';
  const hasImage = imageUrl !== '';
  const bgStyle = hasImage ? `background-image: linear-gradient(rgba(8, 11, 17, 0.88), rgba(8, 11, 17, 0.96)), url('${escapeHTML(imageUrl)}'); background-size: cover; background-position: center;` : '';
  
  container.setAttribute('style', bgStyle);
  container.innerHTML = `
    <div class="featured-badge">🎯 Jogo do Dia</div>
    <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap; z-index: 2; position: relative;">
      ${hasImage 
        ? `<img src="${escapeHTML(imageUrl)}" style="width: 100px; height: 100px; object-fit: cover; border-radius: var(--radius-md); border: 2px solid rgba(255,255,255,0.08); box-shadow: 0 0 20px rgba(0,0,0,0.4);" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
           <div class="featured-icon" style="display:none; width: 100px; height: 100px; margin-bottom: 0;">${emoji}</div>`
        : `<div class="featured-icon" style="width: 100px; height: 100px; margin-bottom: 0; display:flex;">${emoji}</div>`
      }
      <div style="flex: 1; min-width: 200px;">
        <div class="featured-title-lbl">Recomendação de hoje</div>
        <h2 class="featured-name" style="margin-bottom: 0.25rem; font-size: 1.75rem;">${safeName}</h2>
        <div class="featured-cat" style="margin-bottom: 0;">${CATEGORY_NAMES[game.category] || 'Casual'}</div>
      </div>
    </div>
    
    <div style="display:flex; gap:1rem; margin-top: 1.5rem; z-index: 2; position: relative;">
      <button class="btn btn-primary" id="play-featured-btn">Jogar Agora →</button>
      <button class="btn btn-secondary" id="fav-featured-btn">${isFav ? '★ Favoritado' : '☆ Favoritar'}</button>
    </div>
  `;
  
  // Bind actions
  document.getElementById('play-featured-btn').addEventListener('click', () => launchGame(game.id));
  
  const favBtn = document.getElementById('fav-featured-btn');
  favBtn.addEventListener('click', () => {
    toggleFavorite(game.id);
    // Refresh button UI
    const isNowFav = favorites.includes(game.id);
    favBtn.textContent = isNowFav ? '★ Favoritado' : '☆ Favoritar';
  });
}

// ─── DATA GETTERS & SEARCH LOGIC ──────────────────────────────
function getFilteredAndSortedGames() {
  let result = [...games];
  
  // Filter by category selection
  if (activeCategory === 'favorites') {
    result = result.filter(g => favorites.includes(g.id));
  } else if (activeCategory !== 'all') {
    result = result.filter(g => g.category === activeCategory);
  }
  
  // Filter by Search Query
  if (searchQuery) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter(g => 
      g.name.toLowerCase().includes(q) || 
      (CATEGORY_NAMES[g.category] || '').toLowerCase().includes(q)
    );
  }
  
  // Sort
  if (sortMode === 'name_asc') {
    result.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortMode === 'name_desc') {
    result.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortMode === 'plays_desc') {
    result.sort((a, b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0));
  } else if (sortMode === 'rating_desc') {
    result.sort((a, b) => (ratings[b.id] || 0) - (ratings[a.id] || 0));
  }
  
  return result;
}

// Sort games state initially or on filter change
function sortGames() {
  if (sortMode === 'name_asc') {
    games.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortMode === 'name_desc') {
    games.sort((a, b) => b.name.localeCompare(a.name));
  }
}

// ─── PORTAL INTERACTIVE SYSTEMS ─────────────────────────────────

// Add / Remove from Favorites storage
function toggleFavorite(gameId) {
  const index = favorites.indexOf(gameId);
  let msg = '';
  
  if (index > -1) {
    favorites.splice(index, 1);
    msg = 'Removido dos favoritos';
  } else {
    favorites.push(gameId);
    msg = 'Adicionado aos favoritos';
  }
  
  localStorage.setItem('nexus_favorites', JSON.stringify(favorites));
  updateFavoritesCounter();
  
  // Sync Hero Stat Count
  document.getElementById('total-favorites-stat').textContent = favorites.length;
  
  // Render updates
  renderGamesGrid();
  
  const featuredGame = getGameOfTheDay();
  if (featuredGame && featuredGame.id === gameId) {
    renderGameOfTheDay();
  }
  
  // Update Player Modal favorite button state if matching
  const player = document.getElementById('theater-player');
  if (player.classList.contains('open') && player.dataset.currentGameId === gameId) {
    const isNowFav = favorites.includes(gameId);
    const favBtn = document.getElementById('theater-fav-btn');
    favBtn.classList.toggle('active', isNowFav);
    favBtn.title = isNowFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
  }
  
  showToast(`⭐ ${msg}!`);
}

// Rate Game Score storage
function rateGame(gameId, score) {
  ratings[gameId] = score;
  localStorage.setItem('nexus_ratings', JSON.stringify(ratings));
  
  renderGamesGrid();
  showToast(`★ Avaliado com ${score} estrelas! Obrigado!`);
}

// Update Badge Counters
function updateFavoritesCounter() {
  const badges = [
    document.getElementById('fav-count-badge')
  ];
  badges.forEach(badge => {
    if (badge) {
      badge.textContent = favorites.length;
    }
  });
}

// Increments game plays
function incrementPlay(gameId) {
  playCounts[gameId] = (playCounts[gameId] || 0) + 1;
  localStorage.setItem('nexus_plays', JSON.stringify(playCounts));
  
  let totalPlays = Object.values(playCounts).reduce((a, b) => a + b, 0);
  document.getElementById('total-played-stat').textContent = totalPlays;
}

// Adds game to recent stack
function pushToRecent(gameId) {
  recentPlays = recentPlays.filter(id => id !== gameId);
  recentPlays.unshift(gameId);
  
  // Cap at 6 games
  if (recentPlays.length > 6) {
    recentPlays.pop();
  }
  
  localStorage.setItem('nexus_history', JSON.stringify(recentPlays));
}

// ─── THEATER PLAYER OVERLAY ENGINE ────────────────────────────
function launchGame(gameId) {
  const game = games.find(g => g.id === gameId);
  if (!game || !isPlayableGame(game)) return;

  const player = document.getElementById('theater-player');
  const iframe = document.getElementById('theater-iframe');
  currentGame = game;

  player.classList.add('open');
  document.body.style.overflow = 'hidden';

  if (isFileProtocol()) {
    document.getElementById('theater-game-name').textContent = game.name;
    document.getElementById('theater-game-category').textContent = CATEGORY_NAMES[game.category] || 'Casual';
    document.getElementById('theater-game-icon').textContent = getGameEmoji(game);
    iframe.src = 'about:blank';
    showFileProtocolGameError();
    const banner = document.getElementById('file-protocol-banner');
    if (banner) banner.hidden = false;
    return;
  }
  
  incrementPlay(gameId);
  pushToRecent(gameId);
  
  player.dataset.currentGameId = gameId;
  
  document.getElementById('theater-game-name').textContent = game.name;
  document.getElementById('theater-game-category').textContent = CATEGORY_NAMES[game.category] || 'Casual';
  document.getElementById('theater-game-icon').textContent = getGameEmoji(game);
  
  const isFav = favorites.includes(gameId);
  const favBtn = document.getElementById('theater-fav-btn');
  favBtn.classList.toggle('active', isFav);
  favBtn.title = isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
  
  clearGameLoadTimer();
  setPlayerStatus('loading');
  iframe.onload = () => {
    clearGameLoadTimer();
    setPlayerStatus('hidden');
  };
  iframe.onerror = () => {
    clearGameLoadTimer();
    setPlayerStatus('error', 'O jogo não respondeu. Abra em nova aba se o problema continuar.');
  };
  iframe.src = encodeGameUrl(game.url);
  gameLoadTimer = setTimeout(() => {
    if (!document.getElementById('player-status')?.hidden) {
      setPlayerStatus('error', 'O carregamento está demorando. Tente recarregar ou abrir em nova aba.');
    }
  }, GAME_LOAD_TIMEOUT_MS);
  
  renderRecentBar();
  showToast(`🎮 Iniciando ${game.name}...`);
}

function closeGame() {
  const player = document.getElementById('theater-player');
  const iframe = document.getElementById('theater-iframe');
  
  clearGameLoadTimer();
  setPlayerStatus('hidden');
  currentGame = null;
  iframe.onload = null;
  iframe.onerror = null;
  iframe.src = '';
  
  // Exit fullscreens if needed
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(err => console.log(err));
  }
  
  player.classList.remove('open');
  player.classList.remove('lights-off'); // reset cinema state
  document.body.style.overflow = ''; // restore scrolling
  
  // Render grid updates (plays count badge might have changed)
  renderGamesGrid();
}

function toggleTheaterLights() {
  const player = document.getElementById('theater-player');
  player.classList.toggle('lights-off');
  
  const isDimmed = player.classList.contains('lights-off');
  showToast(isDimmed ? '🕶️ Luzes apagadas. Modo cinema ativo.' : '💡 Luzes acesas.');
}

function togglePlayerFullscreen() {
  const iframeContainer = document.querySelector('.theater-viewport');
  
  if (!document.fullscreenElement) {
    iframeContainer.requestFullscreen()
      .then(() => showToast('🖥️ Tela cheia ativada.'))
      .catch(err => {
        showToast('Erro ao ativar tela cheia: ' + err.message, 'error');
      });
  } else {
    document.exitFullscreen().then(() => showToast('🖥️ Tela cheia desativada.'));
  }
}

// ─── EVENT WRAPPER CONFIG ─────────────────────────────────────
function setupEventListeners() {
  // Navigation & Category Filters Clicking
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      
      activeCategory = chip.getAttribute('data-category');
      renderGamesGrid();
    });
  });
  
  // Custom Meus Favoritos Header Button Link
  document.getElementById('nav-favs-link').addEventListener('click', (e) => {
    e.preventDefault();
    activeCategory = 'favorites';
    
    // Highlight category chip
    chips.forEach(c => {
      if (c.getAttribute('data-category') === 'favorites') {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });
    
    // Create favorites category chip dynamically if missing, but it is simulated
    // We can highlight "Todos os jogos" and filter, or just run filter. Let's run filter.
    chips.forEach(c => c.classList.remove('active'));
    renderGamesGrid();
    
    // Smooth scroll library grid
    document.getElementById('library').scrollIntoView({ behavior: 'smooth' });
  });
  
  document.getElementById('favs-shortcut').addEventListener('click', () => {
    activeCategory = 'favorites';
    chips.forEach(c => c.classList.remove('active'));
    renderGamesGrid();
    document.getElementById('library').scrollIntoView({ behavior: 'smooth' });
  });
  
  // Search input typing debounce
  let searchDebounce;
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      searchQuery = e.target.value;
      renderGamesGrid();
    }, 150);
  });
  
  // Sort selection changes
  document.getElementById('sort-select').addEventListener('change', (e) => {
    sortMode = e.target.value;
    renderGamesGrid();
  });
  
  // Theater mode buttons
  document.getElementById('theater-close-btn').addEventListener('click', closeGame);
  document.getElementById('theater-lights-btn').addEventListener('click', toggleTheaterLights);
  document.getElementById('theater-fullscreen-btn').addEventListener('click', togglePlayerFullscreen);
  
  document.getElementById('theater-fav-btn').addEventListener('click', () => {
    const player = document.getElementById('theater-player');
    const gameId = player.dataset.currentGameId;
    if (gameId) toggleFavorite(gameId);
  });

  document.getElementById('theater-open-tab-btn').addEventListener('click', openCurrentGameInNewTab);
  document.getElementById('player-retry-btn').addEventListener('click', () => {
    const player = document.getElementById('theater-player');
    const gameId = player.dataset.currentGameId;
    if (gameId) launchGame(gameId);
  });
  document.getElementById('player-open-tab-btn').addEventListener('click', openCurrentGameInNewTab);
  
  // Spotlight Modal Open/Close clicks
  const spotlight = document.getElementById('spotlight-search');
  document.getElementById('search-btn-trigger').addEventListener('click', openSpotlightSearch);
  
  // Close spotlight clicking background
  spotlight.addEventListener('click', (e) => {
    if (e.target === spotlight) {
      closeSpotlightSearch();
    }
  });
  
  // Spotlight Search Text Typing
  const spotlightInput = document.getElementById('spotlight-input');
  spotlightInput.addEventListener('input', (e) => {
    searchSpotlight(e.target.value);
  });
}

// ─── KEYBOARD SHORTCUTS SYSTEM ──────────────────────────────────
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    const spotlight = document.getElementById('spotlight-search');
    const player = document.getElementById('theater-player');
    
    // Ctrl + K - Open Search
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (spotlight.classList.contains('open')) {
        closeSpotlightSearch();
      } else {
        openSpotlightSearch();
      }
    }
    
    // ESC Action
    if (e.key === 'Escape') {
      if (spotlight.classList.contains('open')) {
        closeSpotlightSearch();
      } else if (player.classList.contains('open')) {
        closeGame();
      }
    }
    
    // Arrow Navigation inside Spotlight
    if (spotlight.classList.contains('open') && spotlightFiltered.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        spotlightIndex = (spotlightIndex + 1) % spotlightFiltered.length;
        updateSpotlightSelection();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        spotlightIndex = (spotlightIndex - 1 + spotlightFiltered.length) % spotlightFiltered.length;
        updateSpotlightSelection();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (spotlightIndex >= 0 && spotlightIndex < spotlightFiltered.length) {
          const game = spotlightFiltered[spotlightIndex];
          closeSpotlightSearch();
          launchGame(game.id);
        }
      }
    }
  });
}

// ─── SPOTLIGHT CONTROL LOGIC ──────────────────────────────────
function openSpotlightSearch() {
  const spotlight = document.getElementById('spotlight-search');
  const input = document.getElementById('spotlight-input');
  
  spotlight.classList.add('open');
  input.value = '';
  input.focus();
  
  // Show initial featured games list in spotlight on start
  searchSpotlight('');
}

function closeSpotlightSearch() {
  const spotlight = document.getElementById('spotlight-search');
  spotlight.classList.remove('open');
}

function searchSpotlight(query) {
  const resultsContainer = document.getElementById('spotlight-results');
  resultsContainer.innerHTML = '';
  spotlightIndex = -1;
  
  const q = query.toLowerCase().trim();
  
  if (!q) {
    // Show first 6 featured/popular games as suggestions when empty
    spotlightFiltered = games.filter(g => g.featured || favorites.includes(g.id)).slice(0, 6);
    if (spotlightFiltered.length === 0) {
      spotlightFiltered = games.slice(0, 6);
    }
  } else {
    // Filter matches
    spotlightFiltered = games.filter(g => 
      g.name.toLowerCase().includes(q) || 
      (CATEGORY_NAMES[g.category] || '').toLowerCase().includes(q)
    ).slice(0, 8); // cap matches view at 8 results
  }
  
  if (spotlightFiltered.length === 0) {
    resultsContainer.innerHTML = `<div style="padding:1.5rem; text-align:center; color:var(--text-muted);">Nenhum jogo encontrado para "${query}"</div>`;
    return;
  }
  
  spotlightFiltered.forEach((game, idx) => {
    const row = document.createElement('div');
    row.className = 'spotlight-item';
    row.setAttribute('data-idx', idx);
    row.innerHTML = `
      <div class="spotlight-game-info">
        <span class="spotlight-game-icon">${getGameEmoji(game)}</span>
        <div>
          <span class="spotlight-game-name">${escapeHTML(game.name)}</span>
          <div class="spotlight-game-cat">${CATEGORY_NAMES[game.category] || 'Casual'}</div>
        </div>
      </div>
      <span class="spotlight-action">JOGAR ↵</span>
    `;
    
    row.addEventListener('click', () => {
      closeSpotlightSearch();
      launchGame(game.id);
    });
    
    resultsContainer.appendChild(row);
  });
}

function updateSpotlightSelection() {
  const items = document.querySelectorAll('.spotlight-item');
  items.forEach((item, idx) => {
    if (idx === spotlightIndex) {
      item.classList.add('selected');
      // Scroll into view if needed
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('selected');
    }
  });
}

// ─── TOAST NOTIFICATION UTILITIES ──────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Auto dismiss after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    // Wait for transition to complete before deleting element
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }, 3000);
}
