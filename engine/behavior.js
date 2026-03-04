// behavior.js — Creature AI state machine and decision-making

const { getBiome, BIOMES } = require('./world');

const STATES = {
  IDLE: 'idle',
  WANDER: 'wander',
  SEEKING_TASK: 'seeking_task',
  WORKING: 'working',
  RESTING: 'resting',
  SOCIALIZING: 'socializing',
  FLEEING: 'fleeing',
  RETURNING_HOME: 'returning_home',
};

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function findNearestTask(creature, tasks) {
  let nearest = null;
  let minDist = Infinity;
  for (const t of tasks) {
    if (t.claimed) continue;
    const d = distance(creature, t);

    // Creatures prefer tasks matching their species affinity
    const affinityBonus = t.type === creature.genome.affinityTask ? 0.6 : 1.0;
    const effectiveDist = d * affinityBonus;

    if (effectiveDist < minDist) {
      minDist = effectiveDist;
      nearest = t;
    }
  }
  return nearest;
}

function findNearbyCreature(creature, creatures, radius) {
  for (const other of creatures) {
    if (other.id === creature.id) continue;
    if (distance(creature, other) < radius) return other;
  }
  return null;
}

function decideAction(creature, tasks, creatures) {
  const traits = creature.genome.traits;

  // Low HP? Rest
  if (creature.hp < creature.maxHp * 0.3) {
    return { state: STATES.RESTING, duration: 5 + Math.random() * 5 };
  }

  // Social creatures seek company
  if (traits.social > 0.7 && Math.random() < 0.2) {
    const friend = findNearbyCreature(creature, creatures, 200);
    if (friend) {
      return {
        state: STATES.SOCIALIZING,
        target: { x: friend.x, y: friend.y },
        duration: 3 + Math.random() * 4,
        friendId: friend.id,
      };
    }
  }

  // Curious creatures explore random biomes
  if (traits.curiosity > 0.6 && Math.random() < 0.3) {
    const randomBiome = BIOMES[Math.floor(Math.random() * BIOMES.length)];
    return {
      state: STATES.WANDER,
      target: {
        x: (randomBiome.x + 2 + Math.random() * (randomBiome.w - 4)) * 16,
        y: (randomBiome.y + 2 + Math.random() * (randomBiome.h - 4)) * 16,
      },
      duration: 8 + Math.random() * 12,
      destination: randomBiome.name,
    };
  }

  // Default: seek task
  const task = findNearestTask(creature, tasks);
  if (task) {
    return {
      state: STATES.SEEKING_TASK,
      target: { x: task.x, y: task.y },
      taskId: task.id,
      duration: 30,
    };
  }

  // Nothing to do — wander locally
  const currentBiome = getBiome(Math.floor(creature.x / 16), Math.floor(creature.y / 16));
  return {
    state: STATES.WANDER,
    target: {
      x: creature.x + (Math.random() - 0.5) * 200,
      y: creature.y + (Math.random() - 0.5) * 200,
    },
    duration: 5 + Math.random() * 8,
    destination: currentBiome.name,
  };
}

function attemptTask(creature, task) {
  const statMap = {
    code: 'intelligence',
    research: 'intelligence',
    create: 'creativity',
    gather: 'strength',
    fight: 'strength',
    explore: 'speed',
    trade: 'luck',
    rest: 'luck',
    mystery: 'creativity',
  };

  const relevantStat = creature.genome.stats[statMap[task.type] || 'intelligence'];
  const luckBonus = creature.genome.stats.luck / 10;
  const resilienceBonus = creature.genome.traits.resilience * 3;
  const roll = Math.random() * 25;

  const success = roll < (relevantStat + luckBonus + resilienceBonus);

  return {
    success,
    xp: success ? task.xpReward : Math.floor(task.xpReward * 0.1),
    statGrowth: success ? statMap[task.type] : null,
    message: success
      ? `completed ${task.type} task (difficulty ${task.difficulty})`
      : `failed at ${task.type} task (difficulty ${task.difficulty})`,
  };
}

function moveToward(creature, target, dt) {
  const dx = target.x - creature.x;
  const dy = target.y - creature.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 2) return true; // arrived

  const speed = (creature.genome.stats.speed / 8) * 50 * dt;
  const step = Math.min(speed, dist);
  creature.x += (dx / dist) * step;
  creature.y += (dy / dist) * step;

  // Clamp to world bounds
  creature.x = Math.max(16, Math.min(128 * 16 - 16, creature.x));
  creature.y = Math.max(16, Math.min(128 * 16 - 16, creature.y));

  return false;
}

module.exports = { STATES, decideAction, attemptTask, moveToward, findNearestTask, distance };
