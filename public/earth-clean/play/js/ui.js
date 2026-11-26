/* earth-clean · 화면 칸 — 맨 위 숫자 · 정거장 칸 · 고른 것 · 선택창 · 끝 카드 · 메뉴
 * 모두 캔버스에 그리고, 누를 곳은 네모(무대 좌표)로 돌려준다.
 * 붙는 이름 = window.EC.ui
 */
(function () {
  'use strict';
  const EC = window.EC;
  const A = EC.art, N = window.EarthCleanNumbers;
  const U = EC.ui = {};
  const INK = A.INK, PT = A.PT, KO = A.KO, HAND = A.HAND;
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  U.fmt = fmt;
  U.mmss = (sec) => { const m = Math.floor(sec / 60), s = Math.floor(sec - m * 60); return `${m}분 ${s}초`; };

  // ---------- 정거장 방(손님이 늘면 하나씩 생긴다 · 그림과 말풍선만 · 숫자 규칙 아님) ----------
  U.ROOMS = [
    { at: 1, id: 'lounge', talk: '어? 여기 좋다!' },
    { at: 8, id: 'dining', talk: '피자 마저 먹자' },
    { at: 500, id: 'bunk', talk: '낮잠 자기 딱이야' },
    { at: 2000, id: 'pingpong', talk: '한 판 더!' },
    { at: 6008, id: 'party', talk: '옆집도 왔네!' },
    { at: 50000, id: 'tramp', talk: '둥실둥실~' },
    { at: 200000, id: 'karaoke', talk: '한 곡 더!' },
    { at: 500000, id: 'bakery', talk: '갓 구운 빵이다' },
    { at: 1000000, id: 'view', talk: '와, 지구 예쁘다' },
    { at: 1500000, id: 'pool', talk: '물방울 수영!' },
    { at: 2500000, id: 'cinema', talk: '팝콘 나눠 먹자' },
  ];
  U.TALK = ['창밖 경치 최고!', '둥둥 떠다니니 좋다', '간식 또 나왔다!', '다들 반가워요~', '무중력 재밌다', '여기 좋다~', '옆 방도 가 보자'];

  function drawRoomArt(g, id, w, h) {
    g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = 1.3;
    const earth = (x, y, r) => A.earthWindow(g, x, y, r);
    const sofa = (x, y) => {
      A.rPath(g, [[x, y + 24], [x, y + 4], [x + 8, y], [x + 72, y], [x + 80, y + 4], [x + 80, y + 24]], false, 0.5);
      A.rLine(g, x + 8, y + 12, x + 72, y + 12, 0.4);
      g.lineWidth = 0.8; A.hatch(g, () => { g.beginPath(); g.rect(x + 1, y + 13, 78, 11); }, x + 1, y + 13, 78, 11, 3.4, 0.6); g.lineWidth = 1.3;
    };
    const flags = (x0, x1, y) => {
      g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + 18, x1, y); g.stroke();
      const n = Math.max(4, Math.round((x1 - x0) / 19));
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n, bx = x0 + (x1 - x0) * t, byy = y + 36 * t * (1 - t);
        g.beginPath(); g.moveTo(bx - 5, byy); g.lineTo(bx + 5, byy); g.lineTo(bx, byy + 9); g.closePath();
        g.fillStyle = k % 2 ? '#fff' : PT; g.fill(); g.stroke();
      }
      g.lineWidth = 1.3;
    };
    const ew = Math.min(22, h * 0.15);
    switch (id) {
      case 'lounge': case 'dining':
        earth(w - 34, 34, ew); sofa(w - 96, h - 30);
        if (id === 'dining') {
          flags(8, w * 0.62, 10);
          A.rLine(g, 12, h - 18, 82, h - 18, 0.4); A.rLine(g, 18, h - 18, 18, h - 4, 0.3); A.rLine(g, 76, h - 18, 76, h - 4, 0.3);
          g.fillStyle = '#fff'; g.beginPath(); g.arc(34, h - 24, 8, 0, Math.PI); g.closePath(); g.fill(); g.stroke();
          A.rRect(g, 56, h - 31, 8, 11, 0.3);
        }
        break;
      case 'bunk':
        earth(w - 34, 34, ew);
        A.rRect(g, 12, 26, 78, h - 34, 0.4); A.rLine(g, 12, 26 + (h - 34) / 2, 90, 26 + (h - 34) / 2, 0.4);
        for (const yy of [26 + (h - 34) / 2 - 8, h - 16]) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(24, yy, 8, 4, 0, 0, 7); g.fill(); g.stroke(); }
        A.rLine(g, 96, 26, 96, h - 8, 0.3); A.rLine(g, 104, 26, 104, h - 8, 0.3);
        for (let yy = 34; yy < h - 8; yy += 10) A.rLine(g, 96, yy, 104, yy, 0.2);
        break;
      case 'pingpong':
        earth(w - 34, 34, ew);
        A.rRect(g, w / 2 - 54, h - 34, 108, 14, 0.4); A.rLine(g, w / 2, h - 40, w / 2, h - 20, 0.3);
        A.rLine(g, w / 2 - 44, h - 20, w / 2 - 44, h - 6, 0.3); A.rLine(g, w / 2 + 44, h - 20, w / 2 + 44, h - 6, 0.3);
        g.fillStyle = PT; g.beginPath(); g.ellipse(w / 2 - 70, h - 40, 6, 7, 0.4, 0, 7); g.fill(); g.stroke();
        g.beginPath(); g.ellipse(w / 2 + 70, h - 42, 6, 7, -0.4, 0, 7); g.fill(); g.stroke();
        break;
      case 'party':
        flags(6, w - 6, 8); flags(20, w - 60, 26);
        g.fillStyle = '#fff'; A.rRect(g, w / 2 - 24, h - 30, 48, 18, 0.3); A.rRect(g, w / 2 - 16, h - 44, 32, 14, 0.3);
        g.fillStyle = PT; for (const dx of [-10, 0, 10]) { g.beginPath(); g.arc(w / 2 + dx, h - 47, 2.4, 0, 7); g.fill(); }
        A.rLine(g, w / 2 - 34, h - 12, w / 2 + 34, h - 12, 0.3);
        break;
      case 'tramp':
        earth(w - 34, 34, ew);
        g.fillStyle = '#fff'; g.beginPath(); g.ellipse(w / 2, h - 22, 60, 10, 0, 0, 7); g.fill();
        A.rEllipse(g, w / 2, h - 22, 60, 10, 0.4); A.rEllipse(g, w / 2, h - 22, 50, 7, 0.3, 1);
        for (const dx of [-48, -16, 16, 48]) A.rLine(g, w / 2 + dx, h - 16, w / 2 + dx, h - 4, 0.2);
        break;
      case 'karaoke':
        earth(w - 34, 34, ew);
        g.fillStyle = INK; g.fillRect(14, 16, 74, 46); g.fillStyle = '#fff'; g.fillRect(18, 20, 66, 38);
        g.fillStyle = INK; A.note(g, 34, 46, 1.4); A.note(g, 58, 40, 1.4);
        A.rLine(g, w - 70, h - 6, w - 70, h - 44, 0.3); g.fillStyle = PT; g.beginPath(); g.ellipse(w - 70, h - 50, 5, 7, 0, 0, 7); g.fill(); g.stroke();
        break;
      case 'bakery':
        earth(w - 34, 34, ew);
        A.rRect(g, 12, h - 30, w * 0.6, 22, 0.4);
        for (let q = 0; q < 4; q++) { const bx = 26 + q * (w * 0.6 - 24) / 4; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(bx, h - 36, 10, 6, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(bx - 4, h - 39); g.lineTo(bx - 1, h - 34); g.moveTo(bx + 2, h - 39); g.lineTo(bx + 5, h - 34); g.stroke(); }
        g.fillStyle = PT; g.font = `700 15px ${KO}`; g.fillText('빵', 16, 24); g.strokeRect(10, 8, 26, 22);
        break;
      case 'view':
        earth(w / 2, h / 2 - 6, Math.min(48, h * 0.34));
        A.rLine(g, w / 2 - 60, h - 10, w / 2 + 60, h - 10, 0.4); A.rLine(g, w / 2 - 50, h - 10, w / 2 - 50, h - 2, 0.2); A.rLine(g, w / 2 + 50, h - 10, w / 2 + 50, h - 2, 0.2);
        break;
      case 'pool':
        earth(w - 34, 34, ew);
        A.rRect(g, 12, h - 44, w - 24, 36, 0.4);
        g.lineWidth = 1;
        for (let yy = h - 34; yy < h - 10; yy += 9) for (let x = 20; x < w - 30; x += 22) { g.beginPath(); g.moveTo(x, yy); g.quadraticCurveTo(x + 5, yy - 3, x + 10, yy); g.quadraticCurveTo(x + 15, yy + 3, x + 20, yy); g.stroke(); }
        for (const [bx, by, r] of [[40, h - 60, 4], [52, h - 74, 3], [w - 80, h - 66, 5], [w - 66, h - 84, 3]]) { g.beginPath(); g.arc(bx, by, r, 0, 7); g.stroke(); }
        break;
      case 'cinema':
        g.fillStyle = INK; g.fillRect(14, 10, w - 70, 44); g.fillStyle = '#fff'; g.fillRect(18, 14, w - 78, 36);
        g.lineWidth = 1.1; A.rEllipse(g, w / 2 - 30, 32, 12, 7, 0.3, 1); A.rEllipse(g, w / 2 - 14, 28, 9, 6, 0.3, 1);
        g.lineWidth = 1.3;
        for (let r = 0; r < 2; r++) for (let x = 20; x < w - 20; x += 22) { g.beginPath(); g.arc(x + r * 10, h - 8 - r * 18, 8, Math.PI, 0); g.stroke(); }
        g.fillStyle = '#fff'; g.beginPath(); g.moveTo(w - 46, h - 56); g.lineTo(w - 26, h - 56); g.lineTo(w - 29, h - 34); g.lineTo(w - 43, h - 34); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = PT; g.fillRect(w - 44, h - 50, 3, 14); g.fillRect(w - 36, h - 50, 3, 14);
        break;
    }
  }

  // ---------- 바탕(종이 · 칸 나눔 · 정거장 틀) ----------
  U.drawStatic = function (g, L) {
    const W = L.W, H = L.H;
    g.fillStyle = A.PAPER; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(0,0,0,0.14)';
    for (let y = 14; y < H; y += 24) for (let x = 14; x < W; x += 24) { g.beginPath(); g.arc(x, y, 0.9, 0, 7); g.fill(); }
  };
  U.drawPanels = function (g, L) {
    g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(L.sep.x, L.sep.y); g.lineTo(L.sep.x2, L.sep.y2); g.stroke();
    // 왼쪽 칸 바탕(지도가 비치지 않게)
    g.fillStyle = A.PAPER;
    if (!L.portrait) g.fillRect(0, 0, L.map.x - 0.5, L.H); else g.fillRect(0, L.map.y + L.map.h + 0.5, L.W, L.H);
    g.fillStyle = 'rgba(0,0,0,0.14)';
    for (let y = 14; y < L.H; y += 24) for (let x = 14; x < L.W; x += 24) {
      const inMap = x >= L.map.x && x <= L.map.x + L.map.w && y >= L.map.y && y <= L.map.y + L.map.h;
      if (!inMap) { g.beginPath(); g.arc(x, y, 0.9, 0, 7); g.fill(); }
    }
    const s = L.stn;
    g.save(); if (L.ui) { g.translate(L.ui.x, L.ui.y); g.scale(L.ui.k, L.ui.k); }
    g.fillStyle = 'rgba(0,0,0,0.07)'; g.beginPath(); g.roundRect(s.x + 3, s.y + 4, s.w, s.h, 12); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect(s.x, s.y, s.w, s.h, 12); g.fill();
    g.save(); g.beginPath(); g.roundRect(s.x, s.y, s.w, s.h, 12); g.clip();
    g.fillStyle = PT; g.fillRect(s.x, s.y, s.w, 31); g.restore();
    g.lineWidth = 2; g.strokeStyle = INK; A.rPath(g, A.rrPts(s.x, s.y, s.w, s.h, 12), true, 0.7);
    g.lineWidth = 1.4; A.rLine(g, s.x, s.y + 31, s.x + s.w, s.y + 31, 0.4);
    g.fillStyle = '#fff'; g.font = `700 15px ${KO}`; g.fillText('우주 정거장', s.x + 14, s.y + 21);
    g.strokeStyle = '#fff'; g.lineWidth = 1.2; A.star(g, s.x + 112, s.y + 15, 5, null); A.star(g, s.x + 124, s.y + 21, 3, null);
    A.tape(g, s.x + 6, s.y + 2, -0.6); A.tape(g, s.x + s.w - 6, s.y + 2, 0.6);
    g.restore();
  };

  // 맨 위 종이 띠(세 벌) — 세로 휴대폰은 상자 없이 글자만(지도가 그대로 비친다 · 대표 11/26 「박스 배경을 그냥 투명으로」)
  // 글자 · 막대에는 흰 테두리를 둘러 사람 그림이 밑을 지나가도 또렷하다. 가로(PC)는 상자 그대로.
  U.stripArt = function (L, RS) {
    const c = L.ctr, bw = c.w + 40, bh = c.h + 40;
    return [0, 1, 2].map((v) => {
      const cv = A.mk(bw * RS, bh * RS), g = cv.getContext('2d');
      g.setTransform(RS, 0, 0, RS, 0, 0); g.lineCap = 'round'; g.lineJoin = 'round';
      g.translate(bw / 2, bh / 2);
      A.seed(555 + v * 31);
      const w = c.w, h = c.h, P = L.portrait;
      if (!P) {
        g.fillStyle = 'rgba(0,0,0,0.08)'; g.beginPath(); g.roundRect(-w / 2 + 3, -h / 2 + 4, w, h, 6); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 6); g.fill();
        g.strokeStyle = INK; g.lineWidth = 1.8; A.rPath(g, A.rrPts(-w / 2, -h / 2, w, h, 6), true, 0.8);
      }
      g.fillStyle = A.PT_HL;
      // 세로 휴대폰(P)은 글자를 키운 큰 띠
      const hy = P ? 8 : 0;
      g.beginPath(); g.moveTo(-w * 0.4 + A.jit(2), -24 - hy + A.jit(1)); g.lineTo(w * 0.4 + A.jit(2), -27 - hy + A.jit(1)); g.lineTo(w * 0.41 + A.jit(2), 12 + hy + A.jit(1)); g.lineTo(-w * 0.41 + A.jit(2), 14 + hy + A.jit(1)); g.closePath(); g.fill();
      const ly = P ? -50 : -38, gx = P ? -120 : -88, gy = ly - (P ? 7 : 5), gr = P ? 10 : 7.5;
      g.font = `700 ${P ? 21 : 15}px ${KO}`; g.textAlign = 'center';
      if (P) { g.lineWidth = 6; g.strokeStyle = '#fff'; g.strokeText('지구에 남은 사람', 0, ly); g.beginPath(); g.arc(gx, gy, gr + 1, 0, 7); g.fillStyle = '#fff'; g.fill(); }
      g.fillStyle = INK; g.fillText('지구에 남은 사람', 0, ly); g.textAlign = 'left';
      g.strokeStyle = INK; g.lineWidth = P ? 1.5 : 1.2; A.rEllipse(g, gx, gy, gr, gr, 0.3);
      g.beginPath(); g.ellipse(gx, gy, gr * 0.43, gr, 0, 0, 7); g.moveTo(gx - gr, gy); g.lineTo(gx + gr, gy); g.stroke();
      if (!P) { g.strokeStyle = 'rgba(27,27,27,0.3)'; g.lineWidth = 1; g.setLineDash([3, 4]); A.rLine(g, -w / 2 + 16, 22, w / 2 - 16, 22, 0.3); g.setLineDash([]); }
      if (P) { g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.rect(40, 44, w / 2 - 60, 18); g.fill(); g.stroke(); }
      g.strokeStyle = INK; g.lineWidth = 1.3; A.rRect(g, 40, P ? 44 : 32, w / 2 - 60, P ? 18 : 12, 0.4);
      if (!P) { A.tape(g, -w / 2 + 8, -h / 2 + 4, -0.5); A.tape(g, w / 2 - 8, -h / 2 + 4, 0.5); }
      return cv;
    });
  };
  // 큰 숫자 글자 조각(흰 테두리를 미리 그려 둔다 — 매 프레임 테두리 글자를 새로 그리지 않게)
  U.digitArt = function (L, RS) {
    const P = L.portrait, nf = P ? 58 : 50, pad = 6, font = `700 ${nf}px ${HAND}`;
    const m = A.mk(1, 1).getContext('2d'); m.font = font;
    const out = { nf, map: {} };
    for (const ch of '0123456789,') {
      const w = m.measureText(ch).width, cw = w + pad * 2, chh = nf * 1.5 + pad * 2, base = pad + nf * 1.12;
      const cv = A.mk(cw * RS, chh * RS), g = cv.getContext('2d');
      g.setTransform(RS, 0, 0, RS, 0, 0); g.font = font; g.lineJoin = 'round';
      g.lineWidth = 9; g.strokeStyle = '#fff'; g.strokeText(ch, pad, base);
      g.fillStyle = INK; g.fillText(ch, pad, base);
      out.map[ch] = { cv, w, cw, chh, base };
    }
    return out;
  };
  const STAGE_LEFT = ['내 방에 남은 사람', '이 동네에 남은 사람', '이 도시에 남은 사람'];
  U.drawCounter = function (g, G, bi) {
    const L = G.L, c = L.ctr, kick = 1 + 0.07 * (G.ctrKick || 0);
    g.save(); g.translate(c.x, c.y); g.rotate(-0.006); g.scale(kick, kick);   // 한 번에 많이 모시면 숫자 칸이 들썩
    g.drawImage(G.strip[bi], -c.w / 2 - 20, -c.h / 2 - 20, c.w + 40, c.h + 40);
    // 큰 숫자 — 바뀐 자리만 살짝 들썩
    const s = fmt(G.shownEarth);
    const cd = G.ctrDigits;
    if (cd.s.length !== s.length) { cd.s = s; cd.t = Array.from(s, () => -9); }
    for (let i = 0; i < s.length; i++) if (s[i] !== cd.s[i]) cd.t[i] = G.clock;
    cd.s = s;
    const P = L.portrait, ny = P ? 16 : 12, D = G.digits;
    let w1 = 0;
    for (let i = 0; i < s.length; i++) w1 += D.map[s[i]].w;
    g.font = `700 ${P ? 26 : 22}px ${KO}`; const w2 = g.measureText('명').width;
    const x0 = -(w1 + 6 + w2) / 2;
    let x = x0;
    for (let i = 0; i < s.length; i++) {
      const d = D.map[s[i]], age = G.clock - cd.t[i], jy = age < 0.25 ? -3 * (1 - age / 0.25) : 0;
      g.drawImage(d.cv, x - 6, ny + jy - d.base, d.cw, d.chh);
      x += d.w;
    }
    g.lineJoin = 'round'; g.lineWidth = 6; g.strokeStyle = '#fff'; g.strokeText('명', x0 + w1 + 6, ny - 2);
    g.fillStyle = INK; g.fillText('명', x0 + w1 + 6, ny - 2);
    // 이 판에 남은 사람 + 막대
    const run = G.run, S = N.STAGES[run.stage];
    const left = G.ended ? 0 : run.left;
    g.font = `700 ${P ? 20 : 14}px ${KO}`; g.fillStyle = INK;
    const sl = `${STAGE_LEFT[run.stage]} ${fmt(left)}명`;
    g.textAlign = 'right';
    if (P) { g.lineWidth = 5; g.strokeStyle = '#fff'; g.strokeText(sl, 30, 60); }
    g.fillText(sl, 30, P ? 60 : 43); g.textAlign = 'left';
    const bw = c.w / 2 - 60, frac = 1 - left / S.people, by = P ? 45 : 33, bh = P ? 16 : 10;
    g.save(); g.beginPath(); g.rect(41, by, Math.max(0, (bw - 2) * frac), bh); g.clip();
    g.fillStyle = PT; g.fillRect(41, by, bw, bh); g.restore();
    g.restore();
  };

  // 신바람 게이지 줄(맨 위 숫자 바로 아래) — 손가락에 가리지 않는 자리에서 차오르는 것 · 신바람 중 남은 시간 · 끝난 것이 보이게(대표 11/26)
  U.drawGauge = function (g, G) {
    const q = G.L.gauge, run = G.run, t = G.clock;
    if (!run.gaugeOn || G.ended || G.mode === 'choose' || G.mode === 'finale' || G.mode === 'end') return;
    const burst = run.burst > 0, f = burst ? run.burst / G.st.burstSec : run.gauge;
    const ended = !burst && t - G.burstEndAt < 1.4;
    const label = burst ? '신바람 중!' : ended ? '신바람 끝' : '신바람';
    const bx = q.x, by = q.y - q.h / 2;
    g.save();
    g.font = `700 ${q.f}px ${KO}`; g.textAlign = 'right'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.lineWidth = 5; g.strokeStyle = '#fff'; g.strokeText(label, bx - 10, q.y + 1);
    g.fillStyle = burst ? PT : ended ? 'rgba(27,27,27,0.55)' : INK; g.fillText(label, bx - 10, q.y + 1);
    g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 4;
    g.beginPath(); g.roundRect(bx, by, q.w, q.h, q.h / 2); g.fill(); g.stroke();
    if (f > 0.004) {
      g.save(); g.beginPath(); g.roundRect(bx, by, q.w, q.h, q.h / 2); g.clip();
      g.fillStyle = PT;
      g.globalAlpha = burst ? (run.burst < 1.5 && ((t * 7) | 0) % 2 ? 0.4 : 1) : f > 0.85 ? 0.6 + 0.4 * Math.sin(t * 14) : 1;
      g.fillRect(bx, by, q.w * Math.min(1, f), q.h);
      g.restore();
    }
    g.strokeStyle = INK; g.lineWidth = 1.6; g.beginPath(); g.roundRect(bx, by, q.w, q.h, q.h / 2); g.stroke();
    if (burst) {
      const sec = `${Math.ceil(run.burst)}초`;
      g.textAlign = 'left'; g.lineWidth = 5; g.strokeStyle = '#fff'; g.strokeText(sec, bx + q.w + 10, q.y + 1);
      g.fillStyle = PT; g.fillText(sec, bx + q.w + 10, q.y + 1);
    }
    g.restore();
  };

  // ---------- 정거장 칸 ----------
  U.roomArt = function (L, RS) {
    const wn = L.win, out = {};
    for (const r of U.ROOMS) {
      const cv = A.mk(wn.w * RS, wn.h * RS), g = cv.getContext('2d');
      g.setTransform(RS, 0, 0, RS, 0, 0); A.seed(1000 + r.at);
      drawRoomArt(g, r.id, wn.w, wn.h);
      out[r.id] = cv;
    }
    return out;
  };
  // 첫 방(소파 · 둥근 창)은 손님이 오기 전부터 보인다
  U.unlockedRooms = (guests) => U.ROOMS.filter((r, i) => i === 0 || guests >= r.at);

  U.drawStation = function (g, G) {
    const L = G.L, wn = L.win, S = G.stn, t = G.clock;
    const room = S.room;
    g.save(); g.beginPath(); g.rect(wn.x, wn.y, wn.w, wn.h); g.clip();
    g.fillStyle = '#fff'; g.fillRect(wn.x, wn.y, wn.w, wn.h);
    if (room) g.drawImage(G.roomArt[room.id], wn.x, wn.y, wn.w, wn.h);
    // 들어오는 문(늘 열려 있다)
    g.fillStyle = A.PT_PALE; g.strokeStyle = INK; g.lineWidth = 1.5;
    if (L.hatchDir === 'right') { g.beginPath(); g.ellipse(wn.x + wn.w - 2, L.hatch.y, 4, 10, 0, 0, 7); g.fill(); g.stroke(); }
    else { g.beginPath(); g.ellipse((L.hatchIn || L.hatch).x, wn.y + 2, 10, 4, 0, 0, 7); g.fill(); g.stroke(); }
    const sp = G.stnSpr;
    for (const q of S.guests) {
      g.save(); g.translate(q.x, q.y);
      g.rotate(q.sleep ? 0.28 + Math.sin(t * 1.3 + q.ph) * 0.12 : q.rot);
      const f = q.sleep ? 8 : q.wide ? 6 + (((t * 2.2 + q.ph) | 0) & 1) : 8;
      g.drawImage(sp.spr[q.v][f], -sp.ax, -sp.ay + sp.h * 0.45, sp.size, sp.size);
      if (q.hat) { g.strokeStyle = INK; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -sp.h * 0.55); g.lineTo(0, -sp.h * 0.72); g.stroke(); g.fillStyle = PT; g.beginPath(); g.ellipse(Math.cos(t * 14) * 2, -sp.h * 0.74, 4.5, 1.4, 0, 0, 7); g.fill(); g.stroke(); }
      g.restore();
      if (q.sleep) {
        g.fillStyle = INK; g.font = `700 12px ${HAND}`;
        const zt = (t * 0.7 + q.ph) % 1;
        g.globalAlpha = 1 - zt * 0.6; g.fillText('Zz', q.x + 9 + zt * 5, q.y - 8 - zt * 9); g.globalAlpha = 1;
      }
    }
    for (const o of S.flashes) {
      const k = o.k || 1, a = 1 - o.t / 0.35, r0 = (6 + o.t * 30) * k;   // k = 호스 불룩이가 클수록 크게 「도착!」
      g.strokeStyle = PT; g.lineWidth = 1.6 * Math.min(2, k); g.globalAlpha = a; g.lineCap = 'round';
      const hx = L.hatchDir === 'right' ? wn.x + wn.w : (L.hatchIn || L.hatch).x, hy = L.hatchDir === 'right' ? L.hatch.y : wn.y;
      const base = L.hatchDir === 'right' ? 0.6 : 0.1;
      for (let q = 0; q < 5; q++) { const ang = Math.PI * (base + q * 0.2); g.beginPath(); g.moveTo(hx + Math.cos(ang) * r0, hy + Math.sin(ang) * r0); g.lineTo(hx + Math.cos(ang) * (r0 + 5 * k), hy + Math.sin(ang) * (r0 + 5 * k)); g.stroke(); }
      g.globalAlpha = 1;
    }
    if (S.bubble) {
      const b = S.bubble, q = b.g, a = Math.min(1, b.t * 6, (2.6 - b.t) * 4);
      g.font = `700 11.5px ${KO}`;
      const tw = g.measureText(b.s).width, bw = tw + 14, bh = 21;
      const bx = Math.max(wn.x + 3, Math.min(wn.x + wn.w - bw - 3, q.x - bw / 2));
      const by = Math.max(wn.y + 3, Math.min(wn.y + wn.h - bh - 3, q.y - 22 - bh));
      g.globalAlpha = Math.max(0, a);
      g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 1.3;
      g.beginPath(); g.roundRect(bx, by, bw, bh, 9); g.fill(); g.stroke();
      g.fillStyle = INK; g.textBaseline = 'middle'; g.fillText(b.s, bx + 7, by + bh / 2 + 0.5); g.textBaseline = 'alphabetic';
      g.globalAlpha = 1;
    }
    g.restore();
    g.strokeStyle = INK; g.lineWidth = 1.3; g.strokeRect(wn.x + 0.5, wn.y + 0.5, wn.w - 1, wn.h - 1);
    // 작은 정거장 그림 — 방이 늘 때마다 칸이 하나씩 붙는다
    const rooms = S.rooms, s = L.stn;
    const n = rooms.length, cw = n > 6 ? 5 : 8, ch = n > 6 ? 6 : 8, gap = n > 6 ? 2 : 3;
    const x0 = s.x + s.w - 12 - n * (cw + gap) + gap;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (cw + gap), y = s.y + 16 - ch / 2;
      g.fillStyle = rooms[i] === room ? '#fff' : PT; g.strokeStyle = '#fff'; g.lineWidth = 1.2;
      g.beginPath(); g.rect(x, y, cw, ch); g.fill(); g.stroke();
      if (i > 0) { g.beginPath(); g.moveTo(x - gap, y + ch / 2); g.lineTo(x, y + ch / 2); g.stroke(); }
    }
    // 손님 수 + 1초에 모시는 사람
    const gs = fmt(N.EARTH_START - Math.round(G.shownEarth));
    const cx = L.count.x, cy = L.count.y, gk = 1 + 0.2 * (G.guestKick || 0);   // 호스 불룩이가 닿으면 손님 수가 들썩
    if (L.ui) {
      // 휴대폰 — 손님 수와 다음 카드만 크게(「+N명/초」는 뺐다)
      g.fillStyle = INK; g.font = `700 14px ${KO}`; g.fillText('손님', cx, cy);
      g.font = `700 ${gs.length > 7 ? 24 : 29}px ${HAND}`; g.fillStyle = PT;
      g.save(); g.translate(cx - 1, cy + 34); g.scale(gk, gk); g.fillText(gs, 0, 0); g.restore();
      const gw = g.measureText(gs).width;
      g.fillStyle = INK; g.font = `700 14px ${KO}`; g.fillText('명', cx + gw + 3, cy + 33);
      const pc = G.ended ? null : N.choiceProgress(G.run), b = L.bar;
      if (pc !== null) {
        g.fillStyle = INK; g.font = `700 14px ${KO}`; g.fillText('다음 카드', b.x, b.y - 8);
        g.fillStyle = '#fff'; g.fillRect(b.x, b.y, b.w, b.h);
        g.fillStyle = PT; g.globalAlpha = pc >= 1 ? 0.6 + 0.4 * Math.sin(t * 9) : 1;
        g.fillRect(b.x, b.y, b.w * pc, b.h); g.globalAlpha = 1;
        g.strokeStyle = INK; g.lineWidth = 1.6; g.strokeRect(b.x, b.y, b.w, b.h);
      }
    } else {
    g.fillStyle = INK; g.font = `700 12px ${KO}`; g.fillText('손님', cx, cy);
    g.font = `700 17px ${HAND}`; g.fillStyle = PT;
    g.save(); g.translate(cx + 32, cy + 2); g.scale(gk, gk); g.fillText(gs, 0, 0); g.restore();
    const w = g.measureText(gs).width;
    g.fillStyle = INK; g.font = `700 12px ${KO}`; g.fillText('명', cx + 36 + w, cy);
    if (G.run.stage > 0 || G.rate > 0.5) {
      g.font = `700 12px ${KO}`; g.fillStyle = 'rgba(27,27,27,0.75)';
      g.fillText(`+${fmt(G.rate)}명/초`, cx + 32, cy + 20);
    }
    // 다음 카드까지 — 손님이 늘수록 차고, 다 차면 카드 셋이 뜬다(대표 11/25 「카드가 뜨는 건 어떻게 알아? 표시가 있나?」)
    const nc = G.ended ? null : N.choiceProgress(G.run);
    if (nc !== null) {
      const bw = L.portrait ? 96 : 46, bh = 9, bx = L.stn.x + L.stn.w - 14 - bw, by = cy + 11;
      g.font = `700 11px ${KO}`; g.fillStyle = 'rgba(27,27,27,0.75)'; g.textAlign = 'right';
      if (L.portrait) g.fillText('다음 카드', bx - 5, cy + 20); else g.fillText('다음 카드', bx + bw, cy + 1);   // 가로는 칸이 좁아 글자를 윗줄에(「+N명/초」와 안 겹치게)
      g.textAlign = 'left';
      g.fillStyle = '#fff'; g.fillRect(bx, by, bw, bh);
      g.fillStyle = PT; g.globalAlpha = nc >= 1 ? 0.6 + 0.4 * Math.sin(t * 9) : 1;
      g.fillRect(bx, by, bw * nc, bh); g.globalAlpha = 1;
      g.strokeStyle = INK; g.lineWidth = 1.3; g.strokeRect(bx, by, bw, bh);
    }
    }
    if (S.banner) {
      // 「동네 사람 6,000명 모두 도착!」 깃발
      const bt = S.banner.t, a = Math.min(1, bt * 5);
      g.save(); g.globalAlpha = a; g.translate(wn.x + wn.w / 2, wn.y + wn.h / 2); g.rotate(-0.04);
      g.font = `700 14px ${KO}`; const tw = g.measureText(S.banner.s).width + 22;
      g.fillStyle = PT; g.beginPath(); g.roundRect(-tw / 2, -15, tw, 30, 6); g.fill();
      g.strokeStyle = INK; g.lineWidth = 1.6; g.stroke();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(S.banner.s, 0, 1);
      g.restore();
    }
  };

  // ---------- 지금까지 고른 것 ----------
  U.pickRows = function (G) {
    const out = [];
    for (const id of G.pickOrder) { const c = N.cardById(id); out.push({ id, c, lv: G.run.picks[id] || 0 }); }
    return out;
  };
  U.rowRect = function (L, i) {
    const p = L.picks;
    if (p.cols === 0) return { x: p.x, y: p.y, w: p.w, h: p.h };   // 휴대폰 — 목록이 없다(고른 카드는 「다음 카드」 막대 쪽으로 날아가 사라진다)
    if (p.cols === 1) return { x: p.x + 4, y: p.y + 30 + i * 40, w: p.w - 8, h: 36 };
    const cw = (p.w - 12) / 2, col = i % 2, row = (i / 2) | 0;
    return { x: p.x + 4 + col * (cw + 4), y: p.y + 26 + row * 34, w: cw, h: 31 };
  };
  U.renderPicks = function (G) {
    const L = G.L, RS = G.RS, p = L.picks;
    if (p.cols === 0) return A.mk(1, 1);
    const cv = A.mk(p.w * RS, p.h * RS), g = cv.getContext('2d');
    g.setTransform(RS, 0, 0, RS, 0, 0); g.translate(-p.x, -p.y); g.lineCap = 'round'; g.lineJoin = 'round';
    A.seed(4321);
    g.fillStyle = INK; g.font = `700 14px ${KO}`; g.fillText('지금까지 고른 것', p.x + 6, p.y + 17);
    g.strokeStyle = 'rgba(27,27,27,0.35)'; g.lineWidth = 1; g.setLineDash([3, 4]); A.rLine(g, p.x + 4, p.y + 23, p.x + p.w - 4, p.y + 23, 0.3); g.setLineDash([]);
    const rows = U.pickRows(G);
    if (!rows.length) {
      g.fillStyle = 'rgba(27,27,27,0.45)'; g.font = `500 12px ${KO}`;
      g.fillText('아직 없어요 — 손님이 늘면', p.x + 8, p.y + 46); g.fillText('카드 셋 중 하나를 골라요', p.x + 8, p.y + 64);
    }
    rows.forEach((r, i) => drawRow(g, L, U.rowRect(L, i), r));
    return cv;
  };
  function drawRow(g, L, rc, r) {
    const big = r.c.tier === 'big', small = L.picks.cols === 2;
    const ir = small ? 12 : 15, ix = rc.x + ir + 2, iy = rc.y + rc.h / 2;
    g.fillStyle = A.PT_HL; g.beginPath(); g.arc(ix, iy, ir, 0, 7); g.fill();
    g.save(); g.translate(ix, iy); g.scale(ir / 26, ir / 26); A.icon(g, r.id, 0, 0); g.restore();
    g.fillStyle = INK; g.font = `700 ${small ? 12 : 13.5}px ${KO}`;
    g.fillText(r.c.name, ix + ir + 6, iy + (big ? 0 : -2));
    if (big) {
      g.font = `700 10px ${KO}`; const tx = ix + ir + 6, tw = g.measureText('큰 카드').width + 8;
      g.strokeStyle = PT; g.lineWidth = 1.3; g.beginPath(); g.roundRect(tx, iy + 4, tw, 13, 6); g.stroke();
      g.fillStyle = PT; g.fillText('큰 카드', tx + 4, iy + 14);
    } else {
      for (let k = 0; k < 5; k++) {
        g.beginPath(); g.arc(ix + ir + 10 + k * (small ? 10 : 12), iy + 9, small ? 3 : 3.6, 0, 7);
        if (k < r.lv) { g.fillStyle = PT; g.fill(); }
        g.strokeStyle = INK; g.lineWidth = 1; g.stroke();
      }
    }
  }

  // ---------- 선택창 ----------
  U.cardRects = function (L, n) {
    const M = L.map, out = [];
    if (!L.portrait) {
      const cw = 262, ch = 290, gap = 28, tot = n * cw + (n - 1) * gap;
      const x0 = M.x + M.w / 2 - tot / 2, y0 = M.y + M.h / 2 - ch / 2 + 30;
      for (let i = 0; i < n; i++) out.push({ x: x0 + i * (cw + gap), y: y0, w: cw, h: ch });
    } else {
      const cw = 600, ch = 196, gap = 22, tot = n * ch + (n - 1) * gap;
      // 제목 「하나 골라요」가 맨 위 숫자와 겹치지 않게(상자 없이 비치므로 · 낮은 화면 1240 에서도)
      const x0 = M.x + M.w / 2 - cw / 2, y0 = Math.max(M.y + M.h / 2 - tot / 2 + 40, 236);
      for (let i = 0; i < n; i++) out.push({ x: x0, y: y0 + i * (ch + gap), w: cw, h: ch });
    }
    return out;
  };
  U.renderCard = function (G, id, rc) {
    const RS = G.RS, c = N.cardById(id), big = c.tier === 'big', lv = G.run.picks[id] || 0;
    const pad = 10;
    const cv = A.mk((rc.w + pad * 2) * RS, (rc.h + pad * 2) * RS), g = cv.getContext('2d');
    g.setTransform(RS, 0, 0, RS, 0, 0); g.translate(pad, pad); g.lineCap = 'round'; g.lineJoin = 'round';
    A.seed(id.length * 131 + lv);
    const w = rc.w, h = rc.h;
    A.paper(g, 0, 0, w, h, 10, big ? 3.2 : 1.8, big ? PT : INK);
    if (big) { g.strokeStyle = PT; g.lineWidth = 1.2; A.rPath(g, A.rrPts(6, 6, w - 12, h - 12, 7), true, 0.5); }
    A.tape(g, w / 2 + (id.charCodeAt(0) % 20 - 10), 0, (id.length % 3 - 1) * 0.06);
    const port = G.L.portrait;
    const pk = port ? 1.4 : 1;   // 세로 휴대폰은 글자 · 그림을 키운다(대표 11/25 「화면 비율이 작음」)
    const icx = port ? 86 : w / 2, icy = port ? h / 2 : 78;
    g.fillStyle = A.PT_HL; g.beginPath(); g.arc(icx, icy, 40 * pk, 0, 7); g.fill();
    g.save(); g.translate(icx, icy); g.scale(1.45 * pk, 1.45 * pk); A.icon(g, id, 0, 0); g.restore();
    g.fillStyle = INK; g.font = `700 ${Math.round(22 * pk)}px ${KO}`;
    const tx = port ? 172 : w / 2;
    g.textAlign = port ? 'left' : 'center';
    const ny = port ? 62 : 154;
    g.fillText(c.name, tx, ny);
    const ly = ny + Math.round(26 * pk);
    if (big) {
      g.font = `700 ${Math.round(13 * pk)}px ${KO}`; g.fillStyle = PT; g.fillText('큰 카드 · 한 번만', tx, ly);
    } else {
      const n = 5, dx = 16 * pk, sx0 = port ? tx + 8 : tx - (n - 1) * dx / 2;
      for (let k = 0; k < n; k++) {
        g.beginPath(); g.arc(sx0 + k * dx, ly - 5 * pk, 5 * pk, 0, 7);
        if (k < lv) { g.fillStyle = PT; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke(); }
        else if (k === lv) { g.fillStyle = A.PT_PALE; g.fill(); g.strokeStyle = PT; g.lineWidth = 2; g.stroke(); }
        else { g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke(); }
      }
    }
    g.font = `500 ${Math.round(16 * pk)}px ${KO}`; g.fillStyle = 'rgba(27,27,27,0.86)';
    const lines = A.wrap(g, c.line, port ? w - 196 : w - 40);
    lines.forEach((s, i) => g.fillText(s, tx, ly + Math.round(34 * pk) + i * Math.round(23 * pk)));
    g.textAlign = 'left';
    return cv;
  };
  U.drawChoice = function (g, G) {
    const ch = G.choice, L = G.L, M = L.map;
    const tIn = Math.min(1, (G.uiClock - ch.t0) / 0.2), e = 1 - (1 - tIn) * (1 - tIn);
    g.save();
    g.fillStyle = `rgba(253,253,251,${0.62 * e})`; g.fillRect(M.x, M.y, M.w, M.h);
    g.globalAlpha = e;
    const title = ch.tier === 'big' ? '큰 카드! 하나 골라요' : '하나 골라요';
    const r0 = ch.rects[0];
    g.font = `700 ${L.portrait ? 36 : 26}px ${KO}`; g.textAlign = 'center';
    const ty = r0.y - (L.portrait ? 26 : 30);
    g.lineWidth = 6; g.strokeStyle = '#fff'; g.lineJoin = 'round'; g.strokeText(title, M.x + M.w / 2, ty);
    g.fillStyle = ch.tier === 'big' ? PT : INK; g.fillText(title, M.x + M.w / 2, ty);
    g.textAlign = 'left';
    ch.rects.forEach((rc, i) => {
      const hov = ch.hover === i ? 1 : 0;
      const s = 0.9 + 0.1 * e + hov * 0.02, cx = rc.x + rc.w / 2, cy = rc.y + rc.h / 2 - hov * 4;
      g.save(); g.translate(cx, cy); g.rotate((i - 1) * 0.012); g.scale(s, s);
      g.drawImage(ch.cards[i], -rc.w / 2 - 10, -rc.h / 2 - 10, rc.w + 20, rc.h + 20);
      g.restore();
    });
    g.restore();
  };
  // 고른 카드가 왼쪽 목록으로 날아간다 · 나머지는 사라진다
  U.drawFly = function (g, G) {
    const f = G.fly, t = Math.min(1, (G.uiClock - f.t0) / 0.28), e = t * t * (3 - 2 * t);
    for (let i = 0; i < f.rects.length; i++) {
      const rc = f.rects[i];
      if (i === f.idx) {
        const to = f.to, x = rc.x + (to.x - rc.x) * e, y = rc.y + (to.y - rc.y) * e;
        const w = rc.w + (to.w - rc.w) * e, h = rc.h + (to.h - rc.h) * e;
        g.globalAlpha = 1 - e * 0.7;
        g.drawImage(f.cards[i], x - 10 * w / rc.w, y - 10 * h / rc.h, w + 20 * w / rc.w, h + 20 * h / rc.h);
      } else {
        g.globalAlpha = Math.max(0, 1 - t * 3);
        g.drawImage(f.cards[i], rc.x - 10, rc.y - 10, rc.w + 20, rc.h + 20);
      }
    }
    g.globalAlpha = 1;
  };

  // ---------- 끝 카드 ----------
  U.endRect = (L) => (L.portrait ? { x: 30, y: 60, w: 660, h: 1150 } : { x: 160, y: 30, w: 960, h: 660 });
  U.endButtons = function (L) {
    const r = U.endRect(L), out = [];
    const labels = [['save', '그림으로 저장'], ['code', '이어하기 코드 복사'], ['again', '처음부터']];
    if (!L.portrait) {
      const bw = 200, gap = 22, tot = 3 * bw + 2 * gap, x0 = r.x + r.w / 2 - tot / 2;
      labels.forEach(([id, s], i) => out.push({ id, s, x: x0 + i * (bw + gap), y: r.y + r.h - 70, w: bw, h: 44 }));
    } else {
      labels.forEach(([id, s], i) => out.push({ id, s, x: r.x + 60, y: r.y + r.h - 268 + i * 84, w: r.w - 120, h: 70 }));
    }
    return out;
  };
  // withButtons = false 면 「그림으로 저장」용(단추 없이)
  U.drawEnd = function (g, G, rc, withButtons) {
    const E = G.endInfo, L = G.L, port = L.portrait;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    A.seed(2026);
    A.paper(g, rc.x, rc.y, rc.w, rc.h, 14, 2.2);
    A.tape(g, rc.x + rc.w * 0.25, rc.y + 2, -0.08); A.tape(g, rc.x + rc.w * 0.75, rc.y + 2, 0.07);
    const cx = rc.x + rc.w / 2;
    g.textAlign = 'center'; g.fillStyle = INK;
    g.font = `700 ${port ? 38 : 31}px ${KO}`;
    const big = `손님 ${fmt(E.guests)}명이 우주 정거장에 놀러 왔어요`;
    if (port) { g.fillText(`손님 ${fmt(E.guests)}명이`, cx, rc.y + 78); g.fillText('우주 정거장에 놀러 왔어요', cx, rc.y + 126); }
    else g.fillText(big, cx, rc.y + 72);
    g.font = `700 ${port ? 28 : 20}px ${KO}`; g.fillStyle = 'rgba(27,27,27,0.8)';
    g.fillText(`내 방에서 시작해 ${U.mmss(E.playSec)}`, cx, rc.y + (port ? 172 : 108));
    g.textAlign = 'left';
    // 사진 — 정거장 다 같이 찰칵
    const ph = port ? { x: rc.x + 40, y: rc.y + 198, w: rc.w - 80, h: 320 } : { x: rc.x + 40, y: rc.y + 136, w: 470, h: 300 };
    drawPhoto(g, G, ph);
    // 고른 카드 줄
    const lx = port ? rc.x + 50 : rc.x + 550, ly = port ? ph.y + ph.h + 40 : rc.y + 150;
    g.fillStyle = INK; g.font = `700 ${port ? 22 : 16}px ${KO}`; g.fillText('고른 카드', lx, ly);
    const rows = U.pickRows(G);
    const colW = port ? (rc.w - 100) / 2 : 190;
    if (port) rows.forEach((r, i) => {
      const x = lx + 30 + (i % 9) * 62, y = ly + 46 + ((i / 9) | 0) * 84;
      g.fillStyle = A.PT_HL; g.beginPath(); g.arc(x, y, 25, 0, 7); g.fill();
      g.save(); g.translate(x, y); g.scale(0.9, 0.9); A.icon(g, r.id, 0, 0); g.restore();
      if (r.c.tier === 'small') { g.fillStyle = INK; g.font = `700 17px ${KO}`; g.textAlign = 'center'; g.fillText(`×${r.lv}`, x, y + 45); g.textAlign = 'left'; }
    });
    else rows.forEach((r, i) => {
      const col = i % 2, row = (i / 2) | 0, x = lx + col * colW, y = ly + 18 + row * 40;
      g.fillStyle = A.PT_HL; g.beginPath(); g.arc(x + 15, y + 15, 15, 0, 7); g.fill();
      g.save(); g.translate(x + 15, y + 15); g.scale(0.55, 0.55); A.icon(g, r.id, 0, 0); g.restore();
      g.fillStyle = INK; g.font = `700 14px ${KO}`;
      g.fillText(r.c.tier === 'small' ? `${r.c.name} ×${r.lv}` : r.c.name, x + 36, y + 20);
    });
    const sy = port ? ly + 46 + Math.ceil(rows.length / 9) * 84 + 16 : rc.y + 470;
    g.textAlign = 'center'; g.font = `700 ${port ? 21 : 16}px ${KO}`; g.fillStyle = INK;
    g.fillText(`신바람 타임 ${E.bursts}번 · 가장 많이 모신 1초 ${fmt(E.maxSec)}명`, cx, sy);
    if (E.prevBest) { g.font = `500 ${port ? 19 : 14}px ${KO}`; g.fillStyle = 'rgba(27,27,27,0.7)'; g.fillText(`지난번 가장 빠른 기록 ${U.mmss(E.prevBest)}`, cx, sy + (port ? 32 : 26)); }
    g.font = `500 ${port ? 19 : 13}px ${KO}`; g.fillStyle = 'rgba(27,27,27,0.65)';
    g.fillText(`지구에 남은 사람 ${fmt(E.earth)}명 · 다음은 더 넓은 곳`, cx, withButtons ? (port ? rc.y + rc.h - 292 : rc.y + rc.h - 90) : rc.y + rc.h - 28);
    g.textAlign = 'left';
    if (withButtons) {
      for (const b of U.endButtons(L)) {
        const hov = G.endHover === b.id;
        g.fillStyle = b.id === 'again' ? '#fff' : PT; g.beginPath(); g.roundRect(b.x, b.y, b.w, b.h, b.h / 2); g.fill();
        g.strokeStyle = INK; g.lineWidth = hov ? 2.4 : 1.6; A.rPath(g, A.rrPts(b.x, b.y, b.w, b.h, b.h / 2), true, 0.5);
        g.fillStyle = b.id === 'again' ? INK : '#fff'; g.font = `700 ${port ? 27 : 16}px ${KO}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(b.s, b.x + b.w / 2, b.y + b.h / 2 + 1); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      }
    }
    g.restore();
  };
  function drawPhoto(g, G, ph) {
    const st = G.st, picks = G.run.picks;
    g.save();
    g.fillStyle = '#fff'; g.fillRect(ph.x, ph.y, ph.w, ph.h);
    g.strokeStyle = INK; g.lineWidth = 2; A.rRect(g, ph.x, ph.y, ph.w, ph.h, 0.6);
    g.beginPath(); g.rect(ph.x + 2, ph.y + 2, ph.w - 4, ph.h - 4); g.clip();
    // 깃발 줄 · 지구 창
    g.lineWidth = 1.2;
    const fl = (x0, x1, y) => { g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + 22, x1, y); g.stroke(); for (let k = 0; k < 9; k++) { const t = (k + 0.5) / 9, bx = x0 + (x1 - x0) * t, by = y + 44 * t * (1 - t); g.beginPath(); g.moveTo(bx - 6, by); g.lineTo(bx + 6, by); g.lineTo(bx, by + 11); g.closePath(); g.fillStyle = k % 2 ? '#fff' : PT; g.fill(); g.stroke(); } };
    fl(ph.x + 10, ph.x + ph.w * 0.62, ph.y + 14);
    A.earthWindow(g, ph.x + ph.w - 60, ph.y + 62, 36);
    // 손님들 — 팔 활짝 · 두 줄
    const sp = G.photoSpr, n = 13, rows = [[ph.y + ph.h * 0.62, 6], [ph.y + ph.h * 0.88, 7]];
    let k = 0;
    for (const [y, m] of rows) for (let i = 0; i < m; i++, k++) {
      const x = ph.x + ph.w * ((i + 0.5) / m) * 0.86 + ph.w * 0.07 + (m === 6 ? ph.w * 0.03 : 0);
      g.drawImage(sp.spr[k % A.NV][4 + (k % 2)], x - sp.ax, y - sp.ay, sp.size, sp.size);
      if (picks.stroll && k % 3 === 0) { g.strokeStyle = INK; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y - sp.h * 0.98); g.lineTo(x, y - sp.h * 1.12); g.stroke(); g.fillStyle = PT; g.beginPath(); g.ellipse(x, y - sp.h * 1.14, 7, 2.2, 0, 0, 7); g.fill(); g.stroke(); }
    }
    void n;
    // 고른 것 중 눈에 띄는 것
    const robots = Math.min(4, st.robots);
    for (let i = 0; i < robots; i++) A.robot(g, ph.x + 40 + i * 44, ph.y + ph.h * 0.4, picks.chubby ? 1.15 : 0.9, { t: i, prop: !!picks.chubby });
    let nx = ph.x + ph.w * 0.5;
    if (picks.twin) { A.nozzle(g, nx - 40, ph.y + ph.h * 0.42, 0.7, { gauge: 1, jumbo: !!picks.jumbo, t: 0 }); }
    A.nozzle(g, nx, ph.y + ph.h * 0.42, 0.8, { gauge: 1, jumbo: !!picks.jumbo, t: 0 });
    if (picks.window) {
      const bx = nx + 50, by = ph.y + ph.h * 0.18;
      g.strokeStyle = INK; g.lineWidth = 1.2; g.beginPath(); g.moveTo(bx, by + 18); g.quadraticCurveTo(bx + 6, by + 40, nx + 6, ph.y + ph.h * 0.42 - 40); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(bx, by, 18, 0, 7); g.fill(); g.lineWidth = 1.8; g.stroke();
      g.fillStyle = A.PT_PALE; g.beginPath(); g.arc(bx, by, 12, 0, 7); g.fill(); g.lineWidth = 1.2; g.stroke();
    }
    // 찰칵
    g.fillStyle = INK; g.font = `700 22px ${HAND}`; g.fillText('찰칵!', ph.x + 14, ph.y + ph.h - 14);
    g.strokeStyle = PT; g.lineWidth = 2;
    for (let i = 0; i < 8; i++) { const a = i * 0.785; g.beginPath(); g.moveTo(ph.x + ph.w - 30 + Math.cos(a) * 8, ph.y + ph.h - 30 + Math.sin(a) * 8); g.lineTo(ph.x + ph.w - 30 + Math.cos(a) * 14, ph.y + ph.h - 30 + Math.sin(a) * 14); g.stroke(); }
    g.restore();
  }

  // ---------- 메뉴 ----------
  U.menuButtons = function (L, confirm) {
    const k = L.portrait ? 1.6 : 1;
    const M = L.map, cx = M.x + M.w / 2, cy = M.y + M.h / 2, bw = 260 * k, bh = 46 * k;
    const items = confirm ? [['reset', '처음부터 할게요'], ['back', '아니요']] : [['resume', '계속하기'], ['sound', EC.sound.isOn() ? '소리 · 진동 켜짐' : '소리 · 진동 꺼짐'], ['code', '이어하기 코드 복사'], ['ask', '처음부터']];
    return items.map(([id, s], i) => ({ id, s, x: cx - bw / 2, y: cy - 40 * k + i * (bh + 14 * k), w: bw, h: bh }));
  };
  U.drawMenu = function (g, G) {
    const L = G.L, M = L.map, cx = M.x + M.w / 2, cy = M.y + M.h / 2, confirm = G.menu === 'confirm';
    g.save();
    g.fillStyle = 'rgba(253,253,251,0.7)'; g.fillRect(0, 0, L.W, L.H);
    A.seed(77);
    const k = L.portrait ? 1.6 : 1;
    const n = confirm ? 2 : 4, h = (110 + n * 60) * k;
    A.paper(g, cx - 180 * k, cy - 110 * k, 360 * k, h, 12, 1.8);
    g.fillStyle = INK; g.font = `700 ${Math.round(18 * k)}px ${KO}`; g.textAlign = 'center';
    if (confirm) { g.fillText('지금까지 한 것이 지워져요.', cx, cy - 74 * k); g.fillText('처음부터 할까요?', cx, cy - 50 * k); }
    else g.fillText('잠깐 쉬는 중', cx, cy - 62 * k);
    for (const b of U.menuButtons(L, confirm)) {
      g.fillStyle = b.id === 'resume' || b.id === 'back' ? PT : '#fff'; g.beginPath(); g.roundRect(b.x, b.y, b.w, b.h, b.h / 2); g.fill();
      g.strokeStyle = INK; g.lineWidth = G.menuHover === b.id ? 2.4 : 1.6; A.rPath(g, A.rrPts(b.x, b.y, b.w, b.h, b.h / 2), true, 0.5);
      g.fillStyle = b.id === 'resume' || b.id === 'back' ? '#fff' : INK; g.font = `700 ${Math.round(16 * k)}px ${KO}`; g.textBaseline = 'middle';
      g.fillText(b.s, b.x + b.w / 2, b.y + b.h / 2 + 1); g.textBaseline = 'alphabetic';
    }
    g.textAlign = 'left';
    g.restore();
  };
  U.drawMenuButton = function (g, G) {
    const b = G.L.menu;
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect(b.x, b.y, b.w, b.h, 8); g.fill();
    g.strokeStyle = 'rgba(27,27,27,0.6)'; g.lineWidth = 1.2; g.beginPath(); g.roundRect(b.x, b.y, b.w, b.h, 8); g.stroke();
    g.fillStyle = INK; g.font = `700 ${b.h > 30 ? Math.round(b.h * 0.44) : 12}px ${KO}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('≡ 메뉴', b.x + b.w / 2, b.y + b.h / 2 + 1); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  };
  U.drawToast = function (g, G) {
    const T = G.toast, M = G.L.map;
    const a = Math.min(1, T.t * 6, (T.dur - T.t) * 4);
    g.save(); g.globalAlpha = Math.max(0, a);
    g.font = `700 15px ${KO}`; const tw = g.measureText(T.s).width + 30;
    const x = M.x + M.w / 2 - tw / 2, y = M.y + M.h - 70;
    g.fillStyle = INK; g.beginPath(); g.roundRect(x, y, tw, 34, 17); g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(T.s, x + tw / 2, y + 18);
    g.restore();
  };
})();
