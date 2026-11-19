const KEY = "shift-gameoff-2026";

export const UPGRADE_IDS = [
  "accel",
  "vitality",
  "quickshift",
  "shield",
  "magnet",
  "bike",
  "tank",
  "boat",
  "plane",
];

function blank() {
  const upgrades = {};
  for (const id of UPGRADE_IDS) upgrades[id] = 0;
  return { coins: 0, best: 0, muted: false, upgrades };
}

export function loadSave() {
  const base = blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const data = JSON.parse(raw);
    const upgrades = { ...base.upgrades };
    for (const id of UPGRADE_IDS) {
      const n = data.upgrades?.[id];
      if (Number.isFinite(n) && n > 0) upgrades[id] = Math.floor(n);
    }
    return {
      coins: Math.max(0, data.coins | 0),
      best: Math.max(0, data.best | 0),
      muted: !!data.muted,
      upgrades,
    };
  } catch {
    return base;
  }
}

export function writeSave(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* Private mode can block storage; the run still plays. */
  }
}
