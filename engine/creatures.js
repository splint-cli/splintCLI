// creatures.js — Creature creation, management, and lifecycle

const { generateGenome, randomName, getSpeciesInfo, breedGenomes } = require('./dna');
const { getBiome, BIOMES } = require('./world');

let creatureIdCounter = 0;

function createCreature(x, y, speciesId, parentGenome) {
  const genome = parentGenome || generateGenome(speciesId);
  const species = getSpeciesInfo(genome.species);

  const creature = {
    id: 'c_' + (++creatureIdCounter) + '_' + Date.now(),
    name: randomName(),
    genome,
    x, y,
    targetX: x,
    targetY: y,
    hp: 100,
    maxHp: 100,
    xp: 0,
    totalXp: 0,
    level: 1,
    state: 'idle',
    stateTimer: 0,
    stateData: null,
    activity: 'just hatched!',
    currentBiome: getBiome(Math.floor(x / 16), Math.floor(y / 16)).id,
    bodyScale: species.size || 1.0,
    age: 0,
    bornAt: Date.now(),
    taskCount: 0,
    failCount: 0,
    history: [],
  };

  return creature;
}

function breedCreatures(parentA, parentB) {
  const childGenome = breedGenomes(parentA.genome, parentB.genome);

  // Spawn near parents
  const x = (parentA.x + parentB.x) / 2 + (Math.random() - 0.5) * 50;
  const y = (parentA.y + parentB.y) / 2 + (Math.random() - 0.5) * 50;

  const child = createCreature(x, y, null, childGenome);
  child.activity = 'born from breeding!';
  child.history.push({
    type: 'born',
    time: Date.now(),
    parents: [parentA.name, parentB.name],
  });

  return child;
}

function addHistory(creature, type, detail) {
  creature.history.push({ type, time: Date.now(), detail });
  if (creature.history.length > 50) creature.history.shift();
}

function isAlive(creature) {
  return creature.hp > 0;
}

function heal(creature, amount) {
  creature.hp = Math.min(creature.maxHp, creature.hp + amount);
}

function damage(creature, amount) {
  creature.hp = Math.max(0, creature.hp - amount);
}

module.exports = { createCreature, breedCreatures, addHistory, isAlive, heal, damage };
