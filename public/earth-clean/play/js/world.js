/* earth-clean · 판(내 방 · 동네 · 첫 도시) — 화면 배치 · 지도 만들기 · 바탕 그리기 · 군중 걷기
 * 지도 그림은 시안 D 의 길 · 집 · 광장 · 공원 코드를 판마다 크기만 바꿔 쓴다.
 * 붙는 이름 = window.EC.world
 */
(function () {
  'use strict';
  const EC = window.EC;
  const A = EC.art;
  const Wd = EC.world = {};
  const INK = A.INK, PT = A.PT;

  // ---------- 화면 배치 ----------
  // 가로 = 1280×720(왼쪽 세로 칸 위 정거장 · 아래 고른 것 · 오른쪽 지도 · 맨 위 가운데 숫자)
  // 세로 = 720×H(위 숫자 · 가운데 지도 · 아래 정거장 창과 고른 것) — H 는 휴대폰 화면 비율에 맞춘다(양옆이 남지 않게 · 대표 11/25 「화면 비율이 작음」)
  Wd.PORTRAIT_H = [1240, 1700];
  Wd.layout = function (portrait, H) {
    if (!portrait) return {
      portrait: false, W: 1280, H: 720,
      map: { x: 245, y: 0, w: 1035, h: 720 },
      stn: { x: 12, y: 12, w: 222, h: 252 }, win: { x: 20, y: 46, w: 206, h: 156 },
      count: { x: 24, y: 226 }, hatch: { x: 238, y: 126 }, hatchDir: 'right',
      picks: { x: 12, y: 280, w: 222, h: 396, cols: 1 },
      menu: { x: 14, y: 686, w: 66, h: 26 },
      ctr: { x: 640, y: 64, w: 560, h: 112 },
      gauge: { x: 600, y: 140, w: 150, h: 11, f: 15 },   // 신바람 게이지 줄(숫자 상자 바로 아래 · x = 막대 왼쪽 끝 · 글은 그 왼쪽)
      sep: { x: 244.5, y: 0, x2: 244.5, y2: 720 },
    };
    H = Math.min(Wd.PORTRAIT_H[1], Math.max(Wd.PORTRAIT_H[0], Math.round(H || 1400)));
    // 휴대폰 개편(대표 11/25 「모바일에서 했을 때 게임 외 요소들이 너무 작다」 · 「포기할 거 포기하고, 생략할 거 생략하고, 간단히 할 거 간단히 하고」)
    // 아래 칸 = 정거장 창 · 손님 수 · 다음 카드 · 메뉴만. 「지금까지 고른 것」 목록과 「+N명/초」는 뺐다. 아래 칸 안은 480×200 으로 짜고 1.5배로 그린다(ui).
    const k = 1.5, uy = H - 300;
    return {
      portrait: true, W: 720, H,
      map: { x: 0, y: 0, w: 720, h: uy },
      ui: { x: 0, y: uy, k },
      // stn · win · count · bar · hatchIn 은 아래 칸 안 자리(ui 만큼 옮기고 키워 그린다) — 나머지는 무대 자리
      stn: { x: 8, y: 8, w: 296, h: 184 }, win: { x: 16, y: 42, w: 280, h: 142 },
      count: { x: 318, y: 30 }, bar: { x: 318, y: 100, w: 152, h: 18 }, hatchIn: { x: 250, y: 4 },
      hatch: { x: 250 * k, y: uy + 6 }, hatchDir: 'up',
      picks: { x: 477, y: uy + 150, w: 228, h: 27, cols: 0 },
      menu: { x: 477, y: uy + 201, w: 228, h: 75 },
      ctr: { x: 360, y: 86, w: 668, h: 150 },
      gauge: { x: 280, y: 190, w: 250, h: 16, f: 22 },
      sep: { x: 0, y: uy + 0.5, x2: 720, y2: uy + 0.5 },
    };
  };

  // 아래 칸 안 자리 → 무대 자리
  Wd.toStage = function (L, r) {
    if (!L.ui) return r;
    return { x: L.ui.x + r.x * L.ui.k, y: L.ui.y + r.y * L.ui.k, w: r.w * L.ui.k, h: r.h * L.ui.k };
  };

  // ---------- 판 만들기 ----------
  // 본편(스팀 · numbers.js useFull) 판 3~8 은 첫 도시와 같은 길 그물에 바탕만 다른 임시 그림(field) · 판 9 = 끝 장면(last)
  Wd.make = function (stage, L, seed) {
    const S = window.EarthCleanNumbers && window.EarthCleanNumbers.STAGES[stage];
    if (S && S.last) return Wd.lastWorld(L, seed);   // world-full.js(본편만)
    return stage === 0 ? roomWorld(L, seed) : townWorld(stage, L, seed);
  };

  function roomWorld(L, seed) {
    const M = L.map;
    const fx = (f) => M.x + M.w * f, fy = (f) => M.y + M.h * f;
    const w = { kind: 'room', M, nodes: [], exits: [], spots: [], bld: [], doors: [], trees: [], lamps: [], seed };
    const wallY = fy(L.portrait ? 0.22 : 0.3);
    w.room = {
      wallY,
      win: L.portrait ? { x: fx(0.76), y: M.y + 134, w: M.w * 0.18, h: wallY - M.y - 150 } : { x: fx(0.8), y: fy(0.06), w: M.w * 0.16, h: (wallY - M.y) * 0.62 },
      tv: { x: fx(0.17), y: wallY + 46 },
      table: { x: fx(0.47), y: fy(0.64) },
      dance: { x: fx(0.78), y: fy(0.7) },
      sofa: { x: fx(0.2), y: fy(0.86) },
    };
    const r = w.room;
    w.spots.push({ kind: 'tv', x: r.tv.x, y: r.tv.y + 70, r: 40, nodes: [], n: 0, cap: 99, p: 0, avoid: [] });
    w.spots.push({ kind: 'pizza', x: r.table.x, y: r.table.y + 10, r: 95, nodes: [], n: 0, cap: 99, p: 0, avoid: [{ x: r.table.x, y: r.table.y, r: 62 }] });
    w.spots.push({ kind: 'dance', x: r.dance.x, y: r.dance.y, r: 80, nodes: [], n: 0, cap: 99, p: 0, avoid: [] });
    w.home = [0, 0, 1, 1, 1, 2, 2, 2];   // 친구 여덟의 자리(게임 둘 · 피자 셋 · 춤 셋)
    return w;
  }

  function townWorld(stage, L, seed) {
    const M = L.map;
    const R = A.mulberry(seed);
    const city = stage >= 2;   // 본편 판(3~)도 첫 도시와 같은 촘촘한 길 그물
    const k = city ? 0.82 : 1;
    const ROAD = city ? 11 : 15, AV = city ? 17 : 15;
    const sx = city ? 150 : 205, sy = city ? 165 : 225;
    const XS = [], YS = [];
    for (let x = M.x + (city ? 72 : 95); x < M.x + M.w - 45; x += sx) XS.push(Math.round(x));
    for (let y = M.y + (city ? 150 : 175); y < M.y + M.h - 45; y += sy) YS.push(Math.round(y));
    const avRow = city ? 1 : -1;
    const hw = (j) => (j === avRow ? AV : ROAD);
    const w = { kind: stage === 2 ? 'city' : city ? 'field' : 'hood', stage, M, XS, YS, ROAD, hw, avRow, k, seed,
      nodes: [], exits: [], spots: [], bld: [], trees: [], parks: [], plazas: [], markets: [], shops: [], lamps: [], doors: [] };

    // 길 그물 — 갈림길 + 지도 끝(밖으로 나간 사람은 다른 끝에서 들어온다)
    const nodes = w.nodes;
    const add = (x, y, exit, row, col) => { nodes.push({ x, y, exit, row, col, adj: [], spots: [] }); return nodes.length - 1; };
    const link = (a, b) => { nodes[a].adj.push(b); nodes[b].adj.push(a); };
    const grid = YS.map((y, j) => XS.map((x, i) => add(x, y, false, j, i)));
    for (let j = 0; j < YS.length; j++) for (let i = 0; i < XS.length; i++) {
      if (i < XS.length - 1) link(grid[j][i], grid[j][i + 1]);
      if (j < YS.length - 1) link(grid[j][i], grid[j + 1][i]);
    }
    const rows = [], cols = [];
    for (let j = 0; j < YS.length; j++) {
      const l = add(M.x - 14, YS[j], true, j, -1), r = add(M.x + M.w + 14, YS[j], true, j, XS.length);
      link(l, grid[j][0]); link(r, grid[j][XS.length - 1]);
      rows.push([l, ...grid[j], r]);
    }
    for (let i = 0; i < XS.length; i++) {
      const t = add(XS[i], M.y - 14, true, -1, i), b = add(XS[i], M.y + M.h + 14, true, YS.length, i);
      link(t, grid[0][i]); link(b, grid[YS.length - 1][i]);
      cols.push([t, ...grid.map((g) => g[i]), b]);
    }
    w.exits = nodes.map((n, i) => (n.exit ? i : -1)).filter((i) => i >= 0);
    w.grid = grid; w.rows = rows; w.cols = cols;
    w.edgeHW = (a, b) => { const A1 = nodes[a], B1 = nodes[b]; return A1.y === B1.y ? hw(A1.row) : ROAD; };

    // 구역(길 사이 네모)
    const xr = [[M.x, XS[0] - ROAD]];
    for (let i = 0; i < XS.length - 1; i++) xr.push([XS[i] + ROAD, XS[i + 1] - ROAD]);
    xr.push([XS[XS.length - 1] + ROAD, M.x + M.w]);
    const yr = [[M.y, YS[0] - hw(0)]];
    for (let j = 0; j < YS.length - 1; j++) yr.push([YS[j] + hw(j), YS[j + 1] - hw(j + 1)]);
    yr.push([YS[YS.length - 1] + hw(YS.length - 1), M.y + M.h]);
    const blocks = [];
    for (let j = 0; j < yr.length; j++) for (let i = 0; i < xr.length; i++) {
      blocks.push({ i, j, x0: xr[i][0], x1: xr[i][1], y0: yr[j][0], y1: yr[j][1], inner: i > 0 && i < xr.length - 1 && j > 0 && j < yr.length - 1, use: null });
    }
    const used = new Set();
    const choose = (fxv, fyv) => {
      const px = M.x + M.w * fxv, py = M.y + M.h * fyv;
      let best = null, bd = 1e9;
      for (const b of blocks) {
        if (!b.inner || used.has(b)) continue;
        const d = Math.hypot((b.x0 + b.x1) / 2 - px, (b.y0 + b.y1) / 2 - py);
        if (d < bd) { bd = d; best = b; }
      }
      if (best) used.add(best);
      return best;
    };
    const nearNode = (x, y) => { let bi = grid[0][0], bd = 1e9; for (const g of grid) for (const n of g) { const d = Math.hypot(nodes[n].x - x, nodes[n].y - y); if (d < bd) { bd = d; bi = n; } } return bi; };
    const corners = (b) => [nearNode(b.x0, b.y0), nearNode(b.x1, b.y0), nearNode(b.x0, b.y1), nearNode(b.x1, b.y1)];

    // 광장(울타리 없이 사방이 트인 곳 · 분수 · 벤치)
    const pn = nearNode(M.x + M.w * (city ? 0.62 : 0.8), M.y + M.h * (city ? 0.36 : 0.5));
    const PR = city ? 54 : 64;
    const plaza = { x: nodes[pn].x, y: nodes[pn].y, r: PR, fx: nodes[pn].x - PR * 0.46, fy: nodes[pn].y + PR * 0.46 };
    w.plazas.push(plaza);
    w.spots.push({ kind: 'plaza', x: plaza.x, y: plaza.y, r: PR - 6, nodes: [pn], n: 0, cap: city ? 60 : 34, p: 0.5, avoid: [{ x: plaza.fx, y: plaza.fy, r: 22 }] });

    // 판마다 특별한 구역
    if (!city) {
      const shop = choose(0.15, 0.3);
      shop.use = 'shop'; w.shops.push(shop);
      w.spots.push({ kind: 'shop', x: (shop.x0 + shop.x1) / 2, y: shop.y1 - 50, r: 46, nodes: [nearNode(shop.x0, shop.y1), nearNode(shop.x1, shop.y1)], n: 0, cap: 22, p: 0.45, avoid: [] });
      const mine = choose(0.42, 0.75);
      mine.use = 'mine';
      const hw2 = 50, hh = 36, cx = (mine.x0 + mine.x1) / 2, base = (mine.y0 + mine.y1) / 2 + 30;
      const ww = 28, wh = ww * M.h / M.w;
      w.myHouse = { x: cx - hw2 / 2, y: base, w: hw2, h: hh, win: { x: cx - ww / 2, y: base - hh + 6, w: ww, h: wh } };
      w.zoomSpot = { x: w.myHouse.win.x, y: w.myHouse.win.y, w: ww, h: wh };
      mine.reserve = { x: cx - hw2 / 2 - 10, y: base - hh - 20, w: hw2 + 20, h: hh + 24 };
      const park = choose(0.75, 0.75);
      park.use = 'park'; w.parks.push(park);
    } else {
      const mk = choose(0.2, 0.62);
      mk.use = 'market'; w.markets.push(mk);
      const hood = choose(0.47, 0.78);
      hood.use = 'hood';
      const bw = hood.x1 - hood.x0 - 10, bh = hood.y1 - hood.y0 - 10;
      let zw = bw, zh = zw * M.h / M.w;
      if (zh > bh) { zh = bh; zw = zh * M.w / M.h; }
      w.zoomSpot = { x: (hood.x0 + hood.x1) / 2 - zw / 2, y: (hood.y0 + hood.y1) / 2 - zh / 2, w: zw, h: zh };
      const park = choose(0.85, 0.8);
      park.use = 'park'; w.parks.push(park);
      w.spots.push({ kind: 'market', x: (mk.x0 + mk.x1) / 2, y: (mk.y0 + mk.y1) / 2 + 6, r: Math.min(mk.x1 - mk.x0, mk.y1 - mk.y0) / 2 - 18, nodes: corners(mk), n: 0, cap: 80, p: 0.4, avoid: [] });
      // 가로등(저녁에 켜진다)
      for (let j = 0; j < YS.length; j++) for (let x = M.x + 40; x < M.x + M.w - 20; x += 120) w.lamps.push({ x: x + (j % 2) * 60, y: YS[j] - hw(j) - 4 });
    }
    for (const p of w.parks) {
      const cx = (p.x0 + p.x1) / 2, cy = (p.y0 + p.y1) / 2;
      p.pond = { x: cx + (p.x1 - p.x0) * 0.12, y: cy + (p.y1 - p.y0) * 0.1, rx: (p.x1 - p.x0) * 0.24, ry: (p.y1 - p.y0) * 0.15 };
      w.spots.push({ kind: 'park', x: cx, y: cy, r: Math.min(p.x1 - p.x0, p.y1 - p.y0) / 2 - 10, nodes: corners(p), n: 0, cap: city ? 70 : 30, p: 0.35,
        avoid: [{ x: p.pond.x, y: p.pond.y, r: Math.max(p.pond.rx, p.pond.ry) + 6 }] });
    }
    w.spots.forEach((s, si) => { for (const n of s.nodes) nodes[n].spots.push(si); });

    // 집 · 건물(광장은 비운다 · 맨 위 숫자 칸은 상자 없이 투명이라 그 밑에도 지도가 그대로 비친다 — 세로 11/26 · 가로 11/27 대표)
    const blocked = (x, y, bw, bh, b) => {
      for (const pz of w.plazas) {
        const qx = Math.max(x, Math.min(pz.x, x + bw)), qy = Math.max(y, Math.min(pz.y, y + bh));
        if (Math.hypot(qx - pz.x, qy - pz.y) < pz.r + 10) return true;
      }
      const rv = b.reserve;
      if (rv && x < rv.x + rv.w && x + bw > rv.x && y < rv.y + rv.h && y + bh > rv.y) return true;
      return false;
    };
    for (const b of blocks) {
      if (b.use === 'park' || b.use === 'market' || b.use === 'hood') continue;
      const tower = city ? R() < 0.55 && b.use !== 'shop' : false;
      const lastRow = b.use === 'shop' ? b.y0 + 52 : b.y1 - 4;
      for (let base = b.y0 + (tower ? 66 : 40) * k; base <= lastRow; base += (tower ? 78 : 50) * k) {
        let x = b.x0 + 6 + R() * 6;
        for (;;) {
          const bw = tower ? (24 + R() * 14) * k : (18 + R() * 12) * k;
          const bh = tower ? (40 + R() * 30) * k : (13 + R() * 8) * k;
          if (x + bw > b.x1 - 4) break;
          const top = base - bh - (tower ? 2 : 13 * k);
          if (!blocked(x, top, bw, base - top, b)) {
            if (!tower && b.use !== 'shop' && R() < 0.14) w.trees.push({ x: x + 8 * k, y: base, r: (5 + R() * 3) * k });
            else w.bld.push({ x, y: base, w: bw, h: bh, roof: (9 + R() * 5) * k, kind: R(), k2: R(), tower, shop: b.use === 'shop' });
          }
          x += bw + (5 + R() * 9) * k;
        }
      }
    }
    // 문 → 가장 가까운 길(새 사람이 여기서 걸어 나온다)
    const roadPoint = (x, y) => {
      let best = null, bd = 1e9;
      for (let j = 0; j < YS.length; j++) { const d = Math.abs(y - YS[j]); if (d < bd) { bd = d; best = { horiz: true, j, x, y: YS[j] }; } }
      for (let i = 0; i < XS.length; i++) { const d = Math.abs(x - XS[i]); if (d < bd) { bd = d; best = { horiz: false, i, x: XS[i], y }; } }
      const list = best.horiz ? rows[best.j] : cols[best.i];
      const key = best.horiz ? 'x' : 'y';
      const v = best[key];
      for (let q = 0; q < list.length - 1; q++) {
        const a = list[q], bb = list[q + 1];
        if (v >= nodes[a][key] && v <= nodes[bb][key]) return { a, b: bb, t: v - nodes[a][key], rx: best.x, ry: best.y };
      }
      const a = list[list.length - 2], bb = list[list.length - 1];
      return { a, b: bb, t: 0, rx: nodes[a].x, ry: nodes[a].y };
    };
    for (const s of w.bld) {
      const dx = s.tower ? s.x + s.w / 2 : s.x + (s.k2 < 0.5 ? s.w * 0.22 : s.w * 0.62) + 2.5;
      const rp = roadPoint(dx, s.y);
      w.doors.push({ x: dx, y: s.y, ...rp });
    }
    if (w.myHouse) { const h = w.myHouse; const rp = roadPoint(h.x + h.w * 0.25, h.y); w.doors.push({ x: h.x + h.w * 0.25, y: h.y, ...rp }); }
    if (w.kind === 'field') {
      // 본편 임시 맵 — 사람은 길 위에 고르게(광장 · 공원 · 장터 자리는 그리지 않으므로 모이지 않게) · 가로등 없음
      const NS = window.EarthCleanNumbers.STAGES;
      w.look = NS[stage].look; w.prevLook = NS[stage - 1].look || 'city';
      for (const s of w.spots) s.cap = 0;
      w.lamps = [];
    }
    return w;
  }

  // ---------- 바탕 그리기(지도 영역만 · 펜 선이 그릴 때마다 조금씩 다르다) ----------
  Wd.drawMap = function (g, w) {
    const M = w.M;
    g.save(); g.beginPath(); g.rect(M.x, M.y, M.w, M.h); g.clip();
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (w.kind === 'room') drawRoom(g, w); else if (w.kind === 'field' || w.kind === 'last') Wd.drawField(g, w); else drawTown(g, w);   // field · last = world-full.js(본편만)
    g.restore();
  };

  function drawRoom(g, w) {
    const M = w.M, r = w.room;
    const ink = 'rgba(27,27,27,0.6)';
    // 벽
    g.fillStyle = '#fff'; g.fillRect(M.x, M.y, M.w, r.wallY - M.y);
    g.strokeStyle = ink; g.lineWidth = 1;
    g.globalAlpha = 0.35;
    for (let x = M.x + 18; x < M.x + M.w; x += 22) A.rLine(g, x, M.y, x, r.wallY - 4, 0.3);
    g.globalAlpha = 1;
    g.lineWidth = 2; A.rLine(g, M.x, r.wallY, M.x + M.w, r.wallY, 0.6);
    g.lineWidth = 1.2; A.rLine(g, M.x, r.wallY - 8, M.x + M.w, r.wallY - 8, 0.4);
    // 바닥 판자
    g.lineWidth = 1; g.strokeStyle = 'rgba(27,27,27,0.22)';
    let row = 0;
    for (let y = r.wallY + 34; y < M.y + M.h; y += 34, row++) {
      A.rLine(g, M.x, y, M.x + M.w, y, 0.5);
      for (let x = M.x + (row % 2) * 90 + 40; x < M.x + M.w; x += 180) A.rLine(g, x, y - 34, x, y, 0.2);
    }
    // 창(동네로 빠질 때 이 방이 집 한 채의 창문이 된다)
    const wn = r.win;
    g.fillStyle = '#fff'; g.fillRect(wn.x, wn.y, wn.w, wn.h);
    g.strokeStyle = INK; g.lineWidth = 2.2; A.rRect(g, wn.x, wn.y, wn.w, wn.h, 0.6);
    g.lineWidth = 1.4; A.rLine(g, wn.x + wn.w / 2, wn.y, wn.x + wn.w / 2, wn.y + wn.h, 0.4); A.rLine(g, wn.x, wn.y + wn.h / 2, wn.x + wn.w, wn.y + wn.h / 2, 0.4);
    g.lineWidth = 1; g.strokeStyle = 'rgba(27,27,27,0.5)';
    A.rEllipse(g, wn.x + wn.w * 0.28, wn.y + wn.h * 0.25, 10, 6, 0.5, 1); A.rEllipse(g, wn.x + wn.w * 0.36, wn.y + wn.h * 0.22, 8, 5, 0.5, 1);
    g.strokeStyle = INK; g.lineWidth = 1.3;
    for (const sd of [-1, 1]) { const cx = sd < 0 ? wn.x - 8 : wn.x + wn.w + 8; A.rPath(g, [[cx, wn.y - 6], [cx + sd * 6, wn.y + wn.h * 0.5], [cx - sd * 2, wn.y + wn.h + 8]], false, 0.5); }
    // 벽에 액자 · 시계
    const fx = M.x + M.w * 0.05, fy = M.y + (r.wallY - M.y) * 0.25;
    g.lineWidth = 1.6; A.rRect(g, fx, fy, 50, 36, 0.5);
    g.lineWidth = 1.1; A.rPath(g, [[fx + 6, fy + 30], [fx + 20, fy + 12], [fx + 30, fy + 24], [fx + 38, fy + 16], [fx + 46, fy + 30]], false, 0.4);
    A.rEllipse(g, M.x + M.w * 0.68, fy + 14, 13, 13, 0.4);
    g.beginPath(); g.moveTo(M.x + M.w * 0.68, fy + 14); g.lineTo(M.x + M.w * 0.68, fy + 6); g.moveTo(M.x + M.w * 0.68, fy + 14); g.lineTo(M.x + M.w * 0.68 + 6, fy + 16); g.stroke();
    // 깔개
    const t = r.table;
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(t.x, t.y + 20, 150, 66, 0, 0, 7); g.fill();
    g.strokeStyle = ink; g.lineWidth = 1.4; A.rEllipse(g, t.x, t.y + 20, 150, 66, 0.8); A.rEllipse(g, t.x, t.y + 20, 136, 56, 0.6, 1);
    // 텔레비전 · 게임기
    const tv = r.tv;
    g.strokeStyle = INK; g.lineWidth = 1.8;
    g.fillStyle = '#fff'; g.fillRect(tv.x - 60, tv.y - 6, 120, 26);
    A.rRect(g, tv.x - 60, tv.y - 6, 120, 26, 0.5);
    g.fillStyle = INK; g.fillRect(tv.x - 48, tv.y - 62, 96, 54);
    g.fillStyle = '#fff'; g.fillRect(tv.x - 43, tv.y - 57, 86, 44);
    g.strokeStyle = INK; g.lineWidth = 1.2;
    A.rPath(g, [[tv.x - 36, tv.y - 22], [tv.x - 22, tv.y - 22], [tv.x - 22, tv.y - 32], [tv.x - 8, tv.y - 32], [tv.x - 8, tv.y - 22], [tv.x + 34, tv.y - 22]], false, 0.3);
    g.beginPath(); g.arc(tv.x - 15, tv.y - 40, 4, 0, 7); g.stroke();
    A.star(g, tv.x + 20, tv.y - 42, 5, null);
    g.lineWidth = 1.4; A.rRect(g, tv.x - 22, tv.y + 2, 24, 10, 0.3);
    g.beginPath(); g.moveTo(tv.x - 10, tv.y + 20); g.bezierCurveTo(tv.x - 20, tv.y + 50, tv.x - 40, tv.y + 40, tv.x - 36, tv.y + 66); g.stroke();
    g.beginPath(); g.moveTo(tv.x + 2, tv.y + 20); g.bezierCurveTo(tv.x + 20, tv.y + 52, tv.x + 40, tv.y + 44, tv.x + 34, tv.y + 70); g.stroke();
    for (const [cx, cy] of [[tv.x - 36, tv.y + 70], [tv.x + 34, tv.y + 74]]) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx, cy, 9, 5, 0, 0, 7); g.fill(); g.stroke(); }
    // 낮은 상 + 피자 상자
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(t.x, t.y, 56, 22, 0, 0, 7); g.fill();
    g.strokeStyle = INK; g.lineWidth = 1.8; A.rEllipse(g, t.x, t.y, 56, 22, 0.5);
    A.rLine(g, t.x - 40, t.y + 14, t.x - 40, t.y + 30, 0.3); A.rLine(g, t.x + 40, t.y + 14, t.x + 40, t.y + 30, 0.3);
    g.lineWidth = 1.4; g.fillStyle = '#fff';
    g.beginPath(); g.moveTo(t.x - 30, t.y - 4); g.lineTo(t.x + 30, t.y - 4); g.lineTo(t.x + 24, t.y - 40); g.lineTo(t.x - 24, t.y - 40); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(t.x, t.y - 6, 26, 9, 0, 0, 7); g.fill(); g.stroke();
    g.lineWidth = 1; for (let a = 0; a < 6; a++) { g.beginPath(); g.moveTo(t.x, t.y - 6); g.lineTo(t.x + Math.cos(a * 1.047) * 26, t.y - 6 + Math.sin(a * 1.047) * 9); g.stroke(); }
    g.fillStyle = INK; for (const [dx, dy] of [[-14, -3], [10, -9], [4, 1], [-6, -10], [16, -2]]) { g.beginPath(); g.arc(t.x + dx, t.y - 6 + dy * 0.5, 1.6, 0, 7); g.fill(); }
    for (const [dx, dy] of [[-44, -2], [46, 0]]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(t.x + dx, t.y + dy, 7, 0, 7); g.fill(); g.lineWidth = 1.2; g.stroke(); }
    // 춤 자리 — 스피커 · 음표
    const d = r.dance;
    g.lineWidth = 1.8; g.fillStyle = '#fff';
    for (const sx of [-110, 110]) {
      g.fillRect(d.x + sx - 14, d.y - 120, 28, 44); A.rRect(g, d.x + sx - 14, d.y - 120, 28, 44, 0.4);
      g.lineWidth = 1.3; A.rEllipse(g, d.x + sx, d.y - 92, 8, 8, 0.3); A.rEllipse(g, d.x + sx, d.y - 110, 4, 4, 0.3); g.lineWidth = 1.8;
    }
    g.fillStyle = INK; g.lineWidth = 1.3;
    for (const [nx, ny] of [[-70, -130], [-30, -150], [40, -138], [80, -152]]) A.note(g, d.x + nx, d.y + ny, 1.6);
    // 소파
    const so = r.sofa;
    g.strokeStyle = INK; g.lineWidth = 1.8; g.fillStyle = '#fff';
    g.beginPath(); g.roundRect(so.x - 90, so.y - 30, 180, 44, 10); g.fill();
    A.rPath(g, A.rrPts(so.x - 90, so.y - 30, 180, 44, 10), true, 0.6);
    A.rLine(g, so.x - 76, so.y - 6, so.x + 76, so.y - 6, 0.4);
    g.lineWidth = 1; A.hatch(g, () => { g.beginPath(); g.rect(so.x - 76, so.y - 5, 152, 18); }, so.x - 76, so.y - 5, 152, 18, 4, 0.5);
    // 화분
    const px = M.x + M.w * 0.94, py = M.y + M.h * 0.93;
    g.lineWidth = 1.6; g.fillStyle = '#fff';
    g.beginPath(); g.moveTo(px - 14, py - 24); g.lineTo(px + 14, py - 24); g.lineTo(px + 10, py); g.lineTo(px - 10, py); g.closePath(); g.fill(); g.stroke();
    for (const a of [-0.9, -0.4, 0.1, 0.6, 1.0]) { g.beginPath(); g.moveTo(px, py - 24); g.quadraticCurveTo(px + Math.sin(a) * 30, py - 50, px + Math.sin(a) * 26, py - 68 + Math.abs(a) * 10); g.stroke(); }
  }

  function cutSeg(a, b, off, plazas, horiz) {
    // [a,b] 구간에서 광장과 겹치는 부분을 뺀다(광장은 사방이 트여 있다)
    let segs = [[a, b]];
    for (const pz of plazas) {
      const along = horiz ? pz.x : pz.y, across = horiz ? pz.y : pz.x;
      const d = Math.abs(off - across);
      if (d >= pz.r) continue;
      const h = Math.sqrt(pz.r * pz.r - d * d), lo = along - h, hi = along + h, out = [];
      for (const [sa, sb] of segs) {
        if (hi <= sa || lo >= sb) { out.push([sa, sb]); continue; }
        if (lo > sa) out.push([sa, lo]);
        if (hi < sb) out.push([hi, sb]);
      }
      segs = out;
    }
    return segs;
  }

  function drawTown(g, w) {
    const M = w.M, XS = w.XS, YS = w.YS, ROAD = w.ROAD, hw = w.hw, k = w.k;
    // 길 바탕(점 지우기)
    g.fillStyle = '#fff';
    YS.forEach((y, j) => g.fillRect(M.x, y - hw(j), M.w, hw(j) * 2));
    for (const x of XS) g.fillRect(x - ROAD, M.y, ROAD * 2, M.h);
    for (const pz of w.plazas) { g.beginPath(); g.arc(pz.x, pz.y, pz.r, 0, 7); g.fill(); }
    for (const p of w.parks) drawPark(g, p, w);
    for (const m of w.markets) drawMarket(g, m, w);
    // 길 가장자리
    g.strokeStyle = A.MAP; g.lineWidth = 1.5;
    const xc = [M.x - ROAD - 40, ...XS, M.x + M.w + ROAD + 40];
    YS.forEach((y, j) => {
      for (let i = 0; i < xc.length - 1; i++) {
        const a = i === 0 ? M.x - 4 : xc[i] + ROAD, b = i === xc.length - 2 ? M.x + M.w + 4 : xc[i + 1] - ROAD;
        for (const s of [-1, 1]) for (const [aa, bb] of cutSeg(a, b, y + s * hw(j), w.plazas, true)) if (bb - aa > 2) A.rLine(g, aa, y + s * hw(j), bb, y + s * hw(j), 0.7);
      }
      if (j === w.avRow) { g.save(); g.setLineDash([10, 9]); g.lineWidth = 1.1; A.rLine(g, M.x, y, M.x + M.w, y, 0.3); g.restore(); }
    });
    const yc = YS.map((y, j) => [y - hw(j), y + hw(j)]);
    XS.forEach((x) => {
      const pts = [M.y - 4];
      for (const [lo, hi] of yc) pts.push(lo, hi);
      pts.push(M.y + M.h + 4);
      for (let q = 0; q < pts.length; q += 2) {
        const a = pts[q], b = pts[q + 1];
        for (const s of [-1, 1]) for (const [aa, bb] of cutSeg(a, b, x + s * ROAD, w.plazas, false)) if (bb - aa > 2) A.rLine(g, x + s * ROAD, aa, x + s * ROAD, bb, 0.7);
      }
    });
    // 건널목
    g.lineWidth = 1.1;
    for (let j = 0; j < YS.length; j++) for (let i = 0; i < XS.length; i += 2) {
      const cx = XS[i] + ROAD + 4 * k, cy = YS[j];
      for (let q = -hw(j) + 4; q <= hw(j) - 4; q += 6) A.rLine(g, cx, cy + q, cx + 8 * k, cy + q, 0.2);
    }
    for (const pz of w.plazas) drawPlaza(g, pz, w);
    for (const s of w.shops) {
      // 가게 앞 — 작은 마당 · 의자 둘
      const cx = (s.x0 + s.x1) / 2, cy = s.y1 - 50;
      g.strokeStyle = 'rgba(27,27,27,0.25)'; g.lineWidth = 0.9;
      for (let q = 0; q < 5; q++) A.rLine(g, cx - 40 + q * 4, cy - 30 + q * 15, cx + 40 - q * 4, cy - 30 + q * 15, 0.3);
      drawBench(g, cx - 40, cy + 26); drawBench(g, cx + 40, cy + 26);
    }
    for (const s of w.bld) (s.tower ? drawTower : drawHouse)(g, s, k);
    for (const t of w.trees) drawTree(g, t.x, t.y, t.r);
    for (const l of w.lamps) { g.strokeStyle = A.MAP; g.lineWidth = 1; A.rLine(g, l.x, l.y, l.x, l.y - 12, 0.2); g.beginPath(); g.arc(l.x + 2, l.y - 13, 2, 0, 7); g.stroke(); }
    if (w.myHouse) drawMyHouse(g, w.myHouse);
    if (w.kind === 'city' && w.zoomSpot) drawMiniHood(g, w.zoomSpot);
  }

  function drawHouse(g, s, k) {
    const { x, y, w, h, roof, kind, k2 } = s, top = y - h;
    g.strokeStyle = A.MAP; g.lineWidth = 1.2;
    g.fillStyle = '#fff'; g.fillRect(x, top, w, h);
    A.rRect(g, x, top, w, h, 0.6);
    A.rLine(g, x - 3, top, x + w / 2, top - roof, 0.6); A.rLine(g, x + w / 2, top - roof, x + w + 3, top, 0.6);
    g.lineWidth = 0.8;
    if (kind < 0.55) A.hatch(g, () => { g.beginPath(); g.moveTo(x - 2, top); g.lineTo(x + w / 2, top - roof + 1); g.lineTo(x + w + 2, top); g.closePath(); }, x - 3, top - roof, w + 6, roof, 2.8, 0.7);
    g.lineWidth = 1;
    const dx = x + (k2 < 0.5 ? w * 0.22 : w * 0.62);
    A.rRect(g, dx, y - 8 * k, 5 * k, 8 * k, 0.4);
    const wx = k2 < 0.5 ? x + w * 0.62 : x + w * 0.16;
    if (w > 21 * k) { A.rRect(g, wx, top + 3.5, 5 * k, 5 * k, 0.4); if (kind > 0.8) { g.fillStyle = A.MAP; g.fillRect(wx + 0.5, top + 4, 4 * k, 4 * k); } }
    if (s.shop) {
      // 줄무늬 차양 + 간판
      g.lineWidth = 1; g.strokeStyle = A.MAP;
      const ay = top + h * 0.35;
      A.rLine(g, x - 2, ay, x + w + 2, ay, 0.3);
      for (let q = x; q < x + w; q += 4) { g.beginPath(); g.moveTo(q, ay); g.lineTo(q + 2, ay + 4); g.stroke(); }
    }
  }
  function drawTower(g, s, k) {
    const { x, y, w, h, kind } = s, top = y - h;
    g.strokeStyle = A.MAP; g.lineWidth = 1.2;
    g.fillStyle = '#fff'; g.fillRect(x, top, w, h);
    A.rRect(g, x, top, w, h, 0.6);
    g.lineWidth = 0.9;
    const cols = w > 31 * k ? 3 : 2, gx = (w - 6) / cols;
    for (let yy = top + 6; yy < y - 12; yy += 9 * k) for (let c = 0; c < cols; c++) {
      const wx = x + 4 + c * gx;
      if ((Math.floor(yy) + c * 7 + Math.floor(kind * 10)) % 5 === 0) { g.fillStyle = A.MAP; g.fillRect(wx, yy, gx - 4, 4.5 * k); }
      else A.rRect(g, wx, yy, gx - 4, 4.5 * k, 0.3);
    }
    A.rRect(g, x + w / 2 - 3.5 * k, y - 9 * k, 7 * k, 9 * k, 0.4);
    if (kind > 0.5) { A.rLine(g, x + w * 0.7, top, x + w * 0.7, top - 9, 0.4); g.beginPath(); g.arc(x + w * 0.7, top - 10, 1.4, 0, 7); g.stroke(); }
  }
  function drawTree(g, x, y, r) {
    g.strokeStyle = A.MAP; g.lineWidth = 1.1;
    A.rLine(g, x, y, x, y - r - 3, 0.3);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y - r * 1.6 - 2, r, 0, 7); g.fill();
    A.rEllipse(g, x, y - r * 1.6 - 2, r, r, 0.8);
    g.lineWidth = 0.8; g.beginPath(); g.arc(x - r * 0.25, y - r * 1.6 - 2, r * 0.45, 2.5, 4.2); g.stroke();
  }
  function drawBench(g, x, y) {
    g.strokeStyle = A.MAP; g.lineWidth = 1.1;
    A.rLine(g, x - 13, y - 6, x + 13, y - 6, 0.3); A.rLine(g, x - 13, y - 2, x + 13, y - 2, 0.3);
    A.rLine(g, x - 10, y - 2, x - 10, y + 3, 0.2); A.rLine(g, x + 10, y - 2, x + 10, y + 3, 0.2);
  }
  function drawPigeon(g, x, y, dir) {
    g.strokeStyle = 'rgba(27,27,27,0.72)'; g.lineWidth = 1; g.fillStyle = '#fff';
    g.beginPath(); g.ellipse(x, y, 4, 2.6, 0, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(x + dir * 4, y - 2.4, 1.7, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x + dir * 5.6, y - 2.2); g.lineTo(x + dir * 7.4, y - 1.8); g.moveTo(x - dir * 4, y - 0.5); g.lineTo(x - dir * 6.5, y - 1.8); g.stroke();
  }
  function drawFountain(g, x, y) {
    g.strokeStyle = 'rgba(27,27,27,0.72)'; g.lineWidth = 1.2; g.fillStyle = '#fff';
    g.beginPath(); g.ellipse(x, y, 17, 5.5, 0, 0, 7); g.fill();
    A.rEllipse(g, x, y, 17, 5.5, 0.4);
    A.rLine(g, x - 17, y, x - 16, y + 6, 0.2); A.rLine(g, x + 17, y, x + 16, y + 6, 0.2);
    g.beginPath(); g.ellipse(x, y + 6, 16, 4.5, 0, 0, Math.PI); g.stroke();
    A.rLine(g, x, y - 1, x, y - 14, 0.2);
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y - 15); g.quadraticCurveTo(x - 9, y - 22, x - 12, y - 2); g.moveTo(x, y - 15); g.quadraticCurveTo(x + 9, y - 22, x + 12, y - 2); g.stroke();
    for (const [dx, dy] of [[-15, -8], [14, -10], [-6, -21], [7, -22]]) { g.beginPath(); g.arc(x + dx, y + dy, 0.8, 0, 7); g.stroke(); }
  }
  function drawPlaza(g, pz) {
    const R = A.mulberry(4242);
    g.strokeStyle = 'rgba(27,27,27,0.20)'; g.lineWidth = 0.9;
    g.beginPath();
    for (let row = 0, y = pz.y - pz.r; y <= pz.y + pz.r; y += 7, row++) {
      for (let x = pz.x - pz.r + (row % 2) * 6; x <= pz.x + pz.r; x += 12) {
        const d = Math.hypot(x - pz.x, y - pz.y);
        if (d > pz.r - 2 - R() * 16 || Math.hypot(x - pz.fx, y - pz.fy) < 20) continue;
        g.moveTo(x, y); g.lineTo(x + 6, y);
      }
    }
    g.stroke();
    drawFountain(g, pz.fx, pz.fy);
    drawBench(g, pz.x + pz.r * 0.55, pz.y - pz.r * 0.45); drawBench(g, pz.x - pz.r * 0.5, pz.y - pz.r * 0.5);
    drawPigeon(g, pz.x + pz.r * 0.45, pz.y + pz.r * 0.5, 1); drawPigeon(g, pz.x + pz.r * 0.65, pz.y + pz.r * 0.6, -1);
    drawTree(g, pz.x + pz.r * 0.95, pz.y - pz.r * 0.75, 7); drawTree(g, pz.x - pz.r * 0.95, pz.y - pz.r * 0.75, 7);
  }
  function drawPark(g, p) {
    const { x0, y0, x1, y1 } = p, pd = p.pond;
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(pd.x, pd.y, pd.rx, pd.ry, 0, 0, 7); g.fill();
    g.strokeStyle = A.MAP; g.lineWidth = 1.3; A.rEllipse(g, pd.x, pd.y, pd.rx, pd.ry, 0.8);
    g.lineWidth = 0.9;
    for (let q = 0; q < 3; q++) { const yy = pd.y - pd.ry * 0.4 + q * pd.ry * 0.4, xx = pd.x - pd.rx * 0.5 + q * pd.rx * 0.2; g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(xx + 5, yy - 3, xx + 10, yy); g.quadraticCurveTo(xx + 15, yy + 3, xx + 20, yy); g.stroke(); }
    g.lineWidth = 1.1; g.beginPath(); g.ellipse(pd.x + pd.rx * 0.45, pd.y + pd.ry * 0.2, 5, 3, 0, 0, 7); g.stroke(); g.beginPath(); g.arc(pd.x + pd.rx * 0.45 + 4, pd.y + pd.ry * 0.2 - 5, 2.2, 0, 7); g.stroke();
    const tw = x1 - x0, th = y1 - y0;
    const trees = [[0.14, 0.2], [0.34, 0.14], [0.8, 0.18], [0.12, 0.85], [0.86, 0.88], [0.55, 0.12], [0.1, 0.52]];
    for (const [a, b] of trees) drawTree(g, x0 + tw * a, y0 + th * b + 12, 7);
    drawBench(g, x0 + tw * 0.3, y1 - 18); drawBench(g, x0 + tw * 0.7, y0 + 26);
    g.lineWidth = 0.9; g.strokeStyle = A.MAP;
    for (const [a, b] of [[0.45, 0.35], [0.7, 0.75], [0.3, 0.65], [0.9, 0.45]]) { const gx = x0 + tw * a, gy = y0 + th * b; g.beginPath(); g.moveTo(gx - 3, gy - 4); g.lineTo(gx, gy); g.lineTo(gx + 3, gy - 5); g.stroke(); }
  }
  function drawMarket(g, m) {
    // 장터 — 가장자리에 천막 가게
    const tw = m.x1 - m.x0;
    g.strokeStyle = A.MAP; g.lineWidth = 1.1;
    for (let x = m.x0 + 10; x + 26 < m.x1 - 4; x += 32) {
      for (const y of [m.y0 + 24, m.y1 - 6]) {
        g.fillStyle = '#fff'; g.fillRect(x, y - 12, 26, 12); A.rRect(g, x, y - 12, 26, 12, 0.3);
        g.beginPath(); g.moveTo(x - 3, y - 12); g.lineTo(x + 13, y - 22); g.lineTo(x + 29, y - 12); g.closePath(); g.fill(); g.stroke();
        for (let q = x + 2; q < x + 26; q += 6) { g.beginPath(); g.moveTo(q, y - 13); g.lineTo(q + 6, y - 19); g.stroke(); }
      }
    }
    g.strokeStyle = 'rgba(27,27,27,0.22)'; g.lineWidth = 0.8;
    for (let q = 0; q < 4; q++) A.rLine(g, m.x0 + tw * 0.2, m.y0 + 46 + q * 18, m.x1 - tw * 0.2, m.y0 + 46 + q * 18, 0.3);
  }
  function drawMyHouse(g, h) {
    const top = h.y - h.h;
    g.strokeStyle = 'rgba(27,27,27,0.75)'; g.lineWidth = 1.4; g.fillStyle = '#fff';
    g.fillRect(h.x, top, h.w, h.h); A.rRect(g, h.x, top, h.w, h.h, 0.6);
    A.rLine(g, h.x - 4, top, h.x + h.w / 2, top - 18, 0.5); A.rLine(g, h.x + h.w / 2, top - 18, h.x + h.w + 4, top, 0.5);
    g.lineWidth = 0.8; A.hatch(g, () => { g.beginPath(); g.moveTo(h.x - 2, top); g.lineTo(h.x + h.w / 2, top - 17); g.lineTo(h.x + h.w + 2, top); g.closePath(); }, h.x - 3, top - 18, h.w + 6, 18, 2.8, 0.7);
    g.lineWidth = 1.2; A.rRect(g, h.x + h.w * 0.12, h.y - 11, 7, 11, 0.4);
    const wn = h.win;
    g.fillStyle = '#fff'; g.fillRect(wn.x, wn.y, wn.w, wn.h);
    g.lineWidth = 1.3; A.rRect(g, wn.x, wn.y, wn.w, wn.h, 0.3);
    g.lineWidth = 0.8; A.rLine(g, wn.x + wn.w / 2, wn.y, wn.x + wn.w / 2, wn.y + wn.h, 0.2); A.rLine(g, wn.x, wn.y + wn.h / 2, wn.x + wn.w, wn.y + wn.h / 2, 0.2);
  }
  Wd._drawMiniHood = (g, z) => drawMiniHood(g, z);   // world-full.js 가 앞 판 조각을 그릴 때
  function drawMiniHood(g, z) {
    // 도시 속 동네 한 구역(동네가 여기로 작아져 들어온다)
    g.strokeStyle = A.MAP; g.lineWidth = 0.8;
    const R = A.mulberry(99);
    for (let y = z.y + 14; y < z.y + z.h - 2; y += 16) {
      for (let x = z.x + 3 + R() * 4; x + 10 < z.x + z.w - 2; x += 12 + R() * 5) {
        const w = 7 + R() * 4, h = 5 + R() * 3;
        g.fillStyle = '#fff'; g.fillRect(x, y - h, w, h); A.rRect(g, x, y - h, w, h, 0.2);
        A.rLine(g, x - 1, y - h, x + w / 2, y - h - 4, 0.2); A.rLine(g, x + w / 2, y - h - 4, x + w + 1, y - h, 0.2);
      }
    }
  }

  // ---------- 군중 ----------
  function setEdge(w, p, a, b) {
    const A1 = w.nodes[a], B1 = w.nodes[b], dx = B1.x - A1.x, dy = B1.y - A1.y, L = Math.hypot(dx, dy) || 1;
    p.a = a; p.b = b; p.len = L; p.ux = dx / L; p.uy = dy / L; p.t = 0;
    const h = w.edgeHW(a, b);
    if (p.laneHW !== h) { p.lane = 2 + Math.random() * Math.max(1, h - 5); p.laneHW = h; }
  }
  function roadPos(w, p) {
    const A1 = w.nodes[p.a];
    p.rx = A1.x + p.ux * p.t - p.uy * p.lane;
    p.ry = A1.y + p.uy * p.t + p.ux * p.lane;
  }
  function newFig(R) {
    return { v: A.pickV(R), st: 0, a: 0, b: 0, t: 0, len: 1, ux: 1, uy: 0, lane: 4, laneHW: 0, speed: 17 + R() * 13,
      rx: 0, ry: 0, dx: 0, dy: 0, x: 0, y: 0, ph: R() * 4, ph0: R() * 6, leader: null,
      spot: null, tx: 0, ty: 0, timer: 0, pause: 0, pspeed: 15, hopper: false, exc: -9, by: null, gone: false };
  }
  function spotTarget(p, s, R) {
    for (let i = 0; i < 6; i++) {
      const a = R() * 6.283, r = Math.sqrt(R()) * s.r;
      p.tx = s.x + Math.cos(a) * r; p.ty = s.y + Math.sin(a) * r;
      let ok = true;
      for (const v of s.avoid) if (Math.hypot(p.tx - v.x, p.ty - v.y) < v.r) { ok = false; break; }
      if (ok) return;
    }
  }
  function enterSpot(p, s, R) {
    p.st = 1; p.spot = s; p.timer = 6 + R() * 8; p.pause = 0; p.pspeed = 8 + R() * 20; p.hopper = R() < 0.25; p.leader = null;
    spotTarget(p, s, R);
  }
  function leaveSpot(w, p, R) {
    const s = p.spot, ox = p.rx, oy = p.ry;
    let n = s.nodes[0], bd = 1e9;
    for (const q of s.nodes) { const d = Math.hypot(w.nodes[q].x - ox, w.nodes[q].y - oy); if (d < bd) { bd = d; n = q; } }
    const adj = w.nodes[n].adj;
    p.st = 0; p.spot = null;
    setEdge(w, p, n, adj[(R() * adj.length) | 0]);
    p.t = Math.min(p.len * 0.3, s.kind === 'plaza' ? s.r * 0.6 : 4); roadPos(w, p);
    p.dx += ox - p.rx; p.dy += oy - p.ry;
  }
  function arriveNode(w, p, cx) {
    const B = w.nodes[p.b], R = cx.R;
    if (p.leader && p.leader.gone) p.leader = null;
    if (B.exit) {
      if (Math.hypot(p.dx, p.dy) < 3) {
        // 지도 밖으로 나간 사람은 다른 끝에서 걸어 들어온다(수는 그대로)
        const e = w.exits[(R() * w.exits.length) | 0];
        setEdge(w, p, e, w.nodes[e].adj[0]); roadPos(w, p); p.dx = 0; p.dy = 0; p.x = p.rx; p.y = p.ry; p.leader = null;
      } else { const ox = p.rx, oy = p.ry; setEdge(w, p, p.b, p.a); roadPos(w, p); p.dx += ox - p.rx; p.dy += oy - p.ry; }
      return;
    }
    const ox = p.rx, oy = p.ry;
    const L = p.leader;
    if (L && L.st === 1 && L.spot && B.spots.indexOf(w.spots.indexOf(L.spot)) >= 0) { enterSpot(p, L.spot, R); return; }
    if (!L || L.st !== 0) {
      for (const si of B.spots) {
        const s = w.spots[si];
        if (s.n < s.cap && R() < s.p * cx.spotMul(s.kind)) { enterSpot(p, s, R); s.n++; return; }
      }
    }
    let next = -1;
    if (L && L.st === 0 && L.a === p.b) next = L.b;
    if (next < 0) {
      const opts = B.adj.filter((n) => n !== p.a);
      let tot = 0;
      const ws = opts.map((n) => {
        const N2 = w.nodes[n], len = Math.hypot(N2.x - B.x, N2.y - B.y);
        let wt = ((N2.x - B.x) / len) * p.ux + ((N2.y - B.y) / len) * p.uy > 0.9 ? 2 : 1;
        if (N2.y === B.y) { wt *= 1.6; if (B.row === w.avRow) wt *= cx.avMul; }
        if (N2.exit) wt *= 0.6;
        tot += wt; return wt;
      });
      let r = R() * tot, q = 0;
      while (q < ws.length - 1 && r > ws[q]) { r -= ws[q]; q++; }
      next = opts[q];
      if (L) p.leader = null;
    }
    setEdge(w, p, p.b, next); roadPos(w, p);
    p.dx += ox - p.rx; p.dy += oy - p.ry;
  }

  // 판에 처음 사람을 놓는다
  Wd.initCrowd = function (w, n, R) {
    const crowd = [];
    if (w.kind === 'last') return crowd;   // 본편 끝 장면 판 — 걷는 사람 없음
    if (w.kind === 'room') {
      for (let i = 0; i < n; i++) {
        const p = newFig(R), s = w.spots[w.home[i % w.home.length]];
        p.v = i % A.NV;
        p.st = 1; p.spot = s; p.timer = Infinity; p.pspeed = 6 + R() * 10; p.hopper = s.kind === 'dance';
        spotTarget(p, s, R); p.rx = p.tx; p.ry = p.ty; spotTarget(p, s, R); p.pause = R() * 3;
        p.x = p.rx; p.y = p.ry; crowd.push(p);
      }
      return crowd;
    }
    // 광장 · 공원 · 장터에 조금
    for (const s of w.spots) {
      const m = Math.min(s.cap * 0.6, n * 0.03);
      for (let i = 0; i < m && crowd.length < n; i++) {
        const p = newFig(R); enterSpot(p, s, R); spotTarget(p, s, R); p.rx = p.tx; p.ry = p.ty; spotTarget(p, s, R);
        p.timer = 2 + R() * 12; p.pause = R() * 2; p.x = p.rx; p.y = p.ry; crowd.push(p);
      }
    }
    // 나머지는 길 위에 두셋씩
    const edges = [];
    let sum = 0;
    w.nodes.forEach((nd, a) => nd.adj.forEach((b) => {
      const len = Math.hypot(w.nodes[b].x - nd.x, w.nodes[b].y - nd.y);
      const wt = w.nodes[b].x === nd.x ? len * 0.55 : len;
      edges.push([a, b, len, wt]); sum += wt;
    }));
    while (crowd.length < n) {
      let r = R() * sum, e = edges[0];
      for (const ed of edges) { r -= ed[3]; if (r <= 0) { e = ed; break; } }
      const gs = R() < 0.3 ? 1 : R() < 0.6 ? 2 : 3, t0 = R() * e[2], speed = 17 + R() * 13;
      let leader = null;
      for (let q = 0; q < gs && crowd.length < n; q++) {
        const p = newFig(R);
        setEdge(w, p, e[0], e[1]); p.speed = speed; p.t = Math.max(0, t0 - q * ((p.uy ? 15 : 8) + R() * 5)); roadPos(w, p);
        p.x = p.rx; p.y = p.ry; p.leader = leader; if (!leader) leader = p;
        crowd.push(p);
      }
    }
    return crowd;
  };

  // 새 사람 — 집 · 건물 문에서 걸어 나온다
  Wd.spawn = function (w, R) {
    const p = newFig(R);
    const d = w.doors[(R() * w.doors.length) | 0];
    if (!d) return null;
    p.st = 2; p.door = d; p.rx = d.x; p.ry = d.y; p.x = d.x; p.y = d.y; p.speed = 20 + R() * 10;
    return p;
  };

  // ---------- 둥글게 손잡고 도는 무리(대표 11/26 「시원시원하게 빨아들일 요소가 있으면 좋겠어」) ----------
  // 판에 이미 있는 사람 그림이 스스로 모여 손잡고 빙글빙글 돈다 — 보너스 사람이 아니다(사람 수 · 길이 규칙은 numbers.js 그대로).
  // 상태: join(제자리로 뛰어옴) → spin(손잡고 돈다) → release(흡입구가 닿아 줄줄이 날아감 · game.js) · 시간이 다 되면 흩어져 다시 걷는다.
  // 사람 st = 4 가 무리 안. 줄 · 울타리 · 미끼 없이 사람들이 알아서 모여 노는 모습만(반대 읽기 「꾀어 모아 줄 세워 이송」).
  const RING_RY = 0.62, RING_PERIM = 5.23, RING_JOIN = 85;   // 타원 세로 비율 · 둘레 ≈ 가로 반지름 × 5.23 · 뛰어오는 빠르기(px/초)
  function toRoad(w, p, R) {
    // 무리에서 나온 사람 — 가장 가까운 갈림길에서 다시 걷는다(길 쪽으로 천천히 돌아간다)
    let n = -1, bd = 1e9;
    for (let i = 0; i < w.nodes.length; i++) { const nd = w.nodes[i]; if (nd.exit) continue; const d = Math.hypot(nd.x - p.x, nd.y - p.y); if (d < bd) { bd = d; n = i; } }
    const adj = w.nodes[n].adj;
    p.st = 0; p.ring = null; p.spot = null; p.leader = null;
    setEdge(w, p, n, adj[(R() * adj.length) | 0]);
    p.t = 0; roadPos(w, p);
    p.dx = p.x - p.rx; p.dy = p.y - p.ry;
  }
  // o = { R, n0, n1, sp(옆 사람 간격 px), avoid:[{x,y,r}], keep:{x,y,r}, minY(무리 윗끝), stamp, reach, v(도는 빠르기 px/초), life(초) }
  Wd.formRing = function (w, crowd, o) {
    if (w.kind === 'room') return null;
    const R = o.R, M = w.M;
    const n = o.n0 + Math.floor(R() * (o.n1 - o.n0 + 1));
    const rx = n * o.sp / RING_PERIM, ry = rx * RING_RY;
    const cands = [];
    for (const s of w.spots) cands.push({ x: s.x, y: s.y, wt: 3 });
    for (const g of w.grid) for (const i of g) cands.push({ x: w.nodes[i].x, y: w.nodes[i].y, wt: 1 });
    let tot = 0;
    for (const c of cands) tot += c.wt;
    for (let tries = 0; tries < 14; tries++) {
      let r = R() * tot, c = cands[0];
      for (const q of cands) { r -= q.wt; if (r <= 0) { c = q; break; } }
      const x = c.x + (R() - 0.5) * 40, y = c.y + (R() - 0.5) * 30;
      if (x - rx < M.x + 14 || x + rx > M.x + M.w - 14 || y - ry < o.minY || y + ry > M.y + M.h - 12) continue;
      let bad = false;
      for (const a of o.avoid) if (Math.hypot((a.x - x) / (rx + a.r), (a.y - y) / (ry + a.r)) < 1) { bad = true; break; }
      if (bad) continue;
      const near = [], k = o.keep;   // keep = 흡입구 둘레 — 거기 사람은 데려가지 않는다(흡입구 쪽이 성겨지지 않게)
      for (const p of crowd) {
        if (p.st > 2 || p.ring || p.exc >= o.stamp - 1 || p.cool > 0) continue;
        if (k && Math.hypot(p.x - k.x, p.y - k.y) < k.r) continue;
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < o.reach) near.push([d, p]);
      }
      if (near.length < o.n0) continue;
      near.sort((a, b) => a[0] - b[0]);
      const mem = near.slice(0, n).map((q) => q[1]);
      const ang = (p) => Math.atan2((p.y - y) / ry, (p.x - x) / rx);
      mem.sort((a, b) => ang(a) - ang(b));
      const nn = mem.length, rx2 = nn * o.sp / RING_PERIM;   // 모인 수에 맞춰 크기를 다시
      const g = { x, y, rx: rx2, ry: rx2 * RING_RY, sp: o.sp, n: nn, members: mem, ang: ang(mem[0]), w: (R() < 0.5 ? -1 : 1) * o.v / rx2,
        state: 'join', t: 0, life: o.life, hop: R() * 6, rt: 0, queue: null, by: null, dir: 1 };
      mem.forEach((p, i) => { p.st = 4; p.ring = g; p.slot = i; p.rin = false; p.spot = null; p.leader = null; p.dx = 0; p.dy = 0; });
      return g;
    }
    return null;
  };
  // 다 흩어진다(시간이 다 됨 · 너무 적게 남음) — 다시 길을 걷는다
  Wd.dissolveRing = function (w, g, R) {
    for (const p of g.members) if (p.ring === g && p.st === 4) toRoad(w, p, R);
    g.members.length = 0; g.state = 'done';
  };
  // 한 명만 빠진다(로봇 등) — 남은 사람이 간격을 다시 맞춘다
  Wd.leaveRing = function (g, p) {
    const i = g.members.indexOf(p);
    if (i >= 0) g.members.splice(i, 1);
    p.ring = null;
    if (g.state === 'release') return;
    g.n = g.members.length;
    g.rx = g.n * g.sp / RING_PERIM; g.ry = g.rx * RING_RY;   // 원을 줄여 다시 손잡는다
    g.members.forEach((q, k) => { q.slot = k; q.rin = false; });
  };
  function stepRing(w, g, dt, R) {
    g.t += dt;
    if (g.state === 'join') {
      let all = true;
      for (const p of g.members) if (!p.rin) { all = false; break; }
      if (all || g.t > 5) g.state = 'spin';
    } else if (g.state === 'spin') {
      g.ang += g.w * dt;
      g.life -= dt;
      if (g.life <= 0) Wd.dissolveRing(w, g, R);
    } else if (g.state === 'release') g.ang += g.w * 2.5 * dt;
  }
  function ringMember(p, dt) {
    const g = p.ring, a = g.ang + p.slot * 6.283185 / g.n;
    const tx = g.x + Math.cos(a) * g.rx, ty = g.y + Math.sin(a) * g.ry;
    if (p.rin) { p.x = tx; p.y = ty; return; }
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy), s = RING_JOIN * dt;
    if (d <= s + 0.5) { p.x = tx; p.y = ty; p.rin = true; } else { p.x += dx / d * s; p.y += dy / d * s; }
  }
  const ringHop = (g, t, sp) => Math.abs(Math.sin(t * 6 + g.hop)) * sp.h * 0.07;
  // 무리 그리기(사람보다 먼저) — 바닥 무늬 · 맞잡은 손 줄 · 음표
  Wd.drawRings = function (g, rings, sp, t) {
    for (const r of rings) {
      if (r.state === 'done' || !r.members.length) continue;
      g.fillStyle = 'rgba(255,90,44,0.08)'; g.beginPath(); g.ellipse(r.x, r.y + 1, r.rx + 9, r.ry + 7, 0, 0, 7); g.fill();
      if (r.state !== 'spin') continue;
      let all = true;
      for (const p of r.members) if (!p.rin) { all = false; break; }
      if (!all) continue;   // 자리를 다시 잡는 동안은 손을 놓는다
      const hop = ringHop(r, t, sp);
      g.strokeStyle = INK; g.lineWidth = Math.max(1, 1.2 * sp.scale);
      g.beginPath(); g.ellipse(r.x, r.y - 8.2 * sp.scale - hop, r.rx, r.ry, 0, 0, 7); g.stroke();
      g.fillStyle = INK; g.lineWidth = 1.1;
      for (let k = 0; k < 2; k++) {
        const ph = (t * 0.7 + k * 0.5 + r.hop) % 1;
        g.globalAlpha = Math.min(1, (1 - ph) * 2.5);
        A.note(g, r.x + (k ? 0.3 : -0.3) * r.rx + Math.sin(ph * 6 + k) * 4, r.y - r.ry - sp.h - 8 - ph * 22, 1.3);
      }
      g.globalAlpha = 1;
    }
  };

  // 한 걸음 — cx = { dt, stamp, walkIn, R, spotMul, avMul, wave, rings, home }
  // 다 날아 들어간 사람(정거장으로 가는 사람)은 arrived 에 넣고 crowd 에서 뺀다
  Wd.step = function (w, crowd, cx, arrived) {
    const dt = cx.dt, R = cx.R;
    for (const s of w.spots) s.n = 0;
    for (const p of crowd) if (p.st === 1 && p.spot) p.spot.n++;
    if (cx.rings) for (const g of cx.rings) if (g.state !== 'done') stepRing(w, g, dt, R);
    let j = 0;
    for (let i = 0; i < crowd.length; i++) {
      const p = crowd[i];
      if (p.st === 4) {
        if (p.ring) ringMember(p, dt); else toRoad(w, p, R);
        p.ph += dt * 8;
        crowd[j++] = p; continue;
      }
      if (p.st === 3) {
        // 흡입구 · 로봇 쪽으로 날아간다(팔을 옆으로 · 웃으며)
        // 흡입구가 아무리 빨리 움직여도 따라잡는다(최고 빠르기 550px/초보다 빠르게 · 0.7초 넘으면 바로 들어감)
        const c = p.by, ex = c.x - p.x, ey = c.y - 4 - p.y, d = Math.hypot(ex, ey) || 0.001;
        p.vel = Math.min(1100, p.vel + 2400 * dt);
        p.ft = (p.ft || 0) + dt;
        if (p.ft > 0.7) { p.gone = true; arrived.push(p); continue; }
        const ux = ex / d, uy = ey / d, tg = Math.min(1, d / Math.max(10, c.r)) * 0.7 * p.sd;
        const s = Math.min(p.vel * dt, d);
        p.x += (ux - uy * tg) * s; p.y += (uy + ux * tg) * s;
        p.spin *= 1 + 2.2 * dt; p.rot += p.spin * dt;
        p.sc = 0.3 + 0.7 * Math.min(1, d / Math.max(10, c.r));
        if (d < 7) { p.gone = true; arrived.push(p); continue; }
        crowd[j++] = p; continue;
      }
      const off = Math.hypot(p.dx, p.dy);
      const excited = p.exc === cx.stamp || !!cx.home;   // cx.home = 판 끝 몇 명 — 스스로 흡입구로 달려온다
      if (p.st === 0) {
        p.t += p.speed * dt * (excited ? 0.08 : off > 6 ? 0.5 : 1);
        if (p.t >= p.len) { p.t = p.len; roadPos(w, p); arriveNode(w, p, cx); } else roadPos(w, p);
      } else if (p.st === 1) {
        p.timer -= dt;
        if (p.pause > 0) p.pause -= dt;
        else {
          const tx = p.tx - p.rx, ty = p.ty - p.ry, d = Math.hypot(tx, ty);
          if (d < 1) { p.pause = (p.spot.kind === 'tv' ? 3 : 0.3) + R() * 2.2; spotTarget(p, p.spot, R); }
          else { const s = Math.min(d, p.pspeed * dt); p.rx += tx / d * s; p.ry += ty / d * s; }
        }
        if (p.timer <= 0 && !excited) leaveSpot(w, p, R);
      } else if (p.st === 2) {
        const d0 = p.door, tx = d0.rx - p.rx, ty = d0.ry - p.ry, d = Math.hypot(tx, ty);
        if (d < 2) {
          p.st = 0;
          const back = R() < 0.5;
          setEdge(w, p, back ? d0.b : d0.a, back ? d0.a : d0.b);
          p.t = back ? p.len - d0.t : d0.t; roadPos(w, p);
          p.dx = d0.rx - p.rx; p.dy = d0.ry - p.ry;
        } else { const s = Math.min(d, p.speed * dt); p.rx += tx / d * s; p.ry += ty / d * s; }
      }
      // 고리 안에서 2.5초를 따라와도 못 닿으면 잠깐 쉰다(흡입구 뒤로 긴 줄이 생기지 않게 · 판 끝 「나도!」 때는 끝까지 온다)
      if (excited) { p.excT = (p.excT || 0) + dt; if (p.excT > 2.5 && !cx.lastCall) { p.cool = 3; p.excT = 0; } }
      else { p.excT = 0; if (p.cool > 0) p.cool -= dt; }
      let x = p.rx + p.dx, y = p.ry + p.dy;
      if (excited) {
        const c = cx.home || p.by, ex = c.x - x, ey = c.y - y, d = Math.hypot(ex, ey) || 1;
        const s = Math.min(d, (cx.home ? Math.max(180, d / 1.8) : cx.walkIn) * dt);   // 판 끝은 어디서든 2초 안팎에 닿게
        x += ex / d * s; y += ey / d * s;
        p.dx = x - p.rx; p.dy = y - p.ry;
      } else if (off > 0.01) {
        const s = Math.min(off, 34 * dt); p.dx -= p.dx / off * s; p.dy -= p.dy / off * s;
        x = p.rx + p.dx; y = p.ry + p.dy;
      }
      p.x = x; p.y = y;
      p.ph += dt * (excited ? 10 : 5.5 + p.speed * 0.06);
      crowd[j++] = p;
    }
    crowd.length = j;
  };

  // 군중 그리기 — sp = 사람 조각 묶음 · t = 시계 · stamp = 지금 걸음 번호 · wave = 판 끝 「나도!」
  Wd.drawCrowd = function (g, crowd, sp, t, stamp, wave) {
    crowd.sort((a, b) => a.y - b.y);
    const S = sp.size, ax = sp.ax, ay = sp.ay;
    for (const p of crowd) {
      const fr = sp.spr[p.v];
      if (p.st === 3) {
        g.save(); g.translate(p.x, p.y - sp.h * 0.45); g.rotate(p.rot); g.scale(p.sc, p.sc);
        g.drawImage(fr[6 + (((t * 9) | 0) & 1)], -ax, -ay + sp.h * 0.45, S, S); g.restore();
        continue;
      }
      let f, hop = 0;
      if (p.st === 4) {
        // 무리 — 팔을 옆으로 벌려 손잡고 다 같이 들썩(뛰어오는 중이면 더 크게)
        const r = p.ring;
        if (r && p.rin) { f = 4 + (((t * 3 + r.hop) | 0) & 1); hop = ringHop(r, t, sp); }
        else { f = 4 + (((t * 6 + p.ph0) | 0) & 1); hop = Math.abs(Math.sin(t * 12 + p.ph0)) * sp.h * 0.16; }
        g.drawImage(fr[f], p.x - ax, p.y - ay - hop, S, S);
        continue;
      }
      if (p.exc >= stamp - 1) f = 4 + (((p.ph * 0.5) | 0) & 1);
      else if (wave) { f = 4 + (((t * 4 + p.ph0) | 0) & 1); hop = Math.abs(Math.sin(t * 6 + p.ph0)) * sp.h * 0.12; }
      else if (p.st === 1) {
        if (p.pause > 0 || p.hopper) {
          f = 1;
          if (p.hopper) { hop = Math.abs(Math.sin(t * 6.5 + p.ph0)) * sp.h * 0.2; f = 4 + (((t * 3 + p.ph0) | 0) & 1); }
        } else f = (p.ph | 0) & 3;
      } else f = (p.ph | 0) & 3;
      g.drawImage(fr[f], p.x - ax, p.y - ay - hop, S, S);
    }
  };
})();
