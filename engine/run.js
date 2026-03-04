// run.js — Main engine loop. Ticks the world forward.

const fs = require('fs');
const path = require('path');
const { generateWorld, spawnTasks, getBiome, getBiomePopulation, BIOMES } = require('./world');
const { createCreature, addHistory, isAlive, heal } = require('./creatures');
const { STATES, decideAction, attemptTask, moveToward } = require('./behavior');
const { processXP, processStatGrowth, processFailure, calculatePower, getCreatureSummary } = require('./evolution');
const { getSpeciesInfo } = require('./dna');

const STATE_FILE = path.join(__dirname, '..', 'world-state.json');
const TICK_RATE = 1000; // ms between ticks
const SAVE_INTERVAL = 30000; // save every 30s

// ===== WORLD STATE =====
let world = {
  creatures: [],
  tasks: [],
  tiles: null,
  events: [],
  cycle: 0,
  startedAt: Date.now(),
  lastTick: Date.now(),
  stats: {
    totalHatched: 0,
    totalTasks: 0,
    totalLevelUps: 0,
    totalMutations: 0,
    totalBreeds: 0,
  },
};

function init() {
  console.log('=== HATCHERY ENGINE v0.1 ===');
  console.log('generating world...');
  world.tiles = generateWorld();

  // Spawn initial creatures
  for (let i = 0; i < 8; i++) {
    const biome = BIOMES[Math.floor(Math.random() * BIOMES.length)];
    const x = (biome.x + 3 + Math.random() * (biome.w - 6)) * 16;
    const y = (biome.y + 3 + Math.random() * (biome.h - 6)) * 16;
    const creature = createCreature(x, y);
    world.creatures.push(creature);
    world.stats.totalHatched++;
    logEvent(`${creature.name} the ${getSpeciesInfo(creature.genome.species).name} hatched in ${biome.name}`, 'hatch');
  }

  // Spawn initial tasks
  const newTasks = spawnTasks([], world.creatures.length);
  world.tasks.push(...newTasks);

  console.log(`world ready: ${world.creatures.length} creatures, ${world.tasks.length} tasks, ${BIOMES.length} biomes`);
}

function logEvent(text, type) {
  world.events.unshift({ text, type, time: Date.now() });
  if (world.events.length > 100) world.events.pop();
  console.log(`  [${type}] ${text}`);
}

function tick() {
  const now = Date.now();
  const dt = (now - world.lastTick) / 1000;
  world.lastTick = now;

  // Update each creature
  for (const creature of world.creatures) {
    if (!isAlive(creature)) continue;

    creature.age += dt;
    creature.stateTimer -= dt;
    creature.currentBiome = getBiome(Math.floor(creature.x / 16), Math.floor(creature.y / 16)).id;

    // Passive healing
    if (creature.hp < creature.maxHp && creature.state === 'resting') {
      heal(creature, dt * 5);
    }

    // State machine
    if (creature.stateTimer <= 0) {
      switch (creature.state) {
        case 'idle':
        case 'wander':
        case 'socializing':
        case 'resting': {
          const action = decideAction(creature, world.tasks, world.creatures);
          creature.state = action.state;
          creature.stateTimer = action.duration || 10;
          creature.stateData = action;

          if (action.target) {
            creature.targetX = action.target.x;
            creature.targetY = action.target.y;
          }

          if (action.taskId) {
            const task = world.tasks.find(t => t.id === action.taskId);
            if (task && !task.claimed) {
              task.claimed = true;
              task.claimedBy = creature.id;
              creature.activity = `heading to ${task.type} task`;
            } else {
              creature.state = 'idle';
              creature.stateTimer = 1;
            }
          } else if (action.state === STATES.WANDER) {
            creature.activity = `wandering toward ${action.destination || 'somewhere'}`;
          } else if (action.state === STATES.RESTING) {
            creature.activity = 'resting to recover HP';
          } else if (action.state === STATES.SOCIALIZING) {
            creature.activity = 'hanging out with a friend';
          }
          break;
        }

        case 'seeking_task': {
          const taskId = creature.stateData?.taskId;
          const task = world.tasks.find(t => t.id === taskId);

          if (!task) {
            creature.state = 'idle';
            creature.stateTimer = 1;
            break;
          }

          const arrived = moveToward(creature, { x: task.x, y: task.y }, dt + creature.stateTimer);
          if (arrived || creature.stateTimer <= -2) {
            // Attempt the task
            creature.state = 'working';
            creature.stateTimer = 2 + task.difficulty * 0.5;
            creature.activity = `working on ${task.type}...`;
          } else {
            creature.stateTimer = 0.5; // keep seeking
          }
          break;
        }

        case 'working': {
          const taskId = creature.stateData?.taskId;
          const task = world.tasks.find(t => t.id === taskId);

          if (task) {
            const result = attemptTask(creature, task);
            creature.taskCount = (creature.taskCount || 0) + 1;
            world.stats.totalTasks++;

            if (result.success) {
              const evoResult = processXP(creature, result.xp);
              processStatGrowth(creature, result.statGrowth);

              creature.activity = `completed ${task.type}! +${result.xp}xp`;
              logEvent(`${creature.name} ${result.message} (+${result.xp}xp)`, 'success');
              addHistory(creature, 'task_success', result.message);

              if (evoResult.leveledUp) {
                logEvent(`${creature.name} reached level ${evoResult.newLevel}!`, 'levelup');
                world.stats.totalLevelUps++;
              }

              for (const mut of evoResult.mutations) {
                logEvent(`${creature.name} mutated: ${mut.visual}!`, 'mutation');
                world.stats.totalMutations++;
              }
            } else {
              processFailure(creature);
              processXP(creature, result.xp); // small consolation xp
              creature.activity = `failed at ${task.type}...`;
              logEvent(`${creature.name} ${result.message}`, 'fail');
              addHistory(creature, 'task_fail', result.message);
            }

            // Remove completed task
            world.tasks = world.tasks.filter(t => t.id !== taskId);
          }

          creature.state = 'idle';
          creature.stateTimer = 2 + Math.random() * 3;
          break;
        }

        default:
          creature.state = 'idle';
          creature.stateTimer = 1;
      }
    }

    // Movement (continuous)
    if (creature.targetX !== undefined && creature.state !== 'working') {
      moveToward(creature, { x: creature.targetX, y: creature.targetY }, dt);
    }
  }

  // Spawn new tasks
  const newTasks = spawnTasks(world.tasks, world.creatures.length);
  if (newTasks.length > 0) {
    world.tasks.push(...newTasks);
  }

  // Clean up stale claimed tasks (unclaim after 60s)
  for (const task of world.tasks) {
    if (task.claimed && task.claimedBy) {
      const claimer = world.creatures.find(c => c.id === task.claimedBy);
      if (!claimer || claimer.state === 'idle') {
        task.claimed = false;
        task.claimedBy = null;
      }
    }
  }

  world.cycle++;
}

function saveState() {
  const output = {
    meta: {
      version: '0.1.0',
      cycle: world.cycle,
      startedAt: world.startedAt,
      savedAt: Date.now(),
      stats: world.stats,
    },
    biomes: BIOMES.map(b => ({
      id: b.id,
      name: b.name,
      taskType: b.taskType,
      population: 0,
    })),
    creatures: world.creatures.map(c => getCreatureSummary(c)),
    tasks: world.tasks.map(t => ({
      id: t.id,
      type: t.type,
      biome: t.biome,
      difficulty: t.difficulty,
      claimed: t.claimed,
      x: t.x,
      y: t.y,
    })),
    events: world.events.slice(0, 50),
    population: getBiomePopulation(world.creatures),
  };

  // Update biome populations
  for (const b of output.biomes) {
    b.population = output.population[b.id] || 0;
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify(output, null, 2));
  console.log(`\n[cycle ${world.cycle}] saved: ${world.creatures.length} creatures, ${world.tasks.length} tasks`);

  // Print summary
  const topCreature = world.creatures
    .map(c => ({ name: c.name, level: c.level, power: calculatePower(c) }))
    .sort((a, b) => b.power - a.power)[0];

  if (topCreature) {
    console.log(`  strongest: ${topCreature.name} (L${topCreature.level}, power ${topCreature.power})`);
  }
  console.log(`  stats: ${world.stats.totalTasks} tasks completed, ${world.stats.totalLevelUps} level-ups, ${world.stats.totalMutations} mutations\n`);
}

// ===== START =====
init();

// Main tick loop
setInterval(tick, TICK_RATE);

// Save periodically
setInterval(saveState, SAVE_INTERVAL);

// Save on first tick
setTimeout(saveState, 2000);

console.log(`\nengine running (tick: ${TICK_RATE}ms, save: ${SAVE_INTERVAL/1000}s)`);
console.log('world-state.json will be updated periodically\n');
