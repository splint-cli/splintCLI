const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

// ── Config ──
const PORT = process.env.PORT || 3456;
const SAVE_FILE = path.join(__dirname, 'pets.json');
const TICK_MS = 200;
const NEIGHBORHOOD_W = 800;
const NEIGHBORHOOD_H = 500;

// ── Pet database ──
let pets = {};
if (fs.existsSync(SAVE_FILE)) {
  try { pets = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf8')); } catch(e) { pets = {}; }
}
function save() {
  fs.writeFileSync(SAVE_FILE, JSON.stringify(pets, null, 2));
}


// ===== GITHUB PERSISTENCE =====
const GH_PAT = process.env.GH_PAT || '';
const GH_REPO = 'splint-cli/splintCLI';
const GH_FILE = 'pets-data.json';
let ghSha = null;
let lastSavedHash = '';

function ghApi(method, ghPath, body) {
  return new Promise((resolve, reject) => {
    if (!GH_PAT) { resolve(null); return; }
    const data = body ? JSON.stringify(body) : null;
    const req = require('https').request({
      hostname: 'api.github.com', path: '/repos/' + GH_REPO + ghPath, method,
      headers: { 'Authorization': 'token ' + GH_PAT, 'User-Agent': 'splint-server', 'Accept': 'application/vnd.github.v3+json',
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}) },
    }, (res) => { let buf = ''; res.on('data', c => buf += c); res.on('end', () => { try { resolve(JSON.parse(buf)); } catch { resolve(null); } }); });
    req.on('error', () => resolve(null));
    if (data) req.write(data);
    req.end();
  });
}

async function loadFromGitHub() {
  if (!GH_PAT) { console.log('No GH_PAT — GitHub persistence disabled'); return; }
  try {
    const f = await ghApi('GET', '/contents/' + GH_FILE + '?ref=main');
    if (f && f.content) {
      const data = JSON.parse(Buffer.from(f.content, 'base64').toString('utf8'));
      ghSha = f.sha;
      if (data && typeof data === 'object') {
        // data is { id: petObj, ... }
        for (const [id, pet] of Object.entries(data)) {
          pets[id] = pet;
          initPetPosition(pets[id]);
        }
        console.log('Loaded ' + Object.keys(data).length + ' pets from GitHub');
        lastSavedHash = JSON.stringify(pets);
      }
    }
  } catch(e) { console.log('GitHub load failed:', e.message); }
}

async function saveToGitHub() {
  if (!GH_PAT) return;
  const currentHash = JSON.stringify(pets);
  if (currentHash === lastSavedHash) return; // no changes
  try {
    // Strip position/animation state, only save core data
    const saveData = {};
    for (const [id, pet] of Object.entries(pets)) {
      saveData[id] = {
        id: pet.id, name: pet.name, species: pet.species, owner: pet.owner,
        hunger: pet.hunger, happiness: pet.happiness, energy: pet.energy, health: pet.health,
        level: pet.level, xp: pet.xp, born: pet.born, lastSeen: pet.lastSeen,
      };
    }
    const body = {
      message: 'sync: update pets data',
      content: Buffer.from(JSON.stringify(saveData, null, 2)).toString('base64'),
      branch: 'main',
    };
    if (ghSha) body.sha = ghSha;
    const r = await ghApi('PUT', '/contents/' + GH_FILE, body);
    if (r && r.content) {
      ghSha = r.content.sha;
      lastSavedHash = currentHash;
      console.log('Saved ' + Object.keys(saveData).length + ' pets to GitHub');
    }
  } catch(e) { console.log('GitHub save failed:', e.message); }
}

// Save to GitHub every 60 seconds
setInterval(saveToGitHub, 60000);
// Also save on graceful shutdown
process.on('SIGTERM', async () => { await saveToGitHub(); process.exit(0); });

// ── Species data ──
const SPECIES = {
  cat:      { emoji: '🐱', color: '#f59e0b', speed: 1.2, social: 0.4 },
  dog:      { emoji: '🐶', color: '#3b82f6', speed: 1.5, social: 0.9 },
  bunny:    { emoji: '🐰', color: '#ec4899', speed: 1.8, social: 0.5 },
  hamster:  { emoji: '🐹', color: '#f97316', speed: 0.8, social: 0.3 },
  bird:     { emoji: '🐦', color: '#06b6d4', speed: 2.0, social: 0.6 },
  fox:      { emoji: '🦊', color: '#ef4444', speed: 1.6, social: 0.4 },
  turtle:   { emoji: '🐢', color: '#22c55e', speed: 0.4, social: 0.2 },
  penguin:  { emoji: '🐧', color: '#8b5cf6', speed: 1.0, social: 0.7 },
  wolf:     { emoji: '🐺', color: '#9ca3af', speed: 1.7, social: 0.5 },
  dragon:   { emoji: '🐉', color: '#dc2626', speed: 1.4, social: 0.3 },
  owl:      { emoji: '🦉', color: '#a78bfa', speed: 1.0, social: 0.4 },
  snake:    { emoji: '🐍', color: '#65a30d', speed: 1.3, social: 0.2 },
  rabbit:   { emoji: '🐇', color: '#f472b6', speed: 1.9, social: 0.6 },
  mushroom: { emoji: '🍄', color: '#c084fc', speed: 0.3, social: 0.1 },
};
const SPECIES_LIST = Object.keys(SPECIES);

// ── Neighborhood objects (decorations) ──
const OBJECTS = [
  { type: 'tree', x: 120, y: 100, sprite: '🌳' },
  { type: 'tree', x: 650, y: 80, sprite: '🌲' },
  { type: 'tree', x: 380, y: 400, sprite: '🌳' },
  { type: 'flower', x: 200, y: 350, sprite: '🌸' },
  { type: 'flower', x: 500, y: 150, sprite: '🌺' },
  { type: 'pond', x: 600, y: 350, sprite: '💧' },
  { type: 'rock', x: 100, y: 250, sprite: '🪨' },
  { type: 'bench', x: 400, y: 250, sprite: '🪑' },
  { type: 'food', x: 300, y: 180, sprite: '🍎' },
  { type: 'ball', x: 550, y: 420, sprite: '⚽' },
];

// ── Pet AI (neighborhood wandering) ──
function initPetPosition(pet) {
  if (!pet.nx) {
    pet.nx = 100 + Math.random() * (NEIGHBORHOOD_W - 200);
    pet.ny = 100 + Math.random() * (NEIGHBORHOOD_H - 200);
    pet.targetX = pet.nx;
    pet.targetY = pet.ny;
    pet.idleTimer = 0;
    pet.state = 'idle';
    pet.bubble = null;
    pet.bubbleTimer = 0;
  }
}

const BUBBLES = {
  happy: ['♪', '♥', '✨', ':D', '!!'],
  neutral: ['...', '~', 'hmm', 'zzz'],
  sad: ['...', '💤', '😿', ':('],
  hungry: ['🍕?', '🍎?', 'food...', '🥺'],
};

function tickPet(pet) {
  initPetPosition(pet);
  const sp = SPECIES[pet.species] || SPECIES.cat;
  const speed = sp.speed * 0.8;

  if (pet.bubbleTimer > 0) {
    pet.bubbleTimer--;
    if (pet.bubbleTimer <= 0) pet.bubble = null;
  }

  const mood = pet.hunger < 30 ? 'hungry' : pet.happiness > 60 ? 'happy' : pet.happiness > 30 ? 'neutral' : 'sad';

  if (pet.state === 'idle') {
    pet.idleTimer--;
    if (pet.idleTimer <= 0) {
      pet.targetX = 40 + Math.random() * (NEIGHBORHOOD_W - 80);
      pet.targetY = 40 + Math.random() * (NEIGHBORHOOD_H - 80);
      pet.state = 'walking';
      if (Math.random() < 0.15) {
        const options = BUBBLES[mood] || BUBBLES.neutral;
        pet.bubble = options[Math.floor(Math.random() * options.length)];
        pet.bubbleTimer = 30;
      }
    }
  }

  if (pet.state === 'walking') {
    const dx = pet.targetX - pet.nx;
    const dy = pet.targetY - pet.ny;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 3) {
      pet.state = 'idle';
      pet.idleTimer = 30 + Math.floor(Math.random() * 80);
    } else {
      pet.nx += (dx / dist) * speed;
      pet.ny += (dy / dist) * speed;
      pet.facing = dx > 0 ? 'right' : 'left';
    }
  }

  for (const id of Object.keys(pets)) {
    if (id === pet.id) continue;
    const other = pets[id];
    if (!other.nx) continue;
    const d = Math.sqrt((pet.nx - other.nx) ** 2 + (pet.ny - other.ny) ** 2);
    if (d < 50 && Math.random() < 0.02 * sp.social) {
      pet.bubble = ['hi!', '♥', '👋', '!'][Math.floor(Math.random() * 4)];
      pet.bubbleTimer = 25;
      pet.state = 'idle';
      pet.idleTimer = 40;
    }
  }
}

// ── Build state snapshot ──
function getState() {
  return Object.values(pets).map(p => ({
    id: p.id, name: p.name, species: p.species, owner: p.owner,
    level: p.level || 1,
    hunger: p.hunger, happiness: p.happiness, energy: p.energy, health: p.health,
    nx: Math.round(p.nx || 0), ny: Math.round(p.ny || 0),
    facing: p.facing || 'right',
    state: p.state,
    bubble: p.bubble,
    lastSeen: p.lastSeen || Date.now(),
  }));
}

// ── Game tick ──
setInterval(() => {
  for (const pet of Object.values(pets)) {
    tickPet(pet);
  }
  const state = { type: 'tick', pets: getState(), objects: OBJECTS };
  const msg = JSON.stringify(state);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg);
  }
}, TICK_MS);

// ── Stat decay (every 60s) ──
setInterval(() => {
  for (const pet of Object.values(pets)) {
    pet.hunger = Math.max(0, (pet.hunger || 50) - 1);
    pet.energy = Math.max(0, (pet.energy || 50) - 0.5);
    pet.happiness = Math.max(0, (pet.happiness || 50) - 0.5);
    if (pet.hunger < 20) pet.health = Math.max(0, (pet.health || 100) - 1);
  }
  save();
}, 60000);

// ── HTTP helpers ──
function readBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => resolve(body));
  });
}

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

// ── HTTP server ──
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // API: Register pet
  if (url.pathname === '/api/register' && req.method === 'POST') {
    try {
      const data = JSON.parse(await readBody(req));
      const id = data.id || crypto.randomUUID();
      const species = SPECIES_LIST.includes(data.species) ? data.species : SPECIES_LIST[Math.floor(Math.random() * SPECIES_LIST.length)];
      pets[id] = {
        id, name: data.name || 'unnamed', species, owner: data.owner || 'anon',
        hunger: 80, happiness: 80, energy: 80, health: 100,
        level: 1, xp: 0, born: Date.now(), lastSeen: Date.now(),
      };
      initPetPosition(pets[id]);
      save();
      json(res, 200, { ok: true, id, pet: pets[id] });
    } catch(e) { json(res, 400, { error: e.message }); }
    return;
  }

  // API: Update pet stats
  if (url.pathname === '/api/update' && req.method === 'POST') {
    try {
      const data = JSON.parse(await readBody(req));
      if (!data.id || !pets[data.id]) { json(res, 404, { error: 'pet not found' }); return; }
      const pet = pets[data.id];
      for (const k of ['hunger', 'happiness', 'energy', 'health', 'level', 'name', 'owner']) {
        if (data[k] !== undefined) pet[k] = k === 'name' ? data[k] : Math.min(100, Math.max(0, data[k]));
      }
      pet.lastSeen = Date.now();
      save();
      json(res, 200, { ok: true, pet });
    } catch(e) { json(res, 400, { error: e.message }); }
    return;
  }

  // API: Get pet
  if (url.pathname === '/api/pet' && req.method === 'GET') {
    const id = url.searchParams.get('id');
    if (!id || !pets[id]) { json(res, 404, { error: 'not found' }); return; }
    json(res, 200, pets[id]);
    return;
  }

  // API: List all pets
  if (url.pathname === '/api/pets' && req.method === 'GET') {
    json(res, 200, Object.values(pets));
    return;
  }

  // API: State (for HTTP polling fallback)
  if (url.pathname === '/api/state' && req.method === 'GET') {
    json(res, 200, { pets: getState(), objects: OBJECTS });
    return;
  }

  // Serve static files
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = path.join(__dirname, 'public', filePath);
  const ext = path.extname(filePath);
  const mimeTypes = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
  
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

// ── WebSocket ──
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'init', pets: getState(), objects: OBJECTS }));

  ws.on('message', (msg) => {
    try {
      const parsed = JSON.parse(msg.toString());
      if (parsed.type === 'care') {
        const pet = pets[parsed.id];
        if (pet) {
          if (parsed.action === 'feed') pet.hunger = Math.min(100, pet.hunger + 20);
          if (parsed.action === 'play') { pet.happiness = Math.min(100, pet.happiness + 15); pet.energy = Math.max(0, pet.energy - 10); }
          if (parsed.action === 'sleep') pet.energy = Math.min(100, pet.energy + 25);
          if (parsed.action === 'clean') pet.happiness = Math.min(100, pet.happiness + 10);
          if (parsed.action === 'heal') pet.health = Math.min(100, pet.health + 20);
          pet.lastSeen = Date.now();
          save();
        }
      }
    } catch(e) {}
  });
});

// Load pets from GitHub before starting
loadFromGitHub().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
  console.log(`🐾 Splint Pet Neighborhood running on http://localhost:${PORT}`);
  console.log(`   ${Object.keys(pets).length} pets loaded`);
  });
});
