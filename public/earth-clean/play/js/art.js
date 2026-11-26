/* earth-clean · 그림 도구 — 낙서 선(대표가 고른 시안 D 의 코드를 가져와 나눔)
 * 펜 선 흔들림 · 작은 사람 조각 · 흡입구 · 로봇 · 카드 그림 · 정거장 창의 지구.
 * 붙는 이름 = window.EC.art
 */
(function () {
  'use strict';
  const EC = window.EC = window.EC || {};
  const A = EC.art = {};

  A.KO = '"Malgun Gothic","맑은 고딕","Apple SD Gothic Neo","Noto Sans KR",sans-serif';
  A.HAND = '"Segoe Print","Chalkboard SE","Comic Sans MS",' + A.KO;
  const INK = A.INK = '#1b1b1b';
  const PT = A.PT = '#ff5a2c';
  const PT_PALE = A.PT_PALE = '#ffe3d8';
  A.PT_HL = 'rgba(255,90,44,0.20)';
  A.PAPER = '#fdfdfb';
  A.MAP = 'rgba(27,27,27,0.46)';

  // ---------- 난수 · 손떨림 ----------
  function mulberry(a) {
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  A.mulberry = mulberry;
  let J = mulberry(1);
  A.seed = (s) => { J = mulberry(s); };
  const jit = A.jit = (a) => (J() * 2 - 1) * a;
  A.mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

  A.rLine = function (g, x1, y1, x2, y2, amp = 1) {
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
    const a0 = g.globalAlpha;
    for (let p = 0; p < 2; p++) {
      const bow = jit(Math.min(2.2, 0.3 + len * 0.012) * amp), e = 0.9 * amp;
      g.globalAlpha = a0 * (p ? 0.42 : 1);
      g.beginPath();
      g.moveTo(x1 + jit(e), y1 + jit(e));
      g.quadraticCurveTo((x1 + x2) / 2 + nx * bow, (y1 + y2) / 2 + ny * bow, x2 + jit(e), y2 + jit(e));
      g.stroke();
    }
    g.globalAlpha = a0;
  };
  A.rRect = function (g, x, y, w, h, amp = 1) {
    const o = 1.6 * amp;
    A.rLine(g, x - o, y, x + w + o, y, amp); A.rLine(g, x + w, y - o, x + w, y + h + o, amp);
    A.rLine(g, x + w + o, y + h, x - o, y + h, amp); A.rLine(g, x, y + h + o, x, y - o, amp);
  };
  A.rEllipse = function (g, cx, cy, rx, ry, amp = 1, passes = 2) {
    const a0 = g.globalAlpha;
    for (let p = 0; p < passes; p++) {
      g.globalAlpha = a0 * (p ? 0.42 : 1);
      const n = Math.max(16, Math.round((rx + ry) * 0.9));
      const st = J() * 6.283, turn = 6.283 * (1.05 + J() * 0.07), k = jit(0.05 * amp), ph = J() * 6.283;
      g.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = st + turn * i / n, f = 1 + k * Math.sin(a * 2 + ph) + (i / n) * 0.035 * amp;
        const x = cx + Math.cos(a) * rx * f, y = cy + Math.sin(a) * ry * f;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    }
    g.globalAlpha = a0;
  };
  A.rrPts = function (x, y, w, h, r) {
    const pts = [];
    const arc = (cx, cy, a0) => { for (let k = 0; k <= 3; k++) { const a = a0 + k * Math.PI / 6; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI);
    return pts;
  };
  A.rPath = function (g, pts, closed = true, amp = 1) {
    const sub = [];
    const n = pts.length, m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % n];
      const k = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 36));
      for (let j = 0; j < k; j++) sub.push([ax + (bx - ax) * j / k, ay + (by - ay) * j / k]);
    }
    if (!closed) sub.push(pts[n - 1]);
    const a0 = g.globalAlpha;
    for (let p = 0; p < 2; p++) {
      g.globalAlpha = a0 * (p ? 0.42 : 1);
      const o = sub.map(([x, y]) => [x + jit(amp), y + jit(amp)]);
      g.beginPath(); g.moveTo(o[0][0], o[0][1]);
      for (let i = 1; i < o.length; i++) g.lineTo(o[i][0], o[i][1]);
      if (closed) { g.lineTo(o[0][0], o[0][1]); g.lineTo(o[0][0] + (o[1][0] - o[0][0]) * 0.35, o[0][1] + (o[1][1] - o[0][1]) * 0.35); }
      g.stroke();
    }
    g.globalAlpha = a0;
  };
  A.hatch = function (g, clipFn, x, y, w, h, gap = 3.2, alpha = 0.45) {
    g.save(); clipFn(); g.clip();
    const a0 = g.globalAlpha; g.globalAlpha = a0 * alpha;
    g.beginPath();
    for (let k = -h; k < w; k += gap) { g.moveTo(x + k + jit(0.4), y + h); g.lineTo(x + k + h + jit(0.4), y); }
    g.stroke(); g.globalAlpha = a0; g.restore();
  };
  A.star = function (g, x, y, r, fill) {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } g.stroke();
  };
  A.tape = function (g, x, y, r) {
    g.save(); g.translate(x, y); g.rotate(r);
    g.fillStyle = 'rgba(160,160,150,0.30)'; g.fillRect(-18, -7, 36, 14);
    g.restore();
  };
  // 종이 카드(흰 바탕 · 그림자 · 손그림 테두리)
  A.paper = function (g, x, y, w, h, r, lw, border) {
    g.fillStyle = 'rgba(0,0,0,0.08)'; g.beginPath(); g.roundRect(x + 3, y + 4, w, h, r); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill();
    g.strokeStyle = border || INK; g.lineWidth = lw || 1.6; A.rPath(g, A.rrPts(x, y, w, h, r), true, 0.7);
  };
  A.heartPath = function (g, x, y, s) {
    g.beginPath(); g.moveTo(x, y + s * 0.9);
    g.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.7, y - s * 1.2, x, y - s * 0.4);
    g.bezierCurveTo(x + s * 0.7, y - s * 1.2, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
  };
  A.note = function (g, x, y, s) {
    // 음표 하나
    g.beginPath(); g.ellipse(x, y, 2.4 * s, 1.8 * s, -0.4, 0, 7); g.fill();
    g.beginPath(); g.moveTo(x + 2.1 * s, y - 0.5 * s); g.lineTo(x + 2.1 * s, y - 8 * s); g.quadraticCurveTo(x + 5 * s, y - 6 * s, x + 5.5 * s, y - 3.5 * s); g.stroke();
  };
  // 글 줄 나누기(글자 단위 · 한글은 띄어쓰기를 먼저 본다)
  A.wrap = function (g, text, maxW) {
    const words = text.split(' '), lines = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (g.measureText(t).width <= maxW || !cur) cur = t;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines;
  };

  // ---------- 작은 사람(둥근 머리 + 통통한 몸 · 검은 선 · 옷은 저마다) ----------
  // 틀: 0-3 걷기 · 4-5 팔 활짝(옆으로 · 서 있음) · 6-7 팔 활짝(떠 있음) · 8 가만히(떠 있음)
  const SP = A.SP = 26, AX = A.AX = 13, AY = A.AY = 21, NF = 9;
  // 옷: 0 흰 · 1 흰+머리카락 · 2 까만 외투+모자 · 3 줄무늬(길쭉) · 4 흰+똥머리 · 5 까만 바지 · 6 땡땡이
  const V_WEIGHT = [0.24, 0.14, 0.13, 0.13, 0.12, 0.14, 0.10];
  const NV = A.NV = V_WEIGHT.length;
  A.FIG_H = 16;                     // 크기 1 일 때 사람 키(발끝 → 머리끝 px)
  A.pickV = function (r) { let x = r(); for (let i = 0; i < NV; i++) { x -= V_WEIGHT[i]; if (x <= 0) return i; } return 0; };
  function drawFig(g, v, f, lw) {
    const float = f >= 6, wide = f >= 4 && f <= 7;
    if (!float) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.ellipse(0, 0.3, 4.6, 1.5, 0, 0, 7); g.fill(); }
    const tilt = f < 4 ? [-0.17, 0, 0.17, 0][f] : wide ? (f % 2 ? 0.12 : -0.12) : 0;
    g.save(); g.rotate(tilt);
    g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 1.25 * lw; g.lineCap = 'round'; g.lineJoin = 'round';
    const fat = v === 3 ? 0.8 : 1, tall = v === 3 ? 1.3 : 0;
    const lA = f === 0 ? -1.4 : 0, lB = f === 2 ? -1.4 : 0;
    g.beginPath(); g.moveTo(-1.6, -3); g.lineTo(-1.8, -0.2 + lA); g.moveTo(1.6, -3); g.lineTo(1.8, -0.2 + lB); g.stroke();
    const by = -6.6 - tall;
    g.beginPath();
    if (wide) { const s = f % 2 ? 0.9 : -0.9; g.moveTo(-3, by - 1); g.lineTo(-6.6, by - 1.6 + s); g.moveTo(3, by - 1); g.lineTo(6.6, by - 1.6 - s); }
    else { const s = f === 0 ? 1 : f === 2 ? -1 : 0; g.moveTo(-3.1 * fat, by - 0.8); g.lineTo(-4.9 * fat, by + 2.2 + s); g.moveTo(3.1 * fat, by - 0.8); g.lineTo(4.9 * fat, by + 2.2 - s); }
    g.stroke();
    const rx = 3.7 * fat, ry = 4.1 + tall * 0.5;
    const body = () => { g.beginPath(); g.ellipse(0, by, rx, ry, 0, 0, 7); };
    body(); g.fillStyle = v === 2 ? INK : '#fff'; g.fill();
    if (v === 3 || v === 5 || v === 6) {
      g.save(); body(); g.clip(); g.fillStyle = INK; g.lineWidth = 1.1 * lw;
      if (v === 3) { g.beginPath(); g.moveTo(-5, by - 1.4); g.lineTo(5, by - 1.4); g.moveTo(-5, by + 1.5); g.lineTo(5, by + 1.5); g.stroke(); }
      if (v === 5) g.fillRect(-5, by + 0.6, 10, 6);
      if (v === 6) { g.beginPath(); g.arc(-1.4, by - 1.3, 0.75, 0, 7); g.arc(1.5, by + 0.2, 0.75, 0, 7); g.arc(-0.6, by + 2.2, 0.75, 0, 7); g.fill(); }
      g.restore();
    }
    body(); g.stroke();
    const hy = by - 6.3 - tall * 0.3;
    g.fillStyle = '#fff'; g.beginPath(); g.arc(0, hy, 3.1, 0, 7); g.fill(); g.stroke();
    g.fillStyle = INK;
    g.beginPath(); g.arc(-1.1, hy - 0.1, 0.5, 0, 7); g.arc(1.1, hy - 0.1, 0.5, 0, 7); g.fill();
    if (wide) { g.beginPath(); g.arc(0, hy + 1.1, 0.8, 0, Math.PI); g.fill(); }
    if (v === 1) { g.beginPath(); g.moveTo(-0.3, hy - 3); g.quadraticCurveTo(1.8, hy - 5.8, 0.3, hy - 6.2); g.stroke(); }
    if (v === 2) { g.beginPath(); g.arc(0, hy - 0.7, 3.35, Math.PI, 0); g.closePath(); g.fill(); g.beginPath(); g.moveTo(0, hy - 0.8); g.lineTo(4.8, hy - 0.6); g.stroke(); }
    if (v === 4) { g.beginPath(); g.arc(0, hy - 4, 1.4, 0, 7); g.fill(); }
    g.restore();
  }
  // 사람 조각 묶음 — scale = 무대 기준 크기 배수 · RS = 무대 → 화면 화소 배수
  A.sprites = function (scale, RS) {
    const n = Math.ceil(SP * scale * RS);
    const lw = Math.min(1, 1.7 / scale);
    const spr = [];
    for (let v = 0; v < NV; v++) {
      spr.push([]);
      for (let f = 0; f < NF; f++) {
        const c = A.mk(n, n), g = c.getContext('2d');
        g.setTransform(n / SP, 0, 0, n / SP, 0, 0); g.translate(AX, AY);
        drawFig(g, v, f, lw);
        spr[v].push(c);
      }
    }
    return { spr, scale, size: SP * scale, ax: AX * scale, ay: AY * scale, h: A.FIG_H * scale };
  };

  // ---------- 흡입구(주황 나팔 머리) ----------
  function nozzlePath(g) {
    g.beginPath();
    g.moveTo(-7, -38); g.lineTo(-7, -31);
    g.bezierCurveTo(-8, -19, -22, -13, -24, -3);
    g.lineTo(24, -3);
    g.bezierCurveTo(22, -13, 8, -19, 7, -31);
    g.lineTo(7, -38); g.closePath();
  }
  function trumpetPath(g) {
    g.beginPath();
    g.moveTo(-6, -38); g.lineTo(-6, -30);
    g.bezierCurveTo(-6, -16, -26, -14, -30, -3);
    g.lineTo(30, -3);
    g.bezierCurveTo(26, -14, 6, -16, 6, -30);
    g.lineTo(6, -38); g.closePath();
  }
  A.nozzlePath = nozzlePath;
  // (x, y) = 입 가운데 · s = 크기 배수 · o = { gauge 0~1, burst, jumbo, notes, t, flare 0~1(삼킬 때 입이 벌름) }
  A.nozzle = function (g, x, y, s, o) {
    g.save(); g.translate(x, y + 3 * s); g.scale(s, s);
    if (o.flare > 0.01) g.scale(1 + 0.3 * o.flare, 1 - 0.07 * o.flare);
    const path = o.jumbo ? trumpetPath : nozzlePath;
    path(g); g.fillStyle = PT; g.fill();
    g.strokeStyle = INK; g.lineWidth = 2 / Math.max(0.7, s * 0.9); g.lineJoin = 'round'; g.stroke();
    g.save(); g.translate(1, -0.8); g.globalAlpha = 0.35; g.lineWidth = 1; path(g); g.stroke(); g.restore();
    const mw = o.jumbo ? 30 : 24;
    if (o.jumbo) {
      // 나팔꽃 테 — 꽃잎 여섯
      g.fillStyle = PT; g.strokeStyle = INK; g.lineWidth = 1.4;
      for (let k = 0; k < 6; k++) {
        const px = -mw + (k + 0.5) * (2 * mw / 6);
        g.beginPath(); g.ellipse(px, -2, 5.6, 3.6, 0, Math.PI, 0); g.fill(); g.stroke();
      }
    }
    g.beginPath(); g.ellipse(0, -3, mw, 6.5, 0, 0, 7); g.fillStyle = INK; g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2.2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-3.5, -32); g.quadraticCurveTo(-5, -19, -15, -10); g.stroke();
    // 머리 띠 = 신바람 게이지(흰 띠가 주황으로 차오른다)
    const bx = -12, byy = -48, bw = 24, bh = 11;
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect(bx, byy, bw, bh, 3); g.fill();
    const fill = o.burst ? 1 : Math.max(0, Math.min(1, o.gauge || 0));
    if (fill > 0) {
      g.save(); g.beginPath(); g.roundRect(bx, byy, bw, bh, 3); g.clip();
      g.fillStyle = o.burst && ((o.t * 8) | 0) % 2 ? '#ffb196' : PT;
      g.fillRect(bx, byy, bw * fill, bh); g.restore();
    }
    g.strokeStyle = INK; g.lineWidth = 1.6; g.beginPath(); g.roundRect(bx, byy, bw, bh, 3); g.stroke();
    if (o.notes) {
      g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = 1;
      for (let k = 0; k < o.notes; k++) A.note(g, 17 + (k % 3) * 7, -40 - Math.floor(k / 3) * 9 + Math.sin(o.t * 4 + k) * 1.2, 0.8);
    }
    g.restore();
  };
  A.nozzleTop = (y, s) => y + 3 * s - 48 * s;

  // ---------- 마중 로봇 ----------
  // (x, y) = 발밑 가운데 · k = 크기 배수 · o = { t, prop(통통 · 프로펠러), wave }
  A.robot = function (g, x, y, k, o) {
    g.save(); g.translate(x, y); g.scale(k, k);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.ellipse(0, 1, 15, 4, 0, 0, 7); g.fill();
    const cy = -9;
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, cy, 15, 9, 0, 0, 7); g.fill();
    g.save(); g.beginPath(); g.ellipse(0, cy, 15, 9, 0, 0, 7); g.clip();
    g.fillStyle = PT; g.fillRect(-16, cy + 2, 32, 10); g.restore();
    g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath(); g.ellipse(0, cy, 15, 9, 0, 0, 7); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(0, cy - 6, 7.5, Math.PI, 0); g.fill(); g.stroke();
    g.fillStyle = INK; g.beginPath(); g.arc(-3, cy - 2, 1.3, 0, 7); g.arc(3, cy - 2, 1.3, 0, 7); g.fill();
    g.lineWidth = 1.2; g.beginPath(); g.arc(0, cy, 2.6, 0.3, Math.PI - 0.3); g.stroke();
    const wv = Math.sin((o.t || 0) * 7) * 0.5;
    g.lineWidth = 1.4; g.beginPath(); g.moveTo(13, cy - 2); g.lineTo(13 + Math.cos(-1 + wv) * 8, cy - 2 + Math.sin(-1 + wv) * 8); g.stroke();
    g.beginPath(); g.arc(13 + Math.cos(-1 + wv) * 10, cy - 2 + Math.sin(-1 + wv) * 10, 2.2, 0, 7); g.stroke();
    if (o.prop) {
      g.lineWidth = 1.3; g.beginPath(); g.moveTo(0, cy - 13.5); g.lineTo(0, cy - 18); g.stroke();
      const a = (o.t || 0) * 16;
      g.beginPath(); g.ellipse(Math.cos(a) * 4, cy - 18, 5, 1.6, 0, 0, 7); g.fillStyle = PT; g.fill(); g.stroke();
    }
    g.restore();
  };

  // ---------- 정거장 창의 지구(늘 같은 모습) ----------
  A.earthWindow = function (g, px, py, pr) {
    const k = pr / 23;
    g.save();
    g.fillStyle = INK; g.beginPath(); g.arc(px, py, pr, 0, 7); g.fill();
    g.fillStyle = '#fff';
    for (const [sx, sy] of [[-12, -9], [9, -14], [13, 6], [-15, 8], [-3, -17], [4, 15]]) { g.beginPath(); g.arc(px + sx * k, py + sy * k, 0.9 * Math.max(1, k * 0.8), 0, 7); g.fill(); }
    g.beginPath(); g.arc(px + 3 * k, py + 3 * k, 8 * k, 0, 7); g.fill();
    g.strokeStyle = INK; g.lineWidth = Math.max(1, k * 0.9);
    g.beginPath(); g.moveTo(px - 2 * k, py - 2 * k); g.quadraticCurveTo(px + 2 * k, py - 4 * k, px + 4 * k, py); g.quadraticCurveTo(px + 2 * k, py + 4 * k, px, py + 2 * k); g.stroke();
    g.beginPath(); g.moveTo(px + 6 * k, py + 5 * k); g.quadraticCurveTo(px + 9 * k, py + 6 * k, px + 7 * k, py + 9 * k); g.stroke();
    g.lineWidth = 2; A.seed(77); A.rEllipse(g, px, py, pr + 2, pr + 2, 0.5);
    g.lineWidth = 1; A.rEllipse(g, px, py, pr + 6, pr + 6, 0.5, 1);
    g.restore();
  };

  // ---------- 카드 그림(16장) — (cx, cy) 가운데 · 40px 안팎 ----------
  function mini(g, x, y, s, jumbo) {
    g.save(); g.translate(x, y); g.scale(s, s);
    (jumbo ? trumpetPath : nozzlePath)(g); g.fillStyle = PT; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.6; g.stroke();
    g.beginPath(); g.ellipse(0, -3, jumbo ? 30 : 24, 6, 0, 0, 7); g.fillStyle = INK; g.fill();
    g.restore();
  }
  function head(g, x, y, r, smile) {
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y + r * 1.9, r * 1.1, r * 1.25, 0, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke();
    g.fillStyle = INK; g.beginPath(); g.arc(x - r * 0.35, y - r * 0.05, r * 0.16, 0, 7); g.arc(x + r * 0.35, y - r * 0.05, r * 0.16, 0, 7); g.fill();
    if (smile) { g.beginPath(); g.arc(x, y + r * 0.3, r * 0.28, 0, Math.PI); g.fill(); }
  }
  function miniRobot(g, x, y, k, prop) { A.robot(g, x, y, k, { t: 0.3, prop }); }
  A.icon = function (g, id, cx, cy) {
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = 1.4;
    switch (id) {
      case 'wide':
        g.setLineDash([3, 3]); g.strokeStyle = PT; A.rEllipse(g, cx, cy + 4, 20, 18, 0.4, 1); g.setLineDash([]);
        mini(g, cx, cy + 14, 0.55); break;
      case 'pull':
        g.strokeStyle = PT; g.lineWidth = 2; g.beginPath();
        for (let a = 0; a < Math.PI * 3.6; a += 0.2) { const r = 1.5 + a * 1.45; g.lineTo(cx - 4 + Math.cos(a) * r, cy + Math.sin(a) * r); }
        g.stroke(); g.strokeStyle = INK; g.lineWidth = 1.3;
        for (const k of [-8, 0, 8]) A.rLine(g, cx + 16, cy + k, cx + 25 - Math.abs(k) * 0.3, cy + k, 0.2);
        break;
      case 'robot': miniRobot(g, cx - 2, cy + 14, 1.15, false); break;
      case 'friend':
        head(g, cx - 9, cy - 8, 6, true); head(g, cx + 9, cy - 8, 6, true);
        g.beginPath(); g.moveTo(cx - 3, cy + 6); g.quadraticCurveTo(cx, cy + 9, cx + 3, cy + 6); g.stroke();
        g.fillStyle = PT; A.heartPath(g, cx, cy - 20, 4); g.fill(); g.stroke(); break;
      case 'trail':
        g.strokeStyle = PT; g.lineWidth = 2.4; g.setLineDash([3, 4]);
        g.beginPath(); g.moveTo(cx - 26, cy + 14); g.quadraticCurveTo(cx - 14, cy - 6, cx, cy + 6); g.stroke(); g.setLineDash([]);
        mini(g, cx + 8, cy + 16, 0.5); break;
      case 'joy':
        g.fillStyle = '#fff'; g.beginPath(); g.roundRect(cx - 18, cy - 6, 36, 14, 4); g.fill();
        g.fillStyle = PT; g.fillRect(cx - 18, cy - 6, 24, 14); g.lineWidth = 1.6; g.beginPath(); g.roundRect(cx - 18, cy - 6, 36, 14, 4); g.stroke();
        g.fillStyle = INK; g.lineWidth = 1.2; A.note(g, cx - 10, cy - 12, 1.1); A.note(g, cx + 8, cy - 15, 1.1); break;
      case 'twin':
        mini(g, cx - 12, cy + 14, 0.45); mini(g, cx + 13, cy + 16, 0.45);
        g.strokeStyle = PT; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 12, cy - 6); g.quadraticCurveTo(cx, cy - 16, cx + 1, cy - 22); g.moveTo(cx + 13, cy - 4); g.quadraticCurveTo(cx + 2, cy - 14, cx + 1, cy - 22); g.stroke(); break;
      case 'jumbo': mini(g, cx, cy + 15, 0.62, true); break;
      case 'spin':
        g.strokeStyle = PT; g.lineWidth = 2;
        g.beginPath(); g.arc(cx, cy + 2, 19, -2.6, 1.9); g.stroke();
        g.beginPath(); g.moveTo(cx + 19 * Math.cos(1.9) - 5, cy + 2 + 19 * Math.sin(1.9) - 1); g.lineTo(cx + 19 * Math.cos(1.9), cy + 2 + 19 * Math.sin(1.9)); g.lineTo(cx + 19 * Math.cos(1.9) + 1, cy + 2 + 19 * Math.sin(1.9) - 6); g.stroke();
        mini(g, cx, cy + 12, 0.4); g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = 1.1; A.note(g, cx + 16, cy - 14, 1); break;
      case 'robot3': miniRobot(g, cx - 13, cy + 16, 0.62); miniRobot(g, cx + 13, cy + 16, 0.62); miniRobot(g, cx, cy + 4, 0.62); break;
      case 'chubby': miniRobot(g, cx - 2, cy + 16, 1.25, true); break;
      case 'stroll':
        head(g, cx - 4, cy - 4, 7, true);
        g.beginPath(); g.moveTo(cx - 4, cy - 11); g.lineTo(cx - 4, cy - 16); g.stroke();
        g.fillStyle = PT; g.beginPath(); g.ellipse(cx - 4, cy - 17, 8, 2.4, 0, 0, 7); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(cx + 8, cy + 14); g.lineTo(cx + 16, cy + 18); g.moveTo(cx + 11, cy + 20); g.lineTo(cx + 19, cy + 22); g.stroke(); break;
      case 'fest':
        g.fillStyle = PT;
        for (const [dx, dy, r] of [[-16, -12, 0.5], [12, -16, -0.4], [18, 6, 0.9], [-18, 10, -0.8], [0, -20, 0.2], [-6, 16, 1.2]]) { g.save(); g.translate(cx + dx, cy + dy); g.rotate(r); g.fillRect(-3, -2, 6, 4); g.strokeRect(-3, -2, 6, 4); g.restore(); }
        g.fillStyle = INK; g.lineWidth = 1.3; A.note(g, cx - 2, cy + 6, 1.5); break;
      case 'again':
        g.strokeStyle = PT; g.lineWidth = 2.2; g.beginPath(); g.arc(cx, cy, 17, -0.6, 4.6); g.stroke();
        g.beginPath(); g.moveTo(cx + 17 * Math.cos(-0.6) - 6, cy + 17 * Math.sin(-0.6) - 2); g.lineTo(cx + 17 * Math.cos(-0.6), cy + 17 * Math.sin(-0.6)); g.lineTo(cx + 17 * Math.cos(-0.6) + 1, cy + 17 * Math.sin(-0.6) - 7); g.stroke();
        g.fillStyle = INK; g.font = `700 15px ${A.HAND}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+1', cx, cy + 1); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; break;
      case 'fof':
        head(g, cx - 14, cy - 4, 5.4, true); head(g, cx, cy - 10, 5.4, true); head(g, cx + 14, cy - 4, 5.4, true); break;
      case 'window':
        g.beginPath(); g.moveTo(cx, cy + 12); g.quadraticCurveTo(cx + 4, cy + 18, cx, cy + 24); g.stroke();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy - 4, 15, 0, 7); g.fill(); g.lineWidth = 1.8; g.stroke();
        g.fillStyle = PT_PALE; g.beginPath(); g.arc(cx, cy - 4, 10, 0, 7); g.fill(); g.lineWidth = 1.3; g.stroke();
        head(g, cx, cy - 7, 3.4, true); break;
    }
    g.restore();
  };
})();
