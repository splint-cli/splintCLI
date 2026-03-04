// breeding.js — Genetic crossover, compatibility, and offspring generation

const { breedGenomes, getSpeciesInfo, SPECIES } = require('./dna');

// Compatibility score between two creatures (0-1)
function compatibility(creatureA, creatureB) {
  let score = 0.5; // base

  // Same species = higher compatibility
  if (creatureA.genome.species === creatureB.genome.species) score += 0.2;

  // Similar levels = higher compatibility
  const levelDiff = Math.abs(creatureA.level - creatureB.level);
  score += Math.max(0, 0.15 - levelDiff * 0.03);

  // Social creatures breed easier
  score += (creatureA.genome.traits.social + creatureB.genome.traits.social) * 0.1;

  // Opposite stat profiles create interesting offspring
  const statsA = creatureA.genome.stats;
  const statsB = creatureB.genome.stats;
  let diversity = 0;
  for (const key of Object.keys(statsA)) {
    diversity += Math.abs(statsA[key] - statsB[key]);
  }
  score += Math.min(0.15, diversity / 200);

  return Math.max(0, Math.min(1, score));
}

// Can these two creatures breed?
function canBreed(creatureA, creatureB) {
  if (creatureA.id === creatureB.id) return false;
  if (creatureA.level < 3 || creatureB.level < 3) return false;
  if (creatureA.hp < creatureA.maxHp * 0.5) return false;
  if (creatureB.hp < creatureB.maxHp * 0.5) return false;

  // Cooldown check (can't breed within 60s of last breed)
  const now = Date.now();
  if (creatureA.lastBreed && now - creatureA.lastBreed < 60000) return false;
  if (creatureB.lastBreed && now - creatureB.lastBreed < 60000) return false;

  return true;
}

// Perform breeding
function breed(creatureA, creatureB) {
  if (!canBreed(creatureA, creatureB)) return null;

  const comp = compatibility(creatureA, creatureB);

  // Low compatibility = chance of failure
  if (Math.random() > comp + 0.2) return null;

  const childGenome = breedGenomes(creatureA.genome, creatureB.genome);

  // High compatibility = bonus stats on child
  if (comp > 0.7) {
    const bonusStat = Object.keys(childGenome.stats)[Math.floor(Math.random() * 5)];
    childGenome.stats[bonusStat] = Math.min(50, childGenome.stats[bonusStat] + 3);
  }

  // Mark parents
  creatureA.lastBreed = Date.now();
  creatureB.lastBreed = Date.now();
  creatureA.breedCount = (creatureA.breedCount || 0) + 1;
  creatureB.breedCount = (creatureB.breedCount || 0) + 1;

  return {
    genome: childGenome,
    x: (creatureA.x + creatureB.x) / 2,
    y: (creatureA.y + creatureB.y) / 2,
    parentNames: [creatureA.name, creatureB.name],
    compatibility: comp,
  };
}

// Predict offspring traits (for UI preview)
function predictOffspring(creatureA, creatureB) {
  const comp = compatibility(creatureA, creatureB);
  const speciesA = getSpeciesInfo(creatureA.genome.species);
  const speciesB = getSpeciesInfo(creatureB.genome.species);

  const avgStats = {};
  for (const key of Object.keys(creatureA.genome.stats)) {
    avgStats[key] = Math.floor((creatureA.genome.stats[key] + creatureB.genome.stats[key]) / 2);
  }

  return {
    compatibility: comp,
    possibleSpecies: [speciesA.name, speciesB.name],
    estimatedStats: avgStats,
    possibleMutations: [...new Set([...creatureA.genome.mutations, ...creatureB.genome.mutations])],
    generation: Math.max(creatureA.genome.generation, creatureB.genome.generation) + 1,
  };
}

module.exports = { compatibility, canBreed, breed, predictOffspring };
