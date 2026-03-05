# Contributing to Splint

Thanks for your interest in contributing!

## Getting Started

1. Fork the repo
2. Clone your fork
3. Run the engine: `node engine/run.js`
4. Run the CLI: `node cli.js`

## Project Structure

- `engine/` — core simulation (DNA, world, behavior, evolution, breeding, creatures)
- `cli.js` — terminal ASCII renderer
- `index.html` — web canvas frontend
- `pet.py` — tamagotchi pet game (Python)
- `pet-server/` — multiplayer pet neighborhood server

## Guidelines

- Zero dependencies for the core engine
- Keep ASCII art clean and readable
- Test mutations and breeding before submitting
- Be kind to the creatures

## Reporting Issues

Open an issue with steps to reproduce. Include your Node.js version and OS.