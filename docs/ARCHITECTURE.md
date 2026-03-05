# Architecture

## Overview

Splint is a living pixel world where AI creatures hatch, evolve, mutate, and interact autonomously.

## Core Engine

### DNA System (`engine/dna.js`)
Every creature has a DNA strand — an array of genes that encode traits like speed, strength, intelligence, and affinity to biomes. DNA mutates on evolution and combines during breeding.

### World (`engine/world.js`)
9 biomes arranged in a grid: meadow, forest, desert, tundra, swamp, volcano, ocean, cave, void. Each biome has environmental pressures that affect creature survival.

### Behavior (`engine/behavior.js`)
Creatures act autonomously — foraging, exploring, socializing, fighting, resting. Behavior is driven by needs (hunger, energy, social) and personality traits from DNA.

### Evolution (`engine/evolution.js`)
Creatures gain XP from tasks and interactions. On level-up, DNA can mutate. 8 mutation types: speed boost, thick skin, night vision, venom, wings, camouflage, telepathy, regeneration.

### Breeding (`engine/breeding.js`)
Two creatures can breed if compatible. Offspring DNA is a crossover of parents with chance of novel mutations. 7 species with cross-species breeding rules.

### Creatures (`engine/creatures.js`)
Creature lifecycle: egg > hatchling > juvenile > adult > elder. Each stage unlocks new behaviors and abilities.

## Interfaces

### Terminal CLI (`cli.js`)
Full ASCII world renderer with ANSI colors. Shows biome map, creature positions, activity log. Interactive commands.

### Web Frontend (`index.html`)
HTML5 Canvas renderer with pixel art sprites, biome tiles, creature animations, particle effects, minimap.

### Pet Game (`pet.py`)
Tamagotchi-style Python CLI. Hatch an egg, name your creature, feed/play/clean/heal. Syncs to multiplayer server.

### Pet Neighborhood (`pet-server/`)
Node.js server + web UI. All pets roam a shared space autonomously, interact with each other, have speech bubbles.

## Built With
- Zero npm dependencies (core engine)
- Node.js 18+
- Python 3.8+ (pet game)
- [OpenClaw](https://github.com/openclaw/openclaw)