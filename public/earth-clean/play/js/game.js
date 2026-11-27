/* earth-clean · 30분 맛보기 — 놀이 흐름 · 손 · 흡입구 · 로봇 · 선택창 · 판 넘어가기 · 저장
 * 숫자 규칙은 전부 numbers.js(EarthCleanNumbers)의 값과 함수를 그대로 쓴다.
 * 시험용 문(화면에 안내하지 않음 · 공개 주소에서는 안 통함): ?speed=20 · ?bot=1 · ?fresh=1 · ?debug=1 · window.__state()
 */
(function () {
  'use strict';
  const N = window.EarthCleanNumbers, EC = window.EC, A = EC.art, Wd = EC.world, U = EC.ui;
  const B = N.BASE;
  // 시험용 문은 이 PC(파일로 열기)와 안쪽 망 주소에서만 통한다 — 공개 주소(sehahub.info)에서는 무시한다(공개 전 정리 · 11/25)
  const TEST = location.protocol === 'file:' || /^(localhost$|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname);
  const qs = new URLSearchParams(TEST ? location.search : '');
  const SPEED = Math.max(0.05, Math.min(200, Number(qs.get('speed')) || 1));
  const BOT = qs.get('bot') === '1';
  const FRESH = qs.get('fresh') === '1';
  // 본편(스팀 · full.html 이 게임 스크립트보다 먼저 N.useFull() 을 부른다) — 저장 칸 v2 · 문구 표 text.js · 셈 표시 안 함
  const FULL = !!N.FULL, TX = EC.text, T = TX.T, KO_L = TX.lang === 'ko';   // 화면 글은 text.js(맛보기 · 본편 같이 · 한국어 칸 = 예전 글자)
  const SAVE_KEY = FULL ? 'earth-clean/save/v2' : 'earth-clean/save/v1', BEST_KEY = FULL ? 'earth-clean/best/v2' : 'earth-clean/best/v1';
  // 화면 연출(숫자 규칙 아님)
  const STEP = 1 / 40;           // 한 걸음 길이(놀이 시간 · 초)
  const ZOOM_FLAG = 0.9, ZOOM_SEC = 3.0, FINALE_SEC = 2.6;
  const PHONE_FIG = 1.35;        // 세로 휴대폰에서 사람 그림 키움 — 화면 사람 수를 1/배수² 로 줄여 「화면 수 × 그림 한 명」을 지킨다(design.md 판 셋 🔴)
  const SPIN_R = 70;             // 혼자서도 빙글 — 도는 고리 반지름
  const TRAIL_K = 3;             // 꼬리바람 — 꼬리 길이(초) = (꼬리 배수 − 1) × 이것
  const CELL = 48;
  // 둥글게 손잡고 도는 무리(world.js) — 판마다 [가장 적게, 가장 많이, 화면에 몇 무리] · 숫자 규칙 아님(사람 수는 그대로 · 이미 있는 사람 그림을 모은다)
  const RING_CFG = [null, [10, 16, 2], [16, 30, 3]];
  const ringCfg = (s) => (s < RING_CFG.length ? RING_CFG[s] : N.STAGES[s].last ? null : RING_CFG[2]);   // 본편 맵은 첫 도시와 같게(임시)
  // 본편 — 화면 밖 로봇 · 마중대의 덮는 효율 · 반응(web/sim/run.mjs 의 BOT 과 같은 가정값)
  const CREW_EFF = { botEff: 0.6, botReact: 1.0, autoEff: 0.55 };
  const CREW_HAND = { v: 520, e: 1.27, tReact: 0.2 };   // 계산기 「봇 확인」 손(design-full.md) — crewAway 에서는 botFig 만 쓰므로 값은 결과에 안 들어간다
  const LAST_PLACES = ['peak', 'island', 'lake', 'hill'];   // 마지막 손님이 있던 곳(판 씨앗으로 하나 · design-full.md 「끝 장면」 ③)
  const RING_OPEN = 0.42;        // 흡입구가 닿으면 무리가 줄줄이 풀려 날아가기 시작하는 데 걸리는 시간(초)
  const INK = A.INK, PT = A.PT, KO = A.KO;

  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const G = EC.G = {
    L: null, RS: 1, cssScale: 1, clock: 0, uiClock: 0, frames: 0, stamp: 0,
    run: null, st: null, world: null, crowd: [], mode: 'play', menu: null, ended: false,
    choice: null, fly: null, zoom: null, finale: null, pendingChoice: null, endInfo: null,
    noz: { x: 0, y: 0, r: 30, spin: false, sa: 0, scx: 0, scy: 0, sr: 0, dirx: 1, diry: 0, vel: 0 },
    twin: { x: 0, y: 0, r: 0 }, robots: [], walkers: [], tail: [], tailClock: 0,
    hand: { x: 0, y: 0, has: false, pending: false, lastMove: -99 },
    bot: { tx: 0, ty: 0, re: 0 },
    shownEarth: N.EARTH_START, rate: 0, secAt: 0, secN: 0, maxSec: 0,
    stn: { guests: [], bubble: null, bubbleWait: 1.6, flashes: [], rooms: [], room: null, roomT: 0, banner: null, lastTalk: -1, lastAdd: 0 },
    riders: [], pops: [], hearts: [], confetti: [], calls: [],
    pickOrder: [], ctrDigits: { s: '', t: [] }, toast: null, hint: true, stageDone: false,
    lastCheer: 0, cheerSide: 1, lastFriendPop: 0,
    // 손맛(대표 11/26 「사용자 동작 피드백이 시원시원하게」) — 전부 화면 연출 · 숫자 규칙 아님
    rings: [], ringWait: 1.5,
    combo: { n: 0, figs: 0, age: 0, idle: 0, ring: false }, floats: [], bumps: [], waves: [],
    nozFlare: 0, burstPop: 0, burstFx: null, burstEndAt: -9, burstFrame: 0, cheerUntil: -9, ctrKick: 0, guestKick: 0, shake: 0,
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

  // ---------- 셈 표시 셋(제품 그룹장 부탁 11/26 · 팀 todo.md 「그룹장 기입 · 11/26」) ----------
  // 세 순간에 사이트의 작은 정적 파일 하나씩을 부른다 → 대표가 Cloudflare 도메인 Analytics 에서 경로로 걸러 요청 수를 읽는다.
  //   start = 새 판에서 사람이 첫 손을 댔을 때 · city = 첫 도시에 들어섰을 때 · picture = 끝 카드 「그림으로 저장」을 눌렀을 때
  // 공개 주소(sehahub.info)에서만 · 한 판에 한 번(표시는 저장(v1) 밖 따로 칸 · 판 씨앗으로 가림 → 새로고침 · 이어하기로 또 안 셈 · 「처음부터」면 다시 셈)
  // 사람을 알아볼 값 없음(아이디 · 쿠키 · 번호 0 · 경로만 다름) · 브라우저 캐시 안 탐 · 실패해도 조용히 · 기다리지 않음 · 파일은 화면 어디에서도 링크하지 않음.
  const COUNT_KEY = 'earth-clean/counted/v1';
  const COUNT_FILE = { start: 'count/start.txt', city: 'count/city.txt', picture: 'count/picture.txt', end: 'count/end.txt' };
  const countHost = (h) => h === 'sehahub.info' || h === 'www.sehahub.info';
  EC.countHost = countHost;   // 확인용(주소를 넣어 참 · 거짓만 본다)
  const COUNT_ON = !FULL && !TEST && !BOT && !navigator.webdriver && countHost(location.hostname);   // 본편에서는 부르지 않는다
  function countOnce(what) {
    if (!COUNT_ON || !G.run) return;
    let m = null;
    try { m = JSON.parse(localStorage.getItem(COUNT_KEY) || 'null'); } catch (e) { m = null; }
    if (!m || m.seed !== G.run.seed) m = { seed: G.run.seed };
    if (m[what]) return;
    m[what] = 1;
    try { localStorage.setItem(COUNT_KEY, JSON.stringify(m)); } catch (e) { /* 저장이 막힌 브라우저 — 그래도 한 번은 셈 */ }
    try { fetch(COUNT_FILE[what], { cache: 'no-store' }).catch(() => {}); } catch (e) { /* 조용히 */ }
  }

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
    G.floats = []; G.bumps = []; G.waves = []; G.burstFx = null; G.burstFrame = 0; G.burstEndAt = -9; G.ringWait = 1.5;
    G.combo = { n: 0, figs: 0, age: 0, idle: 0, ring: false };
    if (FULL) { G.last = null; G.meet = null; G.crewRate = 0; G.crewAcc = 0; G.releaseReq = false; G.edgeRiders = []; G.edgeWait = 0; }
    G.stn.guests = []; G.stn.bubble = null; G.stn.banner = null; G.stn.rooms = []; G.stn.room = null; G.stn.party = null;
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
    if (saved && (saved.ended || (FULL && N.STAGES[G.run.stage].last)) && G.run.stage === N.STAGES.length - 1 && G.run.left <= 0) {
      G.ended = true; G.mode = 'end'; G.crowd = [];
      G.endInfo = endInfo(saved.prevBest || null);
    } else if (FULL && N.STAGES[G.run.stage].last) {
      initLast();   // 본편 끝 장면 판에서 다시 열었다 — 연 찾기부터
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
    G.rings = [];
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
    G.digits = U.digitArt(G.L, RS);
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
    if (G.run.stage === 0 && G.run.guests === 0 && G.mode === 'play') countOnce('start');   // 새 판 · 첫 손
  }
  cv.addEventListener('pointermove', (e) => {
    const p = toStage(e);
    if (FULL && e.pointerType !== 'mouse' && !e.isPrimary) return;   // 본편 — 두 번째 손가락은 「신바람 단추」만(흡입구를 끌지 않는다)
    G.pointer = p;
    hoverUpdate(p);
    if (e.pointerType === 'mouse' || touchDown) handTo(p, e.pointerType);
  });
  cv.addEventListener('pointerdown', (e) => {
    const p = toStage(e);
    if (uiClick(p)) { e.preventDefault(); return; }
    if (FULL) {
      G.touchUI = e.pointerType !== 'mouse';
      // 본편 신바람 단추 — PC 마우스 왼쪽 단추(끌면서 누름) · 휴대폰 두 번째 손가락 톡
      if (G.mode === 'play' && (e.pointerType === 'mouse' ? e.button === 0 : touchDown && !e.isPrimary)) G.releaseReq = true;
      if (e.pointerType !== 'mouse' && !e.isPrimary) return;
    }
    if (e.pointerType !== 'mouse') { touchDown = true; try { cv.setPointerCapture(e.pointerId); } catch (er) { /* 무시 */ } }
    handTo(p, e.pointerType);
  });
  const up = (e) => { if (FULL && e && e.pointerType !== 'mouse' && !e.isPrimary) return; touchDown = false; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  window.addEventListener('keydown', (e) => {
    if (G.mode === 'choose' && !G.menu && G.choice && /^[1-3]$/.test(e.key)) { const i = Number(e.key) - 1; if (i < G.choice.ids.length) choose(i); }
    if (e.key === 'Escape' && G.menu === 'paste') { closePaste(); return; }
    if (e.key === 'Escape' && G.mode !== 'end') { G.menu = G.menu ? null : 'open'; }
  });
  // 본편 — 메뉴 「맛보기 이어하기 코드 넣기」: 붙여 넣는 칸 하나(붙여 넣거나 Enter → N.fromCode · 맛보기 끝 코드면 본편 첫 판부터)
  function openPaste() {
    G.menu = 'paste';
    const box = document.createElement('div'); box.id = 'code-in';
    box.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(86vw,440px);box-sizing:border-box;padding:16px 18px;background:#fdfdfb;border:2px solid #1b1b1b;border-radius:12px;box-shadow:0 4px 18px rgba(0,0,0,.25);font:700 16px ' + A.KO + ';color:#1b1b1b;z-index:5';
    const head = document.createElement('div'); head.textContent = TX.T('code.enter');
    const ta = document.createElement('textarea'); ta.rows = 3; ta.spellcheck = false;
    ta.style.cssText = 'display:block;width:100%;box-sizing:border-box;margin:10px 0 6px;padding:6px;font:12px monospace;border:1.5px solid #1b1b1b;border-radius:6px;resize:none';
    const msg = document.createElement('div'); msg.style.cssText = 'min-height:22px;color:#ff5a2c;font-size:14px';
    const btn = document.createElement('button'); btn.textContent = TX.T('menu.resume');
    btn.style.cssText = 'display:block;margin:4px auto 0;padding:8px 26px;font:700 15px ' + A.KO + ';background:#ff5a2c;color:#fff;border:2px solid #1b1b1b;border-radius:20px;cursor:pointer';
    const tryIt = () => {
      const v = ta.value.trim();
      if (!v) return;
      const run = N.fromCode(v);
      if (!run) { msg.textContent = TX.T('code.bad'); return; }
      closePaste();
      try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ }
      startRun({ run, open: null, order: null, maxSec: 0, ended: false });
      // 맛보기 끝 코드 = 본편 첫 판을 여는 큰 선택 — 로봇이 한 명이라도 모시기 전에 띄워야 그 판의 새 카드 둘(넓적 · 세쌍둥이)이 먼저 나온다
      if (G.mode === 'play' && N.nextChoice(G.run) === 'big') openChoice('big');
      save();
      toast(TX.T('code.ok'));
    };
    ta.addEventListener('paste', () => setTimeout(tryIt, 0));
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); tryIt(); } else if (e.key === 'Escape') closePaste(); e.stopPropagation(); });
    btn.addEventListener('click', closePaste);
    box.append(head, ta, msg, btn);
    document.body.appendChild(box);
    setTimeout(() => ta.focus(), 0);
  }
  function closePaste() {
    const box = document.getElementById('code-in');
    if (box) box.remove();
    if (G.menu === 'paste') G.menu = null;
  }
  function hoverUpdate(p) {
    let cur = 'default';
    if (G.menu) { const b = U.menuButtons(G.L, G.menu === 'confirm').find((q) => inRect(p, q)); G.menuHover = b ? b.id : null; if (b) cur = 'pointer'; }
    else if (G.mode === 'end') { const b = U.endButtons(G.L).find((q) => inRect(p, q)); G.endHover = b ? b.id : null; if (b) cur = 'pointer'; }
    else if (G.mode === 'choose' && G.choice) { G.choice.hover = G.choice.rects.findIndex((r) => inRect(p, r)); if (G.choice.hover >= 0) cur = 'pointer'; }
    else if (inRect(p, G.L.menu)) cur = 'pointer';
    else if ((G.mode === 'play' || G.mode === 'find') && inRect(p, G.L.map)) cur = 'none';
    cv.style.cursor = cur;
  }
  function uiClick(p) {
    if (G.menu === 'paste') return true;   // 본편 코드 넣는 칸이 떠 있는 동안 캔버스는 안 받는다
    if (G.menu) {
      const b = U.menuButtons(G.L, G.menu === 'confirm').find((q) => inRect(p, q));
      if (!b) return true;
      if (b.id === 'resume' || b.id === 'back') G.menu = b.id === 'back' ? 'open' : null;
      else if (b.id === 'code') copyCode();
      else if (b.id === 'paste') openPaste();
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
    // 본편 카드 — botMul(로봇 · 마중대가 더 신나게) · burstBots(신바람 때 두 배)는 빠르기로(맛보기에서는 둘 다 1)
    const rv = B.robotSpeed * st.robotSpeed * st.botMul * (burst ? st.burstBots : 1);
    // 본편 카드 sweep(손 쓸기 · 넓적 흡입구 · 옥상 잔치) — 빨려 드는 원(흡입구 · 쌍둥이 · 꼬리)이 그만큼 넓다(맛보기에서는 1)
    const rc = r * st.sweep;
    return { r, ring: Math.max(ring, rc), lc, rr, rv, burst, rc };
  }
  function moveNozzle(dt, z) {
    const n = G.noz, h = G.hand, st = G.st;
    const idle = G.run.playSec - h.lastMove;
    let tx = n.x, ty = n.y, vmax = B.maxSpeed;
    if (st.autoSpin && idle >= B.autoIdleSec && !BOT) {
      // 혼자서도 빙글 — 손을 쉬면 고리를 그리며 돈다(가운데는 사람 많은 쪽으로 천천히)
      // 본편 「가을바람 타기」(st.idle) — 더 크게 · 더 빨리 돈다(맛보기에서는 1)
      const SR = SPIN_R * st.idle, AS = B.autoSpeed * st.idle;
      if (!n.spin) { n.spin = true; n.scx = n.x; n.scy = n.y; n.sr = 0; n.sa = 0; }
      n.sr = Math.min(SR, n.sr + SR * 2 * dt);
      n.sa += AS / SR * dt;
      if (Math.random() < dt) { const c = densest(n.scx, n.scy, 200, null); if (c) { n.stx = c.x; n.sty = c.y; } }
      if (n.stx !== undefined) { const dx = n.stx - n.scx, dy = n.sty - n.scy, d = Math.hypot(dx, dy); if (d > 1) { const s = Math.min(d, 40 * dt); n.scx += dx / d * s; n.scy += dy / d * s; } }
      tx = n.scx + Math.cos(n.sa) * n.sr; ty = n.scy + Math.sin(n.sa) * n.sr; vmax = AS * 1.6;
    } else {
      n.spin = false;
      if (h.has) { tx = h.x; ty = h.y; }
    }
    const dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy);
    let moved = 0;
    if (d > 0.01) {
      const s = Math.min(d, vmax * dt);
      n.x += dx / d * s; n.y += dy / d * s; moved = s;
      if (s > 0.3) { const k = 1 - Math.exp(-dt * 6); n.dirx += (dx / d - n.dirx) * k; n.diry += (dy / d - n.diry) * k; }
    }
    n.vel += (moved / dt - n.vel) * (1 - Math.exp(-dt * 12));   // 꼬리 바람 줄(빨리 움직일 때만 · 그림만)
    [n.x, n.y] = clampMap(n.x, n.y);
    n.r = z.r;
    // 쌍둥이 — 손 옆을 따라다닌다
    if (st.twin > 1) {
      const t = G.twin, l = Math.hypot(n.dirx, n.diry) || 1;
      const px = -n.diry / l, py = n.dirx / l, off = z.rc * 2.1;
      const k = 1 - Math.exp(-dt * 7);
      t.x += (n.x + px * off - t.x) * k; t.y += (n.y + py * off - t.y) * k;
      [t.x, t.y] = clampMap(t.x, t.y);
      t.r = z.rc * 0.75;
      if (G.run.picks.trio) {
        // 본편 세쌍둥이 흡입구 — 셋째가 반대쪽 옆을 따라다닌다
        const t2 = G.twin2 || (G.twin2 = { x: n.x, y: n.y, r: 0 });
        t2.x += (n.x - px * off - t2.x) * k; t2.y += (n.y - py * off - t2.y) * k;
        [t2.x, t2.y] = clampMap(t2.x, t2.y);
        t2.r = z.rc * 0.6;
      }
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
    if (N.STAGES[G.run.stage].last) { G.robots.length = 0; G.walkers.length = 0; return; }   // 본편 끝 장면 판 — 로봇 · 마중대는 정거장에서 기다린다
    // 본편 넓은 맵 — 화면에 그리는 로봇 · 마중대는 N.crewSplit 수까지(합 BASE.drawCrew) · 넘는 몫은 crewAway 의 화면 밖 몫(offShare)으로 센다. 맛보기는 고른 만큼 다
    const cs = FULL ? N.crewSplit(st, G.run.guests, G.run.stage) : null;
    const nr = cs ? cs.robots : st.robots;
    if (G.robots.length > nr) G.robots.length = nr;
    while (G.robots.length < nr) {
      const x = instant ? M.x + 80 + Math.random() * (M.w - 160) : G.noz.x + (Math.random() - 0.5) * 40;
      const y = instant ? M.y + 140 + Math.random() * (M.h - 200) : G.noz.y;
      G.robots.push({ x, y, tx: x, ty: y, re: 0, r: 16, drop: instant ? 0 : 1, ph: Math.random() * 6 });
    }
    const nw = cs ? cs.walkers : (st.walkers ? N.walkerCount(G.run.guests) : 0) + st.helpers;   // 본편 마중대(st.helpers)도 산책 손님처럼 걸어 다닌다(맛보기에서는 0)
    if (G.walkers.length > nw) G.walkers.length = nw;
    while (G.walkers.length < nw) {
      const x = M.x + 80 + Math.random() * (M.w - 160), y = M.y + 140 + Math.random() * (M.h - 200);
      G.walkers.push({ x, y, tx: x, ty: y, re: 0, r: 10, drop: instant ? 0 : 1, ph: Math.random() * 6, v: (Math.random() * A.NV) | 0 });
    }
  }
  function moveBots(list, dt, r, v) {
    for (const b of list) {
      b.r = r;
      if (b.trip) continue;   // 본편 — 화면 밖으로 마중 나가는 중(crewTrips 가 움직인다)
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

  // ---------- 본편 — 화면 밖 마중대(그림만 · 숫자는 crewAway) ----------
  // 넓은 맵에서 마중대(산책 나온 손님 · 마중대 카드)는 화면 가장자리로 나갔다가 친구 손을 잡고 돌아오고,
  // 친구는 가장자리의 가는 호스를 타고 정거장에 들어간다 — 「보이지 않는 곳에서 데려온다」로 읽히지 않게(design-full.md 반대 읽기 6).
  // 가로 = 지도 왼쪽 가장자리(정거장 칸 바로 옆) · 세로 = 지도 아래 가장자리.
  const wideNow = () => FULL && N.STAGES[G.run.stage].wide && G.mode !== 'end';
  function edgeOf(w) {
    const M = G.L.map;
    return G.L.portrait ? [Math.min(M.x + M.w - 40, Math.max(M.x + 40, w.x)), M.y + M.h + 12, 0, -1] : [M.x - 12, Math.min(M.y + M.h - 40, Math.max(M.y + 240, w.y)), 1, 0];
  }
  function crewTrips(dt) {
    if (!wideNow()) { for (const w of G.walkers) { w.trip = null; w.away = false; } return; }
    let out = 0;
    for (const w of G.walkers) if (w.trip) out++;
    for (const w of G.walkers) {
      if (w.drop) continue;
      const tr = w.trip;
      if (!tr) {
        if (w.tripWait === undefined) w.tripWait = 3 + Math.random() * 12;
        w.tripWait -= dt;
        if (w.tripWait <= 0 && out < Math.min(2, Math.ceil(G.walkers.length / 3))) {   // 한 번에 둘까지(나머지 화면 밖 몫은 crewAway · 가장자리 호스)
          const e = edgeOf(w);
          w.trip = { st: 'out', ex: e[0], ey: e[1], dx: e[2], dy: e[3], fv: (Math.random() * A.NV) | 0 }; out++;
        }
        continue;
      }
      if (tr.st === 'out') {
        const dx = tr.ex - w.x, dy = tr.ey - w.y, d = Math.hypot(dx, dy), sp = 110 * dt;
        if (d <= sp) { tr.st = 'away'; tr.t = 4 + Math.random() * 5; w.away = true; }
        else { w.x += dx / d * sp; w.y += dy / d * sp; }
        w.ph += dt;
      } else if (tr.st === 'away') {
        tr.t -= dt;
        if (tr.t <= 0) { tr.st = 'back'; tr.t = 2.4; w.away = false; w.x = tr.ex; w.y = tr.ey; }
      } else {
        w.x += tr.dx * 50 * dt; w.y += tr.dy * 50 * dt; w.ph += dt; tr.t -= dt;
        if (tr.t <= 0) {   // 친구가 가장자리 호스를 타고 정거장으로
          addEdgeRider(tr.fv, 1);
          w.trip = null; w.tripWait = 8 + Math.random() * 12;
        }
      }
    }
  }
  function edgeHose() {
    const L = G.L, M = L.map, h = L.hatch;
    if (L.portrait) { const sx = M.x + 6, sy = M.y + M.h - 30; return [sx, sy, sx + 160, sy + 30, h.x - 120, h.y - 40, h.x - 12, h.y]; }
    const sx = M.x + 4, sy = M.y + M.h - 48;
    return [sx, sy, sx + 26, sy - 220, h.x + 26, h.y + 160, h.x + 1, h.y + 9];
  }
  function addEdgeRider(v, n) { if (G.edgeRiders.length < 16) G.edgeRiders.push({ v, n, t: 0, sp: 0.42 + Math.random() * 0.1, wob: Math.random() * 6 }); }
  function updateEdge(dt, vdt) {
    if (!FULL) return;
    if (!wideNow()) { G.edgeRiders.length = 0; return; }
    // 화면 밖 로봇 · 마중대가 모신 손님이 가장자리 호스로 들어온다(빠르기에 맞춰 · 그림만)
    if (G.crewRate > 1 && G.mode === 'play' && (G.edgeWait -= dt) <= 0) { G.edgeWait = 0.5 + Math.random() * 0.4; addEdgeRider((Math.random() * A.NV) | 0, Math.random() < 0.5 ? 2 : 1); }
    for (const r of G.edgeRiders) { r.t += vdt * r.sp; if (r.t >= 1) G.stn.flashes.push({ t: 0, k: 0.8 }); }
    G.edgeRiders = G.edgeRiders.filter((r) => r.t < 1);
  }
  function drawEdgeHose() {
    if (!wideNow()) return;
    const Q = edgeHose(), path = () => { ctx.beginPath(); ctx.moveTo(Q[0], Q[1]); ctx.bezierCurveTo(Q[2], Q[3], Q[4], Q[5], Q[6], Q[7]); };
    ctx.lineCap = 'round';
    path(); ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.stroke();
    ctx.strokeStyle = A.PT_PALE; ctx.lineWidth = 4.4; ctx.stroke();
    ctx.setLineDash([5, 8]); ctx.lineDashOffset = -G.clock * 40; ctx.strokeStyle = 'rgba(255,90,44,0.8)'; ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = PT; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(Q[0], Q[1], 6, 6, 0, 0, 7); ctx.fill(); ctx.stroke();   // 가장자리 입구
    const sp = G.riderSpr;
    for (const r of G.edgeRiders) {
      const [x, y] = bez(Q, r.t), [dx, dy] = bezD(Q, r.t);
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(dy, dx) + Math.PI / 2 + Math.sin(G.clock * 9 + r.wob) * 0.3);
      for (let k = 0; k < r.n; k++) ctx.drawImage(sp.spr[(r.v + k * 2) % A.NV][6 + (((G.clock * 6 + r.wob) | 0) & 1)], (k - (r.n - 1) / 2) * sp.size * 0.42 - sp.ax * 0.8, -sp.ay * 0.8 + sp.h * 0.3, sp.size * 0.8, sp.size * 0.8);
      ctx.restore();
    }
  }
  // 돌아오는 마중대 — 친구 손을 잡고(마중대 옆에 친구 · 맞잡은 손 줄)
  function drawCrewFriends() {
    if (!wideNow()) return;
    const sp = G.walkSpr;
    for (const w of G.walkers) {
      const tr = w.trip;
      if (!tr || tr.st !== 'back') continue;
      const ox = tr.dy ? 13 : 0, oy = tr.dx ? 13 : 0, fx = w.x + ox, fy = w.y + 4 + oy;
      ctx.drawImage(sp.spr[tr.fv][4 + (((G.clock * 4) | 0) & 1)], fx - sp.ax, fy - sp.ay, sp.size, sp.size);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(w.x + ox * 0.3, w.y + 4 - sp.h * 0.45 + oy * 0.3); ctx.lineTo(fx - ox * 0.3, fy - sp.h * 0.45 - oy * 0.3); ctx.stroke();
    }
  }

  // ---------- 모시기 ----------
  // 흡입구(쌍둥이 · 꼬리바람 포함)가 무리 한 명에 닿으면 무리 전체가 줄줄이 날아온다. 로봇 · 산책 손님이 닿으면 그 한 명만.
  function fly(p, c) {
    const R = p.ring;
    if (R && R.state !== 'release') {
      if (c === G.noz || c === G.twin || c === G.twin2) { releaseRing(R, c, p); return; }
      Wd.leaveRing(R, p);
      if (R.members.length < 5) Wd.dissolveRing(G.world, R, Math.random);
    }
    welcomeFly(p, c, R && R.state === 'release' ? R : null);
  }
  function releaseRing(R, c, p0) {
    R.state = 'release'; R.by = c; R.rt = 0; R.dir = Math.random() < 0.5 ? -1 : 1;
    const n = R.n, i0 = p0.slot;
    // 닿은 사람에서부터 양쪽으로 번갈아 — 원이 그 자리에서 풀린다
    const rest = R.members.filter((q) => q !== p0).map((q) => {
      const d = Math.abs(q.slot - i0), e = Math.min(d, n - d);
      return [e + ((q.slot - i0 + n) % n < n / 2 ? 0 : 0.5), q];
    });
    rest.sort((a, b) => a[0] - b[0]);
    const gap = Math.min(0.035, RING_OPEN / Math.max(1, rest.length));
    R.queue = rest.map((q, k) => ({ p: q[1], at: (k + 1) * gap }));
    const figs = R.members.length;
    G.combo.ring = true;
    G.nozFlare = 1; G.shake = Math.max(G.shake, 0.45);
    G.waves.push({ x: R.x, y: R.y, t: 0, dur: 0.45, max: R.rx * 1.7, lw: 7, ratio: 0.62 });
    EC.sound.ring(figs);
    pop(T('float.allgo'), R.x - 44, R.y - R.rx - 8, true);   // 무리도 「가고 싶어서」 간다(반대 읽기 11/26)
    welcomeFly(p0, c, R);
  }
  function welcomeFly(p, c, R) {
    if (R) { const i = R.members.indexOf(p); if (i >= 0) R.members.splice(i, 1); }
    p.ring = null;
    p.st = 3; p.by = c; p.vel = R ? 320 : 120; p.ft = 0; p.rot = 0; p.sc = 1;
    p.sd = R ? R.dir : Math.random() < 0.5 ? -1 : 1; p.spin = p.sd * (4 + Math.random() * 3);
    EC.sound.take();
    if (G.run.left <= perEff() * 1.01 + 1e-6) pop(T('float.metoo'), p.x - 14, p.y - 30, true);
    if (G.clock - G.lastCheer > 0.6 && c === G.noz) {
      G.lastCheer = G.clock; G.cheerSide = -G.cheerSide;
      const s = T('float.cheer')[(Math.random() * 4) | 0];
      pop(s, G.cheerSide > 0 ? c.x + c.r + 6 : c.x - c.r - 40, c.y - 18 - Math.random() * 22);
    }
  }
  function catchAll(z) {
    const n = G.noz, stamp = G.stamp, r2 = z.rc * z.rc;
    const heartP = 0.1 + 0.05 * (G.run.picks.pull || 0) + (G.run.picks.window ? 0.08 : 0);
    query(n.x, n.y, z.ring, (p, d2) => {
      if (d2 < r2) { fly(p, n); return; }
      if (p.ring) return;   // 무리는 노느라 걸어오지 않는다 — 흡입구가 직접 닿아야 한다
      if (p.cool > 0 && !z.lc) return;
      if (p.exc < stamp - 1 && Math.random() < heartP && G.hearts.length < 40) G.hearts.push({ x: p.x, y: p.y - G.spr.h - 4, t: 0 });
      p.exc = stamp; p.by = n;
    });
    if (G.st.twin > 1) query(G.twin.x, G.twin.y, G.twin.r, (p) => fly(p, G.twin));
    if (G.run.picks.trio && G.twin2) query(G.twin2.x, G.twin2.y, G.twin2.r, (p) => fly(p, G.twin2));
    for (const b of G.robots) if (!b.drop) query(b.x, b.y, b.r, (p) => fly(p, b));
    for (const w of G.walkers) if (!w.drop && !w.away) query(w.x, w.y, w.r, (p) => fly(p, w));
    if (G.tail.length) { const tr = z.rc * 0.6; for (let i = 0; i < G.tail.length; i += 2) query(G.tail[i].x, G.tail[i].y, tr, (p) => fly(p, n)); }
  }
  function onArrive(p) {
    addRider(p.v, p.by);
    if (G.stageDone) return;
    const before = G.run.guests;
    const w = N.welcome(G.run, perEff() * burstK());
    G.run = w.state;
    const took = G.run.guests - before;
    G.secN += took; G.rateAcc = (G.rateAcc || 0) + took;
    if (FULL && (G.robots.indexOf(p.by) >= 0 || G.walkers.indexOf(p.by) >= 0)) G.crewAcc += took;   // 정거장 칸 「로봇 · 마중대 +N명/초」
    G.hint = false;
    if (p.by === G.noz || p.by === G.twin || p.by === G.twin2) noteWelcome(took);
    if (G.run.picks.friend && G.clock - G.lastFriendPop > 7 && Math.random() < 0.05) { G.lastFriendPop = G.clock; pop(T('float.friend'), G.noz.x + 20, G.noz.y - 60); }
    for (const e of w.events) {
      if (e.type === 'clear') { toNextStage(); return; }
      if (e.type === 'end') { startFinale(); return; }
    }
  }
  // 본편 — 신바람 동안 사람 그림 하나가 손님을 더 데려온다(판 깃발 burstPer + 카드 burstPerAdd · numbers.js modelRate 와 같은 셈) · 맛보기에서는 1
  function burstK() {
    const S = N.STAGES[G.run.stage];
    return G.run.burst > 0 && (S.burstPer || G.st.burstPer) ? 1 + (S.burstPer || 0) + G.st.burstPer : 1;
  }
  // 판이 끝났다 — 다음 판으로 줌아웃(본편 끝 넓은 판 다음은 줌아웃 없이 끝 장면)
  function toNextStage() {
    const nx = N.STAGES[G.run.stage + 1];
    if (nx && nx.last) startLast(); else startZoom();
  }
  // 본편 넓은 맵(wide) — 화면 밖으로 나간 로봇 · 마중대가 모신 손님을 정거장에 따로 더한다.
  // 몫 = numbers.js modelRate 의 로봇 · 마중대 몫 × crewSplit 의 offShare(그리지 않은 몫 · 화면 밖) — 화면 안 로봇 · 마중대는 그림 그대로 직접 모신다.
  // handOn = 실제 손 상태(손을 쉬는 동안 modelRate 가 로봇 · 마중대 몫에 st.idleBots 를 곱한다 · 가을바람 타기) — hand 는 modelRate 가 손 몫을 셀 때만 쓰는 자리 채움(여기서는 botFig 만 쓴다)
  function crewAway(dt, handOn) {
    if (G.stageDone || G.run.left <= 0) return;
    const cs = N.crewSplit(G.st, G.run.guests, G.run.stage);
    if (!(cs.offShare > 0)) return;
    const m = N.modelRate(G.st, Object.assign({ stage: G.run.stage, left: G.run.left, guests: G.run.guests, handOn, hand: CREW_HAND, autoOn: false, burst: G.run.burst > 0, sat: true }, CREW_EFF));
    if (!(m.botFig > 0)) return;
    const figs = Math.min(m.n, m.botFig * cs.offShare * dt);
    const before = G.run.guests;
    const w = N.welcome(G.run, figs * N.perFigure(G.st, G.run.stage) * burstK());
    G.run = w.state;
    const took = G.run.guests - before;
    G.secN += took; G.rateAcc = (G.rateAcc || 0) + took; G.crewAcc += took;
    for (const e of w.events) if (e.type === 'clear') { toNextStage(); return; }
  }
  // 흡입구가 한 사람을 모셨다 — 벌름 · 호스 불룩 · 「+N명」 모음
  function noteWelcome(took) {
    const c = G.combo;
    if (!c.figs) c.age = 0;
    c.n += took; c.figs++; c.idle = 0;
    G.nozFlare = Math.min(1, G.nozFlare + 0.22);
    const last = G.bumps[G.bumps.length - 1];
    if (last && last.t < (c.ring ? 0.3 : 0.08)) { last.figs++; last.ring = last.ring || c.ring; }
    else if (G.bumps.length < 3) G.bumps.push({ t: 0, figs: 1, ring: c.ring });   // 셋까지만 — 줄줄이 이어지면 「칸 사슬」로 읽힌다(반대 읽기 11/26)
  }
  function endCombo() {
    const c = G.combo;
    if (c.figs >= 4 || c.ring) {
      const f = plusAt(c);
      f.t = 0;
      const last = G.floats[G.floats.length - 1];
      if (bigMap() && G.floats.length >= 2 && last) {
        // 본편 맵 — 화면에 둘까지 · 셋째는 새로 띄우지 않고 가장 최근 글자의 수를 올린다(같은 자리 · design-full.md 「본편 맵에서 뜨는 글자」)
        last.num += c.n; last.ring = last.ring || c.ring; last.s = plusText(last.num, last.ring); last.size = plusSize(last.ring); last.hot = last.ring; last.t = Math.min(last.t, 0.2);
      } else G.floats.push(f);
    }
    c.n = 0; c.figs = 0; c.age = 0; c.idle = 0; c.ring = false;
  }
  // 본편 맵(판 3~) — design-full.md 「본편 맵에서 뜨는 글자」: 짧은 수(1만 밑은 숫자 그대로 · 「손님 +867만 명」 · "+8.7M guests") · 둘까지 · 크기 고정 · 「신바람!」 글자와 안 겹치게(맛보기 판은 예전 그대로)
  const bigMap = () => FULL && G.run.stage >= N.FULL_FROM;
  const plusNum = (n) => (bigMap() ? TX.fmtRate(n) : U.fmt(n));
  const plusText = (n, ring) => T('float.plus', { n: plusNum(n) }) + (ring ? '!' : '');
  const plusSize = (ring) => (G.L.portrait ? (ring ? 30 : 26) : (ring ? 26 : 22));
  // 「+N명」 글자 크기 · 자리(흡입구 머리 옆 · 오른쪽 끝이면 왼쪽에)
  function plusAt(c) {
    const n = G.noz, s = nozScale(n.r), M = G.L.map, P = G.L.portrait;
    const big = bigMap();
    const size = big ? plusSize(c.ring) : Math.round(((P ? 18 : 15) + 3 * Math.log10(Math.max(1, c.n)) + Math.min(8, c.figs * 0.15)) * (c.ring ? 1.35 : 1));
    const right = n.x < M.x + M.w * 0.62;
    const y = Math.max(P ? 236 : 0, n.y - 50 * s);
    return { s: plusText(c.n, c.ring), num: c.n, ring: c.ring, size, hot: c.ring, x: n.x + (right ? 1 : -1) * (30 * s + 10), y: big ? Math.min(y, M.y + M.h - 12) : y, align: right ? 'left' : 'right' };
  }
  // 호스 불룩이가 정거장 입구에 닿았다 — 도착!
  function bumpArrive(b) {
    const k = Math.min(1, Math.sqrt(b.figs) / 6);
    G.stn.flashes.push({ t: 0, k: 1 + k * 1.6 });
    if (b.figs >= 3) G.guestKick = Math.max(G.guestKick, 0.25 + 0.75 * k);
    if (b.ring || k >= 0.9) {
      const h = G.L.hatch;
      pop(T('float.arrive'), G.L.hatchDir === 'right' ? h.x + 8 : h.x + 16, h.y - 14, true);
      EC.sound.plop(k);
    }
  }
  function refill() {
    const need = targetCount() - G.crowd.length;
    for (let i = 0; i < need && i < 80; i++) { const p = Wd.spawn(G.world, Math.random); if (p) G.crowd.push(p); }
  }
  // 무리 — 날아가는 차례를 넘기고 · 모자라면 새로 모인다(판 끝 「나도!」 무렵에는 새로 안 모인다)
  function manageRings(dt, z) {
    for (const R of G.rings) if (R.state === 'release') {
      R.rt += dt;
      while (R.queue.length && R.queue[0].at <= R.rt) { const p = R.queue.shift().p; if (p.ring === R && p.st === 4) welcomeFly(p, R.by, R); }
    }
    if (G.rings.length && finalRun()) for (const R of G.rings) if (R.state !== 'release') Wd.dissolveRing(G.world, R, Math.random);   // 판 끝 — 무리도 풀고 달려온다
    if (G.rings.length) G.rings = G.rings.filter((R) => R.state !== 'done' && R.members.length);
    const cfg = ringCfg(G.run.stage);
    if (!cfg || G.stageDone) return;
    G.ringWait -= dt;
    if (G.ringWait > 0 || G.rings.length >= cfg[2] || z.lc) return;
    const n = G.noz, L = G.L, avoid = [{ x: n.x, y: n.y, r: z.ring + 90 }];
    for (const R of G.rings) avoid.push({ x: R.x, y: R.y, r: R.rx + 24 });
    const R = Wd.formRing(G.world, G.crowd, { R: Math.random, n0: cfg[0], n1: cfg[1], sp: 12 * G.spr.scale, avoid, keep: { x: n.x, y: n.y, r: z.ring + 120 },
      minY: L.gauge.y + 22 + G.spr.h, stamp: G.stamp, reach: 240, v: 42, life: 28 + Math.random() * 14 });
    G.ringWait = R ? 1 + Math.random() * 1.5 : 0.6;
    if (R) G.rings.push(R);
  }
  function onTickEvent(e) {
    if (e.type === 'burstStart') burstStart();
    if (e.type === 'burstEnd') {
      G.burstEndAt = G.clock;
      EC.sound.burstEnd();
      if (G.st.gaugeAfter > 0) pop(T('burst.again'), G.noz.x - 30, G.noz.y - 70, true);
    }
  }
  // 신바람이 터진다 — 화면 전체에서 느껴지게(대표 11/26 「신바람이 있는지도 모르겠다」) · 무음이어도 보이게
  function burstStart() {
    EC.sound.burst();
    const n = G.noz;
    G.burstFx = { t: 0 }; G.burstPop = 1; G.shake = 1; G.cheerUntil = G.clock + 1.4;
    G.waves.push({ x: n.x, y: n.y, t: 0, dur: 0.75, max: 900, lw: 14, ratio: 0.92 }, { x: n.x, y: n.y, t: -0.14, dur: 0.75, max: 650, lw: 8, ratio: 0.92 });
    for (let i = 0; i < 44; i++) {
      const a = Math.random() * 6.283, v = 220 + Math.random() * 420;
      G.confetti.push({ x: n.x, y: n.y - 20, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 180, r: Math.random() * 6, vr: (Math.random() - 0.5) * 14, t: 0, g: 520, drag: 1.6, life: 1.7, white: Math.random() < 0.35 });
    }
    // 멀리서도 「와아~」
    let k = 0;
    for (let i = 0; i < 40 && k < 5 && G.crowd.length; i++) {
      const p = G.crowd[(Math.random() * G.crowd.length) | 0];
      if (p.st !== 3 && Math.hypot(p.x - n.x, p.y - n.y) > 140 && p.y > G.L.gauge.y + 30) { pop(T('float.wow'), p.x - 16, p.y - G.spr.h - 6); k++; }
    }
  }
  const PHASE_MUL = [
    { plaza: 0.6, park: 0.3, market: 0.4, shop: 1, av: 2.5 },
    { plaza: 1, park: 0.6, market: 2.5, shop: 1, av: 1 },
    { plaza: 1.2, park: 2.5, market: 0.6, shop: 1, av: 1 },
    { plaza: 1.4, park: 1, market: 1, shop: 1, av: 1.6 },
  ];
  const PHASE_NAME = [0, 1, 2, 3].map((i) => T('phase.' + i));
  function phase() {
    if (G.run.stage < 2 || N.STAGES[G.run.stage].last) return -1;   // 첫 도시와 본편 맵마다(끝 장면 판 빼고)
    const p = 1 - G.run.left / N.STAGES[G.run.stage].people;
    return p < 0.18 ? 0 : p < 0.5 ? 1 : p < 0.82 ? 2 : 3;
  }
  const cx = { dt: 0, stamp: 0, walkIn: B.walkIn, R: Math.random, spotMul: () => 1, avMul: 1, rings: null, home: null };
  // 판 끝 — 사람 그림이 이만큼만 남으면 다들 「나도!」 하며 흡입구로 달려온다(대표 화면 기록 11/26 「동네 마지막 2명 찾는 데 8초」 · 그림만 · 사람 수 규칙 그대로)
  const FINAL_N = 10;
  const finalRun = () => G.mode === 'play' && G.run.stage > 0 && G.run.left > 0 && targetCount() <= FINAL_N;
  function crowdCtx(dt) {
    const ph = phase();
    cx.dt = dt; cx.stamp = G.stamp; cx.lastCall = G.run.stage > 0 && N.lastCall(G.st, G.run.stage, G.run.left);
    cx.rings = G.rings;
    cx.home = finalRun() ? G.noz : null;
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
    // 본편 「신바람 단추」 — 가득 찬 게이지는 누를 때(PC 마우스 왼쪽 · 휴대폰 두 번째 손가락) 터진다 · 봇은 차면 바로 누른다
    const tk = N.tick(G.run, G.st, dt, handOn, BOT || !!G.releaseReq);
    G.releaseReq = false;
    G.run = tk.state;
    for (const e of tk.events) onTickEvent(e);
    if (Math.floor(G.run.playSec) !== G.secAt) { G.maxSec = Math.max(G.maxSec, G.secN); G.secN = 0; G.secAt = Math.floor(G.run.playSec); }
    const z = sizes();
    moveNozzle(dt, z);
    syncRobots(false);
    moveBots(G.robots, dt, z.rr, z.rv);
    moveBots(G.walkers, dt, z.rr * Math.sqrt(B.walkerShare), z.rv * Math.sqrt(B.walkerShare));
    if (FULL) crewTrips(dt);
    manageRings(dt, z);
    catchAll(z);
    arrivedBuf.length = 0;
    Wd.step(G.world, G.crowd, crowdCtx(dt), arrivedBuf);
    for (const p of arrivedBuf) { onArrive(p); if (G.mode !== 'play') break; }
    if (G.mode === 'play' && N.STAGES[G.run.stage].wide) crewAway(dt, handOn);
    G.rate += ((G.rateAcc || 0) / dt - G.rate) * (1 - Math.exp(-dt / 1.5)); G.rateAcc = 0;
    if (FULL) { G.crewRate += (G.crewAcc / dt - G.crewRate) * (1 - Math.exp(-dt / 1.5)); G.crewAcc = 0; }
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
  // 봇이 고르는 차례 — 맛보기 16장(본편은 ui-full.js 의 EC.botOrderFull · 맛보기 16장의 앞뒤를 지킨 채 본편 카드를 사이에 끼운 것)
  const BOT_ORDER = EC.botOrderFull || ['twin', 'jumbo', 'robot3', 'window', 'fof', 'fest', 'stroll', 'chubby', 'spin', 'again', 'robot', 'wide', 'friend', 'trail', 'pull', 'joy'];
  function botPick() {
    const ids = G.choice.ids;
    if (Math.random() < 0.35) return (Math.random() * ids.length) | 0;
    let bi = 0, bo = 99;
    ids.forEach((id, i) => { const o0 = BOT_ORDER.indexOf(id), o = o0 < 0 ? 98 : o0; if (o < bo) { bo = o; bi = i; } });   // 표에 없는 새 카드는 맨 뒤로(설계 담당이 카드를 더해도 봇이 새 카드만 고르지 않게)
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
    pop(U.cardText(id).name + '!', G.noz.x - 30, G.noz.y - 80, true);
    save();
    if (G.pointer) hoverUpdate(G.pointer);
  }

  // ---------- 판 넘어가기(줌아웃) · 끝 ----------
  function startZoom() {
    G.stageDone = true;
    EC.sound.clear();
    const S = N.STAGES[G.run.stage];
    // 본편 깃발은 「모두」를 뺀다 — 「(판 이름) 손님 N명 도착!」(design-full.md 「넘어가는 연출」)
    const label = FULL ? T('banner.clear', { stage: T('stage.' + S.id), n: U.fmt(S.people) })
      : G.run.stage === 0 ? T('banner.room', { n: U.fmt(S.people) }) : T('banner.demo', { stage: T('stage.' + S.id), n: U.fmt(S.people) });
    G.stn.banner = { s: label, t: 0 };
    for (const p of G.crowd) addRider(p.v, G.noz);
    G.crowd = []; G.rings = [];
    G.mode = 'zoom';
    G.zoom = { t: 0, snap: G.bg[0], switched: false };
    G.run = N.nextStage(G.run);
    if (G.run.stage === 2) countOnce('city');   // 첫 도시에 들어섬
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
    G.crowd = Wd.initCrowd(G.world, targetCount(), Math.random); G.rings = [];
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
    G.crowd = []; G.rings = [];
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
    const o = { guests, earth: N.EARTH_START - guests, playSec: G.run.playSec, bursts: G.run.bursts, maxSec: G.maxSec, prevBest };
    if (FULL) {
      // 본편 엔딩 카드 — 맵마다 걸린 시간(stageSec = 판마다 끝난 놀이 시간 · 맛보기 코드로 왔으면 맛보기 판은 「맛보기에서」) · 마지막 손님이 있던 곳
      const ss = G.run.stageSec || [], demo = G.run.from === 'demo';
      o.maps = [];
      for (let i = 0; i < N.STAGES.length - 1; i++) {
        const a = i === 0 ? 0 : ss[i - 1], b = ss[i];
        o.maps.push({ id: N.STAGES[i].id, sec: (demo && i < N.FULL_FROM) || a == null || b == null ? null : b - a });
      }
      o.place = LAST_PLACES[G.run.seed % LAST_PLACES.length];
    }
    return o;
  }

  // ---------- 본편 끝 장면 · 엔딩(design-full.md 「끝 장면」 ① ~ ⑥ · 단순한 그림) ----------
  // ① 끝 넓은 판이 끝나면 줌아웃 없이 끝 장면 판 — 맨 위 「1」 · 정거장 「어? 한 명이 안 보여!」 · 어딘가 주황 연 하나(화살표 · 표적 없음 · 시간 제한 없음)
  function startLast() {
    G.stageDone = true;
    EC.sound.clear();
    for (const p of G.crowd) addRider(p.v, G.noz);
    G.crowd = []; G.rings = []; G.tail.length = 0;
    G.floats = []; G.pops = []; G.waves = []; G.confetti = []; G.calls = []; G.burstFx = null;   // 앞 판에서 떠 있던 「손님 +N명」 · 말풍선 글자를 지우고 조용히
    G.combo = { n: 0, figs: 0, age: 0, idle: 0, ring: false };
    G.run = N.nextStage(G.run);
    syncRobots(false);
    buildStage();
    G.stageDone = false;
    initLast();
    save();
  }
  function initLast() {
    const M = G.L.map, R = A.mulberry((G.run.seed ^ 0x2545f491) >>> 0);
    // 연은 늘 보이는 곳 — 둥근 지구 그림 안(world-full.js 와 같은 원) · 맨 위 숫자 밑 · 흡입구에서 조금 떨어진 곳
    const gcx = M.x + M.w / 2, gcy = M.y + M.h / 2 + 24, gr = Math.min(M.w, M.h) * 0.44;
    let x = gcx + gr * 0.4, y = gcy + gr * 0.3;
    for (let i = 0; i < 40; i++) {
      const a = R() * 6.283, d = gr * (0.25 + 0.55 * R()), qx = gcx + Math.cos(a) * d, qy = gcy + Math.sin(a) * d;
      if (qy < M.y + 260 || qy > M.y + M.h - 40) continue;
      x = qx; y = qy;
      if (Math.hypot(qx - G.noz.x, qy - G.noz.y) > 260) break;
    }
    G.mode = 'find'; G.meet = null;
    G.last = { x, y, t: 0, hinted: false, place: LAST_PLACES[G.run.seed % LAST_PLACES.length] };
    stationSay(TX.T('last.where'), 4);
  }
  function stationSay(s, dur) {
    const cand = G.stn.guests.filter((q) => !q.sleep);
    if (cand.length) G.stn.bubble = { g: cand[(Math.random() * cand.length) | 0], s, t: 0, dur };
  }
  // ② 연을 찾아간다(손 · 봇) — 20초가 지나면 정거장 손님이 「저기 연이 보여!」 · 연 꼬리가 반짝
  function stepFind(dt) {
    G.stamp++;
    buildGrid();
    const Lt = G.last;
    Lt.t += dt;
    G.run = Object.assign({}, G.run, { playSec: G.run.playSec + dt });
    if (BOT) {
      const h = G.hand, dx = Lt.x - h.x, dy = Lt.y - h.y, d = Math.hypot(dx, dy), s = Math.min(d, 520 * dt);
      if (d > 0.01) { h.x += dx / d * s; h.y += dy / d * s; }
      h.has = true; h.lastMove = G.run.playSec;
    }
    if (G.hand.pending) { G.hand.pending = false; G.hand.lastMove = G.run.playSec; }
    const z = sizes();
    moveNozzle(dt, z);
    if (!Lt.hinted && Lt.t > 20) { Lt.hinted = true; stationSay(TX.T('last.hint'), 4); }
    if (Math.hypot(G.noz.x - Lt.x, G.noz.y - Lt.y) < z.rc + 26) startMeet();
  }
  // ③ ~ ⑥ 흡입구가 닿으면 — 그곳으로 다가감(2.5초) → 「어? 다들 거기 있었어?」 → 「나도 갈래!」 → 손님이 스스로 흡입구에 쏙(빨아들이는 바람 없음) → 1 → 0 → 정거장 「어서 와!」 → 다 같이 찰칵 → 엔딩 카드
  const MEET = { zoom: 2.5, surprise: 2.5, join: 4.6, walk: 6.4, inside: 7.6, photo: 10.4 };
  function startMeet() {
    G.mode = 'meet';
    G.meet = { t: 0, welcomed: false };
    if (!G.meetSpr) G.meetSpr = A.sprites(4, G.RS);
    EC.sound.ring(6);
  }
  function stepMeet(rdt) {
    const m = G.meet;
    m.t += rdt;
    if (!m.welcomed && m.t >= MEET.inside) {
      m.welcomed = true;
      const w = N.welcome(G.run, 1);
      // 82억 번 넘게 더하고 뺀 소수 오차를 끝에서 정수로(손님 + 지구 = 82억 · 맨 위 0)
      m.drift = w.state.guests - N.EARTH_START;   // 확인용(얼마나 어긋났었나)
      G.run = Object.assign({}, w.state, { guests: N.EARTH_START, earth: 0, left: 0 });
      G.ended = true;
      G.maxSec = Math.max(G.maxSec, G.secN);
      const prev = bestGet();
      G.endInfo = endInfo(prev || null);
      if (!prev || G.run.playSec < prev) bestSet(G.run.playSec);
      addGuest(0, false);
      stationSay(TX.T('last.welcome'), 3);
      G.stn.flashes.push({ t: 0, k: 2.4 }); G.guestKick = 1;
      EC.sound.finale();
      save();
    }
    if (m.t >= MEET.photo) { G.mode = 'finale'; G.finale = { t: 0 }; }
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
  function pop(s, x, y, big) { if (G.pops.length < 16) G.pops.push({ s, x, y, t: 0, big: !!big }); }
  function toast(s) { G.toast = { s, t: 0, dur: 1.8 }; }

  function updateStation(dt) {
    const S = G.stn, L = G.L, wn = L.win, t = G.clock;
    const guests = N.EARTH_START - Math.round(G.shownEarth);
    const rooms = U.unlockedRooms(guests);
    if (rooms.length > S.rooms.length) {
      const nr = rooms[rooms.length - 1];
      // 본편 — 「손님 1억 명!」 같은 잔치는 정거장 창에서만(맨 위 숫자 쪽에서는 축하하지 않는다 · design-full.md 「맨 위 숫자」)
      if (FULL && nr.party && S.rooms.length) { S.party = { s: T('banner.milestone', { short: TX.fmtShort(nr.at) }), t: 0 }; EC.sound.ring(8); }
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
    if (S.party && (S.party.t += dt) > 4) S.party = null;
  }
  function updateFx(dt, vdt) {
    if (FULL) updateEdge(dt, vdt);
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
    for (const c of G.confetti) {
      if (c.g) { c.vy += c.g * dt; const k = Math.exp(-dt * c.drag); c.vx *= k; c.vy *= k; }
      c.x += c.vx * dt; c.y += c.vy * dt; c.r += c.vr * dt; c.t += dt;
    }
    G.confetti = G.confetti.filter((c) => c.t < (c.life || 6) && c.y < G.L.map.y + G.L.map.h + 10);
    // 손맛 — 「+N명」 모음 · 호스 불룩이 · 물결 · 벌름 · 들썩(전부 그림 시계)
    const cb = G.combo;
    if (cb.figs) { cb.age += dt; cb.idle += dt; if (cb.idle > 0.35 || cb.age > (cb.ring ? 1.5 : 0.9)) endCombo(); }
    for (const f of G.floats) f.t += dt;
    G.floats = G.floats.filter((f) => f.t < 1.1);
    for (const b of G.bumps) { b.t += vdt * 0.78; if (b.t >= 1) bumpArrive(b); }
    G.bumps = G.bumps.filter((b) => b.t < 1);
    for (const w of G.waves) w.t += dt;
    G.waves = G.waves.filter((w) => w.t < w.dur);
    G.nozFlare *= Math.exp(-dt * 9); G.burstPop *= Math.exp(-dt * 6); G.ctrKick *= Math.exp(-dt * 5);
    G.guestKick *= Math.exp(-dt * 6); G.shake *= Math.exp(-dt * 9);
    if (G.burstFx && (G.burstFx.t += dt) > 1.3) G.burstFx = null;
    G.burstFrame += ((G.run.burst > 0 && G.mode === 'play' ? 1 : 0) - G.burstFrame) * (1 - Math.exp(-dt * 8));
    // 판 끝 「나도!」 말풍선
    for (const b of G.calls) b.t += dt;
    G.calls = G.calls.filter((b) => b.t < 1.3 && !b.p.gone && b.p.st !== 3);
    if (G.mode === 'play' && G.run.stage > 0 && N.lastCall(G.st, G.run.stage, G.run.left) && G.calls.length < (finalRun() ? FINAL_N : 3) && Math.random() < dt * (finalRun() ? 8 : 2) && G.crowd.length) {
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
      } else if (G.mode === 'find') {
        let gdt = rdt * SPEED;
        while (gdt > 1e-6 && G.mode === 'find' && !G.menu) { const d = Math.min(STEP, gdt); stepFind(d); gdt -= d; }
      } else if (G.mode === 'meet') {
        stepMeet(rdt);
      } else if (G.mode === 'finale') {
        G.finale.t += rdt;
        if (G.finale.t >= FINALE_SEC) { G.mode = 'end'; G.finale = null; countOnce('end'); if (G.pointer) hoverUpdate(G.pointer); }   // 끝 카드에 닿음(다시 열어 끝 카드부터 뜰 때는 안 셈)
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
  const nozDrawScale = () => nozScale(G.noz.r) * (1 + 0.32 * G.burstPop);   // 신바람이 터질 때 한 번 크게 튄다

  function drawGround(x, y, r, ring, t, main) {
    const burst = G.run.burst > 0;
    ctx.fillStyle = burst ? 'rgba(255,90,44,0.13)' : 'rgba(255,90,44,0.06)'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.92, 0, 0, 7); ctx.fill();
    if (main && G.run.gaugeOn) {
      // 신바람 게이지 — 흡입구 둘레 고리가 주황으로 차오른다(신바람 중이면 남은 시간만큼 줄어든다)
      const R = r + 7, f = burst ? G.run.burst / G.st.burstSec : G.run.gauge, a0 = -Math.PI / 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,90,44,0.2)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.92, 0, 0, 7); ctx.stroke();
      if (f > 0.005) {
        ctx.strokeStyle = PT; ctx.lineWidth = burst ? 5.5 : 4;
        ctx.globalAlpha = !burst && f > 0.85 ? 0.55 + 0.45 * Math.sin(t * 14) : 1;
        ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.92, 0, a0, a0 + 6.2832 * Math.min(1, f)); ctx.stroke(); ctx.globalAlpha = 1;
      }
    }
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
  function drawHosePath(P, width, riders, bumps) {
    const path = () => { ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.bezierCurveTo(P[2], P[3], P[4], P[5], P[6], P[7]); };
    ctx.lineCap = 'round';
    path(); ctx.strokeStyle = INK; ctx.lineWidth = width; ctx.stroke();
    path(); ctx.strokeStyle = A.PT_PALE; ctx.lineWidth = width - 3.6; ctx.stroke();
    if (bumps) for (const b of bumps) {
      // 모신 만큼 호스가 불룩해져 정거장까지 내려간다
      const k = Math.min(1, Math.sqrt(b.figs) / 6);
      if (k < 0.2) continue;
      const [x, y] = bez(P, b.t), [dx, dy] = bezD(P, b.t);
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(dy, dx));
      ctx.beginPath(); ctx.ellipse(0, 0, 9 + 14 * k, width / 2 + 9 * k, 0, 0, 7);
      ctx.fillStyle = A.PT_PALE; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }
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
    const n = G.noz, s = nozDrawScale(), top = A.nozzleTop(n.y, s);
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
    if (manyBots()) {
      // 본편 — 로봇이 많으면 가는 호스를 한 길로 묶어 세 번만 그린다(로봇마다 세 번씩 그리던 것이 뒤 판에서 프레임을 떨어뜨렸다 · 11/27 실측)
      const Qs = [];
      for (const b of G.robots) if (!b.drop) { const x = b.x, y = b.y - 22 * (b.r / 16); Qs.push([b, [x, y, x, y - 40, join[0], join[1] + 30, join[0], join[1]]]); }
      const path = () => { ctx.beginPath(); for (const [, Q] of Qs) { ctx.moveTo(Q[0], Q[1]); ctx.bezierCurveTo(Q[2], Q[3], Q[4], Q[5], Q[6], Q[7]); } };
      ctx.lineCap = 'round';
      path(); ctx.strokeStyle = 'rgba(27,27,27,0.28)'; ctx.lineWidth = 4.2; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,227,216,0.9)'; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.setLineDash([4, 7]); ctx.lineDashOffset = -G.clock * 40; ctx.strokeStyle = 'rgba(255,90,44,0.55)'; ctx.stroke(); ctx.setLineDash([]);
      const sp = G.riderSpr;
      for (const [b, Q] of Qs) for (const r of bots.get(b) || []) { const [qx, qy] = bez(Q, Math.min(1, r.t / 0.35)); ctx.drawImage(sp.spr[r.v][6], qx - sp.ax * 0.7, qy - sp.ay * 0.7 + 3, sp.size * 0.7, sp.size * 0.7); }
    } else for (const b of G.robots) if (!b.drop) thin(b.x, b.y - 22 * (b.r / 16), bots.get(b) || [], 0.35);
    if (G.st.twin > 1) { const ts = nozScale(G.twin.r); thin(G.twin.x, A.nozzleTop(G.twin.y, ts), twinR, 0.2); }
    if (G.run.picks.trio && G.twin2) { const ts = nozScale(G.twin2.r); thin(G.twin2.x, A.nozzleTop(G.twin2.y, ts), [], 0.2); }
    drawHosePath(P, 17, main, G.bumps);
    ctx.save(); ctx.translate(0.9, -0.7); ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.bezierCurveTo(P[2], P[3], P[4], P[5], P[6], P[7]); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    const h = G.L.hatch;
    ctx.fillStyle = PT; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.beginPath(); if (G.L.hatchDir === 'right') ctx.ellipse(h.x + 1, h.y, 5, 11, 0, 0, 7); else ctx.ellipse(h.x, h.y + 1, 11, 5, 0, 0, 7); ctx.fill(); ctx.stroke();
  }
  // 빨리 움직일 때 흡입구 뒤로 바람 줄(그림만)
  function drawSpeedLines(n, s) {
    const v = n.vel || 0;
    if (v < 420) return;
    const a = Math.min(0.5, (v - 420) / 1400), len = Math.min(130, v * 0.08);
    const l = Math.hypot(n.dirx, n.diry) || 1, dx = n.dirx / l, dy = n.diry / l, px = -dy, py = dx, cy = n.y - 18 * s;
    ctx.strokeStyle = `rgba(27,27,27,${a.toFixed(3)})`; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let o = -1; o <= 1; o++) {
      const off = o * 20 * s, back = 26 * s + Math.abs(o) * 6, L2 = len * (1 - 0.25 * Math.abs(o));
      const x0 = n.x - dx * back + px * off, y0 = cy - dy * back + py * off;
      ctx.moveTo(x0, y0); ctx.lineTo(x0 - dx * L2, y0 - dy * L2);
    }
    ctx.stroke();
  }
  function drawNozzles(z) {
    const n = G.noz, t = G.clock, picks = G.run.picks;
    const bounce = z.burst ? Math.abs(Math.sin(t * 14)) * 4 : 0;
    const s = nozDrawScale(), fl = G.nozFlare;
    if (G.mode === 'play') drawSpeedLines(n, s);
    if (G.st.twin > 1) A.nozzle(ctx, G.twin.x, G.twin.y, nozScale(G.twin.r), { gauge: G.run.gauge, burst: z.burst, jumbo: !!picks.jumbo, t, flare: fl });
    if (picks.trio && G.twin2) A.nozzle(ctx, G.twin2.x, G.twin2.y, nozScale(G.twin2.r), { gauge: G.run.gauge, burst: z.burst, jumbo: !!picks.jumbo, t, flare: fl });
    if (picks.flat) { ctx.save(); ctx.translate(n.x, n.y); ctx.scale(1.35, 1); ctx.translate(-n.x, -n.y); }   // 본편 넓적 흡입구(임시 — 머리를 옆으로 늘림)
    A.nozzle(ctx, n.x, n.y - bounce, s, { gauge: G.run.gauge, burst: z.burst, jumbo: !!picks.jumbo, notes: picks.joy || 0, t, flare: fl });
    if (picks.flat) ctx.restore();
    if (G.st.burstHold && !z.burst && G.run.gauge >= 1 && G.mode === 'play') {
      // 본편 신바람 단추 — 가득 찬 게이지가 반짝이며 「눌러요!」
      const s2 = TX.T(G.touchUI ? 'burst.readyTap' : 'burst.ready'), by = n.y - 70 * s - 18 - Math.abs(Math.sin(t * 6)) * 6;
      ctx.font = `800 20px ${KO}`; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.strokeText(s2, n.x, by);
      ctx.fillStyle = ((t * 4) | 0) % 2 ? PT : INK; ctx.fillText(s2, n.x, by); ctx.textAlign = 'left';
    }
    if (z.burst) {
      // 신바람 중 — 흡입구 둘레를 음표가 돈다
      ctx.fillStyle = PT; ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
      for (let k = 0; k < 3; k++) { const a = t * 3.2 + k * 2.094; A.note(ctx, n.x + Math.cos(a) * (z.r + 16), n.y - 14 * s + Math.sin(a) * (z.r + 16) * 0.6, 1.6); }
    }
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
  // 본편 — 로봇 · 마중대가 많을 때(화면 안 12대 넘게) 그리기를 가볍게: 점선 고리 생략 · 로봇 몸은 미리 그린 조각 · 프로펠러 모자는 한 번에(맛보기는 예전 그대로)
  const manyBots = () => FULL && G.robots.length + G.walkers.length > 12;
  let robotCache = null;
  function robotFrames(k, prop) {
    const key = k.toFixed(3) + (prop ? 'p' : '') + G.RS;
    if (robotCache && robotCache.key === key) return robotCache;
    const RS = G.RS, W = 76, H = 64, ox = 30, oy = 52, NF = 6, frames = [];
    for (let f = 0; f < NF; f++) {
      const c = A.mk(W * RS, H * RS), g = c.getContext('2d');
      g.setTransform(RS, 0, 0, RS, 0, 0);
      A.robot(g, ox, oy, k, { t: f / NF * (2 * Math.PI / 7), prop });   // 팔 흔들기 한 바퀴를 여섯 장으로
      frames.push(c);
    }
    robotCache = { key, frames, W, H, ox, oy, NF };
    return robotCache;
  }
  function drawBotsLight(z) {
    const t = G.clock, chubby = !!G.run.picks.chubby;
    if (G.robots.length) {
      const b0 = G.robots[0], RF = robotFrames((chubby ? 1.2 : 0.95) * Math.min(1.3, Math.sqrt(b0.r / 16)), chubby);
      for (const b of G.robots) {
        const ph = ((t + b.ph) * 7 / (2 * Math.PI)) % 1, img = RF.frames[Math.floor(ph * RF.NF) % RF.NF];
        const y = b.y + 6 - b.drop * 120 - (z.burst && G.st.burstAll ? Math.abs(Math.sin(t * 12 + b.ph)) * 4 : 0);
        ctx.drawImage(img, b.x - RF.ox, y - RF.oy, RF.W, RF.H);
      }
    }
    const sp = G.walkSpr;
    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    const sticks = new Path2D(), hats = new Path2D();
    for (const w of G.walkers) {
      if (w.away) continue;
      const x = w.x, y = w.y + 4 - w.drop * 120;
      ctx.drawImage(sp.spr[w.v][(w.ph * 6 | 0) & 3], x - sp.ax, y - sp.ay, sp.size, sp.size);
      sticks.moveTo(x, y - sp.h * 0.98); sticks.lineTo(x, y - sp.h * 1.15);
      const hx = x + Math.cos(t * 15 + w.ph) * 2, hy = y - sp.h * 1.17;
      hats.moveTo(hx + 5, hy); hats.ellipse(hx, hy, 5, 1.6, 0, 0, 7);
    }
    ctx.stroke(sticks); ctx.fillStyle = PT; ctx.fill(hats); ctx.stroke(hats);
  }
  function drawBots(z) {
    if (manyBots()) { drawBotsLight(z); return; }
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
      if (w.away) continue;   // 본편 — 화면 밖으로 마중 나감
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
      const cw = KO_L ? 36 : ctx.measureText(T('float.metoo')).width + 12;   // 영어 「Me too!」는 말풍선을 넓게
      ctx.beginPath(); ctx.roundRect(x - cw / 2, y - 16, cw, 17, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText(T('float.metoo'), x, y - 3.5); ctx.textAlign = 'left';
    }
    ctx.globalAlpha = 1;
    // 마지막 몇 명 — 머리 위 화살표
    if (G.mode === 'play' && G.run.stage > 0 && !finalRun()) {   // 다들 달려올 때는 찾을 일이 없다 — 화살표가 「찍힌 사람」으로 읽히지 않게(반대 읽기 11/26)
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
    if (!G.confetti.length) return;
    const RS = G.RS;
    ctx.strokeStyle = INK; ctx.lineWidth = 0.8;
    for (const c of G.confetti) {
      const co = Math.cos(c.r) * RS, si = Math.sin(c.r) * RS;
      ctx.setTransform(co, si, -si, co, (c.x + shakeX) * RS, (c.y + shakeY) * RS);
      ctx.fillStyle = c.white ? '#fff' : PT; ctx.fillRect(-3, -2, 6, 4); ctx.strokeRect(-3, -2, 6, 4);
    }
    ctx.setTransform(RS, 0, 0, RS, shakeX * RS, shakeY * RS);
  }
  // 퍼지는 물결(신바람 · 무리가 풀릴 때)
  function drawWaves() {
    for (const w of G.waves) {
      if (w.t < 0) continue;
      const e0 = w.t / w.dur, e = 1 - (1 - e0) * (1 - e0), r = 10 + (w.max - 10) * e;
      ctx.globalAlpha = (1 - e0) * 0.75; ctx.strokeStyle = PT; ctx.lineWidth = w.lw * (1 - e0) + 1.5;
      ctx.beginPath(); ctx.ellipse(w.x, w.y, r, r * w.ratio, 0, 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // 「손님 +N명」 — 모시는 동안 흡입구 옆에서 세고, 끝나면 떠오르며 사라진다
  function drawPlus(f, x, y, alpha, sc) {
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.font = `700 ${f.size}px ${A.HAND}`; ctx.textAlign = f.align; ctx.lineJoin = 'round';
    // 글자가 지도 밖으로 잘리지 않게 안쪽으로 당긴다(영어 「guests」가 오른쪽 끝에서 잘렸다 · 11/27)
    const M = G.L.map, w = ctx.measureText(f.s).width * sc + 6;
    if (f.align === 'left') x = Math.max(M.x + 6, Math.min(x, M.x + M.w - w));
    else if (f.align === 'right') x = Math.min(M.x + M.w - 6, Math.max(x, M.x + w));
    ctx.translate(x, y); ctx.scale(sc, sc);
    ctx.lineWidth = Math.max(4, f.size * 0.22); ctx.strokeStyle = '#fff'; ctx.strokeText(f.s, 0, 0);
    ctx.fillStyle = f.hot ? PT : INK; ctx.fillText(f.s, 0, 0);
    ctx.restore();
  }
  function drawCombo() {
    const c = G.combo, top = G.L.portrait ? 236 : 178;   // 맨 위 「남은 사람」 숫자 · 신바람 줄 위에 겹치지 않게(반대 읽기 11/26 — 줄어드는 숫자 위의 환호로 읽힌다)
    const full2 = bigMap() && G.floats.length >= 2;   // 본편 맵 — 떠 있는 글자가 둘이면 모으는 중 글자는 안 그린다(둘까지)
    // 본편 맵 — 흡입구가 맨 위 가까이면 글자가 모두 top 줄에 붙어 서로 겹친다 → 먼저 뜬 글자부터 자리를 잡고, 겹치는 글자는 그 아래 줄로 비킨다(맛보기는 예전 그대로)
    const big = bigMap(), used = [];
    const spot = (f, y) => {
      if (big) for (const u of used) if (Math.abs(u.x - f.x) < 320 && Math.abs(u.y - y) < (u.size + f.size) / 2 + 4) y = u.y + (u.size + f.size) / 2 + 4;
      y = offBanner(f, y);
      if (big) used.push({ x: f.x, y, size: f.size });
      return y;
    };
    const fl = G.floats.map((f) => {
      const e = f.t / 1.1, sc = f.t < 0.12 ? 1 + 0.18 * (1 - f.t / 0.12) : 1;
      return [f, spot(f, Math.max(top, f.y - 46 * (1 - (1 - e) * (1 - e)))), f.t < 0.7 ? 1 : Math.max(0, 1 - (f.t - 0.7) / 0.4), sc];
    });
    if (G.mode === 'play' && (c.figs >= 4 || (c.ring && c.figs)) && !full2) { const f = plusAt(c); drawPlus(f, f.x, spot(f, Math.max(top, f.y)), 1, 1); }
    for (const [f, y, a, sc] of fl) drawPlus(f, f.x, y, a, sc);
  }
  // 본편 맵 — 「신바람!」 큰 글자가 떠 있는 동안 「손님 +N」을 그 아래로 비켜 그린다(맛보기는 y 그대로)
  function offBanner(f, y) {
    if (!bigMap() || !G.burstFx || !G.burstFx.art) return y;
    const M = G.L.map, P = G.L.portrait, b = G.burstFx.art, by = M.y + M.h * (P ? 0.34 : 0.42);
    const y0 = by - b.cy * 1.25 - 10, y1 = by + (b.h - b.cy) * 1.25 + f.size;
    return y > y0 && y < y1 ? y1 : y;
  }
  // 신바람 — 터지는 순간 큰 글자(터질 때 한 번 그려 두고 1.3초 동안 키웠다 줄였다만) · 이어지는 동안 화면 테두리
  function burstBannerArt() {
    const P = G.L.portrait, RS = G.RS, w = P ? 560 : 440, h = P ? 190 : 150, cx = w / 2, cy = P ? 112 : 88;
    const c = A.mk(w * RS, h * RS), g = c.getContext('2d');
    g.setTransform(RS, 0, 0, RS, 0, 0); g.textAlign = 'center'; g.lineJoin = 'round';
    g.font = `800 ${P ? 104 : 80}px ${KO}`;
    const big = T('burst.big');
    if (!KO_L) { let fs = P ? 104 : 80; while (fs > 40 && g.measureText(big).width > w - 40) g.font = `800 ${--fs}px ${KO}`; }   // 영어 「Joy Rush!」가 그림 칸을 넘지 않게
    g.lineWidth = 18; g.strokeStyle = '#fff'; g.strokeText(big, cx, cy);
    g.lineWidth = 5; g.strokeStyle = INK; g.strokeText(big, cx, cy);
    g.fillStyle = PT; g.fillText(big, cx, cy);
    const sub = T('burst.sub', { s: Math.round(G.st.burstSec) }), sy = cy + (P ? 54 : 42);
    g.font = `700 ${P ? 30 : 22}px ${KO}`; g.lineWidth = 7; g.strokeStyle = '#fff'; g.strokeText(sub, cx, sy);
    g.fillStyle = INK; g.fillText(sub, cx, sy);
    return { c, w, h, cx, cy };
  }
  function drawBurstBanner() {
    const f = G.burstFx, t = f.t, M = G.L.map, P = G.L.portrait;
    if (!f.art) f.art = burstBannerArt();
    const b = f.art;
    const sIn = t < 0.16 ? 0.3 + 0.95 * (t / 0.16) : t < 0.3 ? 1.25 - 0.25 * ((t - 0.16) / 0.14) : 1;
    const a = t < 0.95 ? 1 : Math.max(0, 1 - (t - 0.95) / 0.35);
    const x = M.x + M.w / 2, y = M.y + M.h * (P ? 0.34 : 0.42) - Math.max(0, t - 0.95) * 40;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(-0.06); ctx.scale(sIn, sIn);
    ctx.drawImage(b.c, -b.cx, -b.cy, b.w, b.h);
    ctx.restore();
  }
  function drawBurstFrame() {
    const M = G.L.map, left = G.run.burst;
    let a = 0.42 + 0.18 * Math.sin(G.clock * 9);
    if (left > 0 && left < 1.5) a = ((G.clock * 7) | 0) % 2 ? 0.12 : 0.6;   // 곧 끝 — 깜빡깜빡
    ctx.save(); ctx.globalAlpha = G.burstFrame * a; ctx.strokeStyle = PT; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.roundRect(M.x + 6, M.y + 6, M.w - 12, M.h - 12, 16); ctx.stroke();
    ctx.globalAlpha = G.burstFrame * 0.85; ctx.lineWidth = 3; ctx.setLineDash([12, 10]); ctx.lineDashOffset = -G.clock * 60;
    ctx.beginPath(); ctx.roundRect(M.x + 16, M.y + 16, M.w - 32, M.h - 32, 12); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }
  function drawWorldLayer(z) {
    const M = G.L.map, ph = phase();
    ctx.save(); ctx.beginPath(); ctx.rect(M.x, M.y, M.w, M.h); ctx.clip();
    if (ph === 3) {
      // 저녁 — 가로등 낙서가 켜진다
      for (const l of G.world.lamps) { ctx.fillStyle = 'rgba(255,90,44,0.12)'; ctx.beginPath(); ctx.arc(l.x + 2, l.y - 13, 16, 0, 7); ctx.fill(); ctx.fillStyle = PT; ctx.beginPath(); ctx.arc(l.x + 2, l.y - 13, 2.2, 0, 7); ctx.fill(); }
    }
    if (G.mode !== 'zoom' && G.mode !== 'end') {
      drawGround(G.noz.x, G.noz.y, z.rc, z.ring, G.clock, true);
      if (G.st.twin > 1) drawGround(G.twin.x, G.twin.y, G.twin.r, G.twin.r, G.clock, false);
      if (G.run.picks.trio && G.twin2) drawGround(G.twin2.x, G.twin2.y, G.twin2.r, G.twin2.r, G.clock, false);
      drawTail(z);
    }
    if (G.rings.length) Wd.drawRings(ctx, G.rings, G.spr, G.clock);
    // 신바람이 터지면 온 동네가 팔 벌려 들썩(「와아~」 · 그림만)
    Wd.drawCrowd(ctx, G.crowd, G.spr, G.clock, G.stamp, (G.mode === 'play' && G.run.stage > 0 && z.lc) || G.clock < G.cheerUntil);
    drawHearts(); drawCalls();
    if (G.mode !== 'zoom' && G.mode !== 'end') { drawBots(z); if (FULL) drawCrewFriends(); }
    drawConfetti();
    drawWaves();
    if (G.mode === 'find' && G.last) drawFindKite();
    if (ph >= 0 && !G.L.portrait) {
      // 도시의 때(아침 → 낮 → 오후 → 저녁) — 휴대폰에서는 위 띠에 가려 잘리므로 뺀다
      ctx.font = `700 14px ${KO}`;
      const tx = KO_L ? M.x + M.w - 62 : Math.min(M.x + M.w - 62, M.x + M.w - 30 - ctx.measureText(PHASE_NAME[ph]).width), ty = M.y + 30;   // 영어 「Afternoon」이 지도 밖으로 안 나가게
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
  let shakeX = 0, shakeY = 0;
  function draw() {
    const L = G.L, RS = G.RS, bi = Math.floor(G.clock / 0.16) % 3;
    // 들썩(신바람이 터질 때 · 무리가 풀릴 때 잠깐) — 밀린 가장자리는 종이색으로 채운다
    const sh = G.shake > 0.03 && G.mode === 'play' ? G.shake * 5 : 0;
    shakeX = sh ? (Math.random() - 0.5) * 2 * sh : 0; shakeY = sh ? (Math.random() - 0.5) * 2 * sh : 0;
    if (sh) { ctx.setTransform(RS, 0, 0, RS, 0, 0); ctx.fillStyle = A.PAPER; ctx.fillRect(0, 0, L.W, L.H); }
    ctx.setTransform(RS, 0, 0, RS, shakeX * RS, shakeY * RS);
    const z = sizes();
    const meet = G.meet && (G.mode === 'meet' || G.mode === 'finale');   // 본편 마지막 손님 가까이
    if (G.mode === 'zoom') {
      drawZoom(bi);
    } else if (meet) {
      ctx.drawImage(G.bg[bi], 0, 0, L.W, L.H);
      drawMeet();
    } else {
      ctx.drawImage(G.bg[bi], 0, 0, L.W, L.H);
      drawWorldLayer(z);
    }
    // 정거장 칸 · 고른 것은 지도 위 호스보다 먼저
    if (L.portrait) { ctx.fillStyle = A.PAPER; } // 칸 바탕은 bg 에 있다
    if (L.ui) { ctx.save(); ctx.translate(L.ui.x, L.ui.y); ctx.scale(L.ui.k, L.ui.k); U.drawStation(ctx, G); ctx.restore(); }
    else { U.drawStation(ctx, G); ctx.drawImage(G.picksCanvas, L.picks.x, L.picks.y, L.picks.w, L.picks.h); }
    if (G.mode !== 'zoom' && G.mode !== 'end' && !meet) { if (FULL) drawEdgeHose(); drawHoses(); drawNozzles(z); }
    if (G.burstFrame > 0.02 && G.mode !== 'end') drawBurstFrame();
    if (G.hint && G.run.stage === 0 && G.mode === 'play') {
      const M = L.map;
      ctx.font = `700 22px ${KO}`; ctx.textAlign = 'center';
      const hx = M.x + M.w / 2, hy = M.y + M.h - 40 + Math.sin(G.clock * 3) * 3;
      ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round'; ctx.strokeText(T('hint.swipe'), hx, hy);
      ctx.fillStyle = INK; ctx.fillText(T('hint.swipe'), hx, hy); ctx.textAlign = 'left';
    }
    U.drawMenuButton(ctx, G);
    drawPops();
    if (G.burstFx && G.mode === 'play') drawBurstBanner();
    if (G.mode === 'choose' && G.choice) U.drawChoice(ctx, G);
    U.drawCounter(ctx, G, bi);
    U.drawGauge(ctx, G);
    if (G.mode !== 'choose') drawCombo();   // 「+N명」은 숫자 칸 · 게이지 줄 위에(흡입구가 맨 위에 있을 때 가리지 않게)
    if (G.fly) U.drawFly(ctx, G);
    if (G.mode === 'finale') drawFinale();
    if (G.mode === 'end') {
      ctx.fillStyle = 'rgba(253,253,251,0.72)'; ctx.fillRect(0, 0, L.W, L.H);
      U.drawEnd(ctx, G, U.endRect(L), true);
    }
    if (G.menu === 'paste') { ctx.fillStyle = 'rgba(253,253,251,0.7)'; ctx.fillRect(0, 0, L.W, L.H); }   // 본편 — 코드 넣는 칸(HTML)이 위에 떠 있다
    else if (G.menu) U.drawMenu(ctx, G);
    if (G.toast) U.drawToast(ctx, G);
  }

  // 본편 끝 장면 그림 — world-full.js(본편만 · 공개 맛보기에는 안 실림)
  const drawFindKite = () => Wd.drawFindKite(ctx, G);
  const drawMeet = () => Wd.drawMeet(ctx, G, MEET);
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
      ctx.fillText(T('photo.snap'), M.x + M.w / 2, y - 20); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }
  }

  // ---------- 끝 카드 단추 ----------
  function savePicture() {
    countOnce('picture');
    try {
      const rc = U.endRect(G.L), k = 2;
      const c = A.mk(rc.w * k + 20, rc.h * k + 20), g = c.getContext('2d');
      g.fillStyle = A.PAPER; g.fillRect(0, 0, c.width, c.height);
      g.setTransform(k, 0, 0, k, 10, 10); g.translate(-rc.x, -rc.y);
      U.drawEnd(g, G, rc, false);
      const a = document.createElement('a');
      a.href = c.toDataURL('image/png'); a.download = 'space-station-photo.png';
      document.body.appendChild(a); a.click(); a.remove();
      toast(T('toast.picSaved'));
    } catch (e) { toast(T('toast.picFail')); }
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
    toast(T(ok ? 'toast.codeCopied' : 'toast.copyFail'));
  }

  // ---------- 시험용 문(화면에 안내하지 않는다) ----------
  window.__state = () => {
    const guests = Math.round(G.run.guests);
    const o = { stage: G.run.stage, left: Math.round(G.run.left), guests, earth: N.EARTH_START - guests, picks: Object.assign({}, G.run.picks),
      playSeconds: G.run.playSec, choosing: G.mode === 'choose' && G.choice ? G.choice.tier : null, ended: G.ended };
    if (FULL) Object.assign(o, { full: true, v: G.run.v, from: G.run.from, stageSec: (G.run.stageSec || []).slice(), mode: G.mode, bursts: G.run.bursts, gauge: G.run.gauge, lastDrift: G.meet ? G.meet.drift : null });
    return o;
  };
  window.__frames = 0;

  // ---------- 돌리기 ----------
  // ---------- 자리 비움(다른 앱 · 홈 화면 · 다른 탭 · 다른 창) ----------
  // 대표 11/25 「아이폰에서 바를 올려서 홈으로 가도 청소가 진행되고 있다」 → visibilitychange 만 받아 세웠더니 「홈으로 나가도 아직 진행되는데」.
  // 가려졌다는 신호가 브라우저마다 다르게 온다 — 오는 신호를 다 받아 세우고, 돌아온 신호나 손이 닿으면 다시 돈다.
  // ?debug=1 이면 어떤 신호가 왔는지 화면 왼쪽 위에 적는다(아이폰에서 무슨 일이 나는지 보려고).
  let away = false, awayFrames = 0;
  const dbg = qs.get('debug') === '1' ? [] : null;
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
  cv.classList.add('ready');   // 크기가 정해진 뒤에 보인다(style.css · 화면 밀림 막기)
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
