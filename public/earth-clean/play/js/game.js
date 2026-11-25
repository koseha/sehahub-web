/* earth-clean · 30분 맛보기 — 놀이 흐름 · 손 · 흡입구 · 로봇 · 선택창 · 판 넘어가기 · 저장
 * 숫자 규칙은 전부 numbers.js(EarthCleanNumbers)의 값과 함수를 그대로 쓴다.
 * 시험용 문(화면에 안내하지 않음): ?speed=20 · ?bot=1 · ?fresh=1 · window.__state()
 */
(function () {
  'use strict';
  const N = window.EarthCleanNumbers, EC = window.EC, A = EC.art, Wd = EC.world, U = EC.ui;
  const B = N.BASE;
  const qs = new URLSearchParams(location.search);
  const SPEED = Math.max(0.05, Math.min(200, Number(qs.get('speed')) || 1));
  const BOT = qs.get('bot') === '1';
  const FRESH = qs.get('fresh') === '1';
  const SAVE_KEY = 'earth-clean/save/v1', BEST_KEY = 'earth-clean/best/v1';
  // 화면 연출(숫자 규칙 아님)
  const STEP = 1 / 40;           // 한 걸음 길이(놀이 시간 · 초)
  const ZOOM_FLAG = 0.9, ZOOM_SEC = 3.0, FINALE_SEC = 2.6;
  const PHONE_FIG = 1.35;        // 세로 휴대폰에서 사람 그림 키움 — 화면 사람 수를 1/배수² 로 줄여 「화면 수 × 그림 한 명」을 지킨다(design.md 판 셋 🔴)
  const SPIN_R = 70;             // 혼자서도 빙글 — 도는 고리 반지름
  const TRAIL_K = 3;             // 꼬리바람 — 꼬리 길이(초) = (꼬리 배수 − 1) × 이것
  const CELL = 48;
  const INK = A.INK, PT = A.PT, KO = A.KO;

  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const G = EC.G = {
    L: null, RS: 1, cssScale: 1, clock: 0, uiClock: 0, frames: 0, stamp: 0,
    run: null, st: null, world: null, crowd: [], mode: 'play', menu: null, ended: false,
    choice: null, fly: null, zoom: null, finale: null, pendingChoice: null, endInfo: null,
    noz: { x: 0, y: 0, r: 30, spin: false, sa: 0, scx: 0, scy: 0, sr: 0, dirx: 1, diry: 0 },
    twin: { x: 0, y: 0, r: 0 }, robots: [], walkers: [], tail: [], tailClock: 0,
    hand: { x: 0, y: 0, has: false, pending: false, lastMove: -99 },
    bot: { tx: 0, ty: 0, re: 0 },
    shownEarth: N.EARTH_START, rate: 0, secAt: 0, secN: 0, maxSec: 0,
    stn: { guests: [], bubble: null, bubbleWait: 1.6, flashes: [], rooms: [], room: null, roomT: 0, banner: null, lastTalk: -1, lastAdd: 0 },
    riders: [], pops: [], hearts: [], confetti: [], calls: [],
    pickOrder: [], ctrDigits: { s: '', t: [] }, toast: null, hint: true, stageDone: false,
    lastCheer: 0, cheerSide: 1, lastFriendPop: 0,
  };
  let grid = [], gridW = 1, gridH = 1;
  const arrivedBuf = [];

  // ---------- 판 크기 · 사람 몫 ----------
  const figK = (stage) => (stage > 0 && G.L && G.L.portrait ? PHONE_FIG : 1);
  const figScale = (stage) => N.STAGES[stage].figurePx / A.FIG_H * figK(stage);
  const capEff = (stage) => Math.max(1, Math.round(N.STAGES[stage].screenCap / (figK(stage) * figK(stage))));
  const perEff = () => N.perFigure(G.st, G.run.stage) * figK(G.run.stage) * figK(G.run.stage);
  const targetCount = () => (G.run.left <= 0 ? 0 : Math.min(capEff(G.run.stage), Math.ceil(G.run.left / perEff() - 1e-9)));
  const offerRand = () => N.rng((G.run.seed ^ ((G.run.smallCount + G.run.bigCount + 1) * 7919)) >>> 0);

  // ---------- 저장 ----------
  function save() {
    try {
      const open = G.mode === 'choose' && G.choice ? { tier: G.choice.tier, ids: G.choice.ids } : (G.pendingChoice || null);
      const o = { run: N.toSave(G.run), open, order: G.pickOrder, maxSec: G.maxSec, ended: G.ended, prevBest: G.endInfo ? G.endInfo.prevBest : null };
      localStorage.setItem(SAVE_KEY, JSON.stringify(o));
    } catch (e) { /* 저장이 막힌 브라우저 — 놀이는 그대로 */ }
  }
  function load() {
    if (FRESH) return null;
    try {
      const o = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      const run = o && N.fromSave(o.run);
      return run ? { run, open: o.open, order: o.order, maxSec: o.maxSec, ended: o.ended, prevBest: o.prevBest } : null;
    } catch (e) { return null; }
  }
  function bestGet() { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch (e) { return 0; } }
  function bestSet(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) { /* 무시 */ } }

  // ---------- 시작 · 처음부터 ----------
  function startRun(saved) {
    G.run = saved ? saved.run : N.newRun((Date.now() ^ (Math.random() * 1e9)) >>> 0);
    G.st = N.stats(G.run.picks);
    G.pickOrder = saved && Array.isArray(saved.order) ? saved.order.filter((id) => G.run.picks[id]) : [];
    for (const c of N.CARDS) if (G.run.picks[c.id] && G.pickOrder.indexOf(c.id) < 0) G.pickOrder.push(c.id);
    G.maxSec = saved ? saved.maxSec || 0 : 0;
    G.mode = 'play'; G.menu = null; G.choice = null; G.fly = null; G.zoom = null; G.finale = null; G.pendingChoice = null;
    G.ended = false; G.endInfo = null; G.stageDone = false;
    G.riders = []; G.pops = []; G.hearts = []; G.confetti = []; G.calls = []; G.tail = []; G.robots = []; G.walkers = [];
    G.stn.guests = []; G.stn.bubble = null; G.stn.banner = null; G.stn.rooms = []; G.stn.room = null;
    G.shownEarth = G.run.earth; G.rate = 0; G.secAt = Math.floor(G.run.playSec); G.secN = 0;
    G.hint = G.run.stage === 0 && G.run.guests === 0;
    G.hand.has = false; G.hand.lastMove = -99;
    const M = G.L.map;
    G.noz.x = M.x + M.w * 0.5; G.noz.y = M.y + M.h * 0.4; G.noz.spin = false;
    G.twin.x = G.noz.x + 60; G.twin.y = G.noz.y;
    G.bot.tx = G.noz.x; G.bot.ty = G.noz.y; G.hand.x = G.noz.x; G.hand.y = G.noz.y;
    buildStage();
    syncRobots(true);
    // 손님 칸 채우기(다시 열었을 때도 몇 명은 놀고 있게)
    const n = Math.min(13, Math.round(G.run.guests));
    for (let i = 0; i < n; i++) addGuest((i * 3) % A.NV, true);
    if (saved && saved.ended && G.run.stage === N.STAGES.length - 1 && G.run.left <= 0) {
      G.ended = true; G.mode = 'end'; G.crowd = [];
      G.endInfo = endInfo(saved.prevBest || null);
    } else if (saved && saved.open && Array.isArray(saved.open.ids) && saved.open.ids.length) {
      showChoice(saved.open.tier, saved.open.ids);
    }
    G.picksCanvas = U.renderPicks(G);
  }
  function resetGame() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ }
    startRun(null);
    save();
  }

  // ---------- 판 만들기 ----------
  function buildStage() {
    G.world = Wd.make(G.run.stage, G.L, (G.run.seed + G.run.stage * 101) >>> 0);
    G.crowd = Wd.initCrowd(G.world, targetCount(), Math.random);
    buildArt();
  }
  function buildBg(world) {
    const L = G.L, RS = G.RS;
    return [0, 1, 2].map((v) => {
      const c = A.mk(L.W * RS, L.H * RS), g = c.getContext('2d');
      g.setTransform(RS, 0, 0, RS, 0, 0); g.lineCap = 'round'; g.lineJoin = 'round';
      A.seed(101 + v * 7919);
      U.drawStatic(g, L);
      Wd.drawMap(g, world);
      U.drawPanels(g, L);
      return c;
    });
  }
  function buildArt() {
    const RS = G.RS;
    G.bg = buildBg(G.world);
    G.strip = U.stripArt(G.L, RS);
    const UR = RS * (G.L.ui ? G.L.ui.k : 1);   // 휴대폰 아래 칸은 키워 그리므로 그만큼 촘촘히 만든다
    G.roomArt = U.roomArt(G.L, UR);
    G.spr = A.sprites(figScale(G.run.stage), RS);
    G.stnSpr = A.sprites(1.4, UR);
    G.riderSpr = A.sprites(0.62, RS);
    G.walkSpr = A.sprites(1.15, RS);
    G.photoSpr = A.sprites(2.4, RS);
    G.picksCanvas = U.renderPicks(G);
    if (G.choice) { const c = G.choice; c.rects = U.cardRects(G.L, c.ids.length); c.cards = c.ids.map((id, i) => U.renderCard(G, id, c.rects[i])); }
  }

  // ---------- 크기 ----------
  function resize() {
    const portrait = innerHeight > innerWidth * 1.15;
    // 세로는 무대 높이를 화면 비율에 맞춘다(8px 넘게 달라질 때만 다시 짠다 — 주소창이 살짝 움직일 때마다 판을 다시 만들지 않게)
    const wantH = portrait ? Math.min(Wd.PORTRAIT_H[1], Math.max(Wd.PORTRAIT_H[0], Math.round(720 * innerHeight / innerWidth))) : 720;
    const changed = !G.L || G.L.portrait !== portrait || (portrait && Math.abs(G.L.H - wantH) > 8);
    if (changed) G.L = Wd.layout(portrait, wantH);
    const L = G.L;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const scale = Math.min(innerWidth / L.W, innerHeight / L.H);
    const cw = Math.max(1, Math.round(L.W * scale)), ch = Math.max(1, Math.round(L.H * scale));
    cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    G.RS = cv.width / L.W; G.cssScale = scale;
    return changed;
  }
  function onResize() {
    const changed = resize();
    if (!G.run) return;
    if (changed) {
      // 가로 ↔ 세로 — 같은 판을 새 칸에 맞춰 다시 그린다
      const M = G.L.map;
      G.noz.x = Math.min(M.x + M.w - 10, Math.max(M.x + 10, G.noz.x)); G.noz.y = Math.min(M.y + M.h - 10, Math.max(M.y + 10, G.noz.y));
      if (G.mode === 'zoom') finishZoom();
      buildStage(); syncRobots(true);
      for (const q of G.stn.guests) { q.x = G.L.win.x + G.L.win.w / 2; q.y = G.L.win.y + G.L.win.h / 2; }
    } else buildArt();
  }

  // ---------- 손 · 손가락 · 시험용 손(봇) ----------
  function toStage(e) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * G.L.W, y: (e.clientY - r.top) / r.height * G.L.H };
  }
  function inRect(p, r) { return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }
  function clampMap(x, y) {
    const M = G.L.map;
    return [Math.min(M.x + M.w - 6, Math.max(M.x + 6, x)), Math.min(M.y + M.h - 6, Math.max(M.y + 6, y))];
  }
  let touchDown = false;
  function handTo(p, type) {
    if (BOT) return;
    const off = type === 'touch' ? 40 / G.cssScale : 0;   // 휴대폰 = 손가락 40px 위
    [G.hand.x, G.hand.y] = clampMap(p.x, p.y - off);
    G.hand.has = true; G.hand.pending = true;
  }
  cv.addEventListener('pointermove', (e) => {
    const p = toStage(e);
    G.pointer = p;
    hoverUpdate(p);
    if (e.pointerType === 'mouse' || touchDown) handTo(p, e.pointerType);
  });
  cv.addEventListener('pointerdown', (e) => {
    const p = toStage(e);
    if (uiClick(p)) { e.preventDefault(); return; }
    if (e.pointerType !== 'mouse') { touchDown = true; try { cv.setPointerCapture(e.pointerId); } catch (er) { /* 무시 */ } }
    handTo(p, e.pointerType);
  });
  const up = () => { touchDown = false; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  window.addEventListener('keydown', (e) => {
    if (G.mode === 'choose' && !G.menu && G.choice && /^[1-3]$/.test(e.key)) { const i = Number(e.key) - 1; if (i < G.choice.ids.length) choose(i); }
    if (e.key === 'Escape' && G.mode !== 'end') { G.menu = G.menu ? null : 'open'; }
  });
  function hoverUpdate(p) {
    let cur = 'default';
    if (G.menu) { const b = U.menuButtons(G.L, G.menu === 'confirm').find((q) => inRect(p, q)); G.menuHover = b ? b.id : null; if (b) cur = 'pointer'; }
    else if (G.mode === 'end') { const b = U.endButtons(G.L).find((q) => inRect(p, q)); G.endHover = b ? b.id : null; if (b) cur = 'pointer'; }
    else if (G.mode === 'choose' && G.choice) { G.choice.hover = G.choice.rects.findIndex((r) => inRect(p, r)); if (G.choice.hover >= 0) cur = 'pointer'; }
    else if (inRect(p, G.L.menu)) cur = 'pointer';
    else if (G.mode === 'play' && inRect(p, G.L.map)) cur = 'none';
    cv.style.cursor = cur;
  }
  function uiClick(p) {
    if (G.menu) {
      const b = U.menuButtons(G.L, G.menu === 'confirm').find((q) => inRect(p, q));
      if (!b) return true;
      if (b.id === 'resume' || b.id === 'back') G.menu = b.id === 'back' ? 'open' : null;
      else if (b.id === 'code') copyCode();
      else if (b.id === 'sound') EC.sound.setOn(!EC.sound.isOn());
      else if (b.id === 'ask') G.menu = 'confirm';
      else if (b.id === 'reset') { G.menu = null; resetGame(); }
      return true;
    }
    if (G.mode === 'end') {
      const b = U.endButtons(G.L).find((q) => inRect(p, q));
      if (b && b.id === 'save') savePicture();
      if (b && b.id === 'code') copyCode();
      if (b && b.id === 'again') resetGame();
      return true;
    }
    if (G.mode === 'choose' && G.choice) {
      const i = G.choice.rects.findIndex((r) => inRect(p, r));
      if (i >= 0 && G.uiClock - G.choice.t0 > 0.12) choose(i);
      return true;
    }
    if (inRect(p, G.L.menu) && G.mode !== 'finale') { G.menu = 'open'; return true; }
    return false;
  }
  function updateBot(dt) {
    const b = G.bot, h = G.hand;
    b.re -= dt;
    if (b.re <= 0 || Math.hypot(b.tx - h.x, b.ty - h.y) < 14) {
      b.re = 0.8;
      let live = 0;
      for (const p of G.crowd) if (p.st !== 3) live++;
      if (live < 40) {
        let best = null, bd = 1e9;
        for (const p of G.crowd) { if (p.st === 3) continue; const d = Math.hypot(p.x - h.x, p.y - h.y); if (d < bd) { bd = d; best = p; } }
        if (best) { b.tx = best.x; b.ty = best.y; }
      } else {
        const c = densest(h.x, h.y, 260, null);
        if (c) { b.tx = c.x + (Math.random() - 0.5) * 30; b.ty = c.y + (Math.random() - 0.5) * 30; }
      }
      [b.tx, b.ty] = clampMap(b.tx, b.ty);
    }
    const dx = b.tx - h.x, dy = b.ty - h.y, d = Math.hypot(dx, dy);
    const s = Math.min(d, 520 * dt);
    if (d > 0.01) { h.x += dx / d * s; h.y += dy / d * s; }
    h.has = true; h.lastMove = G.run.playSec;
  }

  // ---------- 촘촘한 곳 찾기(로봇 · 봇) ----------
  function buildGrid() {
    const M = G.L.map;
    gridW = Math.ceil(M.w / CELL) + 1; gridH = Math.ceil(M.h / CELL) + 1;
    const n = gridW * gridH;
    if (grid.length !== n) { grid = []; for (let i = 0; i < n; i++) grid.push([]); }
    for (let i = 0; i < n; i++) grid[i].length = 0;
    for (const p of G.crowd) {
      if (p.st === 3) continue;
      const gx = Math.min(gridW - 1, Math.max(0, ((p.x - M.x) / CELL) | 0)), gy = Math.min(gridH - 1, Math.max(0, ((p.y - M.y) / CELL) | 0));
      grid[gy * gridW + gx].push(p);
    }
  }
  function query(x, y, r, fn) {
    const M = G.L.map, r2 = r * r;
    const x0 = Math.max(0, ((x - r - M.x) / CELL) | 0), x1 = Math.min(gridW - 1, ((x + r - M.x) / CELL) | 0);
    const y0 = Math.max(0, ((y - r - M.y) / CELL) | 0), y1 = Math.min(gridH - 1, ((y + r - M.y) / CELL) | 0);
    for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
      const cell = grid[gy * gridW + gx];
      for (let i = 0; i < cell.length; i++) {
        const p = cell[i];
        if (p.st === 3) continue;
        const dx = p.x - x, dy = p.y - y, d2 = dx * dx + dy * dy;
        if (d2 < r2) fn(p, d2);
      }
    }
  }
  function densest(x, y, falloff, avoid) {
    const M = G.L.map;
    let best = null, bs = 0;
    if (grid.length !== gridW * gridH) return null;
    for (let gy = 0; gy < gridH; gy++) for (let gx = 0; gx < gridW; gx++) {
      let n = 0;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const qx = gx + ox, qy = gy + oy;
        if (qx >= 0 && qy >= 0 && qx < gridW && qy < gridH) n += grid[qy * gridW + qx].length;
      }
      if (!n) continue;
      const cx = M.x + (gx + 0.5) * CELL, cy = M.y + (gy + 0.5) * CELL;
      let s = n / (1 + Math.hypot(cx - x, cy - y) / falloff);
      if (avoid) for (const a of avoid) if (Math.hypot(a.tx - cx, a.ty - cy) < 180 || Math.hypot(a.x - cx, a.y - cy) < 140) s *= 0.2;
      if (s > bs) { bs = s; best = { x: cx, y: cy }; }
    }
    return best;
  }

  // ---------- 흡입구 · 쌍둥이 · 로봇 · 산책 손님 ----------
  function sizes() {
    const st = G.st, run = G.run, burst = run.burst > 0;
    const bm = burst ? st.burstMul : 1;
    const r = st.radius * bm;
    const lc = N.lastCall(st, run.stage, run.left);
    const ring = N.ringRadius(st) * bm * (lc ? B.lastCallRing : 1);
    const rr = st.radius * B.robotRadius * st.robotSize * (burst && st.burstAll ? B.burstMul : 1);
    const rv = B.robotSpeed * st.robotSpeed;
    return { r, ring, lc, rr, rv, burst };
  }
  function moveNozzle(dt, z) {
    const n = G.noz, h = G.hand, st = G.st;
    const idle = G.run.playSec - h.lastMove;
    let tx = n.x, ty = n.y, vmax = B.maxSpeed;
    if (st.autoSpin && idle >= B.autoIdleSec && !BOT) {
      // 혼자서도 빙글 — 손을 쉬면 고리를 그리며 돈다(가운데는 사람 많은 쪽으로 천천히)
      if (!n.spin) { n.spin = true; n.scx = n.x; n.scy = n.y; n.sr = 0; n.sa = 0; }
      n.sr = Math.min(SPIN_R, n.sr + SPIN_R * 2 * dt);
      n.sa += B.autoSpeed / SPIN_R * dt;
      if (Math.random() < dt) { const c = densest(n.scx, n.scy, 200, null); if (c) { n.stx = c.x; n.sty = c.y; } }
      if (n.stx !== undefined) { const dx = n.stx - n.scx, dy = n.sty - n.scy, d = Math.hypot(dx, dy); if (d > 1) { const s = Math.min(d, 40 * dt); n.scx += dx / d * s; n.scy += dy / d * s; } }
      tx = n.scx + Math.cos(n.sa) * n.sr; ty = n.scy + Math.sin(n.sa) * n.sr; vmax = B.autoSpeed * 1.6;
    } else {
      n.spin = false;
      if (h.has) { tx = h.x; ty = h.y; }
    }
    const dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy);
    if (d > 0.01) {
      const s = Math.min(d, vmax * dt);
      n.x += dx / d * s; n.y += dy / d * s;
      if (s > 0.3) { const k = 1 - Math.exp(-dt * 6); n.dirx += (dx / d - n.dirx) * k; n.diry += (dy / d - n.diry) * k; }
    }
    [n.x, n.y] = clampMap(n.x, n.y);
    n.r = z.r;
    // 쌍둥이 — 손 옆을 따라다닌다
    if (st.twin > 1) {
      const t = G.twin, l = Math.hypot(n.dirx, n.diry) || 1;
      const px = -n.diry / l, py = n.dirx / l, off = z.r * 2.1;
      const k = 1 - Math.exp(-dt * 7);
      t.x += (n.x + px * off - t.x) * k; t.y += (n.y + py * off - t.y) * k;
      [t.x, t.y] = clampMap(t.x, t.y);
      t.r = z.r * 0.75;
    }
    // 꼬리바람 — 지나간 자리에 바람이 남는다
    if (st.trail > 1) {
      G.tailClock += dt;
      if (G.tailClock >= 0.05) { G.tailClock = 0; G.tail.push({ x: n.x, y: n.y, t: G.run.playSec }); }
      const keep = (st.trail - 1) * TRAIL_K;
      while (G.tail.length && G.run.playSec - G.tail[0].t > keep) G.tail.shift();
    } else G.tail.length = 0;
  }
  function syncRobots(instant) {
    const st = G.st, M = G.L.map;
    while (G.robots.length < st.robots) {
      const x = instant ? M.x + 80 + Math.random() * (M.w - 160) : G.noz.x + (Math.random() - 0.5) * 40;
      const y = instant ? M.y + 140 + Math.random() * (M.h - 200) : G.noz.y;
      G.robots.push({ x, y, tx: x, ty: y, re: 0, r: 16, drop: instant ? 0 : 1, ph: Math.random() * 6 });
    }
    const nw = st.walkers ? N.walkerCount(G.run.guests) : 0;
    while (G.walkers.length < nw) {
      const x = M.x + 80 + Math.random() * (M.w - 160), y = M.y + 140 + Math.random() * (M.h - 200);
      G.walkers.push({ x, y, tx: x, ty: y, re: 0, r: 10, drop: instant ? 0 : 1, ph: Math.random() * 6, v: (Math.random() * A.NV) | 0 });
    }
  }
  function moveBots(list, dt, r, v) {
    for (const b of list) {
      b.r = r;
      if (b.drop > 0) { b.drop = Math.max(0, b.drop - dt * 1.6); continue; }
      b.re -= dt;
      if (b.re <= 0 || Math.hypot(b.tx - b.x, b.ty - b.y) < 8) {
        b.re = 1.2 + Math.random();
        const others = list.filter((o) => o !== b);
        const c = densest(b.x, b.y, 300, others);
        if (c) { b.tx = c.x + (Math.random() - 0.5) * 40; b.ty = c.y + (Math.random() - 0.5) * 40; }
        [b.tx, b.ty] = clampMap(b.tx, b.ty);
      }
      const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy);
      if (d > 0.01) { const s = Math.min(d, v * dt); b.x += dx / d * s; b.y += dy / d * s; }
      b.ph += dt;
    }
  }

  // ---------- 모시기 ----------
  function fly(p, c) {
    p.st = 3; p.by = c; p.vel = 120; p.ft = 0; p.rot = 0; p.sc = 1;
    p.sd = Math.random() < 0.5 ? -1 : 1; p.spin = p.sd * (4 + Math.random() * 3);
    EC.sound.take();
    if (G.run.left <= perEff() * 1.01 + 1e-6) pop('나도!', p.x - 14, p.y - 30, true);
    if (G.clock - G.lastCheer > 0.6 && c === G.noz) {
      G.lastCheer = G.clock; G.cheerSide = -G.cheerSide;
      const s = ['와~', '야호!', '우와!', '신난다~'][(Math.random() * 4) | 0];
      pop(s, G.cheerSide > 0 ? c.x + c.r + 6 : c.x - c.r - 40, c.y - 18 - Math.random() * 22);
    }
  }
  function catchAll(z) {
    const n = G.noz, stamp = G.stamp, r2 = z.r * z.r;
    const heartP = 0.1 + 0.05 * (G.run.picks.pull || 0) + (G.run.picks.window ? 0.08 : 0);
    query(n.x, n.y, z.ring, (p, d2) => {
      if (d2 < r2) { fly(p, n); return; }
      if (p.cool > 0 && !z.lc) return;
      if (p.exc < stamp - 1 && Math.random() < heartP && G.hearts.length < 40) G.hearts.push({ x: p.x, y: p.y - G.spr.h - 4, t: 0 });
      p.exc = stamp; p.by = n;
    });
    if (G.st.twin > 1) query(G.twin.x, G.twin.y, G.twin.r, (p) => fly(p, G.twin));
    for (const b of G.robots) if (!b.drop) query(b.x, b.y, b.r, (p) => fly(p, b));
    for (const w of G.walkers) if (!w.drop) query(w.x, w.y, w.r, (p) => fly(p, w));
    if (G.tail.length) { const tr = z.r * 0.6; for (let i = 0; i < G.tail.length; i += 2) query(G.tail[i].x, G.tail[i].y, tr, (p) => fly(p, n)); }
  }
  function onArrive(p) {
    addRider(p.v, p.by);
    if (G.stageDone) return;
    const before = G.run.guests;
    const w = N.welcome(G.run, perEff());
    G.run = w.state;
    const took = G.run.guests - before;
    G.secN += took; G.rateAcc = (G.rateAcc || 0) + took;
    G.hint = false;
    if (G.run.picks.friend && G.clock - G.lastFriendPop > 7 && Math.random() < 0.05) { G.lastFriendPop = G.clock; pop('친구도!', G.noz.x + 20, G.noz.y - 60); }
    for (const e of w.events) {
      if (e.type === 'clear') { startZoom(); return; }
      if (e.type === 'end') { startFinale(); return; }
    }
  }
  function refill() {
    const need = targetCount() - G.crowd.length;
    for (let i = 0; i < need && i < 80; i++) { const p = Wd.spawn(G.world, Math.random); if (p) G.crowd.push(p); }
  }
  function onTickEvent(e) {
    if (e.type === 'burstStart') { pop('신바람!', G.noz.x - 30, G.noz.y - 70, true); EC.sound.burst(); }
    if (e.type === 'burstEnd' && G.st.gaugeAfter > 0) pop('한 번 더!', G.noz.x - 30, G.noz.y - 70, true);
  }
  const PHASE_MUL = [
    { plaza: 0.6, park: 0.3, market: 0.4, shop: 1, av: 2.5 },
    { plaza: 1, park: 0.6, market: 2.5, shop: 1, av: 1 },
    { plaza: 1.2, park: 2.5, market: 0.6, shop: 1, av: 1 },
    { plaza: 1.4, park: 1, market: 1, shop: 1, av: 1.6 },
  ];
  const PHASE_NAME = ['아침', '낮', '오후', '저녁'];
  function phase() {
    if (G.run.stage !== 2) return -1;
    const p = 1 - G.run.left / N.STAGES[2].people;
    return p < 0.18 ? 0 : p < 0.5 ? 1 : p < 0.82 ? 2 : 3;
  }
  const cx = { dt: 0, stamp: 0, walkIn: B.walkIn, R: Math.random, spotMul: () => 1, avMul: 1 };
  function crowdCtx(dt) {
    const ph = phase();
    cx.dt = dt; cx.stamp = G.stamp; cx.lastCall = G.run.stage > 0 && N.lastCall(G.st, G.run.stage, G.run.left);
    cx.spotMul = ph < 0 ? () => 1 : (k) => (PHASE_MUL[ph][k] !== undefined ? PHASE_MUL[ph][k] : 1);
    cx.avMul = ph < 0 ? 1 : PHASE_MUL[ph].av;
    return cx;
  }

  // 놀이 한 걸음(멈춘 동안은 부르지 않는다)
  function stepPlay(dt) {
    G.stamp++;
    buildGrid();
    if (BOT) updateBot(dt);
    if (G.hand.pending) { G.hand.pending = false; G.hand.lastMove = G.run.playSec; }
    const handOn = G.run.playSec - G.hand.lastMove < 0.3;
    const tk = N.tick(G.run, G.st, dt, handOn);
    G.run = tk.state;
    for (const e of tk.events) onTickEvent(e);
    if (Math.floor(G.run.playSec) !== G.secAt) { G.maxSec = Math.max(G.maxSec, G.secN); G.secN = 0; G.secAt = Math.floor(G.run.playSec); }
    const z = sizes();
    moveNozzle(dt, z);
    syncRobots(false);
    moveBots(G.robots, dt, z.rr, z.rv);
    moveBots(G.walkers, dt, z.rr * Math.sqrt(B.walkerShare), z.rv * Math.sqrt(B.walkerShare));
    catchAll(z);
    arrivedBuf.length = 0;
    Wd.step(G.world, G.crowd, crowdCtx(dt), arrivedBuf);
    for (const p of arrivedBuf) { onArrive(p); if (G.mode !== 'play') break; }
    G.rate += ((G.rateAcc || 0) / dt - G.rate) * (1 - Math.exp(-dt / 1.5)); G.rateAcc = 0;
    if (G.mode !== 'play') return;
    refill();
    const due = N.nextChoice(G.run);
    if (due) openChoice(due);
  }

  // ---------- 선택창 ----------
  function openChoice(tier) {
    const o = N.openChoice(G.run, tier, offerRand());
    G.run = o.state;
    if (!o.ids.length) return;
    showChoice(tier, o.ids);
    save();
  }
  function showChoice(tier, ids) {
    G.mode = 'choose';
    EC.sound.cardOpen(tier === 'big');
    const rects = U.cardRects(G.L, ids.length);
    G.choice = { tier, ids: ids.slice(), rects, cards: ids.map((id, i) => U.renderCard(G, id, rects[i])), t0: G.uiClock, hover: -1,
      botAt: BOT ? G.uiClock + (SPEED >= 5 ? 0.15 : 0.8) : Infinity };
    if (G.pointer) hoverUpdate(G.pointer);
  }
  const BOT_ORDER = ['twin', 'jumbo', 'robot3', 'window', 'fof', 'fest', 'stroll', 'chubby', 'spin', 'again', 'robot', 'wide', 'friend', 'trail', 'pull', 'joy'];
  function botPick() {
    const ids = G.choice.ids;
    if (Math.random() < 0.35) return (Math.random() * ids.length) | 0;
    let bi = 0, bo = 99;
    ids.forEach((id, i) => { const o = BOT_ORDER.indexOf(id); if (o < bo) { bo = o; bi = i; } });
    return bi;
  }
  function choose(i) {
    const ch = G.choice, id = ch.ids[i];
    EC.sound.cardPick();
    G.run = N.pick(G.run, id); G.st = N.stats(G.run.picks);
    if (G.pickOrder.indexOf(id) < 0) G.pickOrder.push(id);
    G.picksCanvas = U.renderPicks(G);
    G.fly = { t0: G.uiClock, rects: ch.rects, cards: ch.cards, idx: i, to: U.rowRect(G.L, G.pickOrder.indexOf(id)) };
    G.choice = null; G.mode = 'play';
    syncRobots(false);
    pop(N.cardById(id).name + '!', G.noz.x - 30, G.noz.y - 80, true);
    save();
    if (G.pointer) hoverUpdate(G.pointer);
  }

  // ---------- 판 넘어가기(줌아웃) · 끝 ----------
  function startZoom() {
    G.stageDone = true;
    EC.sound.clear();
    const S = N.STAGES[G.run.stage];
    const label = G.run.stage === 0 ? `내 방 친구 ${U.fmt(S.people)}명 모두 도착!` : `${S.name} 사람 ${U.fmt(S.people)}명 모두 도착!`;
    G.stn.banner = { s: label, t: 0 };
    for (const p of G.crowd) addRider(p.v, G.noz);
    G.crowd = [];
    G.mode = 'zoom';
    G.zoom = { t: 0, snap: G.bg[0], switched: false };
    G.run = N.nextStage(G.run);
    const o = N.openChoice(G.run, 'big', offerRand());
    G.run = o.state;
    G.pendingChoice = o.ids.length ? { tier: 'big', ids: o.ids } : null;
    G.nextWorld = Wd.make(G.run.stage, G.L, (G.run.seed + G.run.stage * 101) >>> 0);
    G.robots.forEach((b) => { b.drop = 1; });
    G.walkers.forEach((b) => { b.drop = 1; });
    G.tail.length = 0;
    save();
  }
  function switchWorld() {
    G.zoom.switched = true;
    G.world = G.nextWorld; G.nextWorld = null;
    G.crowd = Wd.initCrowd(G.world, targetCount(), Math.random);
    G.bg = buildBg(G.world);
    G.spr = A.sprites(figScale(G.run.stage), G.RS);
  }
  function finishZoom() {
    if (G.zoom && !G.zoom.switched) switchWorld();
    G.zoom = null; G.stageDone = false; G.stn.banner = null;
    G.mode = 'play';
    if (G.pendingChoice) { const pc = G.pendingChoice; G.pendingChoice = null; showChoice(pc.tier, pc.ids); }
    save();
  }
  function startFinale() {
    G.stageDone = true;
    EC.sound.finale();
    for (const p of G.crowd) addRider(p.v, G.noz);
    G.crowd = [];
    G.mode = 'finale'; G.finale = { t: 0 };
    G.ended = true;
    G.maxSec = Math.max(G.maxSec, G.secN);
    const prev = bestGet();
    G.endInfo = endInfo(prev || null);
    if (!prev || G.run.playSec < prev) bestSet(G.run.playSec);
    save();
  }
  function endInfo(prevBest) {
    const guests = Math.round(G.run.guests);
    return { guests, earth: N.EARTH_START - guests, playSec: G.run.playSec, bursts: G.run.bursts, maxSec: G.maxSec, prevBest };
  }

  // ---------- 손님 · 호스 탄 사람 · 말풍선 ----------
  function addRider(v, c) {
    if (G.riders.length >= 70) return;
    const picks = G.run.picks;
    let n = 1;
    if (picks.fof) n = 3;
    else if (picks.friend && Math.random() < Math.min(0.9, picks.friend * 0.25)) n = 2;
    G.riders.push({ v, t: 0, sp: 0.7 + Math.random() * 0.15, wob: Math.random() * 6, spin: Math.random() < 0.5 ? (Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 4) : 0, n,
      src: c && c !== G.noz && c !== G.twin ? c : null, twin: c === G.twin });
  }
  function addGuest(v, quiet) {
    const L = G.L, wn = L.win;
    const S = G.stn;
    if (S.guests.length >= 13) return;
    const fromRight = L.hatchDir === 'right';
    S.guests.push({ v, ph: Math.random() * 6, rot: (Math.random() - 0.5) * 0.6, vr: (Math.random() - 0.5) * 0.8,
      wide: Math.random() < 0.55, sleep: Math.random() < 0.12,
      x: quiet ? wn.x + 20 + Math.random() * (wn.w - 40) : fromRight ? wn.x + wn.w - 10 : (L.hatchIn || L.hatch).x,
      y: quiet ? wn.y + 50 + Math.random() * (wn.h - 70) : fromRight ? L.hatch.y : wn.y + 14,
      vx: fromRight ? -(70 + Math.random() * 60) : (Math.random() - 0.5) * 60, vy: fromRight ? (Math.random() - 0.5) * 60 : 70 + Math.random() * 50 });
  }
  function pop(s, x, y, big) { if (G.pops.length < 12) G.pops.push({ s, x, y, t: 0, big: !!big }); }
  function toast(s) { G.toast = { s, t: 0, dur: 1.8 }; }

  function updateStation(dt) {
    const S = G.stn, L = G.L, wn = L.win, t = G.clock;
    const guests = N.EARTH_START - Math.round(G.shownEarth);
    const rooms = U.unlockedRooms(guests);
    if (rooms.length > S.rooms.length) {
      const nr = rooms[rooms.length - 1];
      S.rooms = rooms; S.room = nr; S.roomT = 0;
      const cand = S.guests.filter((q) => !q.sleep);
      if (cand.length) S.bubble = { g: cand[(Math.random() * cand.length) | 0], s: nr.talk, t: 0 };
    } else if (rooms.length < S.rooms.length) { S.rooms = rooms; S.room = rooms[rooms.length - 1] || null; }
    S.roomT += dt;
    if (S.rooms.length > 1 && S.roomT > 6) { S.roomT = 0; const i = S.rooms.indexOf(S.room); S.room = S.rooms[(i + 1) % S.rooms.length]; }
    const flagRoom = S.room && (S.room.id === 'dining' || S.room.id === 'party' || S.room.id === 'cinema' || S.room.id === 'karaoke');
    const topPad = flagRoom ? 46 : 22;
    for (let i = 0; i < S.guests.length; i++) for (let k = i + 1; k < S.guests.length; k++) {
      const a = S.guests[i], b = S.guests[k], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d < 34 && d > 0.01) { const f = (34 - d) * 2.2 * dt; a.vx -= dx / d * f; a.vy -= dy / d * f; b.vx += dx / d * f; b.vy += dy / d * f; }
    }
    const tramp = S.room && S.room.id === 'tramp';
    for (const q of S.guests) {
      const sp = Math.hypot(q.vx, q.vy);
      if (sp > 12) { const k = Math.exp(-dt * 1.4); q.vx *= k; q.vy *= k; }
      else if (sp < 5) { q.vx += (Math.random() - 0.5) * 20 * dt; q.vy += (Math.random() - 0.5) * 20 * dt; }
      q.x += q.vx * dt; q.y += q.vy * dt + Math.sin(t * (tramp ? 4 : 1.3) + q.ph) * (tramp ? 30 : 4) * dt;
      const x0 = wn.x + 10, x1 = wn.x + wn.w - 10, y0 = wn.y + topPad, y1 = wn.y + wn.h - 14;
      if (q.x < x0) { q.x = x0; q.vx = Math.abs(q.vx); } if (q.x > x1) { q.x = x1; q.vx = -Math.abs(q.vx); }
      if (q.y < y0) { q.y = y0; q.vy = Math.abs(q.vy); } if (q.y > y1) { q.y = y1; q.vy = -Math.abs(q.vy); }
      q.vr += (Math.random() - 0.5) * 1.5 * dt; q.vr *= Math.exp(-dt * 0.6);
      q.rot += q.vr * dt; if (q.rot > 0.7) { q.rot = 0.7; q.vr = -Math.abs(q.vr); } if (q.rot < -0.7) { q.rot = -0.7; q.vr = Math.abs(q.vr); }
      q.hat = !!G.run.picks.stroll && (q.ph * 10 | 0) % 3 === 0;
    }
    if (S.bubble) { S.bubble.t += dt; if (S.bubble.t > 2.6) { S.bubble = null; S.bubbleWait = 1.4 + Math.random() * 1.2; } }
    else if ((S.bubbleWait -= dt) <= 0 && S.guests.length) {
      const cand = S.guests.filter((q) => !q.sleep);
      if (cand.length) {
        let k; do { k = (Math.random() * U.TALK.length) | 0; } while (k === S.lastTalk && U.TALK.length > 1);
        S.lastTalk = k; S.bubble = { g: cand[(Math.random() * cand.length) | 0], s: U.TALK[k], t: 0 };
      }
    }
    for (const o of S.flashes) o.t += dt; S.flashes = S.flashes.filter((o) => o.t < 0.35);
    if (S.banner) S.banner.t += dt;
  }
  function updateFx(dt, vdt) {
    for (const r of G.riders) r.t += vdt * r.sp;
    for (const r of G.riders) if (r.t >= 1) {
      G.stn.flashes.push({ t: 0 });
      if (G.stn.guests.length < 13 && G.clock - G.stn.lastAdd > 0.45) { G.stn.lastAdd = G.clock; addGuest(r.v, false); }
    }
    G.riders = G.riders.filter((r) => r.t < 1);
    for (const o of G.pops) o.t += dt; G.pops = G.pops.filter((o) => o.t < (o.big ? 1.4 : 1.1));
    for (const o of G.hearts) o.t += dt; G.hearts = G.hearts.filter((o) => o.t < 1.2);
    // 신바람 축제 — 색종이
    if (G.run.burst > 0 && G.st.burstAll && G.mode === 'play' && G.confetti.length < 90) {
      const M = G.L.map;
      for (let i = 0; i < 2; i++) G.confetti.push({ x: M.x + Math.random() * M.w, y: M.y - 10, vx: (Math.random() - 0.5) * 40, vy: 60 + Math.random() * 80, r: Math.random() * 6, vr: (Math.random() - 0.5) * 8, t: 0 });
    }
    for (const c of G.confetti) { c.x += c.vx * dt; c.y += c.vy * dt; c.r += c.vr * dt; c.t += dt; }
    G.confetti = G.confetti.filter((c) => c.t < 6 && c.y < G.L.map.y + G.L.map.h + 10);
    // 판 끝 「나도!」 말풍선
    for (const b of G.calls) b.t += dt;
    G.calls = G.calls.filter((b) => b.t < 1.3 && !b.p.gone && b.p.st !== 3);
    if (G.mode === 'play' && G.run.stage > 0 && N.lastCall(G.st, G.run.stage, G.run.left) && G.calls.length < 3 && Math.random() < dt * 2 && G.crowd.length) {
      const p = G.crowd[(Math.random() * G.crowd.length) | 0];
      if (p.st !== 3) G.calls.push({ p, t: 0 });
    }
    if (G.toast) { G.toast.t += dt; if (G.toast.t > G.toast.dur) G.toast = null; }
    const target = G.run.earth;
    G.shownEarth += (target - G.shownEarth) * (1 - Math.exp(-dt * 7 * Math.max(1, Math.sqrt(SPEED))));
    if (Math.abs(target - G.shownEarth) < 0.5) G.shownEarth = target;
    updateStation(dt);
  }

  // ---------- 매 프레임 ----------
  let lastSave = 0;
  function update(rdt) {
    // 선택창이 떠 있는 동안은 장면 시계를 세운다 — 숫자뿐 아니라 지도 · 호스 · 정거장 그림도 선다(대표 「멈추는 쪽으로 해」 · 검증 B3)
    const frozen = G.mode === 'choose' && !G.menu;
    G.uiClock += rdt;
    if (!frozen) G.clock += rdt;
    const vdt = rdt * Math.min(SPEED, 3);
    if (!G.menu) {
      if (G.mode === 'play') {
        let gdt = rdt * SPEED;
        while (gdt > 1e-6 && G.mode === 'play' && !G.menu) { const d = Math.min(STEP, gdt); stepPlay(d); gdt -= d; }
      } else if (G.mode === 'choose') {
        if (BOT && G.choice && G.uiClock >= G.choice.botAt) choose(botPick());
      } else if (G.mode === 'zoom') {
        const zt = (G.zoom.t += rdt);
        if (zt >= ZOOM_FLAG && !G.zoom.switched) switchWorld();
        if (G.zoom.switched) { G.stamp++; arrivedBuf.length = 0; Wd.step(G.world, G.crowd, crowdCtx(rdt), arrivedBuf); }
        if (zt >= ZOOM_FLAG + ZOOM_SEC) finishZoom();
      } else if (G.mode === 'finale') {
        G.finale.t += rdt;
        if (G.finale.t >= FINALE_SEC) { G.mode = 'end'; G.finale = null; if (G.pointer) hoverUpdate(G.pointer); }
      }
    }
    if (G.fly && G.uiClock - G.fly.t0 > 0.3) G.fly = null;
    if (!frozen) updateFx(rdt, vdt);
    if (G.uiClock - lastSave > 5) { lastSave = G.uiClock; if (G.mode !== 'zoom' || G.pendingChoice) save(); }
  }

  // ---------- 그리기 ----------
  function hoseCtrl(x0, y0) {
    const L = G.L, h = L.hatch;
    if (L.hatchDir === 'right') {
      const dx = x0 - h.x, dy = y0 - h.y;
      return [x0, y0, x0 - dx * 0.04, y0 - Math.max(70, dy * 0.55 + 50), h.x + Math.max(90, dx * 0.5), h.y + 8, h.x, h.y];
    }
    const dy = h.y - y0;
    return [x0, y0, x0, y0 - 80, h.x + (x0 - h.x) * 0.3, h.y - Math.max(90, dy * 0.45), h.x, h.y];
  }
  function bez(P, t) { const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t; return [a * P[0] + b * P[2] + c * P[4] + d * P[6], a * P[1] + b * P[3] + c * P[5] + d * P[7]]; }
  function bezD(P, t) { const u = 1 - t, a = 3 * u * u, b = 6 * u * t, c = 3 * t * t; return [a * (P[2] - P[0]) + b * (P[4] - P[2]) + c * (P[6] - P[4]), a * (P[3] - P[1]) + b * (P[5] - P[3]) + c * (P[7] - P[5])]; }
  const nozScale = (r) => 0.45 + r / 80;

  function drawGround(x, y, r, ring, t, main) {
    ctx.fillStyle = 'rgba(255,90,44,0.06)'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.92, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = PT; ctx.lineWidth = 2; ctx.setLineDash([7, 6]); ctx.lineDashOffset = -t * 26;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.92, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    if (!main) return;
    ctx.strokeStyle = 'rgba(27,27,27,0.45)'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    const nw = 3 + (G.run.picks.pull || 0);
    for (let k = 0; k < nw; k++) {
      const a = t * 2.4 + k * 6.283 / nw, rr = r + (ring - r) * (0.15 + 0.55 * ((k * 0.37) % 1));
      ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.92, 0, a, a + 0.7); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(27,27,27,0.22)'; ctx.lineWidth = 1; ctx.setLineDash([3, 7]); ctx.lineDashOffset = t * 10;
    ctx.beginPath(); ctx.ellipse(x, y, ring, ring * 0.92, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  }
  function drawHosePath(P, width, riders) {
    const path = () => { ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.bezierCurveTo(P[2], P[3], P[4], P[5], P[6], P[7]); };
    ctx.lineCap = 'round';
    path(); ctx.strokeStyle = INK; ctx.lineWidth = width; ctx.stroke();
    path(); ctx.strokeStyle = A.PT_PALE; ctx.lineWidth = width - 3.6; ctx.stroke();
    if (riders) for (const r of riders) drawRider(P, r);
    path(); ctx.setLineDash([6, 9]); ctx.lineDashOffset = -G.clock * 45; ctx.lineCap = 'butt';
    ctx.strokeStyle = 'rgba(255,90,44,0.85)'; ctx.lineWidth = width - 3.6; ctx.stroke(); ctx.setLineDash([]);
    ctx.lineCap = 'round';
  }
  function drawRider(P, r) {
    const [x, y] = bez(P, r.t), [dx, dy] = bezD(P, r.t);
    const base = Math.atan2(dy, dx) + Math.PI / 2, sp = G.riderSpr;
    ctx.save(); ctx.translate(x, y); ctx.rotate(r.spin && r.n === 1 ? base + G.clock * r.spin : base + Math.sin(G.clock * 9 + r.wob) * 0.4);
    const f = 6 + (((G.clock * 6 + r.wob) | 0) & 1);
    for (let k = 0; k < r.n; k++) {
      const ox = (k - (r.n - 1) / 2) * sp.size * 0.42;
      ctx.drawImage(sp.spr[(r.v + k * 2) % A.NV][f], ox - sp.ax, -sp.ay + sp.h * 0.45, sp.size, sp.size);
    }
    ctx.restore();
  }
  function drawHoses() {
    const n = G.noz, s = nozScale(n.r), top = A.nozzleTop(n.y, s);
    const P = hoseCtrl(n.x, top);
    const main = [], twinR = [], bots = new Map();
    for (const r of G.riders) { if (r.src && r.t < 0.35) { (bots.get(r.src) || bots.set(r.src, []).get(r.src)).push(r); } else if (r.twin && r.t < 0.2) twinR.push(r); else main.push(r); }
    // 로봇 · 쌍둥이의 가는 호스(큰 호스로 합류)
    const join = bez(P, 0.3);
    const thin = (x, y, list, t0) => {
      const Q = [x, y, x, y - 40, join[0], join[1] + 30, join[0], join[1]];
      const path = () => { ctx.beginPath(); ctx.moveTo(Q[0], Q[1]); ctx.bezierCurveTo(Q[2], Q[3], Q[4], Q[5], Q[6], Q[7]); };
      ctx.lineCap = 'round';
      path(); ctx.strokeStyle = 'rgba(27,27,27,0.28)'; ctx.lineWidth = 4.2; ctx.stroke();
      path(); ctx.strokeStyle = 'rgba(255,227,216,0.9)'; ctx.lineWidth = 2.4; ctx.stroke();
      path(); ctx.setLineDash([4, 7]); ctx.lineDashOffset = -G.clock * 40; ctx.strokeStyle = 'rgba(255,90,44,0.55)'; ctx.stroke(); ctx.setLineDash([]);
      for (const r of list) { const tt = r.t / t0; const [qx, qy] = bez(Q, Math.min(1, tt)); const sp = G.riderSpr; ctx.drawImage(sp.spr[r.v][6], qx - sp.ax * 0.7, qy - sp.ay * 0.7 + 3, sp.size * 0.7, sp.size * 0.7); }
    };
    for (const b of G.robots) if (!b.drop) thin(b.x, b.y - 22 * (b.r / 16), bots.get(b) || [], 0.35);
    if (G.st.twin > 1) { const ts = nozScale(G.twin.r); thin(G.twin.x, A.nozzleTop(G.twin.y, ts), twinR, 0.2); }
    drawHosePath(P, 17, main);
    ctx.save(); ctx.translate(0.9, -0.7); ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.bezierCurveTo(P[2], P[3], P[4], P[5], P[6], P[7]); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    const h = G.L.hatch;
    ctx.fillStyle = PT; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.beginPath(); if (G.L.hatchDir === 'right') ctx.ellipse(h.x + 1, h.y, 5, 11, 0, 0, 7); else ctx.ellipse(h.x, h.y + 1, 11, 5, 0, 0, 7); ctx.fill(); ctx.stroke();
  }
  function drawNozzles(z) {
    const n = G.noz, t = G.clock, picks = G.run.picks;
    const bounce = z.burst ? Math.abs(Math.sin(t * 14)) * 4 : 0;
    const s = nozScale(n.r);
    if (G.st.twin > 1) A.nozzle(ctx, G.twin.x, G.twin.y, nozScale(G.twin.r), { gauge: G.run.gauge, burst: z.burst, jumbo: !!picks.jumbo, t });
    A.nozzle(ctx, n.x, n.y - bounce, s, { gauge: G.run.gauge, burst: z.burst, jumbo: !!picks.jumbo, notes: picks.joy || 0, t });
    if (n.spin && G.mode === 'play') { ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = 1; for (let k = 0; k < 2; k++) A.note(ctx, n.x + 24 * s + k * 10, n.y - 50 * s - ((t * 30 + k * 12) % 24), 1); }
    if (picks.window) {
      // 창문 풍선 — 정거장 손님이 손을 흔든다
      const bx = n.x + 34 * s, by = n.y - 86 * s - 26 + Math.sin(t * 2) * 4, R = 17;
      ctx.strokeStyle = INK; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(n.x + 4, A.nozzleTop(n.y, s)); ctx.quadraticCurveTo(bx + 8, by + R + 20, bx, by + R); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx, by, R, 0, 7); ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.arc(bx, by, R - 5, 0, 7); ctx.fillStyle = A.PT_PALE; ctx.fill(); ctx.clip();
      const sp = G.riderSpr; ctx.drawImage(sp.spr[1][4 + (((t * 3) | 0) & 1)], bx - sp.ax * 1.3, by + 8 - sp.ay * 1.3, sp.size * 1.3, sp.size * 1.3);
      ctx.restore(); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(bx, by, R - 5, 0, 7); ctx.stroke();
    }
  }
  function drawBots(z) {
    const t = G.clock, chubby = !!G.run.picks.chubby;
    for (const b of G.robots) {
      const dy = b.drop * 120;
      if (!b.drop) { ctx.strokeStyle = 'rgba(255,90,44,0.5)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r, b.r * 0.92, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
      // 몸 크기는 조금만 커진다(모시는 범위는 점선 원이 보여 준다)
      const k = (chubby ? 1.2 : 0.95) * Math.min(1.3, Math.sqrt(b.r / 16));
      A.robot(ctx, b.x, b.y + 6 - dy - (z.burst && G.st.burstAll ? Math.abs(Math.sin(t * 12 + b.ph)) * 4 : 0), k, { t: t + b.ph, prop: chubby });
    }
    const sp = G.walkSpr;
    for (const w of G.walkers) {
      const dy = w.drop * 120;
      if (!w.drop) { ctx.strokeStyle = 'rgba(255,90,44,0.45)'; ctx.lineWidth = 1; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.ellipse(w.x, w.y, w.r, w.r * 0.92, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
      const x = w.x, y = w.y + 4 - dy;
      ctx.drawImage(sp.spr[w.v][(w.ph * 6 | 0) & 3], x - sp.ax, y - sp.ay, sp.size, sp.size);
      ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - sp.h * 0.98); ctx.lineTo(x, y - sp.h * 1.15); ctx.stroke();
      ctx.fillStyle = PT; ctx.beginPath(); ctx.ellipse(x + Math.cos(t * 15 + w.ph) * 2, y - sp.h * 1.17, 5, 1.6, 0, 0, 7); ctx.fill(); ctx.stroke();
    }
  }
  function drawTail(z) {
    if (G.tail.length < 2) return;
    const now = G.run.playSec, keep = (G.st.trail - 1) * TRAIL_K;
    ctx.strokeStyle = PT; ctx.lineCap = 'round'; ctx.setLineDash([2, 7]);
    for (let i = 1; i < G.tail.length; i++) {
      const a = G.tail[i - 1], b = G.tail[i], age = (now - b.t) / keep;
      ctx.globalAlpha = Math.max(0, 0.75 * (1 - age)); ctx.lineWidth = 2 + 4 * (1 - age);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    void z;
  }
  function drawHearts() {
    for (const o of G.hearts) {
      ctx.globalAlpha = Math.min(1, (1.2 - o.t) * 2.5);
      A.heartPath(ctx, o.x, o.y - o.t * 14, 3.8); ctx.fillStyle = PT; ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 0.9; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function drawCalls() {
    ctx.font = `700 12px ${KO}`;
    for (const b of G.calls) {
      const p = b.p, a = Math.min(1, b.t * 6, (1.3 - b.t) * 4), x = p.x, y = p.y - G.spr.h - 10;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.roundRect(x - 18, y - 16, 36, 17, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText('나도!', x, y - 3.5); ctx.textAlign = 'left';
    }
    ctx.globalAlpha = 1;
    // 마지막 몇 명 — 머리 위 화살표
    if (G.mode === 'play' && G.run.stage > 0) {
      let live = 0;
      for (const p of G.crowd) if (p.st !== 3) live++;
      if (live > 0 && live < B.lastWaveN) {
        ctx.fillStyle = PT; ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
        for (const p of G.crowd) {
          if (p.st === 3) continue;
          const y = p.y - G.spr.h - 14 - Math.abs(Math.sin(G.clock * 5 + p.ph0)) * 6;
          ctx.beginPath(); ctx.moveTo(p.x - 6, y - 8); ctx.lineTo(p.x + 6, y - 8); ctx.lineTo(p.x, y); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      }
    }
  }
  function drawPops() {
    ctx.lineJoin = 'round';
    for (const o of G.pops) {
      const life = o.big ? 1.4 : 1.1, a = Math.min(1, (life - o.t) * 3), y = o.y - o.t * 20;
      ctx.font = `700 ${o.big ? 18 : 14}px ${KO}`;
      ctx.globalAlpha = Math.max(0, a); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.strokeText(o.s, o.x, y);
      ctx.fillStyle = o.big ? PT : INK; ctx.fillText(o.s, o.x, y);
    }
    ctx.globalAlpha = 1;
  }
  function drawConfetti() {
    ctx.fillStyle = PT; ctx.strokeStyle = INK; ctx.lineWidth = 0.8;
    for (const c of G.confetti) { ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.r); ctx.fillRect(-3, -2, 6, 4); ctx.strokeRect(-3, -2, 6, 4); ctx.restore(); }
  }
  function drawWorldLayer(z) {
    const M = G.L.map, ph = phase();
    ctx.save(); ctx.beginPath(); ctx.rect(M.x, M.y, M.w, M.h); ctx.clip();
    if (ph === 3) {
      // 저녁 — 가로등 낙서가 켜진다
      for (const l of G.world.lamps) { ctx.fillStyle = 'rgba(255,90,44,0.12)'; ctx.beginPath(); ctx.arc(l.x + 2, l.y - 13, 16, 0, 7); ctx.fill(); ctx.fillStyle = PT; ctx.beginPath(); ctx.arc(l.x + 2, l.y - 13, 2.2, 0, 7); ctx.fill(); }
    }
    if (G.mode !== 'zoom' && G.mode !== 'end') {
      drawGround(G.noz.x, G.noz.y, z.r, z.ring, G.clock, true);
      if (G.st.twin > 1) drawGround(G.twin.x, G.twin.y, G.twin.r, G.twin.r, G.clock, false);
      drawTail(z);
    }
    Wd.drawCrowd(ctx, G.crowd, G.spr, G.clock, G.stamp, G.mode === 'play' && G.run.stage > 0 && z.lc);
    drawHearts(); drawCalls();
    if (G.mode !== 'zoom' && G.mode !== 'end') drawBots(z);
    drawConfetti();
    if (ph >= 0 && !G.L.portrait) {
      // 도시의 때(아침 → 낮 → 오후 → 저녁) — 휴대폰에서는 위 띠에 가려 잘리므로 뺀다
      const tx = M.x + M.w - 62, ty = M.y + 30;
      ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.fillStyle = ph === 3 ? INK : '#fff';
      ctx.beginPath(); ctx.arc(tx, ty, 9, 0, 7); ctx.fill(); ctx.stroke();
      if (ph < 3) for (let k = 0; k < 8; k++) { const a = k * 0.785; ctx.beginPath(); ctx.moveTo(tx + Math.cos(a) * 12, ty + Math.sin(a) * 12); ctx.lineTo(tx + Math.cos(a) * 16, ty + Math.sin(a) * 16); ctx.stroke(); }
      ctx.fillStyle = INK; ctx.font = `700 14px ${KO}`; ctx.fillText(PHASE_NAME[ph], tx + 20, ty + 5);
    }
    ctx.restore();
  }
  function drawZoom(bi) {
    const L = G.L, M = L.map, RS = G.RS, zt = G.zoom.t;
    if (zt < ZOOM_FLAG || !G.zoom.switched) {
      ctx.drawImage(G.zoom.snap, 0, 0, L.W, L.H);
      return;
    }
    const e0 = Math.min(1, (zt - ZOOM_FLAG) / ZOOM_SEC), e = e0 * e0 * (3 - 2 * e0);
    const sp = G.world.zoomSpot;
    ctx.drawImage(G.bg[bi], 0, 0, L.W, L.H);
    ctx.save(); ctx.beginPath(); ctx.rect(M.x, M.y, M.w, M.h); ctx.clip();
    ctx.fillStyle = A.PAPER; ctx.fillRect(M.x, M.y, M.w, M.h);
    const z0 = M.w / sp.w, zz = Math.exp(Math.log(z0) * (1 - e));
    const pcx = sp.x + sp.w / 2, pcy = sp.y + sp.h / 2, mcx = M.x + M.w / 2, mcy = M.y + M.h / 2;
    const qx = mcx + (pcx - mcx) * e, qy = mcy + (pcy - mcy) * e;
    ctx.translate(qx, qy); ctx.scale(zz, zz); ctx.translate(-pcx, -pcy);
    ctx.drawImage(G.bg[bi], M.x * RS, M.y * RS, M.w * RS, M.h * RS, M.x, M.y, M.w, M.h);
    Wd.drawCrowd(ctx, G.crowd, G.spr, G.clock, G.stamp, false);
    const a = 1 - Math.min(1, Math.max(0, (e - 0.5) / 0.4));
    if (a > 0) { ctx.globalAlpha = a; ctx.drawImage(G.zoom.snap, M.x * RS, M.y * RS, M.w * RS, M.h * RS, sp.x, sp.y, sp.w, sp.h); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  function draw() {
    const L = G.L, RS = G.RS, bi = Math.floor(G.clock / 0.16) % 3;
    ctx.setTransform(RS, 0, 0, RS, 0, 0);
    const z = sizes();
    if (G.mode === 'zoom') {
      drawZoom(bi);
    } else {
      ctx.drawImage(G.bg[bi], 0, 0, L.W, L.H);
      drawWorldLayer(z);
    }
    // 정거장 칸 · 고른 것은 지도 위 호스보다 먼저
    if (L.portrait) { ctx.fillStyle = A.PAPER; } // 칸 바탕은 bg 에 있다
    if (L.ui) { ctx.save(); ctx.translate(L.ui.x, L.ui.y); ctx.scale(L.ui.k, L.ui.k); U.drawStation(ctx, G); ctx.restore(); }
    else { U.drawStation(ctx, G); ctx.drawImage(G.picksCanvas, L.picks.x, L.picks.y, L.picks.w, L.picks.h); }
    if (G.mode !== 'zoom' && G.mode !== 'end') { drawHoses(); drawNozzles(z); }
    if (G.hint && G.run.stage === 0 && G.mode === 'play') {
      const M = L.map;
      ctx.font = `700 22px ${KO}`; ctx.textAlign = 'center';
      const hx = M.x + M.w / 2, hy = M.y + M.h - 40 + Math.sin(G.clock * 3) * 3;
      ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round'; ctx.strokeText('화면을 쓸어 보세요', hx, hy);
      ctx.fillStyle = INK; ctx.fillText('화면을 쓸어 보세요', hx, hy); ctx.textAlign = 'left';
    }
    U.drawMenuButton(ctx, G);
    drawPops();
    if (G.mode === 'choose' && G.choice) U.drawChoice(ctx, G);
    U.drawCounter(ctx, G, bi);
    if (G.fly) U.drawFly(ctx, G);
    if (G.mode === 'finale') drawFinale();
    if (G.mode === 'end') {
      ctx.fillStyle = 'rgba(253,253,251,0.72)'; ctx.fillRect(0, 0, L.W, L.H);
      U.drawEnd(ctx, G, U.endRect(L), true);
    }
    if (G.menu) U.drawMenu(ctx, G);
    if (G.toast) U.drawToast(ctx, G);
  }
  function drawFinale() {
    // 정거장으로 다가가며 다 같이 찰칵
    const L = G.L, RS = G.RS, t = G.finale.t, wn = Wd.toStage(L, L.win);
    const e0 = Math.min(1, t / 1.6), e = e0 * e0 * (3 - 2 * e0);
    const M = L.map;
    const tw = Math.min(M.w * 0.8, (M.h * 0.7) * wn.w / wn.h), th = tw * wn.h / wn.w;
    const x = wn.x + (M.x + M.w / 2 - tw / 2 - wn.x) * e, y = wn.y + (M.y + M.h / 2 - th / 2 - wn.y) * e;
    const w = wn.w + (tw - wn.w) * e, h = wn.h + (th - wn.h) * e;
    ctx.fillStyle = `rgba(253,253,251,${0.8 * e})`; ctx.fillRect(0, 0, L.W, L.H);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    // 지금 그린 정거장 창을 그대로 떠서 키운다
    if (!G.finale.snap) { const c = A.mk(wn.w * RS, wn.h * RS); c.getContext('2d').drawImage(cv, wn.x * RS, wn.y * RS, wn.w * RS, wn.h * RS, 0, 0, wn.w * RS, wn.h * RS); G.finale.snap = c; }
    ctx.restore();
    ctx.drawImage(G.finale.snap, x, y, w, h);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
    if (t > 1.7) {
      const a = Math.max(0, 1 - (t - 1.7) / 0.6);
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(0, 0, L.W, L.H);
      ctx.fillStyle = INK; ctx.font = `700 40px ${A.HAND}`; ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, (t - 1.7) * 4);
      ctx.fillText('찰칵!', M.x + M.w / 2, y - 20); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }
  }

  // ---------- 끝 카드 단추 ----------
  function savePicture() {
    try {
      const rc = U.endRect(G.L), k = 2;
      const c = A.mk(rc.w * k + 20, rc.h * k + 20), g = c.getContext('2d');
      g.fillStyle = A.PAPER; g.fillRect(0, 0, c.width, c.height);
      g.setTransform(k, 0, 0, k, 10, 10); g.translate(-rc.x, -rc.y);
      U.drawEnd(g, G, rc, false);
      const a = document.createElement('a');
      a.href = c.toDataURL('image/png'); a.download = 'space-station-photo.png';
      document.body.appendChild(a); a.click(); a.remove();
      toast('그림을 저장했어요');
    } catch (e) { toast('그림을 저장하지 못했어요'); }
  }
  async function copyCode() {
    const code = btoa(JSON.stringify(N.toSave(G.run)));
    let ok = false;
    try { if (navigator.clipboard) { await navigator.clipboard.writeText(code); ok = true; } } catch (e) { ok = false; }
    if (!ok) {
      const ta = document.createElement('textarea'); ta.value = code; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
    }
    toast(ok ? '이어하기 코드를 복사했어요' : '복사하지 못했어요');
  }

  // ---------- 시험용 문(화면에 안내하지 않는다) ----------
  window.__state = () => {
    const guests = Math.round(G.run.guests);
    return { stage: G.run.stage, left: Math.round(G.run.left), guests, earth: N.EARTH_START - guests, picks: Object.assign({}, G.run.picks),
      playSeconds: G.run.playSec, choosing: G.mode === 'choose' && G.choice ? G.choice.tier : null, ended: G.ended };
  };
  window.__frames = 0;

  // ---------- 돌리기 ----------
  // ---------- 자리 비움(다른 앱 · 홈 화면 · 다른 탭 · 다른 창) ----------
  // 대표 11/25 「아이폰에서 바를 올려서 홈으로 가도 청소가 진행되고 있다」 → visibilitychange 만 받아 세웠더니 「홈으로 나가도 아직 진행되는데」.
  // 가려졌다는 신호가 브라우저마다 다르게 온다 — 오는 신호를 다 받아 세우고, 돌아온 신호나 손이 닿으면 다시 돈다.
  // ?debug=1 이면 어떤 신호가 왔는지 화면 왼쪽 위에 적는다(아이폰에서 무슨 일이 나는지 보려고).
  let away = false, awayFrames = 0;
  const dbg = /[?&]debug=1/.test(location.search) ? [] : null;
  function mark(type) {
    if (!dbg) return;
    dbg.push(`${new Date().toTimeString().slice(0, 8)} ${type} 손님${G.run ? Math.round(G.run.guests) : '-'} hidden=${document.hidden ? 1 : 0} focus=${document.hasFocus() ? 1 : 0} 쉰프레임${awayFrames}`);
    if (dbg.length > 14) dbg.shift();
    let el = document.getElementById('dbg');
    if (!el) {
      el = document.createElement('pre'); el.id = 'dbg';
      el.style.cssText = 'position:fixed;left:4px;top:4px;margin:0;padding:4px 6px;background:rgba(0,0,0,.78);color:#fff;font:10px/1.35 monospace;z-index:9;pointer-events:none;white-space:pre-wrap;max-width:96vw';
      document.body.appendChild(el);
    }
    el.textContent = dbg.join(String.fromCharCode(10));
  }
  function leave(e) { mark(e.type); if (!away) { away = true; awayFrames = 0; if (G.run) save(); EC.sound.pause(true); } }
  function back(e) { mark(e.type); if (document.hidden) return; away = false; EC.sound.pause(false); }
  document.addEventListener('visibilitychange', (e) => (document.hidden ? leave(e) : back(e)));
  window.addEventListener('pagehide', leave); window.addEventListener('blur', leave); document.addEventListener('freeze', leave);
  window.addEventListener('pageshow', back); window.addEventListener('focus', back); document.addEventListener('resume', back);
  window.addEventListener('pointerdown', (e) => { if (away) back(e); }, true);
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(onResize, 120); });
  resize();
  startRun(load());
  let last = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    if (away || document.hidden) { last = now; awayFrames++; return; }
    G.frames++; window.__frames = G.frames;
    const rdt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    update(rdt);
    draw();
  }
  requestAnimationFrame(loop);
})();
