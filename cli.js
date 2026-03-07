#!/usr/bin/env node
// cli.js — SPLINT: your AI creature, alive in your terminal

const fs = require('fs');
const path = require('path');
const { generateGenome, getSpeciesInfo, checkMutations } = require('./engine/dna');
const http = require('http');
const https = require('https');

// ===== ANSI =====
const ESC = '\x1b[';
const CLEAR = ESC + '2J';
const HOME = ESC + 'H';
const HIDE = ESC + '?25l';
const SHOW = ESC + '?25h';
const BOLD = ESC + '1m';
const DIM = ESC + '2m';
const RESET = ESC + '0m';
const CL = ESC + '2K';
function fg(r, g, b) { return `${ESC}38;2;${r};${g};${b}m`; }
function hexFg(hex) {
  const h = hex.replace('#', '');
  return fg(parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16));
}

const GREEN = hexFg('#50fa7b');
const PINK = hexFg('#ff79c6');
const CYAN = hexFg('#8be9fd');
const ORANGE = hexFg('#ffb86c');
const PURPLE = hexFg('#bd93f9');
const RED = hexFg('#ff5555');
const YELLOW = hexFg('#f1fa8c');
const WHITE = hexFg('#f8f8f2');
const GRAY = hexFg('#6272a4');
const DARK = hexFg('#44475a');

// ===== ANIMALS & EVOLUTIONS =====
const ANIMALS = {
  cat: {
    name: 'Cat',
    baby: ['  /\\_/\\  ',' ( o.o ) ','  > ^ <  '],
    young: ['   /\\_/\\   ','  ( o.o )  ','  />   <\\  ','  \\|   |/  '],
    adult: ['    /\\_____/\\    ','   /  o   o  \\   ','  ( ==  ^  == )  ','   )         (   ','  (   |   |   )  ','   (  ) . (  )   '],
    evolutions: {
      shadow: { name: 'Shadow Cat', req: 'speed', threshold: 30, art: ['    /\\_____/\\    ','   /  ◉   ◉  \\   ','  ( ==  ^  == )  ','  ~)  ░░░░░  (~  ','  ~( ░░░░░░░ )~  ','   ~(  ) . (  )~  '] },
      lion: { name: 'Lion', req: 'strength', threshold: 30, art: ['   \\|||||||/   ','   /\\_____/\\   ','  /  O   O  \\  ','  ( ==  ^  == )  ','   )  ROAR  (   ','  (  |   |  )  '] },
      mystic: { name: 'Mystic Cat', req: 'intelligence', threshold: 30, art: ['    ✦ /\\_/\\ ✦    ','   /  ◎   ◎  \\   ','  ( == ◇ ^  == )  ','   ) ~ ~ ~ ~ (   ','  (  ✧     ✧  )  '] },
    },
    idle: ['purring...', 'grooming itself', 'staring at nothing', 'kneading the air', 'chasing its tail'],
    happy: ['purring loudly!', 'rubbing against you', 'slow blinking ♥'],
    hungry: ['meowing at you', 'sitting by food bowl', 'knocking things off tables'],
    sick: ['coughing up a hairball', 'lying very still', 'whimpering softly'],
  },
  dragon: {
    name: 'Dragon',
    baby: ['  /\\_/\\  ',' ( °△° ) ','  /| |\\  ','   ~ ~   '],
    young: ['    /\\___/\\    ','   ( °△°  )   ','  ~/|   |\\~  ','   _|   |_   ','    ~   ~    '],
    adult: ['        __        ','   _  _/  \\_  _   ','  / \\/ °△°  \\/  \\ ','  \\  )      (  /  ','   \\/ |    | \\/   ','      |    |      ','     _/    \\_     '],
    evolutions: {
      inferno: { name: 'Inferno Dragon', req: 'strength', threshold: 30, art: ['    🔥  __  🔥    ','   _  _/  \\_  _   ','  /\\/ ◉△◉  \\/\\  ','  \\🔥)    (🔥/  ','   \\/ |🔥 | \\/   ','     _/    \\_     '] },
      frost: { name: 'Frost Dragon', req: 'intelligence', threshold: 30, art: ['    ❄   __   ❄    ','   _  _/  \\_  _   ','  / \\/ ◇△◇  \\/  \\ ','  \\  ) ❄❄❄❄ (  /  ','   \\/ |    | \\/   '] },
      wind: { name: 'Wind Dragon', req: 'speed', threshold: 30, art: ['   ~ ~  __  ~ ~   ','   _  _/  \\_  _   ','  / \\/ ~△~  \\/  \\ ','  \\  ) ~~~~ (  /  ','   \\/ |    | \\/   '] },
    },
    idle: ['breathing small flames', 'curled around its tail', 'watching the sky', 'hoarding shiny objects'],
    happy: ['doing a little fire dance!', 'nuzzling you gently', 'showing off its wings'],
    hungry: ['eyeing your food', 'scorching the ground', 'gnawing on a rock'],
    sick: ['flames flickering weakly', 'shivering', 'smoke coming from nostrils'],
  },
  wolf: {
    name: 'Wolf',
    baby: ['  /^ ^\\  ',' ( o_o ) ','   \\_/   '],
    young: ['   /\\  /\\   ','  ( o  o )  ','   (    )   ','   /|  |\\   ','    ~  ~    '],
    adult: ['      /\\    /\\      ','     /  \\  /  \\     ','    ( o    o )     ','     \\  __  /      ','      |    |       ','     /|    |\\      '],
    evolutions: {
      dire: { name: 'Dire Wolf', req: 'strength', threshold: 30, art: ['      /\\    /\\      ','     /◆◆\\  /◆◆\\     ','    ( ◉    ◉ )     ','     \\ ≡≡≡≡ /      ','     ▓|    |▓      ','    ▓/|    |\\▓     '] },
      ghost: { name: 'Ghost Wolf', req: 'luck', threshold: 25, art: ['    ~ /\\  /\\ ~    ','   ~ ( ·  · ) ~   ','    ~ (    ) ~    ','   ~  /|  |\\  ~   ','    ~  ~  ~  ~    '] },
      alpha: { name: 'Alpha Wolf', req: 'intelligence', threshold: 30, art: ['    ♛ /\\  /\\ ♛    ','     /  \\  /  \\     ','    ( ◉    ◉ )     ','     \\  ██  /      ','      |    |       '] },
    },
    idle: ['sniffing the air', 'pacing back and forth', 'ears perked up', 'howling softly'],
    happy: ['tail wagging furiously!', 'playful bow!', 'licking your hand'],
    hungry: ['whimpering softly', 'digging for food', 'staring with big eyes'],
    sick: ['limping slightly', 'nose is dry', 'whining quietly'],
  },
  owl: {
    name: 'Owl',
    baby: ['  (o,o)  ','  {`"´}  ','   " "   '],
    young: ['   (o,o)   ','  /{`"´}\\  ','  -" " "-  ','    ^ ^    '],
    adult: ['    ___    ','   (o,o)   ','  /{`"´}\\  ',' / /   \\ \\ ','  -" " "-  '],
    evolutions: {
      sage: { name: 'Sage Owl', req: 'intelligence', threshold: 30, art: ['   ✦___✦   ','   (◎,◎)   ','  /{`"´}\\  ',' /✧/   \\✧\\ ','  -" " "-  '] },
      phantom: { name: 'Phantom Owl', req: 'speed', threshold: 30, art: ['    ___    ','   (●,●)   ','  /{`"´}\\  ',' ~/     \\~ ','  ~" " "~  '] },
    },
    idle: ['rotating its head', 'blinking slowly', 'watching everything', 'preening feathers'],
    happy: ['hooting melodically!', 'fluffing up proudly', 'clicking its beak'],
    hungry: ['scanning for prey', 'ruffling feathers', 'pellet casting'],
    sick: ['feathers drooping', 'eyes half-closed', 'swaying on perch'],
  },
  fox: {
    name: 'Fox',
    baby: ['  /\\ /\\  ',' ( • • ) ','   w w   '],
    young: ['   /\\  /\\   ','  ( •  • )  ','   \\ w  /   ','    |  |    ','    ~~ ~~   '],
    adult: ['     /\\   /\\     ','    /  \\ /  \\    ','   ( •    • )   ','    \\  w   /    ','     |    |     ','    /|    |\\    '],
    evolutions: {
      kitsune: { name: 'Kitsune', req: 'creativity', threshold: 30, art: ['   ✦ /\\   /\\ ✦   ','    /  \\ /  \\    ','   ( ◎    ◎ )   ','    \\ ≈w≈  /    ','   ≈≈|    |≈≈   ','  ≈≈/|    |\\≈≈  '] },
      arctic: { name: 'Arctic Fox', req: 'luck', threshold: 25, art: ['     /\\   /\\     ','    / ❄\\ / ❄\\    ','   ( ·    · )   ','    \\  w   /    ','     | ❄❄ |     '] },
    },
    idle: ['being sneaky', 'digging a hole', 'prancing around', 'tilting its head'],
    happy: ['doing zoomies!', 'yipping excitedly!', 'bringing you a gift'],
    hungry: ['sniffing everywhere', 'giving you puppy eyes', 'stealing socks'],
    sick: ['tail drooping', 'nose running', 'curled up tight'],
  },
  snake: {
    name: 'Snake',
    baby: ['   _    ','  / \\~  ','  \\_/   '],
    young: ['    __     ','   /  \\~~  ','   \\__/    ','    ||     '],
    adult: ['       ___       ','      /   \\      ','     | 0 0 |     ','      \\ ~ /      ','    ~~~   ~~~    ','   ~         ~   '],
    evolutions: {
      cobra: { name: 'King Cobra', req: 'strength', threshold: 30, art: ['     ╔═══╗       ','     ║ ◉◉ ║      ','     ║ ~~ ║      ','      ╚═╝       ','    ~~~   ~~~    ','   ~         ~   '] },
      mystic: { name: 'Mystic Serpent', req: 'intelligence', threshold: 30, art: ['     ✦ ___ ✦     ','      / ◇ \\      ','     | ◎ ◎ |     ','      \\ ~ /      ','    ≈≈≈   ≈≈≈    '] },
    },
    idle: ['coiled up resting', 'flicking its tongue', 'basking in warmth', 'shedding skin'],
    happy: ['doing a happy wiggle!', 'booping your hand', 'exploring everywhere'],
    hungry: ['hunting mode activated', 'eyeing you suspiciously', 'squeezing water bowl'],
    sick: ['not moving much', 'scales look dull', 'refusing food'],
  },
  rabbit: {
    name: 'Rabbit',
    baby: ['  (\\(\\   ',' ( -.-) ','  o_(")(")', ],
    young: ['   (\\(\\    ','   ( -.- )  ','   o(")(")-  ','     ||     '],
    adult: ['    (\\  (\\    ','    ( -  .- )  ','    (       )  ','   o(")(")(")-  '],
    evolutions: {
      jackalope: { name: 'Jackalope', req: 'speed', threshold: 30, art: ['   \\|/ (\\  (\\ \\|/ ','    ( -  .- )  ','    (       )  ','   o(")(")(")-  '] },
      moon: { name: 'Moon Rabbit', req: 'luck', threshold: 25, art: ['    ☽ (\\  (\\ ☽   ','    ( ◎  .◎ )  ','    ( ✧     )  ','   o(")(")(")-  '] },
    },
    idle: ['twitching its nose', 'flopping over', 'digging happily', 'binkying around'],
    happy: ['BINKY!!! 🐇', 'zooming in circles!', 'licking your fingers'],
    hungry: ['thumping its foot', 'nibbling on everything', 'standing up begging'],
    sick: ['not eating', 'hunched up', 'grinding teeth'],
  },
  mushroom: {
    name: 'Mushroom',
    baby: ['   ._.   ','  ( · )  ','   |_|   '],
    young: ['   _.__    ','  / ·  \\   ','  \\____/   ','    ||     '],
    adult: ['    .---.     ','   / · · \\    ','  /   ·   \\   ','  \\_______/   ','     |||      '],
    evolutions: {
      mycelium: { name: 'Mycelium Mind', req: 'intelligence', threshold: 30, art: ['    .≈≈≈.     ','   / ◎ ◎ \\    ','  / ≈ · ≈  \\   ','  \\≈≈≈≈≈≈≈/   ','   ≈≈|||≈≈    ','   ≈≈|||≈≈    '] },
      toxic: { name: 'Toxic Shroom', req: 'strength', threshold: 30, art: ['    .☠☠☠.     ','   / ◉ ◉ \\    ','  /  ☠·☠  \\   ','  \\_______/   ','     |||      '] },
    },
    idle: ['releasing spores', 'glowing faintly', 'absorbing nutrients', 'vibing'],
    happy: ['pulsing with light!', 'growing a tiny friend', 'sporing happily ✨'],
    hungry: ['wilting slightly', 'reaching for moisture', 'looking pale'],
    sick: ['turning grey', 'spores stopped', 'drooping badly'],
  },
};

const ANIMAL_KEYS = Object.keys(ANIMALS);

// ===== ITEMS =====
const ITEMS = {
  berry:      { name: 'Berry',       emoji: '🫐', type: 'food',    effect: { hunger: 15 }, desc: 'restores 15 hunger' },
  meat:       { name: 'Raw Meat',    emoji: '🥩', type: 'food',    effect: { hunger: 30 }, desc: 'restores 30 hunger' },
  fish:       { name: 'Fish',        emoji: '🐟', type: 'food',    effect: { hunger: 20, happiness: 5 }, desc: 'tasty! +20 hunger +5 happy' },
  herb:       { name: 'Healing Herb',emoji: '🌿', type: 'medicine',effect: { cure: true }, desc: 'cures sickness' },
  mushroom:   { name: 'Glow Shroom', emoji: '🍄', type: 'food',    effect: { hunger: 10, xp: 20 }, desc: '+10 hunger +20 XP' },
  crystal:    { name: 'Crystal',     emoji: '💎', type: 'stat',    effect: { stat: 'intelligence', amount: 2 }, desc: 'INT +2 permanently' },
  feather:    { name: 'Swift Feather',emoji: '🪶', type: 'stat',    effect: { stat: 'speed', amount: 2 }, desc: 'SPD +2 permanently' },
  claw:       { name: 'Iron Claw',   emoji: '🦷', type: 'stat',    effect: { stat: 'strength', amount: 2 }, desc: 'STR +2 permanently' },
  star:       { name: 'Lucky Star',  emoji: '⭐', type: 'stat',    effect: { stat: 'luck', amount: 2 }, desc: 'LCK +2 permanently' },
  paint:      { name: 'Dream Paint', emoji: '🎨', type: 'stat',    effect: { stat: 'creativity', amount: 2 }, desc: 'CRE +2 permanently' },
  elixir:     { name: 'Elixir',      emoji: '🧪', type: 'boost',   effect: { allStats: 1 }, desc: 'ALL stats +1' },
  coffee:     { name: 'Coffee',      emoji: '☕', type: 'buff',    effect: { buff: 'caffeinated', duration: 50 }, desc: 'double XP for a while' },
  shield:     { name: 'Shield Rune', emoji: '🛡️', type: 'buff',    effect: { buff: 'shielded', duration: 50 }, desc: 'prevents sickness' },
  bone:       { name: 'Ancient Bone',emoji: '🦴', type: 'treasure',effect: { xp: 50 }, desc: '50 XP' },
  egg:        { name: 'Golden Egg',  emoji: '🥚', type: 'treasure',effect: { xp: 100 }, desc: '100 XP!' },
};

// ===== EXPEDITIONS =====
const ZONES = {
  forest:  { name: 'Dark Forest',   emoji: '🌲', difficulty: 1, stat: 'speed',        loot: ['berry','berry','herb','feather','mushroom'],           enemies: ['Slime','Bat','Spider'], desc: 'easy — good for beginners' },
  cave:    { name: 'Crystal Cave',  emoji: '🕳️', difficulty: 2, stat: 'strength',     loot: ['crystal','claw','bone','mushroom','herb'],             enemies: ['Golem','Cave Bat','Worm'], desc: 'medium — rich in minerals' },
  ocean:   { name: 'Deep Ocean',    emoji: '🌊', difficulty: 2, stat: 'intelligence',  loot: ['fish','fish','crystal','elixir','star'],               enemies: ['Kraken Jr','Jellyfish','Eel'], desc: 'medium — mysterious depths' },
  volcano: { name: 'Volcano',       emoji: '🌋', difficulty: 3, stat: 'strength',      loot: ['claw','claw','elixir','bone','crystal'],               enemies: ['Fire Imp','Magma Snake','Ash Bird'], desc: 'hard — extreme rewards' },
  void:    { name: 'The Void',      emoji: '🕳️', difficulty: 4, stat: 'luck',          loot: ['egg','elixir','star','paint','coffee'],                enemies: ['Shadow','Void Beast','???'], desc: 'deadly — legendary loot' },
  market:  { name: 'Night Market',  emoji: '🏪', difficulty: 1, stat: 'luck',          loot: ['coffee','shield','herb','berry','meat'],               enemies: ['Pickpocket','Stray Dog'], desc: 'easy — find useful supplies' },
};

// ===== SAVE =====
const SAVE_DIR = path.join(process.env.USERPROFILE || process.env.HOME || __dirname, '.splint');
if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR, { recursive: true });
const SAVE_PATH = path.join(SAVE_DIR, 'save.json');

// ===== SERVER SYNC =====
const SYNC_CONFIG_PATH = path.join(SAVE_DIR, 'sync.json');
const DEFAULT_SERVER = 'https://splintcli.onrender.com';

function getSyncUrl() {
  try {
    if (fs.existsSync(SYNC_CONFIG_PATH)) {
      const cfg = JSON.parse(fs.readFileSync(SYNC_CONFIG_PATH, 'utf8'));
      return cfg.server || DEFAULT_SERVER;
    }
  } catch {}
  return DEFAULT_SERVER;
}

function syncToServer(p) {
  if (!p || !p.name) return;
  const serverUrl = getSyncUrl();
  try {
    const url = new URL(serverUrl + '/api/register');
    const mod = url.protocol === 'https:' ? https : http;
    const data = JSON.stringify({
      id: p.id || (p.animal + '-' + p.name),
      name: p.name,
      species: p.animal,
      owner: process.env.USER || process.env.USERNAME || 'anon',
      level: p.level || 1,
      hunger: Math.floor(p.hunger || 0),
      happiness: Math.floor(p.happiness || 0),
      energy: Math.floor(p.energy || 0),
      health: Math.floor(p.hp || p.health || 100),
    });
    const req = mod.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeout: 3000,
    }, () => {});
    req.on('error', () => {});
    req.write(data);
    req.end();
  } catch {}
}

let lastSyncTime = 0;
function throttledSync(p) {
  const now = Date.now();
  if (now - lastSyncTime < 5000) return;
  lastSyncTime = now;
  syncToServer(p);
}


function loadSave() {
  try { if (fs.existsSync(SAVE_PATH)) return JSON.parse(fs.readFileSync(SAVE_PATH, 'utf8')); } catch {} return null;
}
function savePet(p) { fs.writeFileSync(SAVE_PATH, JSON.stringify(p, null, 2)); throttledSync(p); }

// ===== STATE =====
let pet = null;
let frame = 0;
let mode = 'boot'; // boot|hatching|naming|living|expedition|battle|inventory|evolving
let inputBuffer = '';
let hatchFrame = 0;
let selectedAnimal = null;
let message = '';
let messageTimer = 0;
let expeditionData = null;
let battleData = null;
let menuIndex = 0;

let W = process.stdout.columns || 80;
let H = process.stdout.rows || 24;

process.stdout.write(HIDE + CLEAR + HOME);
if (process.stdin.setRawMode) process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.on('exit', () => process.stdout.write(SHOW + RESET + CLEAR + HOME));
process.on('SIGINT', () => process.exit());

// ===== HELPERS =====
function center(text, w) {
  const stripped = text.replace(/\x1b\[[^m]*m/g, '');
  const pad = Math.max(0, Math.floor((w - stripped.length) / 2));
  return ' '.repeat(pad) + text;
}

function bar(val, max, color, width) {
  const pct = Math.max(0, Math.min(1, val / max));
  const filled = Math.floor(pct * width);
  return `${color}${'█'.repeat(filled)}${DARK}${'░'.repeat(width - filled)}${RESET}`;
}

function setMsg(msg) { message = msg; messageTimer = 80; }

function getDayPhase() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

function getDayEmoji() {
  const p = getDayPhase();
  return p === 'morning' ? '🌅' : p === 'afternoon' ? '☀️' : p === 'evening' ? '🌆' : '🌙';
}

// ===== INPUT =====
process.stdin.on('data', (key) => {
  if (key === '\x03') process.exit();

  if (mode === 'boot') {
    if (key === '\r' || key === '\n' || key === ' ') { mode = 'hatching'; hatchFrame = 0; process.stdout.write(CLEAR); }
    return;
  }
  if (mode === 'hatching') return;

  if (mode === 'naming') {
    if (key === '\x7f' || key === '\b') { inputBuffer = inputBuffer.slice(0, -1); }
    else if (key === '\r' || key === '\n') {
      if (inputBuffer.trim().length > 0) {
        pet.name = inputBuffer.trim();
        pet.id = pet.id || require('crypto').randomUUID();
        savePet(pet);
        syncToServer(pet);
        mode = 'living';
        process.stdout.write(CLEAR);
        setMsg(`${pet.name} looks up at you!`);
      }
    } else if (key.length === 1 && inputBuffer.length < 15) { inputBuffer += key; }
    return;
  }

  if (mode === 'expedition') {
    const zoneKeys = Object.keys(ZONES);
    if (key === '\x1b[A' || key === 'w') menuIndex = Math.max(0, menuIndex - 1);
    else if (key === '\x1b[B' || key === 's') menuIndex = Math.min(zoneKeys.length - 1, menuIndex + 1);
    else if (key === '\r' || key === '\n' || key === ' ') { startExpedition(zoneKeys[menuIndex]); }
    else if (key === 'b' || key === '\x1b') { mode = 'living'; process.stdout.write(CLEAR); }
    return;
  }

  if (mode === 'battle') {
    if (key === 'a' || key === '1') battleAction('attack');
    else if (key === 'd' || key === '2') battleAction('defend');
    else if (key === 'r' || key === '3') battleAction('run');
    return;
  }

  if (mode === 'inventory') {
    if (key === '\x1b[A' || key === 'w') menuIndex = Math.max(0, menuIndex - 1);
    else if (key === '\x1b[B' || key === 's') menuIndex = Math.min((pet.inventory || []).length - 1, menuIndex + 1);
    else if (key === '\r' || key === '\n' || key === ' ') useItem(menuIndex);
    else if (key === 'b' || key === '\x1b') { mode = 'living'; process.stdout.write(CLEAR); }
    return;
  }

  if (mode === 'evolving') {
    if (key === '\r' || key === '\n' || key === ' ') { mode = 'living'; process.stdout.write(CLEAR); }
    return;
  }

  if (mode === 'living') {
    switch(key) {
      case 'f': feed(); break;
      case 'p': play(); break;
      case 't': train(); break;
      case 'r': rest(); break;
      case 'e': mode = 'expedition'; menuIndex = 0; process.stdout.write(CLEAR); break;
      case 'v': mode = 'inventory'; menuIndex = 0; process.stdout.write(CLEAR); break;
      case 'q': savePet(pet); process.exit(); break;
    }
  }
});

// ===== ACTIONS =====
function feed() {
  if (pet.hunger >= 95) { setMsg(`${pet.name} isn't hungry.`); return; }
  pet.hunger = Math.min(100, pet.hunger + 20);
  pet.happiness = Math.min(100, pet.happiness + 3);
  pet.xp += 5;
  setMsg(`${pet.name} eats happily! hunger +20`);
  checkLevel(); savePet(pet);
}

function play() {
  if (pet.energy < 10) { setMsg(`${pet.name} is too tired.`); return; }
  pet.happiness = Math.min(100, pet.happiness + 15);
  pet.energy = Math.max(0, pet.energy - 12);
  pet.xp += getXpMultiplier(10);
  setMsg(`${pet.name} plays with you! +${getXpMultiplier(10)}xp`);
  checkLevel(); savePet(pet);
}

function train() {
  if (pet.energy < 20) { setMsg(`too tired to train.`); return; }
  if (pet.sick) { setMsg(`${pet.name} is sick! use a healing herb.`); return; }
  pet.energy = Math.max(0, pet.energy - 18);
  pet.hunger = Math.max(0, pet.hunger - 8);
  const stats = Object.keys(pet.genome.stats);
  const stat = stats[Math.floor(Math.random() * stats.length)];
  const gain = 1 + Math.floor(Math.random() * 2);
  pet.genome.stats[stat] = Math.min(99, pet.genome.stats[stat] + gain);
  pet.xp += getXpMultiplier(15);
  setMsg(`trained! ${stat.slice(0,3).toUpperCase()} +${gain} (+${getXpMultiplier(15)}xp)`);
  // Small chance to get sick from overtraining
  if (pet.energy < 15 && Math.random() < 0.15 && !hasBuff('shielded')) {
    pet.sick = true;
    setMsg(`${pet.name} got sick from overtraining!`);
  }
  checkLevel(); savePet(pet);
}

function rest() {
  if (pet.energy >= 95) { setMsg(`${pet.name} isn't tired.`); return; }
  pet.energy = Math.min(100, pet.energy + 35);
  pet.xp += 3;
  setMsg(`${pet.name} rests. energy +35 💤`);
  savePet(pet);
}

function getXpMultiplier(base) {
  let mult = 1;
  if (hasBuff('caffeinated')) mult = 2;
  if (getDayPhase() === 'night') mult *= 1.2; // night bonus
  return Math.floor(base * mult);
}

function hasBuff(name) {
  return pet.buffs && pet.buffs.some(b => b.name === name && b.timer > 0);
}

// ===== ITEMS =====
function useItem(idx) {
  if (!pet.inventory || !pet.inventory[idx]) return;
  const itemId = pet.inventory[idx];
  const item = ITEMS[itemId];
  if (!item) return;

  pet.inventory.splice(idx, 1);

  if (item.effect.hunger) pet.hunger = Math.min(100, pet.hunger + item.effect.hunger);
  if (item.effect.happiness) pet.happiness = Math.min(100, pet.happiness + item.effect.happiness);
  if (item.effect.xp) { pet.xp += getXpMultiplier(item.effect.xp); checkLevel(); }
  if (item.effect.cure) { pet.sick = false; setMsg(`${pet.name} is cured!`); }
  if (item.effect.stat) { pet.genome.stats[item.effect.stat] = Math.min(99, pet.genome.stats[item.effect.stat] + item.effect.amount); }
  if (item.effect.allStats) { for (const s of Object.keys(pet.genome.stats)) pet.genome.stats[s] = Math.min(99, pet.genome.stats[s] + item.effect.allStats); }
  if (item.effect.buff) {
    if (!pet.buffs) pet.buffs = [];
    pet.buffs = pet.buffs.filter(b => b.name !== item.effect.buff);
    pet.buffs.push({ name: item.effect.buff, timer: item.effect.duration });
  }

  setMsg(`used ${item.emoji} ${item.name}! ${item.desc}`);
  savePet(pet);
  mode = 'living';
  process.stdout.write(CLEAR);
}

// ===== EXPEDITIONS =====
function startExpedition(zoneId) {
  const zone = ZONES[zoneId];
  if (pet.energy < 25) { setMsg('not enough energy for expedition!'); mode = 'living'; process.stdout.write(CLEAR); return; }
  if (pet.sick) { setMsg(`${pet.name} is too sick to explore!`); mode = 'living'; process.stdout.write(CLEAR); return; }

  pet.energy = Math.max(0, pet.energy - 20);

  const statVal = pet.genome.stats[zone.stat] || 10;
  const roll = Math.random() * 30;
  const success = roll < statVal + pet.genome.stats.luck / 5;

  if (success) {
    // Get loot
    const lootId = zone.loot[Math.floor(Math.random() * zone.loot.length)];
    const item = ITEMS[lootId];
    if (!pet.inventory) pet.inventory = [];
    if (pet.inventory.length < 20) pet.inventory.push(lootId);
    const xpGain = getXpMultiplier(20 + zone.difficulty * 10);
    pet.xp += xpGain;
    setMsg(`explored ${zone.name}! found ${item.emoji} ${item.name} +${xpGain}xp`);

    // Chance of battle encounter
    if (Math.random() < 0.4 + zone.difficulty * 0.1) {
      const enemy = zone.enemies[Math.floor(Math.random() * zone.enemies.length)];
      battleData = {
        enemy: enemy,
        enemyHp: 30 + zone.difficulty * 20,
        enemyMaxHp: 30 + zone.difficulty * 20,
        enemyAtk: 3 + zone.difficulty * 4,
        zone: zone,
        turn: 0,
        log: [`a wild ${enemy} appeared!`],
      };
      mode = 'battle';
      process.stdout.write(CLEAR);
      return;
    }
  } else {
    // Failed expedition
    pet.happiness = Math.max(0, pet.happiness - 5);
    if (Math.random() < 0.2 * zone.difficulty && !hasBuff('shielded')) {
      pet.sick = true;
      setMsg(`${pet.name} got sick exploring ${zone.name}!`);
    } else {
      setMsg(`explored ${zone.name} but found nothing...`);
    }
  }

  checkLevel(); savePet(pet);
  mode = 'living';
  process.stdout.write(CLEAR);
}

// ===== BATTLES =====
function battleAction(action) {
  if (!battleData) return;
  const b = battleData;
  b.turn++;

  if (action === 'run') {
    const runChance = pet.genome.stats.speed / 30;
    if (Math.random() < runChance) {
      b.log.push('escaped successfully!');
      setMsg('ran away from battle!');
      mode = 'living'; process.stdout.write(CLEAR); battleData = null;
      savePet(pet); return;
    } else {
      b.log.push('failed to escape!');
    }
  } else if (action === 'attack') {
    const dmg = Math.floor(5 + pet.genome.stats.strength / 3 + Math.random() * 5);
    b.enemyHp = Math.max(0, b.enemyHp - dmg);
    b.log.push(`you dealt ${dmg} damage!`);

    if (b.enemyHp <= 0) {
      const xp = getXpMultiplier(30 + b.zone.difficulty * 15);
      pet.xp += xp;
      pet.genome.stats.strength = Math.min(99, pet.genome.stats.strength + 1);
      b.log.push(`${b.enemy} defeated! +${xp}xp +1 STR`);
      setMsg(`won battle vs ${b.enemy}! +${xp}xp`);
      checkLevel(); savePet(pet);
      setTimeout(() => { mode = 'living'; process.stdout.write(CLEAR); battleData = null; }, 1500);
      return;
    }
  } else if (action === 'defend') {
    b.log.push('bracing for impact...');
  }

  // Enemy attacks
  let enemyDmg = Math.floor(b.enemyAtk + Math.random() * 4);
  if (action === 'defend') enemyDmg = Math.floor(enemyDmg * 0.4);
  pet.hp = Math.max(0, pet.hp - enemyDmg);
  b.log.push(`${b.enemy} dealt ${enemyDmg} damage!`);

  if (pet.hp <= 0) {
    pet.hp = 1; // don't die, just barely survive
    pet.happiness = Math.max(0, pet.happiness - 15);
    pet.sick = true;
    b.log.push('knocked out! retreating...');
    setMsg(`${pet.name} was knocked out and got sick!`);
    savePet(pet);
    setTimeout(() => { mode = 'living'; process.stdout.write(CLEAR); battleData = null; }, 1500);
    return;
  }

  if (b.log.length > 6) b.log = b.log.slice(-6);
}

// ===== LEVELING & EVOLUTION =====
function checkLevel() {
  const needed = pet.level * 50;
  while (pet.xp >= needed) {
    pet.xp -= pet.level * 50;
    pet.level++;
    pet.maxHp += 8;
    pet.hp = pet.maxHp;

    if (pet.level === 5 && pet.stage === 'baby') { pet.stage = 'young'; setMsg(`${pet.name} grew into a young ${ANIMALS[pet.animal].name}!`); }
    else if (pet.level === 12 && pet.stage === 'young') { pet.stage = 'adult'; setMsg(`${pet.name} is fully grown!`); }
    else if (pet.level === 20 && pet.stage === 'adult' && !pet.evolved) { checkEvolution(); }
    else { setMsg(`LEVEL UP! ${pet.name} is now level ${pet.level}!`); }

    const muts = checkMutations(pet.genome, pet.level);
    for (const m of muts) setMsg(`mutation: ${m.visual}!`);
  }
  savePet(pet);
}

function checkEvolution() {
  const animal = ANIMALS[pet.animal];
  if (!animal.evolutions) return;

  for (const [evoId, evo] of Object.entries(animal.evolutions)) {
    if (pet.genome.stats[evo.req] >= evo.threshold) {
      pet.evolved = true;
      pet.evolution = evoId;
      pet.evolutionName = evo.name;
      mode = 'evolving';
      process.stdout.write(CLEAR);
      setMsg(`${pet.name} evolved into ${evo.name}!`);
      savePet(pet);
      return;
    }
  }
}

function getPetArt() {
  const animal = ANIMALS[pet.animal];
  if (pet.evolved && pet.evolution && animal.evolutions && animal.evolutions[pet.evolution]) {
    return animal.evolutions[pet.evolution].art;
  }
  return animal[pet.stage] || animal.baby;
}

// ===== PASSIVE =====
function passiveUpdate() {
  if (!pet || mode !== 'living') return;
  pet.hunger = Math.max(0, pet.hunger - 0.25);
  pet.energy = Math.max(0, pet.energy - 0.08);
  pet.happiness = Math.max(0, pet.happiness - 0.12);
  pet.age = (pet.age || 0) + 1;
  if (pet.hunger < 20) pet.happiness = Math.max(0, pet.happiness - 0.2);
  if (pet.energy < 15) pet.happiness = Math.max(0, pet.happiness - 0.15);
  if (pet.sick) { pet.happiness = Math.max(0, pet.happiness - 0.3); pet.energy = Math.max(0, pet.energy - 0.15); }
  // Regen HP slowly
  if (!pet.sick && pet.hp < pet.maxHp) pet.hp = Math.min(pet.maxHp, pet.hp + 0.1);
  // Decay buffs
  if (pet.buffs) pet.buffs = pet.buffs.filter(b => { b.timer--; return b.timer > 0; });
  // Random sickness (rare)
  if (Math.random() < 0.0005 && !pet.sick && !hasBuff('shielded')) { pet.sick = true; setMsg(`${pet.name} caught something...`); }
}

// ===== RENDER =====
function render() {
  frame++;
  if (messageTimer > 0) messageTimer--;
  let buf = CLEAR + HOME;

  if (mode === 'boot') buf += renderBoot();
  else if (mode === 'hatching') buf += renderHatching();
  else if (mode === 'naming') buf += renderNaming();
  else if (mode === 'living') buf += renderLiving();
  else if (mode === 'expedition') buf += renderExpedition();
  else if (mode === 'battle') buf += renderBattle();
  else if (mode === 'inventory') buf += renderInventory();
  else if (mode === 'evolving') buf += renderEvolving();

  for (let i = 0; i < 3; i++) buf += CL + '\n';
  process.stdout.write(buf);
}

function renderBoot() {
  const saved = loadSave();
  if (saved) { pet = saved; if (!pet.buffs) pet.buffs = []; if (!pet.inventory) pet.inventory = []; mode = 'living'; return CLEAR + HOME; }
  let buf = '\n\n\n\n';
  buf += center(`${GREEN}${BOLD}S P L I N T${RESET}`, W) + '\n';
  buf += center(`${GRAY}raise a creature. watch it evolve.${RESET}`, W) + '\n\n\n';
  const egg = ['      ___      ','     /   \\     ','    /     \\    ','   |  ???  |   ','    \\     /    ','     \\___/     '];
  for (const l of egg) buf += center(`${ORANGE}${l}${RESET}`, W) + '\n';
  buf += '\n' + center(`${GRAY}an egg appeared...${RESET}`, W) + '\n\n';
  buf += center(`${WHITE}${BOLD}[ press SPACE to hatch ]${RESET}`, W) + '\n';
  return buf;
}

function renderHatching() {
  hatchFrame++;
  let buf = '\n\n\n\n' + center(`${GREEN}${BOLD}S P L I N T${RESET}`, W) + '\n\n\n';
  if (hatchFrame < 20) {
    const w = hatchFrame % 4 < 2 ? 1 : 0;
    for (const l of ['      ___      ','     /   \\     ','    / . . \\    ','   |       |   ','    \\     /    ','     \\___/     '])
      buf += center(' '.repeat(w) + `${ORANGE}${l}${RESET}`, W) + '\n';
    buf += '\n' + center(`${YELLOW}*crack* *crack*${RESET}`, W) + '\n';
  } else if (hatchFrame < 35) {
    for (const l of ['      _*_      ','     / * \\     ','    / *   \\    ','   | * * * |   ','    \\ *   /    ','     \\*_*/     '])
      buf += center(`${YELLOW}${l}${RESET}`, W) + '\n';
    buf += '\n' + center(`${WHITE}${BOLD}!! CRACK !!${RESET}`, W) + '\n';
  } else if (hatchFrame < 50) {
    buf += center(`${YELLOW}    *  . *  . *  .  *    ${RESET}`, W) + '\n';
    buf += center(`${ORANGE}  .  *    ✦    *  .      ${RESET}`, W) + '\n';
    buf += center(`${WHITE}${BOLD}        !!!        ${RESET}`, W) + '\n';
    buf += center(`${ORANGE}  .  *    ✦    *  .      ${RESET}`, W) + '\n';
    buf += center(`${YELLOW}    *  . *  . *  .  *    ${RESET}`, W) + '\n';
  } else {
    if (!selectedAnimal) {
      selectedAnimal = ANIMAL_KEYS[Math.floor(Math.random() * ANIMAL_KEYS.length)];
      pet = { animal: selectedAnimal, name: '', genome: generateGenome(), level: 1, xp: 0, hp: 100, maxHp: 100, hunger: 80, energy: 100, happiness: 80, stage: 'baby', age: 0, bornAt: Date.now(), inventory: [], buffs: [], sick: false, evolved: false, id: require('crypto').randomUUID() };
    }
    const art = ANIMALS[selectedAnimal].baby;
    const color = hexFg(getSpeciesInfo(pet.genome.species).base);
    for (const l of art) buf += center(`${color}${BOLD}${l}${RESET}`, W) + '\n';
    buf += '\n' + center(`${GREEN}a ${ANIMALS[selectedAnimal].name} hatched!${RESET}`, W) + '\n';
    if (hatchFrame > 65) { mode = 'naming'; inputBuffer = ''; process.stdout.write(CLEAR); }
  }
  return buf;
}

function renderNaming() {
  const animal = ANIMALS[pet.animal];
  const color = hexFg(getSpeciesInfo(pet.genome.species).base);
  let buf = '\n\n\n';
  buf += center(`${GREEN}${BOLD}S P L I N T${RESET}`, W) + '\n\n';
  for (const l of animal.baby) buf += center(`${color}${BOLD}${l}${RESET}`, W) + '\n';
  buf += '\n' + center(`${CYAN}what will you name your ${animal.name}?${RESET}`, W) + '\n\n';
  buf += center(`${WHITE}${BOLD}> ${inputBuffer}█${RESET}`, W) + '\n\n';
  buf += center(`${GRAY}type a name and press enter${RESET}`, W) + '\n';
  return buf;
}

function renderLiving() {
  passiveUpdate();
  if (frame % 300 === 0) savePet(pet);
  const animal = ANIMALS[pet.animal];
  const color = hexFg(getSpeciesInfo(pet.genome.species).base);
  const art = getPetArt();
  const phase = getDayPhase();

  let buf = CL + '\n';
  // Header
  const sickTag = pet.sick ? ` ${RED}[SICK]${RESET}` : '';
  const evoTag = pet.evolved ? ` ${PURPLE}${pet.evolutionName}${RESET}` : '';
  const buffStr = (pet.buffs || []).filter(b => b.timer > 0).map(b => b.name === 'caffeinated' ? '☕' : '🛡️').join('');
  buf += `  ${GREEN}${BOLD}SPLINT${RESET}  ${GRAY}|${RESET}  ${color}${BOLD}${pet.name}${RESET} ${GRAY}the ${animal.name}${RESET}${evoTag}  ${GRAY}|${RESET}  ${PURPLE}Lv.${pet.level}${RESET}  ${getDayEmoji()} ${GRAY}${phase}${RESET}${sickTag} ${buffStr}\n`;
  buf += `  ${DARK}${'─'.repeat(Math.min(W - 4, 80))}${RESET}\n\n`;

  // Pet art with bob
  const bob = Math.sin(frame / 10) > 0.3;
  const sickMod = pet.sick ? DIM : '';
  for (let i = 0; i < art.length; i++) {
    const line = (i === 0 && bob) ? ' ' + art[i] : art[i];
    buf += center(`${sickMod}${color}${BOLD}${line}${RESET}`, W) + '\n';
  }

  buf += '\n';
  // Activity
  let activity;
  if (pet.sick) activity = animal.sick[Math.floor(frame / 60) % animal.sick.length];
  else if (pet.happiness > 70) activity = animal.happy[Math.floor(frame / 60) % animal.happy.length];
  else if (pet.hunger < 30) activity = animal.hungry[Math.floor(frame / 60) % animal.hungry.length];
  else activity = animal.idle[Math.floor(frame / 60) % animal.idle.length];
  buf += center(`${GRAY}${activity}${RESET}`, W) + '\n\n';

  // Stat bars
  buf += `  ${GRAY}HUNGER${RESET} ${bar(pet.hunger, 100, GREEN, 25)} ${GRAY}${Math.floor(pet.hunger)}%${RESET}\n`;
  buf += `  ${GRAY}ENERGY${RESET} ${bar(pet.energy, 100, CYAN, 25)} ${GRAY}${Math.floor(pet.energy)}%${RESET}\n`;
  buf += `  ${GRAY}HAPPY ${RESET} ${bar(pet.happiness, 100, PINK, 25)} ${GRAY}${Math.floor(pet.happiness)}%${RESET}\n`;
  buf += `  ${GRAY}HP    ${RESET} ${bar(pet.hp, pet.maxHp, RED, 25)} ${GRAY}${Math.floor(pet.hp)}/${pet.maxHp}${RESET}\n`;
  buf += `  ${GRAY}XP    ${RESET} ${bar(pet.xp, pet.level * 50, PURPLE, 25)} ${GRAY}${pet.xp}/${pet.level * 50}${RESET}\n\n`;

  // Stats
  const s = pet.genome.stats;
  buf += `  ${GRAY}INT${RESET}${CYAN}${String(s.intelligence).padStart(3)}${RESET}  ${GRAY}CRE${RESET}${PINK}${String(s.creativity).padStart(3)}${RESET}  ${GRAY}STR${RESET}${RED}${String(s.strength).padStart(3)}${RESET}  ${GRAY}SPD${RESET}${GREEN}${String(s.speed).padStart(3)}${RESET}  ${GRAY}LCK${RESET}${YELLOW}${String(s.luck).padStart(3)}${RESET}`;
  if (pet.genome.mutations.length > 0) buf += `  ${ORANGE}[${pet.genome.mutations.join(',')}]${RESET}`;
  buf += '\n';

  // Inventory count
  const invCount = (pet.inventory || []).length;
  buf += `  ${GRAY}bag: ${invCount}/20 items${RESET}\n`;

  buf += `\n  ${DARK}${'─'.repeat(Math.min(W - 4, 80))}${RESET}\n`;
  buf += `  ${WHITE}[f]${RESET}${GRAY}eed ${RESET}${WHITE}[p]${RESET}${GRAY}lay ${RESET}${WHITE}[t]${RESET}${GRAY}rain ${RESET}${WHITE}[r]${RESET}${GRAY}est ${RESET}${WHITE}[e]${RESET}${GRAY}xpedition ${RESET}${WHITE}[v]${RESET}${GRAY}inventory ${RESET}${WHITE}[q]${RESET}${GRAY}uit${RESET}\n\n`;

  if (messageTimer > 0 && message) buf += `  ${YELLOW}> ${message}${RESET}\n`;
  else buf += `  ${GRAY}${pet.name} is watching you...${RESET}\n`;

  return buf;
}

function renderExpedition() {
  let buf = '\n';
  buf += `  ${GREEN}${BOLD}EXPEDITIONS${RESET}  ${GRAY}— send ${pet.name} exploring${RESET}\n`;
  buf += `  ${DARK}${'─'.repeat(Math.min(W - 4, 60))}${RESET}\n\n`;
  buf += `  ${GRAY}energy: ${Math.floor(pet.energy)}% (costs 20 per expedition)${RESET}\n\n`;

  const zoneKeys = Object.keys(ZONES);
  for (let i = 0; i < zoneKeys.length; i++) {
    const z = ZONES[zoneKeys[i]];
    const sel = i === menuIndex;
    const arrow = sel ? `${GREEN}▸ ` : '  ';
    const nameCol = sel ? WHITE + BOLD : GRAY;
    const stars = '★'.repeat(z.difficulty) + '☆'.repeat(4 - z.difficulty);
    buf += `${arrow}${nameCol}${z.emoji} ${z.name.padEnd(15)}${RESET} ${ORANGE}${stars}${RESET}  ${GRAY}${z.desc}${RESET}\n`;
  }

  buf += `\n  ${GRAY}[↑↓] select  [enter] go  [b] back${RESET}\n`;
  if (messageTimer > 0 && message) buf += `\n  ${YELLOW}> ${message}${RESET}\n`;
  return buf;
}

function renderBattle() {
  if (!battleData) return '';
  const b = battleData;
  let buf = '\n';
  buf += `  ${RED}${BOLD}⚔ BATTLE${RESET}  ${GRAY}vs ${WHITE}${b.enemy}${RESET}\n`;
  buf += `  ${DARK}${'─'.repeat(Math.min(W - 4, 50))}${RESET}\n\n`;

  // Enemy
  buf += `  ${RED}${b.enemy}${RESET}  ${bar(b.enemyHp, b.enemyMaxHp, RED, 20)} ${GRAY}${b.enemyHp}/${b.enemyMaxHp}${RESET}\n\n`;

  // Your pet
  const color = hexFg(getSpeciesInfo(pet.genome.species).base);
  buf += `  ${color}${pet.name}${RESET}  ${bar(pet.hp, pet.maxHp, GREEN, 20)} ${GRAY}${Math.floor(pet.hp)}/${pet.maxHp}${RESET}\n\n`;

  // Battle log
  for (const line of b.log.slice(-4)) {
    buf += `  ${GRAY}> ${line}${RESET}\n`;
  }

  buf += `\n  ${WHITE}[a]${RESET}${GRAY}ttack  ${RESET}${WHITE}[d]${RESET}${GRAY}efend  ${RESET}${WHITE}[r]${RESET}${GRAY}un${RESET}\n`;
  return buf;
}

function renderInventory() {
  let buf = '\n';
  buf += `  ${PURPLE}${BOLD}INVENTORY${RESET}  ${GRAY}(${(pet.inventory||[]).length}/20)${RESET}\n`;
  buf += `  ${DARK}${'─'.repeat(Math.min(W - 4, 50))}${RESET}\n\n`;

  if (!pet.inventory || pet.inventory.length === 0) {
    buf += `  ${GRAY}bag is empty. go on expeditions to find items!${RESET}\n`;
  } else {
    // Group items
    const counts = {};
    for (const id of pet.inventory) { counts[id] = (counts[id] || 0) + 1; }
    const unique = [...new Set(pet.inventory)];

    for (let i = 0; i < unique.length; i++) {
      const id = unique[i];
      const item = ITEMS[id];
      if (!item) continue;
      const sel = i === menuIndex;
      const arrow = sel ? `${GREEN}▸ ` : '  ';
      const nameCol = sel ? WHITE + BOLD : GRAY;
      const countStr = counts[id] > 1 ? ` x${counts[id]}` : '';
      buf += `${arrow}${nameCol}${item.emoji} ${item.name}${countStr}${RESET}  ${DARK}${item.desc}${RESET}\n`;
    }
  }

  buf += `\n  ${GRAY}[↑↓] select  [enter] use  [b] back${RESET}\n`;
  if (messageTimer > 0 && message) buf += `\n  ${YELLOW}> ${message}${RESET}\n`;
  return buf;
}

function renderEvolving() {
  const animal = ANIMALS[pet.animal];
  const evo = animal.evolutions[pet.evolution];
  const color = hexFg(getSpeciesInfo(pet.genome.species).base);
  let buf = '\n\n\n';
  buf += center(`${PURPLE}${BOLD}✦ E V O L U T I O N ✦${RESET}`, W) + '\n\n';
  buf += center(`${WHITE}${pet.name} is evolving...${RESET}`, W) + '\n\n';
  for (const l of evo.art) buf += center(`${color}${BOLD}${l}${RESET}`, W) + '\n';
  buf += '\n' + center(`${GREEN}${BOLD}${pet.name} evolved into ${evo.name}!${RESET}`, W) + '\n\n';
  buf += center(`${GRAY}[ press SPACE to continue ]${RESET}`, W) + '\n';
  return buf;
}

// ===== MAIN =====
const saved = loadSave();
if (saved) { pet = saved; if (!pet.buffs) pet.buffs = []; if (!pet.inventory) pet.inventory = []; mode = 'living'; setMsg(`welcome back! ${pet.name} missed you.`); syncToServer(pet); }
setInterval(render, 100);
