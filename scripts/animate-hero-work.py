#!/usr/bin/env python3
"""
Animate m1's work poses with PixelLab (animate-with-text-v3, 8 frames, 128 px:
2 generations each; the free tier runs one job at a time).

    PIXELLAB_API_TOKEN=... python3 scripts/animate-hero-work.py <dir> [activity ...]

Reads <dir>/first/<activity>.png (bun scripts/build-hero-work-loops.ts --first <dir>),
writes <dir>/out/<activity>/00..08.png, skipping activities already done; then
`bun scripts/build-hero-work-loops.ts --from <dir>`. The token comes only from
the environment; never commit one.
"""
import base64, json, os, sys, time, urllib.request, urllib.error
TOK = os.environ.get("PIXELLAB_API_TOKEN") or sys.exit("set PIXELLAB_API_TOKEN")
HERE = sys.argv[1] if len(sys.argv) > 1 else sys.exit(__doc__)
API = "https://api.pixellab.ai/v2"
SIDE = ("Side view, the young swordsman in a blue robe faces RIGHT the whole time and stays on the same spot; "
        "keep his face, hair, robe colours and proportions exactly as in the first frame; smooth, weighty, realistic motion; seamless loop back to the first pose. ")
ACTIONS = {
 "mine": "He mines ore: the raised pickaxe swings down hard in a full arc, strikes the grey rock in front of his feet (small stone chips fly), his knees bend and back follows through, then he heaves the pickaxe back up over his head.",
 "chop": "He chops wood: draws the axe back over his right shoulder, swings it down with his whole body into the tree stump in front of him (wood chips fly), tugs the axe free and lifts it again.",
 "fish": "He fishes with a long bamboo rod: holds it steady, the line sways, then the rod tip dips as a fish bites, he jerks the rod up and back, then lowers it and waits again.",
 "herb": "He gathers herbs: crouching, he reaches down to a small plant, grips and pulls it from the soil, rises a little to look at it, then drops it over his shoulder into the basket on his back and reaches down again.",
 "hunt": "He hunts with a recurve bow: nocks an arrow, raises the bow and draws the string fully back to his cheek, holds and aims to the right, releases (the bow arm stays straight, the string snaps forward), then reaches for the next arrow.",
 "venom": "He catches a snake: pins a green snake with a forked stick, grabs it just behind the head, lifts it so its fangs press over the rim of a small jar to drip venom, then sets it down and pins it again.",
 "forge": "He forges a blade: raises the smith's hammer high, brings it down onto the glowing red blade on the anvil in front of him with sparks flying, the hammer bounces, and he lifts it again; his other hand holds the tongs steady.",
 "cook": "He cooks: stirs the iron wok on the clay stove in front of him with a ladle, tosses the food in a high flip with the wok handle, stirs again and leans in to taste from the ladle.",
 "alchemy": "He brews medicine: crouched by the small bronze tripod furnace in front of him, he fans the fire under it with a hand fan, smoke curls up from the lid, he drops in a pinch of herbs and fans again.",
 "craft": "He sews, sitting cross-legged: pulls the needle and long thread up and out through the cloth on his lap in a wide arc, pushes the needle back in, and pulls the thread up again.",
 "meditate": "He meditates in the lotus position, eyes closed: a slow deep breath, his chest and shoulders rise and fall gently, his hands rest in a mudra on his knees, his hair and sleeves stir faintly in the breeze.",
 "read": "He reads a bamboo scroll, sitting cross-legged: his eyes follow the text, he unrolls the scroll a little further with one hand, pauses and nods, then keeps reading.",
 "music": "He plays the guqin zither on his lap, sitting cross-legged: his right hand plucks the strings, his left hand presses and slides along them, his head sways gently with the music.",
 "sleep": "He sleeps lying on his side on a straw mat, head resting on his arm: slow peaceful breathing, his chest and shoulder rise and fall gently, nothing else moves.",
}
def req(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    for attempt in range(6):
        r = urllib.request.Request(API + path, data=data, method=method,
            headers={"Authorization": f"Bearer {TOK}", "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(r, timeout=120) as res: return json.load(res)
        except urllib.error.HTTPError as e:
            if e.code == 429 and "concurrent" in e.read().decode():
                time.sleep(15); continue
            raise
        except (urllib.error.URLError, ConnectionError, TimeoutError) as e:
            print("net retry", path, e, flush=True); time.sleep(5 * (attempt + 1))
    raise RuntimeError("network failed: " + path)
def balance(): return req("GET", "/balance")["subscription"]["generations"]
def run(act, frames=8, seed=0):
    out = f"{HERE}/out/{act}"
    os.makedirs(out, exist_ok=True)
    if len(os.listdir(out)) >= frames: print(act, "already done", flush=True); return True
    first = base64.b64encode(open(f"{HERE}/first/{act}.png", "rb").read()).decode()
    try:
        job = req("POST", "/animate-with-text-v3", {"first_frame": {"type": "base64", "base64": first, "format": "png"},
            "action": SIDE + ACTIONS[act], "frame_count": frames, "no_background": True, "seed": seed})
    except urllib.error.HTTPError as e:
        print(act, "HTTP", e.code, e.read().decode()[:400], flush=True); return False
    jid = job.get("background_job_id") or job.get("id")
    for _ in range(120):
        time.sleep(5)
        st = req("GET", f"/background-jobs/{jid}")
        if st["status"] == "completed":
            imgs = st["last_response"]["images"]
            for i, im in enumerate(imgs):
                open(f"{out}/{i:02d}.png", "wb").write(base64.b64decode(im["base64"]))
            print(act, "ok", len(imgs), "frames", flush=True); return True
        if st["status"] == "failed":
            print(act, "failed", json.dumps(st.get("last_response"))[:300], flush=True); return False
    print(act, "timeout", jid, flush=True); return False
if __name__ == "__main__":
    before = balance()
    for act in sys.argv[2:] or list(ACTIONS): run(act)
    print("generations", before, "->", balance())
