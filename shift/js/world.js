import * as THREE from "../vendor/three.module.js";

// With the camera looking along +Z, screen-right is world -X.
export const LANES = [2.15, 0, -2.15];

export const FORMS = {
  bike: { id: "bike", name: "Bike", short: "BIKE", key: "1", color: "#2ee59d", hex: 0x2ee59d, speed: 1.12, hover: 0 },
  tank: { id: "tank", name: "Tank", short: "TANK", key: "2", color: "#d6e04a", hex: 0xd6e04a, speed: 0.86, hover: 0 },
  boat: { id: "boat", name: "Boat", short: "BOAT", key: "3", color: "#3ec1ff", hex: 0x3ec1ff, speed: 1, hover: 0.02 },
  plane: { id: "plane", name: "Plane", short: "PLANE", key: "4", color: "#ff7a3c", hex: 0xff7a3c, speed: 1.16, hover: 0.16 },
};

export const FORM_ORDER = ["bike", "tank", "boat", "plane"];

/** Each terrain allows one form. The alley also requires the center lane. */
export const HAZARDS = {
  narrow: { form: "bike", name: "Alley", tip: "Only a bike fits the alley. Stay in the center." },
  pothole: { form: "tank", name: "Potholes", tip: "Only tank treads cross the potholes." },
  river: { form: "boat", name: "River", tip: "Only a boat crosses the river." },
  barrier: { form: "plane", name: "Barrier", tip: "Only a plane clears the barriers." },
};

export const SKY = {
  road: 0x14182b,
  narrow: 0x1b1022,
  pothole: 0x1c140f,
  river: 0x0d2233,
  barrier: 0x26180f,
};

const SCRIPT = ["road", "road", "road", "narrow", "road", "pothole", "road", "river", "road", "barrier", "road"];
const SHOWCASE = ["road", "narrow", "road", "pothole", "road", "river", "road", "barrier"];

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
const torusGeo = new THREE.TorusGeometry(0.34, 0.075, 6, 12);
const coinGeo = new THREE.OctahedronGeometry(0.28, 0);
const planeGeo = new THREE.PlaneGeometry(1, 1);
const circleGeo = new THREE.CircleGeometry(0.55, 12);
const coneGeo = new THREE.ConeGeometry(0.55, 1.15, 5);
const sphereGeo = new THREE.SphereGeometry(1, 12, 10);

const mats = new Map();

function std(color, extra = {}) {
  const emissive = extra.emissive ?? 0;
  const key = `${color}|${extra.roughness ?? 0.7}|${extra.metalness ?? 0.05}|${emissive}`;
  if (!mats.has(key)) {
    mats.set(
      key,
      new THREE.MeshStandardMaterial({
        color,
        roughness: extra.roughness ?? 0.7,
        metalness: extra.metalness ?? 0.05,
        emissive,
        emissiveIntensity: emissive ? 0.9 : 0,
        flatShading: true,
      })
    );
  }
  return mats.get(key);
}

function basic(color, opacity = 1) {
  const key = `b|${color}|${opacity}`;
  if (!mats.has(key)) {
    mats.set(
      key,
      new THREE.MeshBasicMaterial({
        color,
        transparent: opacity < 1,
        opacity,
        depthWrite: opacity >= 1,
      })
    );
  }
  return mats.get(key);
}

function box(w, h, d, material, x, y, z) {
  const mesh = new THREE.Mesh(boxGeo, material);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  return mesh;
}

function paintIcon(formId, mode) {
  const form = FORMS[formId];
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const g = canvas.getContext("2d");
  if (mode === "sign") {
    g.fillStyle = "rgba(8,10,16,0.92)";
    roundRect(g, 16, 16, 224, 224, 28);
    g.fill();
    g.lineWidth = 14;
    g.strokeStyle = form.color;
    g.stroke();
    g.fillStyle = form.color;
    g.font = "800 64px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(form.short, 128, 118);
    g.fillStyle = "#ffffff";
    g.font = "700 32px sans-serif";
    g.fillText(form.name, 128, 184);
  } else {
    g.clearRect(0, 0, 256, 256);
    g.fillStyle = form.color;
    g.globalAlpha = 0.95;
    g.font = "800 72px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(form.short, 128, 136);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

const iconTex = {};
const iconMat = {};

function iconMaterial(formId, mode) {
  const key = `${formId}|${mode}`;
  if (!iconMat[key]) {
    if (!iconTex[key]) iconTex[key] = paintIcon(formId, mode);
    iconMat[key] = new THREE.MeshBasicMaterial({
      map: iconTex[key],
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }
  return iconMat[key];
}

function stripeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const g = canvas.getContext("2d");
  for (let y = 0; y < 64; y += 16) {
    g.fillStyle = y % 32 === 0 ? "#ffb703" : "#1a1a1a";
    g.fillRect(0, y, 64, 16);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function waveTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const g = canvas.getContext("2d");
  g.fillStyle = "#0f6f99";
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = "rgba(220,248,255,0.45)";
  g.lineWidth = 3;
  for (let row = 0; row < 8; row++) {
    g.beginPath();
    for (let x = 0; x <= 128; x += 8) {
      const y = row * 16 + 8 + Math.sin(x * 0.09 + row) * 3;
      if (x === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

const stripeMat = new THREE.MeshBasicMaterial({ map: stripeTexture() });
const waterTex = waveTexture();
const waterMat = new THREE.MeshStandardMaterial({
  map: waterTex,
  color: 0xb7ecff,
  roughness: 0.18,
  metalness: 0.04,
  emissive: 0x063044,
  emissiveIntensity: 0.45,
  transparent: true,
  opacity: 0.94,
});

function wheel(x, y, z, radius = 0.34) {
  const spin = new THREE.Group();
  spin.position.set(x, y, z);
  const yaw = new THREE.Group();
  yaw.rotation.y = Math.PI / 2;
  const tire = new THREE.Mesh(torusGeo, std(0x1b1f27, { roughness: 0.9 }));
  tire.scale.setScalar(radius / 0.34);
  const hub = new THREE.Mesh(cylGeo, std(0xd5dbe6, { metalness: 0.6, roughness: 0.3 }));
  hub.rotation.x = Math.PI / 2;
  hub.scale.set(0.1, 0.14, 0.1);
  yaw.add(tire, hub);
  spin.add(yaw);
  return spin;
}

function buildBike() {
  const g = new THREE.Group();
  const frame = std(0x2ee59d, { emissive: 0x0c6b45, roughness: 0.4 });
  const metal = std(0xd5dbe6, { metalness: 0.55, roughness: 0.28 });
  const tail = std(0xff3344, { emissive: 0xff2233 });
  const rear = wheel(0, 0.34, -0.46, 0.38);
  const front = wheel(0, 0.34, 0.52, 0.38);
  g.add(rear, front);
  g.add(box(0.1, 0.08, 1.05, frame, 0, 0.5, 0.02));
  g.add(box(0.08, 0.42, 0.08, frame, 0, 0.66, -0.24));
  g.add(box(0.08, 0.36, 0.08, frame, 0, 0.6, 0.34));
  g.add(box(0.22, 0.07, 0.28, std(0x14241c), 0, 0.92, -0.24));
  g.add(box(0.5, 0.05, 0.08, metal, 0, 0.82, 0.52));
  g.add(box(0.32, 0.36, 0.2, frame, 0, 1.12, -0.12));
  g.add(box(0.2, 0.18, 0.18, std(0xffe1c4), 0, 1.4, -0.06));
  g.add(box(0.26, 0.1, 0.22, std(0x173328), 0, 1.52, -0.06));
  g.add(box(0.16, 0.08, 0.08, tail, 0, 0.52, -0.66));
  g.userData.spinners = [rear, front];
  return g;
}

function buildTank() {
  const g = new THREE.Group();
  const paint = std(0x8a9a3e, { emissive: 0x2a3810 });
  const dark = std(0x3c4722);
  const rubber = std(0x23262c, { roughness: 0.95 });
  const tail = std(0xff3344, { emissive: 0xff2233 });
  g.add(box(0.3, 0.42, 1.45, rubber, -0.5, 0.24, 0));
  g.add(box(0.3, 0.42, 1.45, rubber, 0.5, 0.24, 0));
  g.add(box(0.72, 0.32, 1.2, paint, 0, 0.46, 0));
  g.add(box(0.78, 0.08, 0.9, dark, 0, 0.64, -0.02));
  const turret = new THREE.Mesh(cylGeo, dark);
  turret.scale.set(0.26, 0.2, 0.26);
  turret.position.set(0, 0.78, -0.02);
  g.add(turret);
  const barrel = new THREE.Mesh(cylGeo, dark);
  barrel.rotation.x = Math.PI / 2;
  barrel.scale.set(0.055, 0.78, 0.055);
  barrel.position.set(0, 0.8, 0.48);
  g.add(barrel);
  g.add(box(0.12, 0.08, 0.06, tail, -0.22, 0.42, -0.62));
  g.add(box(0.12, 0.08, 0.06, tail, 0.22, 0.42, -0.62));
  return g;
}

function buildBoat() {
  const g = new THREE.Group();
  const hull = std(0x1a9adf, { emissive: 0x084868, roughness: 0.35, metalness: 0.08 });
  const deck = std(0xf4f7fb, { roughness: 0.55 });
  const glass = std(0x9ee7ff, { emissive: 0x1a6d88, roughness: 0.2 });
  g.add(box(1.2, 0.24, 1.35, hull, 0, 0.2, -0.02));
  g.add(box(0.72, 0.16, 0.42, hull, 0, 0.22, 0.78));
  g.add(box(1.22, 0.06, 1.15, deck, 0, 0.34, -0.05));
  g.add(box(0.5, 0.28, 0.46, deck, 0, 0.52, -0.12));
  g.add(box(0.36, 0.16, 0.08, glass, 0, 0.56, 0.12));
  g.add(box(0.08, 0.08, 0.08, std(0xff3344, { emissive: 0xff2233 }), 0, 0.32, -0.7));
  return g;
}

function buildPlane() {
  const g = new THREE.Group();
  const paint = std(0xff7a3c, { emissive: 0x8a320c, roughness: 0.42 });
  const dark = std(0x2b241f);
  const metal = std(0xd5dbe6, { metalness: 0.45, roughness: 0.3 });
  const body = new THREE.Mesh(cylGeo, paint);
  body.rotation.x = Math.PI / 2;
  body.scale.set(0.16, 1.05, 0.16);
  body.position.set(0, 0.58, 0.02);
  g.add(body);
  g.add(box(1.7, 0.07, 0.34, paint, 0, 0.6, 0.08));
  g.add(box(0.58, 0.05, 0.18, paint, 0, 0.6, -0.42));
  g.add(box(0.06, 0.32, 0.2, paint, 0, 0.82, -0.4));
  const prop = new THREE.Group();
  prop.position.set(0, 0.58, 0.62);
  prop.add(box(0.72, 0.06, 0.04, metal, 0, 0, 0));
  prop.add(box(0.06, 0.72, 0.04, metal, 0, 0, 0));
  g.add(prop);
  g.add(box(0.1, 0.08, 0.08, std(0xff3344, { emissive: 0xff2233 }), 0, 0.7, -0.5));
  g.add(box(0.22, 0.08, 0.16, dark, 0, 0.5, -0.15));
  g.userData.props = [prop];
  return g;
}

export function createVehicles() {
  const vehicles = {
    bike: buildBike(),
    tank: buildTank(),
    boat: buildBoat(),
    plane: buildPlane(),
  };
  for (const id of FORM_ORDER) vehicles[id].visible = id === "bike";
  return vehicles;
}

export function spinVehicle(group, dt, speed) {
  const roll = dt * speed * 0.45;
  for (const part of group.userData.spinners || []) part.rotation.x += roll;
  for (const part of group.userData.props || []) part.rotation.z += dt * 26;
}

export function createRig(vehicles) {
  const rig = new THREE.Group();
  rig.scale.setScalar(1.42);
  for (const id of FORM_ORDER) rig.add(vehicles[id]);
  const bubble = new THREE.Mesh(
    sphereGeo,
    new THREE.MeshBasicMaterial({
      color: 0x9ad7ff,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  bubble.scale.setScalar(1.25);
  bubble.visible = false;
  rig.add(bubble);
  const glow = new THREE.PointLight(FORMS.bike.hex, 1.6, 7, 2);
  glow.position.set(0, 0.8, -0.3);
  rig.add(glow);
  return { rig, bubble, glow };
}

export function createShadow() {
  const shadow = new THREE.Mesh(
    circleGeo,
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.04;
  return shadow;
}

function addGround(group, z0, len, color) {
  const mid = z0 + len / 2;
  group.add(box(18, 0.4, len, std(0x10141c), 0, -0.48, mid));
  group.add(box(7.2, 0.5, len, std(color), 0, -0.22, mid));
}

function addDashes(group, z0, len) {
  const mat = std(0xd5dbe8, { roughness: 0.9 });
  for (let z = z0 + 2; z < z0 + len - 1; z += 3.3) {
    group.add(box(0.08, 0.045, 1.2, mat, -1.08, 0.04, z));
    group.add(box(0.08, 0.045, 1.2, mat, 1.08, 0.04, z));
  }
}

function addCurbs(group, z0, len) {
  const curb = std(0x3d4658);
  const mid = z0 + len / 2;
  group.add(box(0.28, 0.16, len, curb, -3.55, 0.08, mid));
  group.add(box(0.28, 0.16, len, curb, 3.55, 0.08, mid));
}

function addTree(group, x, z) {
  group.add(box(0.14, 0.7, 0.14, std(0x6b4a2e), x, 0.4, z));
  const crown = new THREE.Mesh(coneGeo, std(x > 0 ? 0x2f8f55 : 0x237246));
  crown.position.set(x, 1.25, z);
  group.add(crown);
}

function addLamp(group, x, z) {
  group.add(box(0.07, 1.7, 0.07, std(0x222833), x, 0.9, z));
  group.add(box(0.42, 0.08, 0.22, std(0xffc56b, { emissive: 0xffb347 }), x, 1.78, z));
}

function addProps(group, z0, len) {
  addTree(group, -6.3, z0 + len * 0.28);
  addTree(group, 6.5, z0 + len * 0.62);
  addLamp(group, -4.35, z0 + len * 0.18);
  addLamp(group, 4.35, z0 + len * 0.72);
}

function addLights(group, z0, len, hex) {
  const mat = std(hex, { emissive: hex });
  for (let z = z0 + 1.5; z < z0 + len; z += 3) {
    group.add(box(0.16, 0.1, 0.16, mat, -3.15, 0.12, z));
    group.add(box(0.16, 0.1, 0.16, mat, 3.15, 0.12, z));
  }
}

function addSign(group, formId, z) {
  const sign = new THREE.Mesh(planeGeo, iconMaterial(formId, "sign"));
  sign.position.set(0, 2.55, z);
  sign.scale.set(2.15, 2.15, 1);
  sign.rotation.y = Math.PI;
  group.add(sign);
  const decal = new THREE.Mesh(planeGeo, iconMaterial(formId, "decal"));
  decal.position.set(0, 0.07, z + 3.2);
  decal.rotation.x = -Math.PI / 2;
  decal.scale.set(2.3, 2.3, 1);
  group.add(decal);
  return { sign, decal };
}

function addCoin(group, lane, z) {
  const mesh = new THREE.Mesh(coinGeo, basic(0xffd15c));
  mesh.position.set(LANES[lane], 0.95, z);
  group.add(mesh);
  return { lane, z, mesh, taken: false };
}

function addCrate(group, lane, z) {
  const mesh = new THREE.Group();
  mesh.position.set(LANES[lane], 0, z);
  mesh.add(box(0.86, 0.82, 0.86, std(0xc46a2b), 0, 0.41, 0));
  mesh.add(box(0.9, 0.1, 0.9, stripeMat, 0, 0.86, 0));
  group.add(mesh);
  return { lane, z, mesh, hit: false };
}

function buildSegment(type, z0, len, decorative, spawnIndex) {
  const group = new THREE.Group();
  const seg = {
    type,
    z0,
    z1: z0 + len,
    len,
    group,
    coins: [],
    obstacles: [],
    resolved: false,
    damaged: false,
    sign: null,
  };

  if (type === "river") {
    const mid = z0 + len / 2;
    group.add(box(18, 0.35, len, std(0x143044), 0, -0.4, mid));
    const water = new THREE.Mesh(planeGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.02, mid);
    water.scale.set(6.4, len, 1);
    group.add(water);
    group.add(box(1.3, 0.55, len, std(0x6a5436), -3.85, 0.2, mid));
    group.add(box(1.3, 0.55, len, std(0x6a5436), 3.85, 0.2, mid));
    const bridgeZ = z0 + len * 0.5;
    group.add(box(7.4, 0.28, 1.5, std(0x2c313c), 0, 1.55, bridgeZ));
    group.add(box(0.28, 1.3, 1.5, std(0x2c313c), -3.15, 0.7, bridgeZ));
    group.add(box(0.28, 1.3, 1.5, std(0x2c313c), 3.15, 0.7, bridgeZ));
  } else {
    const ground = {
      road: 0x2c3446,
      narrow: 0x3a2a36,
      pothole: 0x4a3b2c,
      barrier: 0x34322c,
    }[type];
    addGround(group, z0, len, ground);
  }

  if (type === "narrow") {
    const mid = z0 + len / 2;
    const wall = std(0x6a4458);
    const arch = std(0xffd1e4, { emissive: 0x5a2340 });
    group.add(box(5.1, 1.05, len, wall, -3.05, 0.52, mid));
    group.add(box(5.1, 1.05, len, wall, 3.05, 0.52, mid));
    group.add(box(0.86, 0.06, len - 1, std(0x2ee59d, { emissive: 0x147a4c }), 0, 0.06, mid));
    for (const t of [0.34, 0.72]) {
      const z = z0 + len * t;
      group.add(box(0.22, 2.15, 0.36, arch, -0.62, 1.08, z));
      group.add(box(0.22, 2.15, 0.36, arch, 0.62, 1.08, z));
      group.add(box(1.5, 0.18, 0.36, arch, 0, 2.12, z));
    }
  } else if (type !== "river") {
    addCurbs(group, z0, len);
    addDashes(group, z0, len);
  }

  if (type === "pothole") {
    const hole = basic(0x120e0c);
    for (let i = 0; i < 3; i++) {
      for (const lane of LANES) {
        const disc = new THREE.Mesh(circleGeo, hole);
        disc.rotation.x = -Math.PI / 2;
        disc.position.set(lane, 0.05, z0 + 6 + i * 5);
        disc.scale.setScalar(1.15);
        group.add(disc);
      }
    }
    const cable = std(0x1a1816);
    group.add(box(7, 0.06, 0.06, cable, 0, 1.62, z0 + 8));
    group.add(box(7, 0.06, 0.06, cable, 0, 1.72, z0 + 14));
  }

  if (type === "barrier") {
    const wallZ = z0 + len * 0.48;
    for (const lane of LANES) {
      const block = new THREE.Group();
      block.position.set(lane, 0, wallZ);
      block.add(box(1.35, 1.15, 0.62, stripeMat, 0, 0.58, 0));
      group.add(block);
    }
    const pole = std(0x2a241c);
    group.add(box(0.18, 3.3, 0.18, pole, -3.5, 1.65, wallZ));
    group.add(box(0.18, 3.3, 0.18, pole, 3.5, 1.65, wallZ));
    group.add(box(7.2, 0.16, 0.16, pole, 0, 3.25, wallZ));
  }

  if (type !== "road") {
    addLights(group, z0, len, FORMS[HAZARDS[type].form].hex);
    const boards = addSign(group, HAZARDS[type].form, z0 - 1.2);
    seg.sign = boards.sign;
    seg.decal = boards.decal;
  } else if (!decorative) {
    const progress = Math.min(1, z0 / 2200);
    let count = 0;
    if (spawnIndex === 2) count = 1;
    else if (spawnIndex > 3) {
      const roll = Math.random();
      if (roll < 0.2 + progress * 0.5) count = 1;
      if (roll < progress * 0.32) count = 2;
    }
    if (count === 1) {
      const lane = Math.floor(Math.random() * 3);
      const z = z0 + 8 + Math.random() * (len - 14);
      seg.obstacles.push(addCrate(group, lane, z));
    } else if (count === 2) {
      const open = Math.floor(Math.random() * 3);
      const z = z0 + 10 + Math.random() * (len - 16);
      for (let lane = 0; lane < 3; lane++) {
        if (lane !== open) seg.obstacles.push(addCrate(group, lane, z));
      }
    }
  }

  if (type === "road" || type === "barrier" || type === "pothole") addProps(group, z0, len);

  const coinCount = type === "road" ? 5 : 2;
  for (let i = 0; i < coinCount; i++) {
    const z = z0 + 3.5 + ((len - 7) * i) / Math.max(1, coinCount - 1);
    let lane = type === "narrow" ? 1 : Math.floor(Math.random() * 3);
    const blocked = seg.obstacles.some((o) => o.lane === lane && Math.abs(o.z - z) < 1.8);
    if (blocked) lane = [0, 1, 2].find((n) => n !== lane) ?? 1;
    if (type === "narrow") lane = 1;
    seg.coins.push(addCoin(group, lane, z));
  }

  return seg;
}

export function createTrack(scene) {
  const track = {
    segments: [],
    decorative: true,
    nextZ: 0,
    spawnCount: 0,
    scriptIndex: 0,
    lastWasHazard: false,
    lastHazard: null,

    reset(mode) {
      for (const seg of this.segments) scene.remove(seg.group);
      this.segments = [];
      this.nextZ = 0;
      this.spawnCount = 0;
      this.scriptIndex = 0;
      this.lastWasHazard = false;
      this.lastHazard = null;
      this.decorative = mode === "menu";
      this.ensure(0);
    },

    ensure(z) {
      while (this.nextZ < z + 150) this.spawn();
      while (this.segments.length && this.segments[0].z1 < z - 30) {
        const old = this.segments.shift();
        scene.remove(old.group);
      }
    },

    spawn() {
      const index = this.spawnCount++;
      let type = "road";
      if (this.decorative) {
        type = SHOWCASE[index % SHOWCASE.length];
      } else if (this.scriptIndex < SCRIPT.length) {
        type = SCRIPT[this.scriptIndex++];
      } else if (!this.lastWasHazard) {
        const chance = Math.min(0.62, 0.36 + this.nextZ / 2600);
        if (Math.random() < chance) {
          const pool = ["narrow", "pothole", "river", "barrier"].filter((t) => t !== this.lastHazard);
          type = pool[Math.floor(Math.random() * pool.length)];
        }
      }
      const len = type === "road" ? 32 : 24;
      const seg = buildSegment(type, this.nextZ, len, this.decorative, index);
      scene.add(seg.group);
      this.segments.push(seg);
      this.nextZ += len;
      this.lastWasHazard = type !== "road";
      if (type !== "road") this.lastHazard = type;
    },

    update(dt, time) {
      waterTex.offset.y -= dt * 0.4;
      for (const seg of this.segments) {
        if (seg.sign) seg.sign.position.y = 2.55 + Math.sin(time * 2.2 + seg.z0) * 0.12;
        for (const coin of seg.coins) {
          if (!coin.mesh.visible) continue;
          if (coin.taken) {
            coin.mesh.position.y += dt * 3.4;
            const s = Math.max(0.01, coin.mesh.scale.x - dt * 2.4);
            coin.mesh.scale.setScalar(s);
            if (s <= 0.05) coin.mesh.visible = false;
          } else {
            coin.mesh.rotation.y += dt * 2.5;
            coin.mesh.position.y = 0.95 + Math.sin(time * 3.2 + coin.z) * 0.08;
          }
        }
      }
    },

    segmentAt(z) {
      for (let i = this.segments.length - 1; i >= 0; i--) {
        const seg = this.segments[i];
        if (z >= seg.z0 && z < seg.z1) return seg;
      }
      return null;
    },

    nextHazard(z) {
      let best = null;
      for (const seg of this.segments) {
        if (seg.type === "road" || seg.resolved) continue;
        const mark = seg.z0 + seg.len * 0.46;
        if (mark < z - 1) continue;
        const dist = mark - z;
        if (!best || dist < best.dist) best = { seg, dist, type: seg.type, mark };
      }
      return best;
    },
  };
  return track;
}

export function planeLift(track, z) {
  let best = 0;
  for (const seg of track.segments) {
    if (seg.type !== "barrier") continue;
    const wall = seg.z0 + seg.len * 0.48;
    const d = wall - z;
    if (d < 18 && d > -5) {
      const k = d >= 0 ? 1 - d / 18 : 1 + d / 5;
      if (k > best) best = k;
    }
  }
  return Math.max(0, best) * 1.55;
}
