// dna.js — Creature genetics and trait system

const SPECIES = [
  { id: 'glimmer', name: 'Glimmer', base: '#50fa7b', shape: 'round',   affinity: 'gather',  statBias: { luck: 3, speed: 2 } },
  { id: 'ember',   name: 'Ember',   base: '#ff5555', shape: 'spiky',   affinity: 'fight',   statBias: { strength: 3, speed: 2 } },
  { id: 'whisp',   name: 'Whisp',   base: '#8be9fd', shape: 'floaty',  affinity: 'research',statBias: { intelligence: 3, creativity: 2 } },
  { id: 'thunk',   name: 'Thunk',   base: '#ffb86c', shape: 'blocky',  affinity: 'code',    statBias: { strength: 2, intelligence: 3 } },
  { id: 'shade',   name: 'Shade',   base: '#bd93f9', shape: 'wispy',   affinity: 'explore', statBias: { speed: 3, luck: 2 } },
  { id: 'bloom',   name: 'Bloom',   base: '#ff79c6', shape: 'round',   affinity: 'create',  statBias: { creativity: 3, luck: 2 } },
  { id: 'crux',    name: 'Crux',    base: '#f1fa8c', shape: 'angular', affinity: 'mystery', statBias: { intelligence: 2, creativity: 3 } },
];

const MUTATIONS = {
  horns:        { minLevel: 3,  chance: 0.5,  effect: { strength: 3 },         visual: 'horns' },
  wings:        { minLevel: 5,  chance: 0.4,  effect: { speed: 5 },            visual: 'wings' },
  armor:        { minLevel: 7,  chance: 0.3,  effect: { strength: 5, speed: -2 }, visual: 'armor' },
  thirdEye:     { minLevel: 4,  chance: 0.35, effect: { intelligence: 4 },     visual: 'thirdEye' },
  biolum:       { minLevel: 6,  chance: 0.25, effect: { luck: 4 },             visual: 'bioluminescence' },
  fins:         { minLevel: 8,  chance: 0.2,  effect: { speed: 3, creativity: 2 }, visual: 'fins' },
  crown:        { minLevel: 10, chance: 0.15, effect: { intelligence: 3, luck: 3 }, visual: 'crown' },
  voidTouch:    { minLevel: 12, chance: 0.1,  effect: { creativity: 5, strength: 3 }, visual: 'voidTouch' },
};

const NAMES_PRE = ['Zyx','Nub','Kip','Boo','Rix','Vim','Dot','Pip','Hex','Lux','Fog','Dex','Pix','Jot','Zap','Orb','Nyx','Sol','Ash','Ivy','Rex','Fen','Rho','Tau','Qix'];
const NAMES_SUF = ['ling','bit','mite','spark','wisp','blob','core','dust','fang','eye','fin','horn','tail','wing','shade','drift','pulse','glow','thorn','veil'];

function randomName() {
  return NAMES_PRE[Math.floor(Math.random() * NAMES_PRE.length)] +
         NAMES_SUF[Math.floor(Math.random() * NAMES_SUF.length)];
}

function randomStat(base, bias) {
  return Math.max(1, Math.min(30, base + Math.floor(Math.random() * 11) - 5 + (bias || 0)));
}

function generateGenome(speciesId) {
  const species = SPECIES.find(s => s.id === speciesId) || SPECIES[Math.floor(Math.random() * SPECIES.length)];
  const bias = species.statBias || {};

  return {
    species: species.id,
    stats: {
      intelligence: randomStat(10, bias.intelligence),
      creativity:   randomStat(10, bias.creativity),
      strength:     randomStat(10, bias.strength),
      speed:        randomStat(10, bias.speed),
      luck:         randomStat(10, bias.luck),
    },
    traits: {
      aggression:  Math.random(),       // 0 = peaceful, 1 = aggressive
      curiosity:   Math.random(),       // 0 = cautious, 1 = explorer
      social:      Math.random(),       // 0 = loner, 1 = social
      resilience:  Math.random(),       // 0 = fragile, 1 = tough
    },
    mutations: [],
    generation: 0,
    parents: [],
  };
}

function breedGenomes(parentA, parentB) {
  const child = {
    species: Math.random() > 0.5 ? parentA.species : parentB.species,
    stats: {},
    traits: {},
    mutations: [],
    generation: Math.max(parentA.generation, parentB.generation) + 1,
    parents: [parentA.species + ':' + parentA.generation, parentB.species + ':' + parentB.generation],
  };

  // Crossover stats — pick from either parent with slight mutation
  for (const stat of Object.keys(parentA.stats)) {
    const fromA = Math.random() > 0.5;
    const base = fromA ? parentA.stats[stat] : parentB.stats[stat];
    const mutation = Math.floor(Math.random() * 5) - 2; // -2 to +2
    child.stats[stat] = Math.max(1, Math.min(50, base + mutation));
  }

  // Crossover traits — blend with noise
  for (const trait of Object.keys(parentA.traits)) {
    const blend = (parentA.traits[trait] + parentB.traits[trait]) / 2;
    const noise = (Math.random() - 0.5) * 0.2;
    child.traits[trait] = Math.max(0, Math.min(1, blend + noise));
  }

  // Inherit some mutations from parents
  const allMutations = [...new Set([...parentA.mutations, ...parentB.mutations])];
  for (const m of allMutations) {
    if (Math.random() > 0.3) child.mutations.push(m); // 70% inheritance rate
  }

  return child;
}

function checkMutations(genome, level) {
  const newMutations = [];
  for (const [id, mut] of Object.entries(MUTATIONS)) {
    if (genome.mutations.includes(id)) continue;
    if (level < mut.minLevel) continue;
    if (Math.random() > mut.chance) continue;

    genome.mutations.push(id);
    for (const [stat, val] of Object.entries(mut.effect)) {
      genome.stats[stat] = Math.max(1, (genome.stats[stat] || 10) + val);
    }
    newMutations.push({ id, visual: mut.visual });
  }
  return newMutations;
}

function getSpeciesInfo(speciesId) {
  return SPECIES.find(s => s.id === speciesId) || SPECIES[0];
}

module.exports = { SPECIES, MUTATIONS, generateGenome, breedGenomes, checkMutations, randomName, getSpeciesInfo };
