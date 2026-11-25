/* earth-clean · 소리 · 진동 — 소리 파일 없이 브라우저가 그 자리에서 만든다(Web Audio)
 * 대표 11/25 「소리는 넣어. 진동도 가능한가?」
 * 붙는 이름 = window.EC.sound
 */
(function () {
  'use strict';
  const EC = window.EC;
  const S = EC.sound = {};
  const KEY = 'earth-clean-sound';
  let ac = null, master = null, on = true;
  try { on = localStorage.getItem(KEY) !== '0'; } catch (e) { /* 무시 */ }

  S.isOn = () => on;
  S.setOn = function (v) {
    on = !!v;
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* 무시 */ }
    if (master) master.gain.value = on ? 0.5 : 0;
  };

  // 브라우저는 손이 닿기 전에는 소리를 막는다 — 손이 닿을 때마다 깨운다
  function unlock() {
    try {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC(); master = ac.createGain(); master.gain.value = on ? 0.5 : 0; master.connect(ac.destination);
      }
      if (ac.state !== 'running') ac.resume();
    } catch (e) { /* 소리가 막힌 브라우저 — 놀이는 그대로 */ }
    if (hapWait && performance.now() - hapWait < 400) hapClick();
    hapWait = 0;
  }
  ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));

  function tone(f0, f1, dur, vol, type, at) {
    if (!ac || !on || ac.state !== 'running') return;
    const t = ac.currentTime + (at || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  const note = (n) => 440 * Math.pow(2, n / 12);
  const STEPS = [0, 2, 4, 7, 9, 12, 14, 16];   // 다섯 음 계단 — 쉬지 않고 모실수록 한 칸씩 올라간다
  let lastTake = 0, step = 0;

  // 한 사람이 호스를 탄다 — 「뽁」
  S.take = function () {
    if (!ac) return;
    const now = ac.currentTime;
    if (now - lastTake < 0.055) return;
    step = now - lastTake < 0.4 ? (step + 1) % STEPS.length : 0;
    lastTake = now;
    const f = note(STEPS[step] + 3);
    tone(f * 0.7, f * 1.25, 0.07, 0.15, 'sine');
  };
  // 카드 셋이 뜬다
  S.cardOpen = function (big) {
    tone(note(7), note(7), 0.16, 0.2, 'triangle');
    tone(note(12), note(12), 0.22, 0.2, 'triangle', 0.11);
    if (big) tone(note(19), note(19), 0.32, 0.2, 'triangle', 0.22);
    S.buzz(big ? [20, 50, 20] : 20);
  };
  // 카드를 골랐다
  S.cardPick = function () {
    [0, 4, 7, 12].forEach((n, i) => tone(note(n + 3), note(n + 3), 0.1, 0.17, 'triangle', i * 0.05));
    S.buzz(15);
  };
  // 신바람 타임
  S.burst = function () {
    tone(260, 1040, 0.35, 0.09, 'sawtooth');
    [7, 12, 16, 19].forEach((n, i) => tone(note(n), note(n), 0.14, 0.16, 'triangle', 0.3 + i * 0.07));
    S.buzz([30, 40, 30]);
  };
  // 판 하나 끝 — 모두 도착
  S.clear = function () {
    [0, 4, 7, 12, 16].forEach((n, i) => tone(note(n), note(n), i === 4 ? 0.5 : 0.16, 0.2, 'triangle', i * 0.12));
    S.buzz(40);
  };
  // 맛보기 끝 — 다 같이 찰칵
  S.finale = function () {
    [0, 4, 7, 12, 7, 12, 16, 24].forEach((n, i) => tone(note(n), note(n), i === 7 ? 0.7 : 0.15, 0.2, 'triangle', i * 0.11));
    tone(2400, 700, 0.03, 0.2, 'square', 1.5); tone(1800, 500, 0.04, 0.2, 'square', 1.56);
    S.buzz([40, 60, 40]);
  };

  // 진동 — 안드로이드는 표준 진동. 아이폰 사파리에는 진동 기능이 없어서, 스위치 꼴 체크박스가 눌릴 때 나는 「톡」을 빌린다
  // (손가락을 떼는 순간에만 통한다 · 안 통하면 아무 일도 없다).
  let hap = null, hapWait = 0;
  function hapClick() {
    try {
      if (!hap) {
        hap = document.createElement('label');
        hap.setAttribute('aria-hidden', 'true');
        hap.style.cssText = 'position:fixed;left:-99px;top:0;opacity:0;pointer-events:none';
        const i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', '');
        hap.appendChild(i); document.body.appendChild(hap);
      }
      hap.click();
    } catch (e) { /* 무시 */ }
  }
  S.buzz = function (pattern) {
    if (!on) return;
    try { if (navigator.vibrate) { navigator.vibrate(pattern); return; } } catch (e) { /* 무시 */ }
    hapWait = performance.now();
  };
})();
