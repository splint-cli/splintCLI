// evolution.js — Leveling, mutations, and creature progression

const { checkMutations, getSpeciesInfo } = require('./dna');

function xpToLevel(level) {
  return Math.floor(level * 50 * (1 + level * 0.1));
}

function processXP(creature, xpGained) {
  creature.xp += xpGained;
  creature.totalXp = (creature.totalXp || 0) + xpGained;
  const results = { leveledUp: false, newLevel: creature.level, mutations: [] };

  while (creature.xp >= xpToLevel(creature.level)) {
    creature.xp -= xpToLevel(creature.level);
    creature.level++;
    creature.maxHp += 5 + Math.floor(creature.level * 1.5);
    creature.hp = creature.maxHp;
    results.leveledUp = true;
    results.newLevel = creature.level;

    // Check for mutations
    const newMutations = checkMutations(creature.genome, creature.level);
    results.mutations.push(...newMutations);

    // Body growth
    if (creature.level >= 4) {
      creature.bodyScale = Math.min(2.5, 1.0 + (creature.level - 3) * 0.08);
    }
  }

  return results;
}

function processStatGrowth(creature, stat) {
  if (!stat) return;
  const current = creature.genome.stats[stat] || 10;
  // Diminishing returns at higher levels
  const growthChance = Math.max(0.1, 1 - current / 60);
  if (Math.random() < growthChance) {
    creature.genome.stats[stat] = Math.min(99, current + 1);
    return true;
  }
  return false;
}

function processFailure(creature) {
  // Failure reduces luck slightly but builds resilience
  creature.genome.stats.luck = Math.max(1, creature.genome.stats.luck - 1);
  creature.genome.traits.resilience = Math.min(1, creature.genome.traits.resilience + 0.01);
  creature.failCount = (creature.failCount || 0) + 1;
}

function calculatePower(creature) {
  const s = creature.genome.stats;
  return Math.floor(
    s.intelligence * 1.2 +
    s.creativity * 1.1 +
    s.strength * 1.3 +
    s.speed * 1.0 +
    s.luck * 0.8 +
    creature.level * 5 +
    creature.genome.mutations.length * 8
  );
}

function getCreatureSummary(creature) {
  const species = getSpeciesInfo(creature.genome.species);
  return {
    id: creature.id,
    name: creature.name,
    species: species.name,
    level: creature.level,
    power: calculatePower(creature),
    hp: creature.hp,
    maxHp: creature.maxHp,
    xp: creature.xp,
    xpNeeded: xpToLevel(creature.level),
    stats: { ...creature.genome.stats },
    traits: { ...creature.genome.traits },
    mutations: creature.genome.mutations,
    generation: creature.genome.generation,
    age: creature.age,
    taskCount: creature.taskCount || 0,
    failCount: creature.failCount || 0,
    state: creature.state,
    activity: creature.activity,
    biome: creature.currentBiome || 'unknown',
  };
}

module.exports = { xpToLevel, processXP, processStatGrowth, processFailure, calculatePower, getCreatureSummary };
