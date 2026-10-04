#!/usr/bin/env python3
"""
The asset library's PixelLab runner (docs/assets.md).

    PIXELLAB_API_TOKEN=... python3 scripts/assets/generate.py run <raw dir> <plan.json ...> [options]
    PIXELLAB_API_TOKEN=... python3 scripts/assets/generate.py balance <raw dir>

`run` reads plan jobs (scripts/assets/plan/<category>.json, written by
build-asset-plan.ts) and runs them in parallel against the PixelLab v2 API:

  v2       POST /generate-image-v2 (16 images at 43–85 px, 4 at 86–170, 64 at ≤ 42), polled
  pixen    POST /create-image-pixen (one image, sync)
  char3    POST /create-character-v3 (8 rotations), rotations downloaded
  tileset  POST /create-tileset (16 Wang tiles), polled

Raw output goes OUTSIDE the repo, to <raw dir>/out/<category>/<job id>/ (images
+ job.json). A job with a job.json is done, so a rerun resumes. The budget is
hard: <raw dir>/budget.json holds {"start": <balance when the library began>,
"cap": <generations allowed>}; nothing is submitted once the live balance minus
what is in flight would go below start − cap. Every submission is appended to
<raw dir>/ledger.jsonl. Style images: <raw dir>/style/<key>.png, picked by a
job's `style` field.

Options: --workers N (default 6), --only <prefix> (job ids starting with it),
--limit N (at most N new jobs), --dry (list what would run).
The token comes only from the environment; never commit one.
"""
import base64, json, math, os, random, sys, threading, time, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor

API = "https://api.pixellab.ai/v2"
TOK = os.environ.get("PIXELLAB_API_TOKEN")


class Busy(Exception):
    pass


def http(method, path, body=None, timeout=180):
    """JSON request. GETs retry on any network error; POSTs only when no response arrived."""
    data = json.dumps(body).encode() if body is not None else None
    for attempt in range(8):
        req = urllib.request.Request(API + path, data=data, method=method, headers={
            "Authorization": f"Bearer {TOK}", "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as res:
                return json.load(res)
        except urllib.error.HTTPError as e:
            text = e.read().decode(errors="replace")
            if e.code == 429:
                raise Busy(text[:200])
            if method == "GET" and e.code >= 500:
                time.sleep(5 * (attempt + 1)); continue
            raise RuntimeError(f"HTTP {e.code} {path}: {text[:400]}")
        except (urllib.error.URLError, ConnectionError, TimeoutError, OSError) as e:
            if method != "GET" and not isinstance(e, (ConnectionResetError, ConnectionRefusedError)) \
                    and "reset" not in str(e).lower() and "refused" not in str(e).lower():
                # A POST that may have reached the server: do not resubmit (could double-spend).
                raise RuntimeError(f"network {path}: {e}")
            time.sleep(4 * (attempt + 1))
    raise RuntimeError(f"network failed: {path}")


def download(url):
    for attempt in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (asset pipeline)"}), timeout=120) as res:
                return res.read()
        except Exception:
            time.sleep(4 * (attempt + 1))
    raise RuntimeError("download failed: " + url)


def balance():
    return float(http("GET", "/balance")["subscription"]["generations"])


def estimate(job):
    m = job["method"]
    w, h = job["size"]["w"], job["size"]["h"]
    if m == "v2":
        return 20
    if m == "pixen":
        return 1
    if m == "char3":
        s = max(w, h)
        return 1 + math.ceil(s * s * 8 / 65536)
    if m == "tileset":
        return job.get("estimate", 4)
    raise ValueError(m)


def b64file(path):
    return base64.b64encode(open(path, "rb").read()).decode()


def png_size(path):
    with open(path, "rb") as f:
        head = f.read(24)
    return int.from_bytes(head[16:20], "big"), int.from_bytes(head[20:24], "big")


class Runner:
    def __init__(self, raw, workers):
        self.raw = raw
        self.workers = workers
        self.lock = threading.Lock()
        self.inflight = 0.0
        self.stop = False
        b = json.load(open(os.path.join(raw, "budget.json")))
        self.floor = b["start"] - b["cap"]
        self.bal = balance()
        self.bal_at = time.time()
        self.done_count = 0
        self.fail_count = 0

    def log(self, **entry):
        entry["t"] = time.strftime("%Y-%m-%dT%H:%M:%S")
        with self.lock:
            with open(os.path.join(self.raw, "ledger.jsonl"), "a") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    def reserve(self, cost):
        with self.lock:
            if self.stop:
                return False
            if time.time() - self.bal_at > 20:
                try:
                    self.bal, self.bal_at = balance(), time.time()
                except Exception:
                    pass
            if self.bal - self.inflight - cost < self.floor:
                self.stop = True
                print(f"BUDGET: balance {self.bal} − in flight {self.inflight} − {cost} < floor {self.floor}; stopping", flush=True)
                return False
            self.inflight += cost
            return True

    def release(self, cost):
        with self.lock:
            self.inflight -= cost
            self.bal_at = 0  # refresh on the next reserve

    def outdir(self, job):
        return os.path.join(self.raw, "out", job["category"], job["id"])

    def submit(self, path, body):
        """POST with back-off on 429 (too many concurrent jobs)."""
        for attempt in range(40):
            try:
                return http("POST", path, body)
            except Busy as e:
                time.sleep(10 + random.random() * 10)
        raise RuntimeError("still busy: " + path)

    def poll(self, job_id, minutes=12):
        end = time.time() + minutes * 60
        while time.time() < end:
            time.sleep(6)
            st = http("GET", f"/background-jobs/{job_id}")
            if st["status"] == "completed":
                return st.get("last_response") or {}
            if st["status"] == "failed":
                raise RuntimeError("job failed: " + json.dumps(st.get("last_response"))[:300])
        raise RuntimeError("job timeout " + job_id)

    def style_ref(self, job):
        key = job.get("style")
        if not key:
            return None
        path = os.path.join(self.raw, "style", key + ".png")
        if not os.path.exists(path):
            return None
        w, h = png_size(path)
        return {"image": {"type": "base64", "base64": b64file(path), "format": "png"}, "size": {"width": w, "height": h},
                "usage_description": job.get("style_usage") or "match this pixel art style: palette, dark outline, shading and detail level; not its subject"}

    def run_job(self, job):
        out = self.outdir(job)
        if os.path.exists(os.path.join(out, "job.json")):
            return
        cost = estimate(job)
        if not self.reserve(cost):
            return
        t0 = time.time()
        meta = {"id": job["id"], "method": job["method"], "prompt": job.get("prompt") or f"{job.get('lower')} | {job.get('upper')}", "size": job["size"], "estimate": cost}
        try:
            os.makedirs(out, exist_ok=True)
            m = job["method"]
            seed = job.get("seed", random.randint(1, 2**31 - 1))
            meta["seed"] = seed
            w, h = job["size"]["w"], job["size"]["h"]
            if m == "v2":
                body = {"description": job["prompt"], "image_size": {"width": w, "height": h}, "no_background": True, "seed": seed}
                ref = self.style_ref(job)
                if ref:
                    body["style_image"] = ref
                    body["style_options"] = {"color_palette": True, "outline": True, "detail": True, "shading": True}
                r = self.submit("/generate-image-v2", body)
                meta["jobId"] = r.get("background_job_id")
                lr = self.poll(meta["jobId"])
                imgs = lr.get("images") or []
                for i, im in enumerate(imgs):
                    open(os.path.join(out, f"{i:02d}.png"), "wb").write(base64.b64decode(im["base64"]))
                meta["images"] = len(imgs)
            elif m == "pixen":
                body = {"description": job["prompt"], "image_size": {"width": w, "height": h}, "no_background": True,
                        "seed": seed, "view": job.get("view", "high top-down"), "outline": job.get("outline", "single color black outline")}
                if job.get("direction"):
                    body["direction"] = job["direction"]
                if job.get("detail"):
                    body["detail"] = job["detail"]
                r = self.submit("/create-image-pixen", body)
                open(os.path.join(out, "00.png"), "wb").write(base64.b64decode(r["image"]["base64"]))
                meta["images"] = 1
            elif m == "char3":
                body = {"description": job["prompt"], "image_size": {"width": w, "height": h}, "view": job.get("view", "high top-down"),
                        "template_id": job.get("template", "mannequin"), "no_background": True, "seed": seed,
                        "outline": "single color black outline", "detail": job.get("detail", "medium detail"), "name": job["id"][:50]}
                pending = os.path.join(out, "pending.json")
                if os.path.exists(pending):  # resume: the character already exists, only fetch it
                    r = json.load(open(pending))
                else:
                    r = self.submit("/create-character-v3", body)
                    json.dump({"character_id": r.get("character_id"), "background_job_id": r.get("background_job_id")}, open(pending, "w"))
                meta["jobId"] = r.get("background_job_id")
                meta["characterId"] = r.get("character_id")
                if meta["jobId"]:
                    self.poll(meta["jobId"], minutes=15)
                for _ in range(30):
                    c = http("GET", f"/characters/{meta['characterId']}")
                    if c.get("status") == "completed" and c.get("rotation_urls"):
                        break
                    time.sleep(6)
                urls = c.get("rotation_urls") or {}
                for direction, url in urls.items():
                    if url:
                        data = download(url)
                        open(os.path.join(out, f"{direction}.png"), "wb").write(data)
                meta["images"] = len([u for u in urls.values() if u])
            elif m == "tileset":
                body = {"lower_description": job["lower"], "upper_description": job["upper"],
                        "transition_description": job.get("transition", ""), "tile_size": {"width": w, "height": h},
                        "view": job.get("view", "high top-down"), "transition_size": job.get("transition_size", 0.25),
                        "outline": job.get("outline", "selective outline"), "shading": job.get("shading", "medium shading"),
                        "detail": job.get("detail", "medium detail"), "seed": seed}
                if job.get("shape_style"):
                    body["shape_style"] = job["shape_style"]
                    body["enhance"] = job.get("enhance", True)
                r = self.submit("/create-tileset", body)
                meta["jobId"] = r.get("background_job_id")
                meta["tilesetId"] = r.get("tileset_id")
                self.poll(meta["jobId"], minutes=15)
                ts = http("GET", f"/tilesets/{meta['tilesetId']}")
                tiles = ts["tileset"]["tiles"]
                info = []
                for i, tile in enumerate(tiles):
                    img = tile.get("image") or {}
                    data = img.get("base64") if isinstance(img, dict) else None
                    if data:
                        open(os.path.join(out, f"{i:02d}.png"), "wb").write(base64.b64decode(data))
                    info.append({k: v for k, v in tile.items() if k != "image"})
                json.dump(info, open(os.path.join(out, "tiles.json"), "w"), indent=1)
                meta["images"] = len(tiles)
            meta["secs"] = round(time.time() - t0)
            meta["finished"] = time.strftime("%Y-%m-%dT%H:%M:%S")
            json.dump(meta, open(os.path.join(out, "job.json"), "w"), ensure_ascii=False, indent=1)
            self.log(job=job["id"], method=job["method"], estimate=cost, images=meta.get("images"), ok=True)
            with self.lock:
                self.done_count += 1
            print(f"ok   {job['id']} ({meta.get('images')} img, {meta['secs']}s)", flush=True)
        except Exception as e:
            self.log(job=job["id"], method=job["method"], estimate=cost, ok=False, error=str(e)[:300])
            with self.lock:
                self.fail_count += 1
            print(f"FAIL {job['id']}: {str(e)[:200]}", flush=True)
        finally:
            self.release(cost)


def main():
    if len(sys.argv) < 3 or not TOK:
        sys.exit(__doc__)
    cmd, raw = sys.argv[1], sys.argv[2]
    if cmd == "balance":
        bal = balance()
        b = json.load(open(os.path.join(raw, "budget.json")))
        print(json.dumps({"balance": bal, "spent": b["start"] - bal, "cap": b["cap"], "left": bal - (b["start"] - b["cap"])}))
        return
    args = sys.argv[3:]
    opts = {"--workers": "6", "--only": "", "--limit": "0"}
    plans, dry = [], False
    i = 0
    while i < len(args):
        if args[i] in opts:
            opts[args[i]] = args[i + 1]; i += 2
        elif args[i] == "--dry":
            dry = True; i += 1
        else:
            plans.append(args[i]); i += 1
    jobs = []
    for p in plans:
        jobs += json.load(open(p))["jobs"]
    prefixes = [x for x in opts["--only"].split(",") if x]
    if prefixes:
        jobs = [j for j in jobs if any(j["id"].startswith(x) for x in prefixes)]
    runner = Runner(raw, int(opts["--workers"]))
    todo = [j for j in jobs if not os.path.exists(os.path.join(runner.outdir(j), "job.json"))]
    if int(opts["--limit"]):
        todo = todo[: int(opts["--limit"])]
    est = sum(estimate(j) for j in todo)
    print(f"{len(jobs)} jobs, {len(todo)} to run, ~{est} generations; balance {runner.bal}, floor {runner.floor}", flush=True)
    if dry:
        for j in todo:
            print(j["id"], j["method"], estimate(j))
        return
    with ThreadPoolExecutor(runner.workers) as pool:
        futures = [pool.submit(runner.run_job, j) for j in todo]
        for f in futures:
            if f.exception():
                print("ERROR", repr(f.exception()), flush=True)
    print(f"done {runner.done_count}, failed {runner.fail_count}, balance {balance()}", flush=True)


if __name__ == "__main__":
    main()
