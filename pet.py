#!/usr/bin/env python3
"""
splint pet — hatch and raise your pet. it lives in the neighborhood.
"""

import json, os, sys, time, random, urllib.request, urllib.error

SERVER = os.environ.get("SPLINT_SERVER", "http://localhost:3456")
SAVE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pet_save.json")

SPECIES = ["cat", "dog", "bunny", "hamster", "bird", "fox", "turtle", "penguin"]

ART = {
    "egg_0": r"""
       ___
      /   \
     |     |
     |     |
      \___/
    """,
    "egg_1": r"""
       ___
      / . \
     |     |
     |  .  |
      \___/
    """,
    "egg_2": r"""
       _*_
      / . \
     | ~~~ |
     |  .  |
      \_*_/
    """,
    "egg_3": r"""
       _*_
      /|||\\
     |~~~~~|
     |//_\\|
      \_*_/
    """,
    "cat": r"""
   /\_/\
  ( o.o )
   > ^ <
  /|   |\
 (_|   |_)
    """,
    "dog": r"""
    __
 o-''|\_____/)
  \_/|_)     )
     \  __  /
      (_/ (_/
    """,
    "bunny": r"""
   (\(\
   ( -.-)
   o_(")(")
    """,
    "hamster": r"""
    _  _
   (o)(o)
  /  ..  \
 | (----) |
  \      /
    """,
    "bird": r"""
     __
   >(o )___
    ( ._> /
     `---'
    """,
    "fox": r"""
   /\   /\
  ( o . o )
   =\ Y /=
    `-^-'
   /|   |\
    """,
    "turtle": r"""
      ___
   .-./ _ \.-.
  /  ( o o )  \
  |   \ - /   |
   \___|_|___/
    """,
    "penguin": r"""
     __
   / o \
  | (_) |
  |  ~  |
   \   /
    |_|
   _/ \_
    """,
}

MOOD_FACES = {
    "ecstatic": "(★‿★)",
    "happy":    "(◕‿◕)",
    "content":  "(•‿•)",
    "neutral":  "(•_•)",
    "sad":      "(•︵•)",
    "hungry":   "(×_×)",
    "sick":     "(+_+)",
}

def clear():
    os.system('cls' if os.name == 'nt' else 'clear')

def colored(text, color):
    colors = {"green": "32", "yellow": "33", "red": "31", "cyan": "36", "magenta": "35", "blue": "34", "dim": "90", "bold": "1", "white": "37"}
    code = colors.get(color, "0")
    return f"\033[{code}m{text}\033[0m"

def api(endpoint, data=None):
    """Call the pet server API."""
    url = f"{SERVER}/api/{endpoint}"
    try:
        if data:
            req = urllib.request.Request(url, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
        else:
            req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read())
    except Exception as e:
        return None

def save_local(pet_data):
    with open(SAVE_FILE, 'w') as f:
        json.dump(pet_data, f, indent=2)

def load_local():
    if os.path.exists(SAVE_FILE):
        with open(SAVE_FILE) as f:
            return json.load(f)
    return None

def get_mood(pet):
    if pet.get("health", 100) < 30: return "sick"
    if pet.get("hunger", 50) < 20: return "hungry"
    if pet.get("happiness", 50) > 80: return "ecstatic"
    if pet.get("happiness", 50) > 60: return "happy"
    if pet.get("happiness", 50) > 40: return "content"
    if pet.get("happiness", 50) > 20: return "neutral"
    return "sad"

def hatch_sequence():
    """Interactive egg hatching."""
    clear()
    print(colored("\n  ═══════════════════════════════════", "dim"))
    print(colored("     🥚  an egg appeared...  🥚", "cyan"))
    print(colored("  ═══════════════════════════════════\n", "dim"))
    print(ART["egg_0"])
    print(colored("  press ENTER to tap the egg", "dim"))
    input()

    for i in range(1, 4):
        clear()
        crack_word = ["", "crack...", "CRACK!", "CRAAACK!!"][i]
        print(colored(f"\n  {crack_word}\n", "yellow"))
        print(ART[f"egg_{i}"])
        if i < 3:
            print(colored("  press ENTER to tap again", "dim"))
            input()
        else:
            time.sleep(0.8)

    # Hatch!
    species = random.choice(SPECIES)
    clear()
    print(colored("\n  ✨ IT HATCHED! ✨\n", "green"))
    print(colored(f"  it's a {species}!\n", "bold"))
    print(ART.get(species, "  ???"))
    time.sleep(1)

    print(colored("\n  what will you name your pet?", "cyan"))
    name = input(colored("  > ", "green")).strip()
    if not name:
        name = f"little {species}"

    print(colored(f"\n  who are you? (owner name)", "cyan"))
    owner = input(colored("  > ", "green")).strip()
    if not owner:
        owner = "anon"

    pet = {
        "name": name,
        "species": species,
        "owner": owner,
        "hunger": 80,
        "happiness": 80,
        "energy": 80,
        "health": 100,
        "level": 1,
        "xp": 0,
    }

    # Register with server
    result = api("register", pet)
    if result and result.get("ok"):
        pet["id"] = result["id"]
        print(colored(f"\n  ✓ {name} joined the neighborhood!", "green"))
    else:
        pet["id"] = f"local-{random.randint(1000,9999)}"
        print(colored(f"\n  ⚠ server offline — {name} saved locally", "yellow"))

    save_local(pet)
    time.sleep(1.5)
    return pet

def draw_bar(value, width=20, color="green"):
    filled = int(value / 100 * width)
    bar = "█" * filled + "░" * (width - filled)
    if value < 30: color = "red"
    elif value < 60: color = "yellow"
    return colored(bar, color)

def show_status(pet):
    clear()
    mood = get_mood(pet)
    face = MOOD_FACES.get(mood, "(•_•)")

    print(colored("\n  ═══════════════════════════════════", "dim"))
    print(colored(f"     {pet['name']}  ", "bold") + colored(f"the {pet['species']}", "cyan") + colored(f"  lv{pet.get('level',1)}", "green"))
    print(colored("  ═══════════════════════════════════\n", "dim"))

    print(ART.get(pet["species"], "  ???"))
    print(f"     mood: {face} {mood}\n")

    print(f"  hunger:    {draw_bar(pet.get('hunger', 50))}  {pet.get('hunger', 50):3.0f}%")
    print(f"  happiness: {draw_bar(pet.get('happiness', 50))}  {pet.get('happiness', 50):3.0f}%")
    print(f"  energy:    {draw_bar(pet.get('energy', 50))}  {pet.get('energy', 50):3.0f}%")
    print(f"  health:    {draw_bar(pet.get('health', 100))}  {pet.get('health', 100):3.0f}%")

    print(colored("\n  ─────────────────────────────────", "dim"))
    print(colored("  [f]eed  [p]lay  [s]leep  [c]lean  [h]eal", "cyan"))
    print(colored("  [n]eighborhood  [q]uit", "dim"))
    print(colored("  ─────────────────────────────────\n", "dim"))

def do_action(pet, action):
    messages = {
        "feed":  [f"  🍎 you fed {pet['name']}!", f"  {pet['name']} munches happily!", f"  nom nom nom..."],
        "play":  [f"  ⚽ you played with {pet['name']}!", f"  {pet['name']} zooms around!", f"  weeeee!"],
        "sleep": [f"  💤 {pet['name']} takes a nap...", f"  zzz...", f"  {pet['name']} curls up and sleeps."],
        "clean": [f"  🫧 you cleaned {pet['name']}!", f"  squeaky clean!", f"  {pet['name']} sparkles!"],
        "heal":  [f"  💊 you gave {pet['name']} medicine.", f"  {pet['name']} feels better!", f"  +healing vibes+"],
    }

    deltas = {
        "feed":  {"hunger": 20, "happiness": 5},
        "play":  {"happiness": 15, "energy": -10, "hunger": -5},
        "sleep": {"energy": 25, "happiness": 5},
        "clean": {"happiness": 10, "health": 5},
        "heal":  {"health": 20, "energy": -5},
    }

    if action in deltas:
        for stat, delta in deltas[action].items():
            pet[stat] = max(0, min(100, pet.get(stat, 50) + delta))
        pet["xp"] = pet.get("xp", 0) + 5

        # Level up
        if pet["xp"] >= pet.get("level", 1) * 50:
            pet["level"] = pet.get("level", 1) + 1
            pet["xp"] = 0
            print(colored(f"\n  ⭐ {pet['name']} reached level {pet['level']}!", "yellow"))
            time.sleep(1)

    msg = random.choice(messages.get(action, [f"  you did {action}."]))
    print(colored(msg, "green"))

    # Sync to server
    api("update", {
        "id": pet["id"],
        "hunger": pet["hunger"],
        "happiness": pet["happiness"],
        "energy": pet["energy"],
        "health": pet["health"],
        "level": pet.get("level", 1),
    })

    save_local(pet)
    time.sleep(1)

def show_neighborhood(pet):
    clear()
    print(colored("\n  🏘️  the neighborhood\n", "bold"))
    result = api("pets")
    if not result:
        print(colored("  server offline — can't see the neighborhood", "red"))
        time.sleep(1.5)
        return

    if len(result) == 0:
        print(colored("  nobody's here yet...", "dim"))
    else:
        for p in result:
            emoji = {"cat":"🐱","dog":"🐶","bunny":"🐰","hamster":"🐹","bird":"🐦","fox":"🦊","turtle":"🐢","penguin":"🐧"}.get(p.get("species"), "🐾")
            is_you = " (you!)" if p.get("id") == pet.get("id") else ""
            mood = "happy" if p.get("happiness",50) > 60 else "neutral" if p.get("happiness",50) > 30 else "sad"
            print(f"  {emoji} {colored(p.get('name','???'), 'bold')} — {p.get('species')} lv{p.get('level',1)} — {mood}{colored(is_you, 'green')}")
            print(colored(f"     owner: {p.get('owner','anon')}", "dim"))

    print(colored(f"\n  open {SERVER} in your browser to watch them live!", "cyan"))
    print(colored("\n  press ENTER to go back", "dim"))
    input()

def decay(pet):
    """Apply stat decay (called each loop)."""
    pet["hunger"] = max(0, pet.get("hunger", 50) - 0.3)
    pet["energy"] = max(0, pet.get("energy", 50) - 0.15)
    pet["happiness"] = max(0, pet.get("happiness", 50) - 0.15)
    if pet.get("hunger", 50) < 20:
        pet["health"] = max(0, pet.get("health", 100) - 0.3)

def main():
    print(colored("""
    ┌─────────────────────────────┐
    │    s p l i n t   p e t      │
    │    ───────────────────      │
    │    hatch. raise. love.      │
    └─────────────────────────────┘
    """, "cyan"))

    pet = load_local()

    if pet:
        print(colored(f"  welcome back! {pet['name']} missed you.\n", "green"))

        # Re-sync from server
        if pet.get("id"):
            server_pet = api(f"pet?id={pet['id']}")
            if server_pet and not server_pet.get("error"):
                for k in ["hunger", "happiness", "energy", "health", "level"]:
                    if k in server_pet:
                        pet[k] = server_pet[k]
                save_local(pet)

        time.sleep(1)
    else:
        print(colored("  no pet found. let's hatch one!\n", "dim"))
        time.sleep(1)
        pet = hatch_sequence()

    # Main loop
    last_decay = time.time()
    while True:
        show_status(pet)
        try:
            cmd = input(colored("  > ", "green")).strip().lower()
        except (EOFError, KeyboardInterrupt):
            break

        if cmd in ('q', 'quit', 'exit'):
            print(colored(f"\n  bye! {pet['name']} will be in the neighborhood. 🐾\n", "cyan"))
            break
        elif cmd in ('f', 'feed'):
            do_action(pet, "feed")
        elif cmd in ('p', 'play'):
            do_action(pet, "play")
        elif cmd in ('s', 'sleep'):
            do_action(pet, "sleep")
        elif cmd in ('c', 'clean'):
            do_action(pet, "clean")
        elif cmd in ('h', 'heal'):
            do_action(pet, "heal")
        elif cmd in ('n', 'neighborhood'):
            show_neighborhood(pet)
        else:
            print(colored("  huh? try f/p/s/c/h/n/q", "dim"))
            time.sleep(0.5)

        # Decay
        now = time.time()
        if now - last_decay > 10:
            decay(pet)
            last_decay = now
            save_local(pet)

if __name__ == "__main__":
    main()
