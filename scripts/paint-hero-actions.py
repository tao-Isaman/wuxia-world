#!/usr/bin/env python3
"""
Paint the heroes' action strips (lib/characters/hero-actions.ts) with the
OpenAI image edit API, from each hero's painted body.

    OPENAI_API_KEY=... python3 scripts/paint-hero-actions.py <out-dir> [hero] [row ...]

Writes <out-dir>/<hero>/<row>.png (skipping strips already there), then build
the sheets with `bun scripts/build-hero-actions.ts --from <out-dir>`. Rows:
the seven weapon families, `combat`, and the work loops (mine, chop, fish,
herb, hunt, venom, forge, cook, alchemy, craft, meditate, read, music_play,
sleep). The key comes only from the environment; never commit one.
"""
import base64, json, os, sys, time, urllib.error, urllib.request, uuid
from concurrent.futures import ThreadPoolExecutor

REPO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public")

def edit(ref, prompt, out):
    key = os.environ.get("OPENAI_API_KEY")
    if not key: sys.exit("set OPENAI_API_KEY")
    b = uuid.uuid4().hex; parts = []
    def field(n, v): parts.append(f'--{b}\r\nContent-Disposition: form-data; name="{n}"\r\n\r\n{v}\r\n'.encode())
    for n, v in (("model", "gpt-image-2"), ("prompt", prompt), ("size", "1536x1024"), ("quality", "high"), ("output_format", "png")): field(n, v)
    parts.append(f'--{b}\r\nContent-Disposition: form-data; name="image[]"; filename="ref.png"\r\nContent-Type: image/png\r\n\r\n'.encode() + open(ref, "rb").read() + b"\r\n")
    parts.append(f"--{b}--\r\n".encode())
    req = urllib.request.Request("https://api.openai.com/v1/images/edits", data=b"".join(parts), method="POST",
        headers={"Authorization": f"Bearer {key}", "Content-Type": f"multipart/form-data; boundary={b}"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=600) as r: data = json.load(r)
            open(out, "wb").write(base64.b64decode(data["data"][0]["b64_json"])); return True
        except urllib.error.HTTPError as e:
            msg = e.read().decode()[:300]; print("HTTP", e.code, msg, file=sys.stderr)
            if "insufficient_quota" in msg: return False
            if e.code in (429, 500, 502, 503): time.sleep(20 * (attempt + 1)); continue
            return False
        except Exception as e:
            print("ERR", e, file=sys.stderr); time.sleep(10)
    return False

SIDE = "every figure shown in full side profile facing to the RIGHT of the picture"
# (count, description) per strip.
ATTACK = "Figure 1: a ready fighting stance. Figure 2: winding up / gathering power. Figure 3: the strike at full extension, a dynamic lunging pose. Figure 4: follow-through of the strike. Figure 5: recovering back toward the stance."
STRIPS = {
 # combat — the weapon in hand per family
 "fist":   (5, f"a bare-handed kung fu palm and fist attack (the sword stays sheathed at the waist, both hands empty). {ATTACK} The strike is a powerful open-palm thrust forward."),
 "long":   (5, f"a long-weapon attack holding a long red-tasselled spear with both hands (no sword in hand). {ATTACK} The strike is a long straight spear thrust."),
 "sword":  (5, f"a sword attack holding a straight double-edged Chinese jian sword in the right hand. {ATTACK} The strike is a fast sword thrust; keep the figures smaller so the extended sword never reaches the next figure."),
 "blade":  (5, f"a heavy broadsword attack holding a broad curved Chinese dao sabre with both hands (no jian in hand). {ATTACK} Figure 2 raises the sabre high overhead, figure 3 is a big downward chop."),
 "short":  (5, f"a short-weapon attack holding a closed folding iron fan in the right hand like a dagger. {ATTACK} The strike is a quick close stab with the fan."),
 "hidden": (5, f"a hidden-weapon attack throwing small steel darts. {ATTACK} Figure 2 draws the darts back beside the ear between the fingers, figure 3 flicks the arm forward releasing them, small darts flying to the right."),
 "music":  (5, "a musical attack with a bamboo flute. Figure 1: holding the flute ready. Figure 2: raising the flute to the lips. Figure 3: playing the flute fiercely, leaning forward, hair and robes blown back. Figure 4: still playing, swaying. Figure 5: lowering the flute."),
 "combat": (6, "Figure 1: a calm battle-ready stance, hand on the sword hilt. Figure 2: casting inner energy, both palms pushed forward, legs in a wide horse stance. Figure 3: hurt, recoiling backward clutching the chest. Figure 4: guarding, forearms crossed in front of the body. Figure 5: victory, standing proud with one fist raised. Figure 6: defeated, kneeling on one knee with head bowed."),
 # activities — 4-frame loops
 "mine":    (4, "mining ore with a pickaxe at a small grey rock. Figure 1: pickaxe raised high overhead. Figure 2: swinging down. Figure 3: pickaxe striking the rock. Figure 4: pulling the pickaxe back up. Each figure has the same small rock in front of the feet."),
 "chop":    (4, "chopping wood with an axe at a short tree stump. Figure 1: axe raised over the shoulder. Figure 2: swinging. Figure 3: the axe biting into the stump. Figure 4: lifting the axe back. Each figure has the same stump in front."),
 "fish":    (4, "fishing with a long bamboo fishing rod, standing. Figure 1: holding the rod out with the line hanging. Figure 2: a small twitch of the rod. Figure 3: pulling the rod up and back. Figure 4: holding up a small caught fish on the line."),
 "herb":    (4, "gathering medicinal herbs, a small woven basket on the back. Figure 1: bending down toward a herb plant. Figure 2: crouching and picking the herb. Figure 3: rising holding the herb. Figure 4: putting the herb over the shoulder into the basket."),
 "hunt":    (4, "hunting with a wooden recurve bow (no sword in hand). Figure 1: holding the bow, reaching for an arrow. Figure 2: nocking the arrow. Figure 3: drawing the bowstring fully back, aiming right. Figure 4: the arrow released, bow arm extended."),
 "venom":   (4, "catching a snake with a forked stick to gather venom. Figure 1: crouching, pinning a green snake with a forked stick. Figure 2: grabbing the snake behind its head. Figure 3: holding the snake up, its fangs over a small jar. Figure 4: holding the small jar of venom up and looking at it."),
 "forge":   (4, "blacksmithing, hammering a glowing red hot blade on a small iron anvil. Figure 1: hammer raised high. Figure 2: hammer swinging down. Figure 3: hammer striking the glowing metal with tiny sparks. Figure 4: lifting the hammer. The same anvil in front of every figure."),
 "cook":    (4, "cooking over a small round clay stove with an iron wok. Figure 1: stirring the wok with a ladle. Figure 2: tossing the food in the wok. Figure 3: stirring again. Figure 4: tasting from the ladle. The same stove and wok in front of every figure."),
 "alchemy": (4, "alchemy, tending a small bronze tripod pill furnace with smoke rising. Figure 1: crouching and fanning the fire under the furnace with a hand fan. Figure 2: dropping a herb into the furnace. Figure 3: standing with palms toward the furnace pushing inner energy. Figure 4: holding up a small round pill. The same furnace in every figure."),
 "craft":   (4, "sewing and jewelry crafting, sitting cross-legged on the ground. Figure 1: pulling a needle and thread through cloth. Figure 2: thread pulled high. Figure 3: polishing a small jade pendant. Figure 4: holding up the finished jade pendant."),
 "meditate":(4, "meditating, sitting cross-legged in the lotus position, eyes closed, hands resting on the knees. The four figures are almost identical: a slow breathing cycle, figure 2 and 3 slightly rising with the breath and the hands forming a mudra, figure 4 back to rest."),
 "read":    (4, "reading a bamboo scroll book while sitting cross-legged on the ground. Figure 1: scroll open, reading. Figure 2: unrolling the scroll further. Figure 3: stroking the chin thinking. Figure 4: reading again, nodding."),
 "music_play": (4, "playing a guqin zither laid across the lap while sitting cross-legged on the ground. Figure 1: right hand plucking. Figure 2: left hand pressing the strings. Figure 3: both hands sweeping the strings. Figure 4: hands lifted gently, eyes closed."),
 "sleep":   (4, "sleeping, lying on the ground on a thin straw mat, head on an arm. Figure 1 to 4: the same sleeping pose with a slow breathing cycle, the chest gently rising (figure 2 and 3) and falling (figure 4)."),
}
def prompt(key):
    n, what = STRIPS[key]
    words = {4: "FOUR", 5: "FIVE", 6: "SIX"}[n]
    return ("A game sprite animation strip of the SAME character as the reference image (identical face, hair, costume and colours, same proportions), "
            "in the same semi-realistic painted wuxia RPG style. "
            f"Exactly {words} full-body figures of this one character side by side in a single row, evenly spaced with clear empty white space between them, "
            "all the same size and scale, feet on the same horizontal ground line, nothing overlapping or touching: keep every weapon, tool and ribbon well clear of the neighbouring figures, with a wide empty gap between figures, "
            f"{SIDE}. The animation: {what} "
            "Plain flat pure white background everywhere, no ground line, no shadows, no motion lines, no effects, no text, no labels, no frame.")

if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit(__doc__)
    root, heroes, rows = sys.argv[1], [a for a in sys.argv[2:] if a in ("m1", "f1")] or ["m1", "f1"], [a for a in sys.argv[2:] if a in STRIPS] or list(STRIPS)
    jobs = [(h, k) for h in heroes for k in rows if not os.path.exists(f"{root}/{h}/{k}.png")]
    def run(job):
        h, k = job
        os.makedirs(f"{root}/{h}", exist_ok=True)
        print(h, k, edit(f"{REPO}/player/body/{h}.png", prompt(k), f"{root}/{h}/{k}.png"), flush=True)
    with ThreadPoolExecutor(5) as pool: list(pool.map(run, jobs))
