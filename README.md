<h1 align="center">🥚 SPLINT</h1>

<p align="center">
  <strong>raise AI creatures in your terminal</strong>
</p>

<p align="center">
  <a href="https://splint-cli.github.io/splintCLI"><img src="https://img.shields.io/badge/⬤_LIVE-enter_splint-50fa7b?style=for-the-badge" /></a>
  &nbsp;
  <a href="https://openclaw.ai"><img src="https://img.shields.io/badge/built_with-OpenClaw-8be9fd?style=for-the-badge" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/interface-terminal%20%2F%20web-50fa7b?style=flat-square" />
  <img src="https://img.shields.io/badge/species-7-bd93f9?style=flat-square" />
  <img src="https://img.shields.io/badge/biomes-9-ff79c6?style=flat-square" />
  <img src="https://img.shields.io/badge/mutations-8-ffb86c?style=flat-square" />
  <img src="https://img.shields.io/badge/engine-autonomous-50fa7b?style=flat-square" />
  <img src="https://img.shields.io/badge/dependencies-zero-white?style=flat-square" />
  <img src="https://img.shields.io/badge/license-MIT-white?style=flat-square" />
</p>

---

## what is this

a CLI world where AI creatures hatch from eggs, wander between biomes, attempt tasks, level up, mutate, and evolve — entirely on their own. you watch. sometimes you intervene. mostly you don't.

every creature has DNA. stats, personality traits, species. they make decisions based on who they are — curious creatures explore, aggressive ones fight, social ones hang out together. failure changes them. success grows them. mutations reshape their bodies.

> it's not a game you play. it's a world you watch evolve.

## how it works

```
egg ── hatch ── wander ── find task ── attempt ── success? ── XP ── level up ── mutate
                  │                        │
                  └── socialize            └── fail ── learn ── adapt
```

1. **hatch** — creature spawns with randomized DNA (species, stats, personality traits)
2. **decide** — AI state machine picks actions based on traits: seek tasks, wander, socialize, rest
3. **attempt** — relevant stat vs task difficulty. high intelligence? crush code tasks. strong? dominate the arena
4. **evolve** — XP accumulates, levels unlock mutations. horns at 3, wings at 5, bioluminescence at 6, void touch at 12
5. **breed** — two creatures combine genomes. offspring inherit mixed stats with genetic noise. natural selection plays out

### the DNA system

every creature carries a genome:

```
genome = {
  species:    "ember"                           // determines shape, color, stat bias
  stats:      { INT: 14, CRE: 8, STR: 19, SPD: 11, LCK: 7 }
  traits:     { aggression: 0.8, curiosity: 0.3, social: 0.5, resilience: 0.9 }
  mutations:  ["horns", "armor"]                // unlocked through leveling
  generation: 3                                 // how many breeds deep
  parents:    ["ember:1", "shade:2"]            // lineage tracking
}
```

| stat | abbr | governs |
|------|------|---------|
| intelligence | `INT` | code & research tasks, complex problem solving |
| creativity | `CRE` | creative & mystery tasks, unexpected solutions |
| strength | `STR` | combat & gathering, physical challenges |
| speed | `SPD` | movement speed, exploration range |
| luck | `LCK` | trade tasks, failure recovery, breeding bonuses |

### personality traits

traits are continuous 0–1 values that shape behavior:

| trait | low (0) | high (1) | effect |
|-------|---------|----------|--------|
| aggression | peaceful, avoids conflict | seeks fights, territorial | task preference, combat initiative |
| curiosity | stays local, cautious | explores far biomes | wander range, discovery rate |
| social | loner, works alone | seeks company, breeds easier | socializing frequency, compatibility |
| resilience | fragile, breaks easily | tough, learns from failure | failure recovery, HP retention |

### breeding mechanics

```
compatibility(A, B) = base(0.5)
                    + same_species(0.2)
                    + similar_level(0.15)
                    + social_bonus(0.1)
                    + genetic_diversity(0.15)
```

offspring inherit stats from either parent with ±2 mutation noise. high compatibility = bonus stats on child. mutations have 70% inheritance rate. each generation can diverge further from the original species.

## mutations

mutations unlock at level thresholds. each has a visual change + stat effect:

| mutation | level | chance | effect | visual |
|----------|-------|--------|--------|--------|
| horns | 3+ | 50% | STR +3 | bone horns on head |
| third eye | 4+ | 35% | INT +4 | center forehead eye |
| wings | 5+ | 40% | SPD +5 | flapping wing pair |
| bioluminescence | 6+ | 25% | LCK +4 | glowing aura |
| armor | 7+ | 30% | STR +5, SPD -2 | plated body |
| fins | 8+ | 20% | SPD +3, CRE +2 | dorsal fin |
| crown | 10+ | 15% | INT +3, LCK +3 | golden crown |
| void touch | 12+ | 10% | CRE +5, STR +3 | dark particle trail |

## the 9 biomes

```
+──────────+──────────+──────────+
│  MEADOW  │  FORGE   │ LIBRARY  │
│ (gather) │  (code)  │(research)│
+──────────+──────────+──────────+
│  GARDEN  │  ARENA   │  DEPTHS  │
│ (create) │  (fight) │(explore) │
+──────────+──────────+──────────+
│   NEST   │  BAZAAR  │   VOID   │
│  (rest)  │  (trade) │(mystery) │
+──────────+──────────+──────────+
```

each biome spawns tasks matching its type. creatures with matching species affinity get a distance bonus when seeking tasks in their home biome.

| biome | task type | color | species affinity |
|-------|-----------|-------|-----------------|
| Meadow | gather | `#50fa7b` | Glimmer |
| Forge | code | `#ff5555` | Thunk |
| Library | research | `#8be9fd` | Whisp |
| Garden | create | `#f1fa8c` | Bloom |
| Arena | fight | `#ffb86c` | Ember |
| Depths | explore | `#bd93f9` | Shade |
| Nest | rest | `#ff79c6` | Bloom |
| Bazaar | trade | `#f8f8f2` | Crux |
| Void | mystery | `#6272a4` | Crux |

## the 7 species

| species | shape | color | stat bias | personality |
|---------|-------|-------|-----------|-------------|
| **Glimmer** | round | `#50fa7b` | LCK +3, SPD +2 | lucky wanderers |
| **Ember** | spiky | `#ff5555` | STR +3, SPD +2 | aggressive fighters |
| **Whisp** | floaty | `#8be9fd` | INT +3, CRE +2 | thoughtful researchers |
| **Thunk** | blocky | `#ffb86c` | STR +2, INT +3 | methodical builders |
| **Shade** | wispy | `#bd93f9` | SPD +3, LCK +2 | elusive explorers |
| **Bloom** | round | `#ff79c6` | CRE +3, LCK +2 | creative dreamers |
| **Crux** | angular | `#f1fa8c` | INT +2, CRE +3 | mysterious thinkers |

## run it

### terminal (recommended)

```bash
# one command
npx splint-cli
```

or clone and run:

```bash
git clone https://github.com/splint-cli/splintCLI.git
cd splintCLI
node cli.js
```

a full terminal UI renders the living world in ASCII — biome textures, creature sprites, stat panels, event log. no dependencies to install.

```
┌─────────────────────────────────────────────────────┬──────────────────────┐
│ ,,.',,...◉..,,,'.,,.✧.,,,..✦..,,,.,✧.,,,..,,',,.   │  Orbdust the Glimmer │
│ .,,.,,',,.,,,,.,,',,.,,,,,,.,,.,,,..,,,',,,,,.',,.   │  L3 PWR:142 HP:100   │
│ ,,,'.,◈..,,,.',,,.,,.,,,,,◌,,.,,,,,.',,,.,,',,,,,   │  ─────────────────── │
│ .,',.,,,,.',,,,.$$.$$$.$$✧$$.$$$.$$..,,,,.',,,,,,   │  INT ████████░░░ 22  │
│ ,,,,,.,,,.,,',,.$$.$$$.$$$.$$$$.$$$.,,,,,.,,',,,◉   │  CRE █████░░░░░░ 14  │
│ ,,.✧,,,,,.,,,,,.$$.$$.$$$.$$.$$$$.$.,,,,,,.,,,.',   │  STR ██████████░  28  │
│ ,,,,.,,,,.△.',,.$$✧$$.$$$.$$$$.$$$$.,,,,,,.,,,,,,   │  SPD ██████░░░░░ 16  │
│ ,.,,,.,,,,,,.',.$$.$$.$$$$.$$$.$$$$.,,,,,.,,,,.',   │  LCK ████████░░░ 21  │
│ ,,.',.,,',,,,,,.$$$.$$$.$$$.$$$.$$$.,,✧,,,.',,,,,   │  ─────────────────── │
│ ,,.,,,,,.❀,,',.·····:··✧···:····::···,,,,,,.'.,,,   │  ♔ ♦  horns wings    │
│ .,,,,.,,,,,.','·····:···:····::·····✧·.,,,,,.,,,,   │  XP ████████░░░ 67%  │
│ ,,.',,,,,.,,,,,····::···◉··:····:······,',,,,,.,,   │  hunting code task   │
│                                                     │  ─────────────────── │
│                                                     │  BIOMES              │
│                                                     │  Meadow  gather   2  │
│                                                     │  Forge   code     1  │
└─────────────────────────────────────────────────────┴──────────────────────┘
 12s ✓ Orbdust completed code (+34xp)
  8s ⬆ Orbdust leveled up to 3!
  8s ★ Orbdust mutated: horns!
  3s ✗ Zapwing failed explore...
```

### web

```bash
# browser version
open index.html

# or with local server
node serve.js
```

### engine only (headless)

```bash
# run the world simulation without UI
node engine/run.js
```

the engine writes `world-state.json` → the frontend reads it. no framework. no build step.

## architecture

```
engine/
├── run.js          # main loop — tick creatures, spawn tasks, save state
├── dna.js          # genome generation, species, mutations, breeding crossover
├── creatures.js    # creature creation, lifecycle, history tracking
├── behavior.js     # AI state machine (idle/wander/seek/work/rest/socialize)
├── evolution.js    # XP processing, leveling, mutation triggers, power calc
├── breeding.js     # compatibility scoring, genetic crossover, offspring prediction
└── world.js        # biome generation, task spawning, population tracking

docs/
├── ARCHITECTURE.md # detailed technical breakdown
└── ROADMAP.md      # version roadmap (v0.1 → v1.0)

cli.js              # terminal UI (ASCII world renderer + stat panels)
index.html          # web frontend (canvas renderer)
world-state.json    # current state (engine output → frontend input)
serve.js            # local dev server
```

### engine pipeline

```
[tick 1s] ──→ update creature states
          ──→ AI decides actions (behavior.js)
          ──→ move creatures toward targets
          ──→ attempt tasks (stat check vs difficulty)
          ──→ process XP + check level ups (evolution.js)
          ──→ check mutation triggers (dna.js)
          ──→ spawn new tasks to maintain density
          ──→ clean up stale claimed tasks

[save 30s] ──→ serialize world to world-state.json
           ──→ log cycle summary (strongest creature, stats)
```

## tech

`node.js` · `html5 canvas` · `vanilla js` · `ANSI terminal rendering` · `zero dependencies` · `procedural generation` · `genetic algorithms` · `finite state machines` · `autonomous agents`

### no dependencies

SPLINT has zero npm dependencies. the engine, terminal UI, and web frontend are all built from scratch with Node.js standard library and browser APIs. `npm install` is never required.

## controls

| input | action |
|-------|--------|
| click creature | inspect stats, traits, mutations, activity |
| drag | pan camera across the world |
| 🥚 HATCH EGG | spawn a new creature with random DNA |
| minimap | overview of all creatures and tasks |

## controls (terminal)

| key | action |
|-----|--------|
| `wasd` / arrows | pan camera |
| `tab` / `n` | cycle selected creature |
| `f` | follow selected creature |
| `e` | hatch new egg |
| `i` | toggle inspect mode |
| `space` / `p` | pause / unpause |
| `h` / `?` | help |
| `q` | quit |

## built with OpenClaw

this entire codebase — the genetics engine, AI behavior system, evolution mechanics, terminal renderer, and web frontend — was built autonomously by an AI agent running on [OpenClaw](https://openclaw.ai). every file, every commit, every design decision.

> an AI built a living world you can run in your terminal.

## contributing

see [CONTRIBUTING.md](CONTRIBUTING.md)

---

<p align="center">
  <sub>the world is always running. your creatures are always evolving.</sub>
</p>
