import * as THREE from "../vendor/three.module.js";
import { createAudio } from "./audio.js";
import { loadSave, writeSave } from "./save.js";
import {
  FORMS,
  FORM_ORDER,
  HAZARDS,
  LANES,
  SKY,
  createRig,
  createShadow,
  createTrack,
  createVehicles,
  planeLift,
  spinVehicle,
} from "./world.js";

const UPGRADES = [
  { id: "accel", name: "Acceleration", desc: "Base speed +8%", max: 8, base: 24 },
  { id: "vitality", name: "Health", desc: "Max health +1", max: 4, base: 36 },
  { id: "quickshift", name: "Quick shift", desc: "Shift cooldown -0.12s", max: 6, base: 28 },
  { id: "shield", name: "Shield", desc: "Start each run with +1 shield", max: 3, base: 48 },
  { id: "magnet", name: "Magnet", desc: "Larger coin pickup radius", max: 5, base: 18 },
  { id: "bike", name: "Bike tune", desc: "Bike speed +6%", max: 5, base: 20 },
  { id: "tank", name: "Tank tune", desc: "Tank speed +6%", max: 5, base: 20 },
  { id: "boat", name: "Boat tune", desc: "Boat speed +6%", max: 5, base: 20 },
  { id: "plane", name: "Plane tune", desc: "Plane speed +6%", max: 5, base: 20 },
];

const AMP = { narrow: 0.12, pothole: 0.75, river: 1.05, barrier: 0.14, hit: 0.22 };

const save = loadSave();
const audio = createAudio();
audio.setMuted(save.muted);

const canvas = document.querySelector("#view");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

const scene = new THREE.Scene();
const fogColor = new THREE.Color(SKY.road);
scene.background = fogColor;
scene.fog = new THREE.Fog(SKY.road, 24, 78);
const wantSky = new THREE.Color(SKY.road);

const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 160);
scene.add(new THREE.HemisphereLight(0xc9d7ff, 0x2a2418, 0.95));
const sun = new THREE.DirectionalLight(0xfff1d6, 1.3);
sun.position.set(-3, 12, -8);
scene.add(sun);
const fill = new THREE.DirectionalLight(0x8eb6ff, 0.35);
fill.position.set(5, 4, 12);
scene.add(fill);

const vehicles = createVehicles();
const { rig, bubble, glow } = createRig(vehicles);
const shadow = createShadow();
const marker = new THREE.Mesh(
  new THREE.CircleGeometry(0.72, 20),
  new THREE.MeshBasicMaterial({ color: FORMS.bike.hex, transparent: true, opacity: 0.92, depthWrite: false })
);
marker.rotation.x = -Math.PI / 2;
scene.add(rig, shadow, marker);

const track = createTrack(scene);
const clock = new THREE.Clock();

const G = {
  mode: "menu",
  form: "bike",
  lane: 1,
  x: 0,
  z: 0,
  hp: 3,
  shield: 0,
  invuln: 0,
  cd: 0,
  combo: 0,
  maxCombo: 0,
  runCoins: 0,
  shake: 0,
  stumble: 0,
  dipAmp: 0.2,
  slow: 1,
  time: 0,
  dying: 0,
  warn: 0,
  kmAward: 0,
  taught: new Set(),
  tips: [],
  tipI: 0,
};

const crumbs = [];
const crumbMat = () =>
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false });
for (let i = 0; i < 10; i++) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), crumbMat());
  mesh.visible = false;
  scene.add(mesh);
  crumbs.push(mesh);
}
let crumbCursor = 0;
let crumbTimer = 0;

const hud = document.querySelector("#hud");
const flashEl = document.querySelector("#flash");
const toastEl = document.querySelector("#toast");
const callout = document.querySelector("#callout");
const screens = {
  menu: document.querySelector("#screen-menu"),
  shop: document.querySelector("#screen-shop"),
  help: document.querySelector("#screen-help"),
  pause: document.querySelector("#screen-pause"),
  over: document.querySelector("#screen-over"),
};

let flashAlpha = 0;
let toastTimer = 0;
let holdDir = 0;
let holdTimer = 0;
let lastNudge = 0;
let saveTimer = 0;
let hudKey = "";

function maxHp() {
  return 3 + (save.upgrades.vitality || 0);
}
function shiftCd() {
  return Math.max(0.26, 1.06 - (save.upgrades.quickshift || 0) * 0.12);
}
function baseSpd() {
  return 14.5 * (1 + (save.upgrades.accel || 0) * 0.08);
}
function formMul(id) {
  return FORMS[id].speed * (1 + (save.upgrades[id] || 0) * 0.06);
}
function magnetR() {
  return 0.72 + (save.upgrades.magnet || 0) * 0.26;
}
function priceOf(def) {
  const level = save.upgrades[def.id] || 0;
  return Math.round(def.base * 1.58 ** level);
}
function speedNow() {
  if (G.mode === "menu") return 9;
  if (G.mode === "dying") return 7 * Math.max(0, G.dying);
  if (G.mode !== "play") return 0;
  const diff = 1 + Math.min(0.7, G.z / 1800);
  return baseSpd() * diff * formMul(G.form) * G.slow;
}

function showScreen(name) {
  toastTimer = 0;
  toastEl.classList.remove("show");
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
}
function hideScreens() {
  for (const el of Object.values(screens)) el.hidden = true;
}

function toast(msg, time = 1.55) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  toastTimer = time;
}

function flash(color, amount) {
  flashEl.style.background = color;
  flashAlpha = amount;
}

function saveNow() {
  writeSave(save);
  saveTimer = 0;
}
function touchSave() {
  saveTimer = 0.25;
}

function grantCoins(n, silent) {
  if (n <= 0) return;
  save.coins += n;
  G.runCoins += n;
  if (!silent) audio.coin();
  touchSave();
}

function applyForm(id, pop) {
  G.form = id;
  for (const key of FORM_ORDER) {
    vehicles[key].visible = key === id;
    if (key === id && pop) vehicles[key].scale.setScalar(0.22);
  }
  glow.color.set(FORMS[id].hex);
  marker.material.color.set(FORMS[id].hex);
}

function changeForm(id) {
  if (G.mode !== "play" || id === G.form) return;
  if (G.cd > 0) {
    audio.deny();
    toast("Shift cooling down");
    return;
  }
  G.cd = shiftCd();
  applyForm(id, true);
  audio.shift();
}

function cycle(dir) {
  const i = FORM_ORDER.indexOf(G.form);
  changeForm(FORM_ORDER[(i + dir + FORM_ORDER.length) % FORM_ORDER.length]);
}

function nudge(dir) {
  if (G.mode !== "play") return;
  const now = performance.now();
  if (now - lastNudge < 85) return;
  lastNudge = now;
  const next = Math.max(0, Math.min(2, G.lane + dir));
  if (next === G.lane) return;
  G.lane = next;
  audio.tick();
}

function hurt(reason, kind) {
  if (G.invuln > 0 || G.mode !== "play") return false;
  G.combo = 0;
  G.invuln = 1.2;
  G.shake = 0.48;
  G.stumble = 1;
  G.dipAmp = AMP[kind] || AMP.hit;
  G.slow = 0.58;
  audio.hit();
  flash("#ff3b30", 0.42);
  if (navigator.vibrate) navigator.vibrate(40);
  if (G.shield > 0) {
    G.shield -= 1;
    toast("Shield absorbed the hit");
    return true;
  }
  G.hp -= 1;
  toast(reason);
  if (G.hp <= 0) {
    G.hp = 0;
    beginDeath();
  }
  return true;
}

function perfect(type) {
  G.combo += 1;
  G.maxCombo = Math.max(G.maxCombo, G.combo);
  grantCoins(G.combo, true);
  audio.pass();
  flash(FORMS[HAZARDS[type].form].color, 0.2);
  toast(`${HAZARDS[type].name} clear  x${G.combo} +${G.combo} coins`);
}

function collect(coin) {
  if (coin.taken) return;
  coin.taken = true;
  grantCoins(1, false);
}

function collisions() {
  const r = magnetR();
  for (const seg of track.segments) {
    if (seg.z1 < G.z - 3 || seg.z0 > G.z + 8) continue;
    for (const coin of seg.coins) {
      if (coin.taken) continue;
      const dx = G.x - LANES[coin.lane];
      const dz = G.z - coin.z;
      if (dx * dx + dz * dz < r * r) collect(coin);
    }
    for (const obstacle of seg.obstacles) {
      if (obstacle.hit) continue;
      if (Math.abs(G.x - LANES[obstacle.lane]) < 0.62 && Math.abs(G.z - obstacle.z) < 0.72) {
        obstacle.hit = true;
        obstacle.mesh.visible = false;
        hurt("Hit a crate", "hit");
      }
    }
    if (seg.type === "narrow" && G.z > seg.z0 + 0.6 && G.z < seg.z1 - 0.4) {
      if (G.lane !== 1 || Math.abs(G.x) > 0.9) {
        if (!seg.damaged && hurt("Clipped the alley wall", "narrow")) seg.damaged = true;
        G.lane = 1;
      }
    }
    if (!seg.resolved && seg.type !== "road" && G.z >= seg.z0 + seg.len * 0.46) {
      seg.resolved = true;
      if (seg.damaged) continue;
      const need = HAZARDS[seg.type].form;
      const laneOk = seg.type !== "narrow" || G.lane === 1;
      if (G.form === need && laneOk) perfect(seg.type);
      else if (hurt(wrongText(seg.type), seg.type)) seg.damaged = true;
    }
  }
}

function wrongText(type) {
  return {
    narrow: "Only a bike fits here",
    pothole: "Only a tank fits here",
    river: "Only a boat fits here",
    barrier: "Only a plane fits here",
  }[type];
}

function teach(next) {
  if (save.best >= 250 || !next || next.dist > 42 || next.dist < 18) return;
  if (G.taught.has(next.type)) return;
  G.taught.add(next.type);
  toast(HAZARDS[next.type].tip, 2.5);
}

function beginDeath() {
  if (G.mode !== "play") return;
  G.mode = "dying";
  G.dying = 0.72;
  audio.die();
  flash("#ff3b30", 0.65);
  G.shake = 0.85;
  if (navigator.vibrate) navigator.vibrate([50, 40, 80]);
}

function finishRun() {
  const dist = Math.floor(G.z);
  const isNew = dist > save.best;
  if (isNew) save.best = dist;
  saveNow();
  G.mode = "over";
  hud.hidden = true;
  showScreen("over");
  document.querySelector("#over-kicker").textContent = isNew ? "New best" : "Run over";
  document.querySelector("#over-dist").textContent = `${dist} m`;
  document.querySelector("#over-coins").textContent = `+${G.runCoins}`;
  document.querySelector("#over-best").textContent = `${save.best} m`;
  document.querySelector("#over-combo").textContent = G.maxCombo > 1 ? `x${G.maxCombo} chain` : "—";
}

function startGame() {
  audio.resume();
  track.reset("play");
  G.mode = "play";
  G.lane = 1;
  G.x = 0;
  G.z = 0;
  G.hp = maxHp();
  G.shield = save.upgrades.shield || 0;
  G.invuln = 0.45;
  G.cd = 0;
  G.combo = 0;
  G.maxCombo = 0;
  G.runCoins = 0;
  G.shake = 0;
  G.stumble = 0;
  G.slow = 1;
  G.time = 0;
  G.dying = 0;
  G.warn = 0;
  G.kmAward = 0;
  G.taught = new Set();
  G.tipI = 0;
  G.tips = save.best < 80
    ? [
        { t: 0.5, msg: "Swipe or use the arrow keys to change lanes" },
        { t: 2.3, msg: "Press Shift, or tap a gear to change form" },
      ]
    : [];
  applyForm("bike", true);
  hideScreens();
  hud.hidden = false;
  hudKey = "";
  clock.getDelta();
}

function enterMenu() {
  track.reset("menu");
  G.mode = "menu";
  G.lane = 1;
  G.x = 0;
  G.z = 0;
  G.hp = maxHp();
  G.shield = 0;
  G.invuln = 0;
  G.cd = 0;
  G.stumble = 0;
  G.shake = 0;
  applyForm("bike", false);
  hud.hidden = true;
  showScreen("menu");
  refreshMenu();
}

function pause() {
  if (G.mode !== "play") return;
  G.mode = "pause";
  holdDir = 0;
  showScreen("pause");
}

function resume() {
  if (G.mode !== "pause") return;
  G.mode = "play";
  hideScreens();
  hud.hidden = false;
  clock.getDelta();
}

function quitToMenu() {
  const dist = Math.floor(G.z);
  if (dist > save.best) {
    save.best = dist;
    saveNow();
  }
  enterMenu();
}

function refreshMenu() {
  document.querySelector("#menu-best").textContent = `${save.best} m`;
  document.querySelector("#menu-coins").textContent = String(save.coins);
  document.querySelector("#btn-mute").textContent = save.muted ? "Sound: off" : "Sound: on";
}

function renderShop() {
  document.querySelector("#shop-coins").textContent = String(save.coins);
  const list = document.querySelector("#shop-list");
  list.innerHTML = "";
  for (const def of UPGRADES) {
    const level = save.upgrades[def.id] || 0;
    const maxed = level >= def.max;
    const cost = priceOf(def);
    const row = document.createElement("div");
    row.className = "up-row";
    const pips = Array.from({ length: def.max }, (_, i) => `<i class="${i < level ? "on" : ""}"></i>`).join("");
    row.innerHTML = `
      <div>
        <strong>${def.name}</strong>
        <p>${def.desc}</p>
        <span class="pips">${pips}</span>
      </div>
      <button type="button">${maxed ? "MAX" : `${cost}`}</button>
    `;
    const button = row.querySelector("button");
    button.disabled = maxed || save.coins < cost;
    button.addEventListener("click", () => {
      if (maxed || save.coins < cost) return;
      save.coins -= cost;
      save.upgrades[def.id] = level + 1;
      audio.click();
      saveNow();
      renderShop();
      refreshMenu();
    });
    list.appendChild(row);
  }
}

function openShop() {
  audio.resume();
  renderShop();
  showScreen("shop");
}

function closeShop() {
  showScreen(G.mode === "over" ? "over" : "menu");
}

function toggleMute() {
  save.muted = !save.muted;
  audio.setMuted(save.muted);
  if (!save.muted) audio.click();
  saveNow();
  refreshMenu();
}

function buildDock() {
  const dock = document.querySelector("#form-dock");
  for (const id of FORM_ORDER) {
    const form = FORMS[id];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "form-btn";
    button.dataset.form = id;
    button.style.setProperty("--c", form.color);
    button.innerHTML = `<i class="cd"></i><b>${form.short}</b><kbd>${form.key}</kbd>`;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (G.mode === "play") changeForm(id);
    });
    dock.appendChild(button);
  }
}

function refreshHud(next) {
  const cdBucket = Math.ceil(G.cd * 10);
  const nextKey = next ? `${next.type}:${Math.ceil(next.dist)}` : "";
  const key = `${Math.floor(G.z)}|${save.coins}|${G.hp}|${G.shield}|${G.combo}|${G.form}|${cdBucket}|${nextKey}|${G.lane}`;
  if (key === hudKey) return;
  hudKey = key;
  document.querySelector("#stat-dist").textContent = `${Math.floor(G.z)}m`;
  document.querySelector("#stat-coins").textContent = String(save.coins);
  const hearts = [];
  for (let i = 0; i < maxHp(); i++) hearts.push(`<span class="${i < G.hp ? "on" : "off"}">♥</span>`);
  for (let i = 0; i < G.shield; i++) hearts.push(`<span class="sh">◆</span>`);
  document.querySelector("#hearts").innerHTML = hearts.join("");
  document.querySelector("#combo").textContent = G.combo > 1 ? `x${G.combo}` : "";

  const fraction = G.cd > 0 ? G.cd / shiftCd() : 0;
  for (const button of document.querySelectorAll(".form-btn")) {
    const id = button.dataset.form;
    button.classList.toggle("on", id === G.form);
    const needed = next && next.dist < 72 && HAZARDS[next.type].form === id && G.form !== id;
    button.classList.toggle("need", !!needed);
    button.querySelector(".cd").style.transform = `scaleY(${fraction})`;
  }

  if (!next || next.dist > 72) {
    callout.hidden = true;
    return;
  }
  const spec = HAZARDS[next.type];
  const ready = G.form === spec.form && (next.type !== "narrow" || G.lane === 1);
  callout.hidden = false;
  callout.style.borderColor = FORMS[spec.form].color;
  callout.classList.toggle("ok", ready);
  callout.classList.toggle("bad", !ready);
  const ahead = Math.max(0, Math.ceil(next.dist));
  callout.textContent = ready
    ? `Ahead ${ahead}m · ${spec.name} · ${FORMS[spec.form].name} is clear`
    : `Ahead ${ahead}m · ${spec.name} · shift to ${FORMS[spec.form].name}`;
}

function dropCrumb(dt, spd) {
  if (G.mode !== "play" && G.mode !== "menu") return;
  crumbTimer -= dt;
  if (crumbTimer > 0) return;
  crumbTimer = spd > 20 ? 0.04 : 0.07;
  const crumb = crumbs[crumbCursor++ % crumbs.length];
  crumb.visible = true;
  crumb.userData.life = 0.32;
  crumb.position.set(G.x + (Math.random() - 0.5) * 0.28, 0.16, G.z - 0.7);
  crumb.scale.setScalar(0.1 + Math.random() * 0.06);
  crumb.material.color.set(FORMS[G.form].hex);
  crumb.material.opacity = 0.65;
}

function updateCrumbs(dt) {
  for (const crumb of crumbs) {
    if (!crumb.visible) continue;
    crumb.userData.life -= dt;
    crumb.material.opacity = Math.max(0, crumb.userData.life * 2);
    if (crumb.userData.life <= 0) crumb.visible = false;
  }
}

function update(dt) {
  G.time += dt;
  if (saveTimer > 0) {
    saveTimer -= dt;
    if (saveTimer <= 0) saveNow();
  }
  toastTimer -= dt;
  if (toastTimer <= 0) toastEl.classList.remove("show");
  flashAlpha = Math.max(0, flashAlpha - dt * 1.5);
  flashEl.style.opacity = String(flashAlpha);

  if (G.mode === "menu") {
    const next = track.nextHazard(G.z);
    if (next && next.dist < 26 && G.form !== HAZARDS[next.type].form) applyForm(HAZARDS[next.type].form, true);
    if (next && next.type === "narrow" && next.dist < 16) G.lane = 1;
  }

  if (G.mode === "play") {
    if (holdDir) {
      holdTimer -= dt;
      if (holdTimer <= 0) {
        nudge(holdDir);
        holdTimer = 0.14;
      }
    }
    while (G.tipI < G.tips.length && G.time >= G.tips[G.tipI].t) {
      toast(G.tips[G.tipI].msg, 2.1);
      G.tipI += 1;
    }
    const km = Math.floor(G.z / 100);
    if (km > G.kmAward) {
      G.kmAward = km;
      grantCoins(2, true);
      toast(`${km * 100}m  +2 coins`);
    }
  }

  const spd = speedNow();
  G.z += spd * dt;
  G.x += (LANES[G.lane] - G.x) * Math.min(1, dt * 14);
  G.invuln = Math.max(0, G.invuln - dt);
  G.cd = Math.max(0, G.cd - dt);
  G.stumble = Math.max(0, G.stumble - dt * 1.25);
  G.slow = Math.min(1, G.slow + dt * 0.5);
  G.shake = Math.max(0, G.shake - dt * 1.35);

  track.ensure(G.z);
  track.update(dt, G.time);

  if (G.mode === "play") {
    collisions();
    const next = track.nextHazard(G.z);
    teach(next);
    const mismatch = next && next.dist < 22 && next.dist > 0
      && (G.form !== HAZARDS[next.type].form || (next.type === "narrow" && G.lane !== 1));
    if (mismatch) {
      G.warn -= dt;
      if (G.warn <= 0) {
        G.warn = 0.7;
        audio.warn();
      }
    }
    refreshHud(next);
  }

  if (G.mode === "dying") {
    G.dying -= dt;
    rig.rotation.x += dt * 1.4;
    if (G.dying <= 0) finishRun();
  }

  const form = FORMS[G.form];
  const lift = G.form === "plane" ? planeLift(track, G.z) : 0;
  const dip = G.stumble * G.dipAmp;
  rig.position.set(G.x, form.hover + lift - dip, G.z);
  const leanTarget = (G.x - LANES[G.lane]) * 0.55;
  rig.rotation.z += (leanTarget - rig.rotation.z) * Math.min(1, dt * 8);
  if (G.mode !== "dying") {
    const pitch = G.form === "plane" ? -0.1 - lift * 0.2 : 0;
    rig.rotation.x += (pitch - rig.rotation.x) * Math.min(1, dt * 6);
  }
  const vehicle = vehicles[G.form];
  const bob = Math.sin(G.time * (G.form === "boat" ? 5.5 : 9)) * (G.form === "boat" ? 0.045 : 0.02);
  vehicle.position.y = bob;
  const scale = vehicle.scale.x + (1 - vehicle.scale.x) * Math.min(1, dt * 9);
  vehicle.scale.setScalar(scale);
  const blinkOff = G.invuln > 0 && Math.sin(G.time * 42) > 0;
  for (const id of FORM_ORDER) vehicles[id].visible = id === G.form && !blinkOff;
  spinVehicle(vehicle, dt, Math.max(8, spd));

  bubble.visible = G.shield > 0 && G.mode !== "menu";
  bubble.material.opacity = 0.12 + Math.sin(G.time * 5) * 0.05;

  shadow.position.set(G.x, 0.045, G.z);
  marker.position.set(G.x, 0.09, G.z);
  const shade = Math.max(0.45, 1.2 - (form.hover + lift) * 0.25);
  shadow.scale.setScalar(shade);
  marker.scale.setScalar(Math.max(0.55, 1.15 - lift * 0.35));
  shadow.material.opacity = Math.max(0.12, 0.35 - lift * 0.12);

  dropCrumb(dt, spd);
  updateCrumbs(dt);

  const here = track.segmentAt(G.z + 4);
  const upcoming = track.nextHazard(G.z);
  for (const seg of track.segments) {
    if (!seg.sign) continue;
    const show = !upcoming || seg === upcoming.seg;
    seg.sign.visible = show;
    if (seg.decal) seg.decal.visible = show;
  }
  let sky = "road";
  if (here && here.type !== "road") sky = here.type;
  else if (upcoming && upcoming.dist < 36) sky = upcoming.type;
  wantSky.setHex(SKY[sky]);
  fogColor.lerp(wantSky, 1 - Math.pow(0.04, dt));
  scene.fog.color.copy(fogColor);

  const portrait = camera.aspect < 0.9;
  const menu = G.mode === "menu";
  const shakeX = (Math.random() - 0.5) * G.shake;
  const shakeY = (Math.random() - 0.5) * G.shake * 0.6;
  const back = menu ? 11 : portrait ? 8.1 : 10.6;
  const up = menu ? 7.4 : portrait ? 4.55 : 5.15;
  const ahead = menu ? 8.2 : portrait ? 3.6 : 6.4;
  camera.position.set(G.x * 0.28 + shakeX, up + Math.sin(G.z * 0.7) * 0.03 + shakeY, G.z - back);
  camera.lookAt(G.x * 0.4, menu ? 0.4 : 0.7, G.z + ahead);
}

function resize() {
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(1, h);
  camera.fov = w < h ? 68 : 50;
  camera.updateProjectionMatrix();
}

function bindHold(button, dir) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (G.mode !== "play") return;
    holdDir = dir;
    holdTimer = 0.2;
    nudge(dir);
  });
}

window.addEventListener("keydown", (event) => {
  const arrows = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"];
  if (arrows.includes(event.code) || event.code === "Tab") event.preventDefault();
  if (event.repeat && event.code !== "ArrowLeft" && event.code !== "ArrowRight" && event.code !== "KeyA" && event.code !== "KeyD") {
    return;
  }
  if (!screens.shop.hidden) {
    if (event.code === "Escape") closeShop();
    return;
  }
  if (!screens.help.hidden) {
    if (event.code === "Escape" || event.code === "Enter" || event.code === "Space") {
      showScreen(G.mode === "over" ? "over" : "menu");
    }
    return;
  }
  if (event.code === "KeyM") {
    toggleMute();
    return;
  }
  if (G.mode === "menu") {
    if (event.code === "Enter" || event.code === "Space") startGame();
    return;
  }
  if (G.mode === "over") {
    if (event.code === "Enter" || event.code === "Space" || event.code === "KeyR") startGame();
    if (event.code === "Escape") enterMenu();
    return;
  }
  if (G.mode === "pause") {
    if (event.code === "Escape" || event.code === "KeyP" || event.code === "Space") resume();
    return;
  }
  if (G.mode !== "play") return;
  if (event.code === "ArrowLeft" || event.code === "KeyA") nudge(-1);
  if (event.code === "ArrowRight" || event.code === "KeyD") nudge(1);
  if (event.code === "ShiftLeft" || event.code === "ShiftRight" || event.code === "KeyE") cycle(1);
  if (event.code === "KeyQ") cycle(-1);
  if (event.code === "Digit1") changeForm("bike");
  if (event.code === "Digit2") changeForm("tank");
  if (event.code === "Digit3") changeForm("boat");
  if (event.code === "Digit4") changeForm("plane");
  if (event.code === "Escape" || event.code === "KeyP") pause();
});

let swipe = null;
canvas.addEventListener("pointerdown", (event) => {
  if (G.mode !== "play") return;
  swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
});
canvas.addEventListener("pointerup", (event) => {
  if (!swipe || swipe.id !== event.pointerId || G.mode !== "play") return;
  const dx = event.clientX - swipe.x;
  const dy = event.clientY - swipe.y;
  if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy) * 0.75) nudge(dx > 0 ? 1 : -1);
  swipe = null;
});
window.addEventListener("pointerup", () => {
  holdDir = 0;
});
window.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("visibilitychange", () => {
  if (document.hidden && G.mode === "play") pause();
});

document.querySelector("#btn-play").addEventListener("click", startGame);
document.querySelector("#btn-help").addEventListener("click", () => {
  audio.resume();
  showScreen("help");
});
document.querySelector("#btn-shop").addEventListener("click", openShop);
document.querySelector("#btn-mute").addEventListener("click", toggleMute);
document.querySelector("#btn-shop-close").addEventListener("click", closeShop);
document.querySelector("#btn-help-close").addEventListener("click", () => showScreen(G.mode === "over" ? "over" : "menu"));
document.querySelector("#btn-pause").addEventListener("click", pause);
document.querySelector("#btn-resume").addEventListener("click", resume);
document.querySelector("#btn-quit").addEventListener("click", quitToMenu);
document.querySelector("#btn-retry").addEventListener("click", startGame);
document.querySelector("#btn-over-shop").addEventListener("click", openShop);
document.querySelector("#btn-over-menu").addEventListener("click", enterMenu);
document.querySelector("#btn-reset").addEventListener("click", () => {
  if (!confirm("Erase coins, upgrades, and best score?")) return;
  save.coins = 0;
  save.best = 0;
  for (const def of UPGRADES) save.upgrades[def.id] = 0;
  saveNow();
  renderShop();
  refreshMenu();
});
screens.shop.addEventListener("pointerdown", (event) => {
  if (event.target === screens.shop) closeShop();
});
screens.help.addEventListener("pointerdown", (event) => {
  if (event.target === screens.help) showScreen(G.mode === "over" ? "over" : "menu");
});

bindHold(document.querySelector("#lane-left"), -1);
bindHold(document.querySelector("#lane-right"), 1);
buildDock();
resize();
window.addEventListener("resize", resize);

const params = new URLSearchParams(location.search);
if (params.has("test")) window.__shift = { G, save, startGame, changeForm, nudge, track, FORMS, HAZARDS };

enterMenu();

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.033, clock.getDelta());
  update(dt);
  renderer.render(scene, camera);
}
frame();
