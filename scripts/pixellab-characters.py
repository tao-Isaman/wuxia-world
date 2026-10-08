"""Download PixelLab characters (rotations + every animation) for the sheet builders.

    PIXELLAB_API_TOKEN=... python3 scripts/pixellab-characters.py <raw dir> [game id ...]

scripts/pixellab-characters.json maps each game id (a hero body, an NPC, an
enemy type, `beast_<kind>`) to its PixelLab character id. For every one this
writes

    <raw>/<game id>/rotations/<direction>.png
    <raw>/<game id>/<animation name>/<direction>/NN.png
    <raw>/<game id>/meta.json        (the character as the API returned it)

where the animation name is the display name given when it was animated
(walk, idle, attack, hurt, stance, defeat, victory…). Ids not given are all
fetched; files already on disk are kept. `bun scripts/build-pixellab-sheets.ts`
packs humans into character sheets and `bun scripts/build-anim-sheets.ts`
packs beasts (docs/assets.md#pixellab-characters).
"""
import json, os, sys, time, urllib.error, urllib.request

API = "https://api.pixellab.ai/v2"
TOK = os.environ.get("PIXELLAB_API_TOKEN") or sys.exit("set PIXELLAB_API_TOKEN")
HERE = os.path.dirname(os.path.abspath(__file__))
# The file host refuses urllib's default agent.
AGENT = "Mozilla/5.0 (X11; Linux x86_64) wuxia-world"


def get(url, auth=False):
    headers = {"User-Agent": AGENT}
    if auth: headers["Authorization"] = f"Bearer {TOK}"
    for attempt in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=90) as res:
                return res.read()
        except (urllib.error.URLError, ConnectionError, TimeoutError) as e:
            if isinstance(e, urllib.error.HTTPError) and e.code < 500 and e.code != 429: raise
            time.sleep(3 * (attempt + 1))
    raise RuntimeError("download failed: " + url)


def save(url, path):
    if os.path.exists(path): return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = get(url)
    with open(path + ".part", "wb") as f: f.write(data)
    os.replace(path + ".part", path)


def fetch(game_id, character_id, raw):
    meta = json.loads(get(f"{API}/characters/{character_id}", auth=True))
    if meta.get("status") != "completed":
        print(game_id, "not ready:", meta.get("status"), flush=True); return False
    out = os.path.join(raw, game_id)
    for direction, url in (meta.get("rotation_urls") or {}).items():
        save(url, os.path.join(out, "rotations", f"{direction}.png"))
    clips = []
    for anim in meta.get("animations") or []:
        name = anim.get("display_name") or anim.get("animation_type")
        for d in anim.get("directions") or []:
            for i, url in enumerate(d.get("frames") or []):
                save(url, os.path.join(out, name, d["direction"], f"{i:02d}.png"))
            clips.append(f"{name}/{d['direction']}×{len(d.get('frames') or [])}")
    with open(os.path.join(out, "meta.json"), "w") as f: json.dump(meta, f, indent=1)
    print(game_id, "ok:", ", ".join(sorted(clips)) or "rotations only", flush=True)
    return True


if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit(__doc__)
    raw = sys.argv[1]
    with open(os.path.join(HERE, "pixellab-characters.json")) as f: manifest = json.load(f)
    ids = sys.argv[2:] or list(manifest)
    missing = [i for i in ids if i not in manifest]
    if missing: sys.exit("not in scripts/pixellab-characters.json: " + ", ".join(missing))
    ok = all([fetch(i, manifest[i]["pixellab"], raw) for i in ids])
    sys.exit(0 if ok else 1)
