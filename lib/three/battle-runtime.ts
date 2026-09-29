import * as THREE from "three";
import { useBattleStore } from "@/store/battle-store";
import { SKILLS, type BattleState, type Side } from "@/lib/game";
import { CHARACTER_CLIPS, CHARACTER_FEET_Y, CHARACTER_FRAME_SIZE, type CharacterId, type CharacterMotion } from "@/lib/characters/catalog";
import { loadCharacterAtlas } from "@/lib/characters/sheet";
import { BATTLE_BACKGROUNDS, type BattleBackground } from "./battle-background";

const WIDTH = 768;
const HEIGHT = 432;
const GROUND = 369;
const HIT_DELAY = 300;
const HIT_GAP = 100;
type Cast = NonNullable<BattleState["lastCast"]>;
type PixelMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
interface FrameBounds {
  left: number;
  right: number;
  strikeY: number;
  rows: ({ left: number; right: number } | null)[];
}

interface Fighter {
  mesh: PixelMesh;
  shadow: PixelMesh;
  ring: PixelMesh;
  texture: THREE.Texture;
  character: string;
  beast: boolean;
  /** Single-pose unique sprite: poses come from lunge/recoil/breath, not frames. */
  still?: boolean;
  baseX: number;
  width: number;
  height: number;
  feet: number;
  columns: number;
  rows: number;
  frameBounds: FrameBounds[];
  frame: number;
  motion: CharacterMotion;
  motionStarted: number;
  hurtUntil: number;
  flashUntil: number;
}

interface Effect {
  mesh: PixelMesh;
  born: number;
  life: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  spin: number;
  grow: number;
  opacity: number;
  ownTexture?: boolean;
}

export interface BattleRuntimeOptions {
  characterA: CharacterId;
  characterB: CharacterId;
  /** Unique single-pose pixel sprite for fighter B (a sparring NPC); archetype sheet otherwise. */
  spriteB?: string;
  creatureFrame?: number | null;
  background?: BattleBackground;
  onReady: () => void;
  onError: () => void;
  onCastProgress?: (progress: BattleCastProgress) => void;
}

export interface BattleCastProgress { seq: number; hits: number; complete: boolean }

/** A single Three.js scene owns the battle's animation clock and GPU resources. */
export function createBattleRuntime(parent: HTMLElement, options: BattleRuntimeOptions): { destroy: () => void } {
  let destroyed = false;
  let failed = false;
  let ready = false;
  let animationFrame = 0;
  let lastTime = 0;
  let elapsed = 0;
  let castSequence = -1;
  let impactCount = 0;
  let shakeUntil = 0;
  let activeCast: { cast: Cast; started: number; nextHit: number; duration: number; support: boolean } | null = null;
  let label: { mesh: PixelMesh; born: number; until: number } | null = null;
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = motionPreference.matches;
  const font = getComputedStyle(document.body).fontFamily;
  const owned = new Set<{ dispose: () => void }>();
  const effects: Effect[] = [];
  const fighters: Fighter[] = [];
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x172723);
  const camera = new THREE.OrthographicCamera(0, WIDTH, HEIGHT, 0, 0.1, 100);
  camera.position.z = 10;
  let renderer: THREE.WebGLRenderer | undefined;
  let observer: ResizeObserver | undefined;

  function frameFront(fighter: Fighter, attack = false): number {
    const bounds = fighter.frameBounds[fighter.beast ? fighter.frame : attack ? 10 : 0] ?? { left: -0.3, right: 0.3 };
    return Math.max(14, (fighter.beast ? -bounds.left : bounds.right) * fighter.width);
  }

  function contactPoint(attacker: Fighter, target: Fighter, hurt = true) {
    const strike = attacker.frameBounds[attacker.beast ? attacker.frame : 10];
    const y = strike ? GROUND - (attacker.feet - strike.strikeY) * attacker.height : GROUND - 91;
    const targetBounds = target.frameBounds[target.beast ? target.frame : hurt ? 12 : 0];
    const targetRow = targetBounds ? Math.round(((y - GROUND) / target.height + target.feet) * targetBounds.rows.length) : 0;
    const nearby = targetBounds?.rows.slice(Math.max(0, targetRow - 4), targetRow + 5).filter((row) => row !== null) ?? [];
    const targetFront = nearby.length ? Math.max(...nearby.map((row) => target.beast ? -row.left : row.right)) * target.width : frameFront(target);
    return { y, targetFront, distance: Math.max(32, frameFront(attacker, true) + targetFront - 2) };
  }

  function own<T extends { dispose: () => void }>(resource: T): T {
    owned.add(resource);
    return resource;
  }
  function release(resource: { dispose: () => void }) {
    owned.delete(resource);
    resource.dispose();
  }
  function fail() {
    if (destroyed || failed) return;
    failed = true;
    parent.dataset.ready = "false";
    cancelAnimationFrame(animationFrame);
    options.onError();
  }
  function onContextLost(event: Event) {
    event.preventDefault();
    fail();
  }
  function onMotionChange(event: MediaQueryListEvent) {
    reduced = event.matches;
    parent.dataset.reducedMotion = String(reduced);
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(animationFrame);
    observer?.disconnect();
    motionPreference.removeEventListener("change", onMotionChange);
    renderer?.domElement.removeEventListener("webglcontextlost", onContextLost);
    for (const resource of owned) resource.dispose();
    owned.clear();
    scene.clear();
    renderer?.dispose();
    renderer?.forceContextLoss();
    renderer?.domElement.remove();
  }

  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "low-power" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;image-rendering:pixelated";
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.dataset.renderer = "three";
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    parent.appendChild(renderer.domElement);
    const resize = () => {
      if (destroyed || !renderer) return;
      const width = Math.max(1, Math.round(parent.clientWidth));
      const height = Math.max(1, Math.round(parent.clientHeight));
      renderer.setSize(width, height, false);
      // Crop scenery instead of stretching sprites. Narrow screens bring the
      // fighters closer; wide screens use more courtyard and less empty sky.
      const ratio = width / height;
      const viewHeight = Math.min(HEIGHT, WIDTH / ratio);
      const viewWidth = viewHeight * ratio;
      camera.left = (WIDTH - viewWidth) / 2;
      camera.right = camera.left + viewWidth;
      camera.top = viewHeight;
      camera.bottom = 0;
      camera.updateProjectionMatrix();
      fighters.forEach((fighter, index) => { fighter.baseX = camera.left + viewWidth * (index ? 0.73 : 0.27); });
      if (label) {
        label.mesh.position.y = camera.top - 45;
        label.mesh.visible = width >= 900;
      }
      parent.dataset.viewWidth = viewWidth.toFixed(1);
      parent.dataset.viewHeight = viewHeight.toFixed(1);
      if (ready) renderer.render(scene, camera);
    };
    observer = new ResizeObserver(resize);
    observer.observe(parent);
    resize();
    motionPreference.addEventListener("change", onMotionChange);
    parent.dataset.renderer = "three";
    parent.dataset.reducedMotion = String(reduced);
    parent.dataset.impactCount = "0";
    parent.dataset.castSeq = "-1";
  } catch {
    fail();
    return { destroy };
  }

  const plane = own(new THREE.PlaneGeometry(1, 1));
  const circle = own(new THREE.CircleGeometry(1, 40));
  const ring = own(new THREE.RingGeometry(0.96, 1, 64));
  const arc = own(new THREE.RingGeometry(0.89, 1, 36, 1, -Math.PI * 0.64, Math.PI * 1.28));

  function texture(image: HTMLCanvasElement | HTMLImageElement) {
    const map = own(new THREE.Texture(image));
    map.colorSpace = THREE.SRGBColorSpace;
    map.magFilter = THREE.NearestFilter;
    map.minFilter = THREE.NearestFilter;
    map.generateMipmaps = false;
    map.needsUpdate = true;
    return map;
  }
  function mesh(geometry: THREE.BufferGeometry, color: number, order: number, map?: THREE.Texture): PixelMesh {
    const material = own(new THREE.MeshBasicMaterial({
      color, map, transparent: true, depthTest: false, depthWrite: false,
      side: THREE.DoubleSide, toneMapped: false,
    }));
    const item = new THREE.Mesh(geometry, material);
    item.renderOrder = order;
    scene.add(item);
    return item;
  }
  function place(item: PixelMesh, x: number, y: number, width: number, height: number) {
    item.position.set(x, HEIGHT - y, 0);
    item.scale.set(width, height, 1);
  }
  function remove(item: PixelMesh, ownTexture = false) {
    scene.remove(item);
    if (ownTexture && item.material.map) release(item.material.map);
    release(item.material);
  }
  function textMesh(text: string, color: string, size: number, banner = false) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Battle label canvas is unavailable");
    const scale = 2;
    context.font = `600 ${size * scale}px ${font}`;
    const width = Math.min(620, Math.ceil(context.measureText(text).width / scale) + (banner ? 64 : 24));
    const height = size + 28;
    canvas.width = width * scale;
    canvas.height = height * scale;
    context.scale(scale, scale);
    if (banner) {
      context.fillStyle = "rgba(15, 34, 30, .86)";
      context.fillRect(0, 1, width, height - 2);
      context.fillStyle = "#b89d63";
      context.fillRect(14, 0, width - 28, 1);
      context.fillRect(14, height - 1, width - 28, 1);
      context.fillStyle = "#d9bd83";
      context.fillRect(12, height / 2 - 2, 4, 4);
      context.fillRect(width - 16, height / 2 - 2, 4, 4);
    }
    context.font = `600 ${size}px ${font}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineJoin = "round";
    context.strokeStyle = "#152620";
    context.lineWidth = size >= 30 ? 6 : 4;
    context.strokeText(text, width / 2, height / 2 + 1, width - 24);
    context.fillStyle = color;
    context.fillText(text, width / 2, height / 2 + 1, width - 24);
    const item = mesh(plane, 0xffffff, 40, texture(canvas));
    item.scale.set(width, height, 1);
    return item;
  }
  function addEffect(item: PixelMesh, x: number, y: number, width: number, height: number,
    life: number, extra: Partial<Effect> = {}) {
    const effect: Effect = { mesh: item, born: elapsed, life, x, y, vx: 0, vy: 0,
      width, height, spin: 0, grow: 0, opacity: 1, ...extra };
    place(item, x, y, width, height);
    effects.push(effect);
  }
  function setFrame(fighter: Fighter, frame: number, side: number) {
    if (!fighter.beast && !fighter.still && frame !== fighter.frame) {
      fighter.texture.offset.set(frame % fighter.columns / fighter.columns,
        1 - (Math.floor(frame / fighter.columns) + 1) / fighter.rows);
    }
    fighter.frame = frame;
    parent.dataset[side ? "fighterBFrame" : "fighterAFrame"] = String(frame);
  }
  function setMotion(fighter: Fighter, motion: CharacterMotion, side: number) {
    if (fighter.motion !== motion) {
      fighter.motion = motion;
      fighter.motionStarted = elapsed;
      parent.dataset[side ? "fighterBMotion" : "fighterAMotion"] = motion;
    }
  }
  function beginCast(cast: Cast) {
    castSequence = cast.seq;
    parent.dataset.castSeq = String(cast.seq);
    activeCast = { cast, started: elapsed, nextHit: 0, duration: HIT_DELAY + cast.hits * HIT_GAP + 500,
      support: cast.hitDamages.every((damage) => damage === 0) && !cast.hitMisses.some(Boolean) };
    options.onCastProgress?.({ seq: cast.seq, hits: 0, complete: false });
    if (label) remove(label.mesh, true);
    const colors = ["#f7edcf", "#b7e9cc", "#abd3ed", "#e3bcec", "#f4cc91"];
    const item = textMesh(cast.name, colors[cast.tier] ?? colors[0], 18, true);
    item.position.set(WIDTH / 2, camera.top - 45, 0);
    item.visible = parent.clientWidth >= 900;
    label = { mesh: item, born: elapsed, until: elapsed + activeCast.duration };
  }
  function hit(cast: Cast, index: number, support: boolean) {
    const attackerSide = cast.side === "A" ? 0 : 1;
    const targetSide = support ? attackerSide : 1 - attackerSide;
    const target = fighters[targetSide];
    const missed = cast.hitMisses[index];
    const damage = cast.hitDamages[index] ?? 0;
    const critical = cast.hitCrits[index];
    const contact = contactPoint(fighters[attackerSide], target, !missed);
    const x = target.mesh.position.x + (targetSide ? -1 : 1) * contact.targetFront;
    const y = contact.y;
    parent.dataset.contactX = x.toFixed(1);
    parent.dataset.contactY = y.toFixed(1);
    // Hero's Adventure-style big numbers: the player's hits read warm gold,
    // hits on the player read red, crits are larger with a 暴擊 tag.
    const onPlayer = targetSide === 0;
    const color = missed ? "#c7d3c5" : support ? "#9ff0b4" : critical ? "#ffd24a" : onPlayer ? "#ff7a64" : "#fff0c8";
    const text = missed ? "พลาด" : damage > 0 ? String(damage) : "ปราณ";
    const number = textMesh(text, color, missed ? 24 : critical ? 44 : damage > 0 ? 34 : 24);
    const numberX = target.mesh.position.x + (index % 3 - 1) * 26, numberY = GROUND - 158 - (index % 2) * 20;
    addEffect(number, numberX, numberY, number.scale.x, number.scale.y, reduced ? 700 : 900,
      { vy: reduced ? 0 : -46, ownTexture: true, grow: critical && !reduced ? 0.12 : 0 });
    if (critical && !missed && damage > 0) {
      const tag = textMesh("暴擊", "#ffe9a8", 18, true);
      addEffect(tag, numberX, numberY - 38, tag.scale.x, tag.scale.y, reduced ? 700 : 900,
        { vy: reduced ? 0 : -46, ownTexture: true });
    }
    impactCount++;
    parent.dataset.impactCount = String(impactCount);
    parent.dataset.lastImpact = `${cast.seq}:${index}`;
    options.onCastProgress?.({ seq: cast.seq, hits: index + 1, complete: false });
    if (missed) return;
    if (damage > 0) {
      target.hurtUntil = elapsed + 180;
      target.flashUntil = elapsed + 70;
      if (!reduced) shakeUntil = elapsed + (critical ? 85 : 55);
    }
    if (reduced) return;
    if (support) {
      const aura = mesh(ring, 0xbbe8c2, 25);
      addEffect(aura, x, GROUND - 38, 34, 48, 480, { grow: 0.7, opacity: 0.8 });
      return;
    }
    const unarmed = fighters[attackerSide].beast || SKILLS.find((skill) => skill.n === cast.name)?.w === "fist";
    const slash = mesh(unarmed ? ring : arc, critical ? 0xffe4a0 : 0xf2f0d0, 25);
    slash.rotation.z = attackerSide ? Math.PI + 0.32 : -0.32;
    addEffect(slash, x, y, unarmed ? 12 : critical ? 46 : 34, unarmed ? 16 : critical ? 69 : 57, 230,
      { grow: unarmed ? 1.2 : 0.25, spin: attackerSide ? -1.9 : 1.9, opacity: 0.94 });
    const count = critical ? 11 : 7;
    for (let n = 0; n < count; n++) {
      const spark = mesh(plane, n % 3 === 0 ? 0xc56b43 : 0xffdc95, 30);
      const angle = n * 2.39996 + index;
      const speed = 50 + n * 12;
      addEffect(spark, x, y, n % 3 === 0 ? 4 : 2, n % 3 === 0 ? 2 : 3, 260 + n * 14,
        { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, spin: n % 2 ? 2 : -2 });
    }
  }
  function updateFighter(fighter: Fighter, index: number, state: BattleState) {
    const side: Side = index ? "B" : "A";
    const age = activeCast ? elapsed - activeCast.started : 0;
    const lastImpact = activeCast ? HIT_DELAY + (activeCast.cast.hitDamages.length - 1) * HIT_GAP : 0;
    const outcomeReady = !!state.winner && (!activeCast || age >= lastImpact + 240);
    let motion: CharacterMotion = "idle";
    let lunge = 0;
    if (outcomeReady) motion = state.winner === side ? "victory" : "defeat";
    else if (fighter.hurtUntil > elapsed) motion = "hurt";
    else if (activeCast?.cast.side === side && age < lastImpact + 280) {
      motion = activeCast.support ? "guard" : "attack";
      if (!reduced && !activeCast.support) {
        const approach = Math.min(1, Math.max(0, (age - 70) / 200));
        const retreat = Math.min(1, Math.max(0, (age - lastImpact - 65) / 220));
        const target = fighters[1 - index];
        const contactDistance = contactPoint(fighter, target, !activeCast.cast.hitMisses.every(Boolean)).distance;
        const travel = Math.max(0, Math.abs(target.baseX - fighter.baseX) - contactDistance);
        lunge = Math.sin(approach * Math.PI / 2) * (1 - retreat) * travel;
      }
    } else if ((state.phase === "enemy" && index === 1) || (state.phase === "player" && index === 0)) motion = "guard";
    setMotion(fighter, motion, index);
    let frame = fighter.frame;
    if (!fighter.beast) {
      const clip = CHARACTER_CLIPS[motion];
      if (motion === "attack") {
        // Anticipation, draw, contact at 300ms, then recovery. Repeated contacts
        // alternate authored strike/recovery poses at the engine's 100ms gap.
        frame = reduced ? 10 : age < 135 ? 8 : age < HIT_DELAY ? 9 :
          age < lastImpact + 100 ? 10 + (Math.floor((age - HIT_DELAY) / HIT_GAP) % 2) : 11;
      } else {
        const progress = reduced ? 0 : Math.floor((elapsed - fighter.motionStarted) * clip.fps / 1000);
        frame = clip.frames[clip.repeat === -1 ? progress % clip.frames.length : Math.min(progress, clip.frames.length - 1)];
      }
    }
    setFrame(fighter, frame, index);
    const recoil = reduced || motion !== "hurt" ? 0 : Math.sin((fighter.hurtUntil - elapsed) / 180 * Math.PI) * 7;
    const x = fighter.baseX + (index ? -lunge + recoil : lunge - recoil);
    parent.dataset[index ? "fighterBX" : "fighterAX"] = x.toFixed(1);
    const breath = (fighter.beast || fighter.still) && !reduced && (motion === "idle" || motion === "guard") ? Math.sin(elapsed / 450 + index) * 0.008 : 0;
    const defeat = fighter.beast && motion === "defeat";
    const height = fighter.height * (defeat ? 0.68 : 1 + breath);
    const y = GROUND - (fighter.feet - 0.5) * height;
    place(fighter.mesh, Math.round(x), y, fighter.width * (index && !fighter.beast ? -1 : 1), height);
    fighter.mesh.material.color.setHex(fighter.flashUntil > elapsed ? 0xffc3a0 : 0xffffff);
    fighter.mesh.material.opacity = motion === "defeat" ? 0.72 : 1;
    place(fighter.shadow, Math.round(x), GROUND + 1, fighter.beast ? 53 : 32, 8);
    const active = !state.winner && ((state.phase === "player" && !index) || (state.phase === "enemy" && index === 1));
    fighter.ring.material.opacity = active ? 0.54 : 0.12;
    place(fighter.ring, Math.round(x), GROUND + 1, fighter.beast ? 61 : 46, 11);
  }
  function update(now: number) {
    if (destroyed || failed) return;
    animationFrame = requestAnimationFrame(update);
    const delta = lastTime ? Math.min(100, Math.max(0, now - lastTime)) : 0;
    lastTime = now;
    const paused = document.hidden || !!document.querySelector('[role="dialog"], dialog[open]');
    parent.dataset.paused = String(paused);
    if (paused) return;
    try {
      elapsed += delta;
      // The store uses wall time for cast holds. Keep its clock held until the
      // visible sequence has completed too, including time spent in a dialog.
      if (!activeCast || elapsed - activeCast.started >= activeCast.duration) useBattleStore.getState().tick(delta);
      const state = useBattleStore.getState().state;
      if (!state) return;
      if (state.lastCast && state.lastCast.seq !== castSequence) beginCast(state.lastCast);
      if (activeCast) {
        const age = elapsed - activeCast.started;
        while (activeCast.nextHit < activeCast.cast.hitDamages.length && age >= HIT_DELAY + activeCast.nextHit * HIT_GAP) {
          hit(activeCast.cast, activeCast.nextHit++, activeCast.support);
        }
        if (age >= activeCast.duration) {
          options.onCastProgress?.({ seq: activeCast.cast.seq, hits: activeCast.nextHit, complete: true });
          activeCast = null;
        }
      }
      fighters.forEach((fighter, index) => updateFighter(fighter, index, state));
      for (let index = effects.length - 1; index >= 0; index--) {
        const effect = effects[index];
        const age = elapsed - effect.born;
        if (age >= effect.life) {
          remove(effect.mesh, effect.ownTexture);
          effects.splice(index, 1);
          continue;
        }
        const t = age / effect.life;
        const growth = 1 + t * effect.grow;
        place(effect.mesh, effect.x + effect.vx * age / 1000, effect.y + effect.vy * age / 1000,
          effect.width * growth, effect.height * growth);
        effect.mesh.rotation.z += reduced ? 0 : effect.spin * delta / 1000;
        effect.mesh.material.opacity = effect.opacity * Math.min(1, (1 - t) * 2.3);
      }
      if (label) {
        label.mesh.material.opacity = Math.min(1, Math.max(0, (label.until - elapsed) / 180));
        if (elapsed >= label.until) { remove(label.mesh, true); label = null; }
      }
      const shake = !reduced && elapsed < shakeUntil ? Math.sin(elapsed * 0.13) * 1.6 : 0;
      camera.position.x = shake;
      camera.position.y = shake * 0.4;
      renderer?.render(scene, camera);
    } catch { fail(); }
  }

  async function initialize() {
    const creatureFrame = options.creatureFrame ?? null;
    const backdrop = options.background ?? BATTLE_BACKGROUNDS.courtyard;
    const [stage, atlasA, atlasB, creature, uniqueB] = await Promise.all([
      loadImage(backdrop.image), loadCharacterAtlas(options.characterA),
      creatureFrame === null ? loadCharacterAtlas(options.characterB) : Promise.resolve(null),
      creatureFrame !== null ? loadImage("/art/creature-atlas.png") : Promise.resolve(null),
      creatureFrame === null && options.spriteB ? stillAtlas(options.spriteB).catch(() => null) : Promise.resolve(null),
    ]);
    if (destroyed || failed) return;
    parent.dataset.backgroundImage = backdrop.image;
    const background = mesh(plane, 0xffffff, 0, texture(stage));
    place(background, WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT);
    const shade = mesh(plane, 0x10251e, 1);
    shade.material.opacity = 0.12;
    place(shade, WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT);
    [atlasA, uniqueB ?? atlasB].forEach((atlas, index) => {
      const beast = index === 1 && creatureFrame !== null && creature !== null;
      const still = index === 1 && !!uniqueB;
      const source = beast ? creature : atlas?.image;
      if (!source) throw new Error("Battle fighter texture is unavailable");
      const map = texture(source);
      let feet = atlas ? atlas.feetY / atlas.frameSize : 1;
      let height = 128 * 1.55;
      let width = height;
      let frame = 0;
      const frameBounds = still && atlas ? Array.from({ length: 16 }, () => characterBounds(atlas.image, atlas.frameSize)[0])
        : atlas ? characterBounds(atlas.image, atlas.frameSize) : [];
      const columns = atlas ? atlas.image.width / atlas.frameSize : 4;
      const rows = atlas ? atlas.image.height / atlas.frameSize : 2;
      if (beast && creature) {
        frame = creatureFrame;
        map.repeat.set(0.25, 0.5);
        map.offset.set(frame % 4 / 4, 1 - (Math.floor(frame / 4) + 1) / 2);
        feet = creatureFeet(creature, frame);
        frameBounds[frame] = creatureBounds(creature, frame);
        height = 200;
        width = height * (creature.width / 4) / (creature.height / 2);
      } else {
        map.repeat.set(1 / columns, 1 / rows);
        map.offset.set(0, 1 - 1 / rows);
      }
      const baseX = camera.left + (camera.right - camera.left) * (index ? 0.73 : 0.27);
      const shadow = mesh(circle, 0x0a1819, 5);
      shadow.material.opacity = 0.42;
      const groundRing = mesh(ring, index ? 0xe4ae7c : 0xd9dcb0, 6);
      const actor = mesh(plane, 0xffffff, 10 + index, map);
      const character = beast ? `beast-${frame}` : index ? options.characterB : options.characterA;
      const fighter: Fighter = { mesh: actor, shadow, ring: groundRing, texture: map, character, beast, still,
        baseX, width, height, feet, columns, rows, frameBounds, frame, motion: "idle", motionStarted: 0, hurtUntil: 0, flashUntil: 0 };
      fighters.push(fighter);
      parent.dataset[index ? "fighterBCharacter" : "fighterACharacter"] = character;
      parent.dataset[index ? "fighterBMotion" : "fighterAMotion"] = "idle";
      setFrame(fighter, frame, index);
      place(actor, baseX, GROUND - (feet - 0.5) * height, width * (index && !beast ? -1 : 1), height);
      place(shadow, baseX, GROUND + 1, beast ? 53 : 32, 8);
      place(groundRing, baseX, GROUND + 1, beast ? 61 : 46, 11);
      groundRing.material.opacity = 0.12;
    });
    ready = true;
    renderer?.render(scene, camera);
    options.onReady();
    animationFrame = requestAnimationFrame(update);
  }
  void initialize().catch(fail);
  return { destroy };
}

/** A unique NPC sprite in one 128 px frame, with the archetype sheets' figure height and feet line. */
async function stillAtlas(url: string) {
  const image = await loadImage(url);
  // Same proportions as a 128 px sheet frame (figure 108, feet at 120), at the
  // source's own density so the denser battle art is never downsampled.
  const unit = Math.max(1, image.height / 108, image.width / 124);
  const size = Math.round(CHARACTER_FRAME_SIZE * unit), feet = Math.round(CHARACTER_FEET_Y * unit);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Battle sprite canvas is unavailable");
  context.imageSmoothingEnabled = false;
  const scale = Math.min(108 * unit / image.height, 124 * unit / image.width);
  const width = Math.round(image.width * scale), height = Math.round(image.height * scale);
  context.drawImage(image, Math.round((size - width) / 2), feet - height, width, height);
  return { image: canvas, frameSize: size, feetY: feet };
}

/** Horizontal visible bounds, relative to the normalized cell center. */
function characterBounds(image: HTMLCanvasElement, size: number) {
  const context = image.getContext("2d", { willReadFrequently: true });
  return Array.from({ length: 16 }, (_, frame) => {
    if (!context) return { left: -0.3, right: 0.3, strikeY: 0.4, rows: [] };
    const pixels = context.getImageData(frame % 4 * size, Math.floor(frame / 4) * size, size, size).data;
    return alphaBounds(pixels, size);
  });
}

function creatureBounds(image: HTMLImageElement, frame: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return { left: -0.4, right: 0.4, strikeY: 0.4, rows: [] };
  context.drawImage(image, frame % 4 * image.width / 4, Math.floor(frame / 4) * image.height / 2,
    image.width / 4, image.height / 2, 0, 0, 128, 128);
  return alphaBounds(context.getImageData(0, 0, 128, 128).data, 128, true);
}

/** Match upper-body contact, avoiding robes and feet that widen a pose. */
function alphaBounds(pixels: Uint8ClampedArray, size: number, facesLeft = false): FrameBounds {
  let left = size, right = 0;
  const rows: FrameBounds["rows"] = Array.from({ length: size }, () => null);
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] <= 64) continue;
    const pixel = (i - 3) / 4;
    const x = pixel % size, y = Math.floor(pixel / size);
    left = Math.min(left, x); right = Math.max(right, x + 1);
    const row = rows[y] ?? { left: 0.5, right: -0.5 };
    row.left = Math.min(row.left, x / size - 0.5);
    row.right = Math.max(row.right, (x + 1) / size - 0.5);
    rows[y] = row;
  }
  const upper = rows.map((row, y) => ({ row, y })).filter(({ row, y }) => row && y > size * 0.15 && y < size * 0.7);
  const front = Math.max(...upper.map(({ row }) => facesLeft ? -row!.left : row!.right));
  const tips = upper.filter(({ row }) => (facesLeft ? -row!.left : row!.right) >= front - 2 / size);
  const strikeY = tips.length ? tips.reduce((sum, tip) => sum + tip.y, 0) / tips.length / size : 0.4;
  return { left: left / size - 0.5, right: right / size - 0.5, strikeY, rows };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Battle artwork failed to load: ${url}`));
    image.src = url;
  });
}

/** Keep the existing eight species in their own cells, anchored by visible feet. */
function creatureFeet(image: HTMLImageElement, frame: number): number {
  const column = frame % 4;
  const row = Math.floor(frame / 4);
  const left = Math.round(column * image.width / 4);
  const top = Math.round(row * image.height / 2);
  const width = Math.round((column + 1) * image.width / 4) - left;
  const height = Math.round((row + 1) * image.height / 2) - top;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return 1;
  context.drawImage(image, left, top, width, height, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  for (let index = pixels.length - 1; index >= 3; index -= 4) {
    if (pixels[index] > 32) return (Math.floor(index / 4 / width) + 1) / height;
  }
  return 1;
}
