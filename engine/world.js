// world.js — World generation, biomes, and task management

const WORLD_SIZE = 128;

const BIOMES = [
  { id: 'meadow',  name: 'Meadow',  color: '#2d5a27', accent: '#50fa7b', taskType: 'gather',   x: 0,  y: 0,  w: 40, h: 40 },
  { id: 'forge',   name: 'Forge',   color: '#4a2020', accent: '#ff5555', taskType: 'code',     x: 40, y: 0,  w: 44, h: 40 },
  { id: 'library', name: 'Library', color: '#1a2a4a', accent: '#8be9fd', taskType: 'research', x: 84, y: 0,  w: 44, h: 40 },
  { id: 'garden',  name: 'Garden',  color: '#2a4a2a', accent: '#f1fa8c', taskType: 'create',   x: 0,  y: 40, w: 40, h: 44 },
  { id: 'arena',   name: 'Arena',   color: '#4a3020', accent: '#ffb86c', taskType: 'fight',    x: 40, y: 40, w: 44, h: 44 },
  { id: 'depths',  name: 'Depths',  color: '#1a1a30', accent: '#bd93f9', taskType: 'explore',  x: 84, y: 40, w: 44, h: 44 },
  { id: 'nest',    name: 'Nest',    color: '#2a2020', accent: '#ff79c6', taskType: 'rest',     x: 0,  y: 84, w: 40, h: 44 },
  { id: 'bazaar',  name: 'Bazaar',  color: '#3a3a1a', accent: '#f8f8f2', taskType: 'trade',    x: 40, y: 84, w: 44, h: 44 },
  { id: 'void',    name: 'Void',    color: '#0f0f1a', accent: '#6272a4', taskType: 'mystery',  x: 84, y: 84, w: 44, h: 44 },
];

function getBiome(tx, ty) {
  for (const b of BIOMES) {
    if (tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h) return b;
  }
  return BIOMES[8];
}

function generateWorld() {
  const tiles = [];
  for (let y = 0; y < WORLD_SIZE; y++) {
    for (let x = 0; x < WORLD_SIZE; x++) {
      const biome = getBiome(x, y);
      const r = Math.random();
      tiles.push({
        biome: biome.id,
        type: r > 0.95 ? 'feature' : r > 0.88 ? 'deco' : 'ground',
      });
    }
  }
  return tiles;
}

let taskIdCounter = 0;

function createTask(biomeId) {
  const biome = BIOMES.find(b => b.id === biomeId) || BIOMES[Math.floor(Math.random() * BIOMES.length)];
  const tx = biome.x + 2 + Math.floor(Math.random() * (biome.w - 4));
  const ty = biome.y + 2 + Math.floor(Math.random() * (biome.h - 4));
  const difficulty = 1 + Math.floor(Math.random() * 5);

  return {
    id: 'task_' + (++taskIdCounter) + '_' + Date.now(),
    x: tx * 16 + 8,
    y: ty * 16 + 8,
    tileX: tx,
    tileY: ty,
    biome: biome.id,
    type: biome.taskType,
    difficulty,
    xpReward: difficulty * 10 + Math.floor(Math.random() * 20),
    spawnedAt: Date.now(),
    claimed: false,
    claimedBy: null,
  };
}

function spawnTasks(currentTasks, creatureCount) {
  const target = Math.max(15, creatureCount * 3);
  const unclaimed = currentTasks.filter(t => !t.claimed);
  const newTasks = [];

  while (unclaimed.length + newTasks.length < target) {
    const biome = BIOMES[Math.floor(Math.random() * BIOMES.length)];
    newTasks.push(createTask(biome.id));
  }

  return newTasks;
}

function getBiomePopulation(creatures) {
  const pop = {};
  for (const b of BIOMES) pop[b.id] = 0;
  for (const c of creatures) {
    const tx = Math.floor(c.x / 16);
    const ty = Math.floor(c.y / 16);
    const biome = getBiome(tx, ty);
    pop[biome.id]++;
  }
  return pop;
}

module.exports = { BIOMES, WORLD_SIZE, getBiome, generateWorld, createTask, spawnTasks, getBiomePopulation };
