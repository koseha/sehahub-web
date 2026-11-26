/* earth-clean 숫자 규칙 — 2026-11-25 게임 설계 담당 (근거 = 팀 폴더 design.md)
 *
 * 화면과 뗀 순수 함수. 같은 파일을
 *   - 브라우저: <script src="js/numbers.js"></script>   (ES 모듈 문법 없음 — file:// 로 열어도 된다)
 *   - node:    vm.runInThisContext(파일 내용) 또는 require
 * 로 읽는다. 붙는 이름은 globalThis.EarthCleanNumbers 하나.
 *
 * 단위 — 길이는 1280×720 무대 기준 화소(px) · 시간은 초 · 사람은 명.
 * 두 부분이다.
 *   ① 규칙 — 판 · 카드 · 문턱 · 선택 때 · 카드 뽑기 · 고르기 · 신바람 · 저장. 게임이 그대로 쓴다.
 *   ② 어림(model 로 시작하는 이름) — 「손이 이렇게 움직이면 1초에 몇 명」. 계산기(web/sim/run.mjs)만 쓴다.
 *      실제 게임은 화면에서 사람 그림 하나하나를 직접 잡으므로 이 어림을 쓰지 않는다.
 * 함수는 받은 상태를 고치지 않고 새 상태를 돌려준다.
 */
(function (root) {
  'use strict';

  var assign = Object.assign;

  // ───────────── ① 규칙 ─────────────

  var EARTH_START = 8200000000;      // 맨 위 큰 숫자의 시작값
  var MAP_AREA = 1035 * 720;         // 지도 넓이(무대 1280 에서 왼쪽 세로 칸 245px 를 뺀 것)

  // 판 셋. perFigure = 그림 속 사람 한 명이 나타내는 사람 수 · screenCap = 화면에 동시에 그리는 사람 그림 수
  // small = 이 판에서 작은 선택 문턱(이 판에서 모신 사람 수) · bigAt = 판 안에서 큰 선택이 뜨는 비율
  // 판이 끝나면(마지막 판 빼고) 큰 선택이 하나 뜬다.
  var STAGES = [
    { id: 'room', name: '내 방', people: 8, perFigure: 1, screenCap: 8, figurePx: 44,
      small: [], bigAt: [] },
    { id: 'hood', name: '동네', people: 6000, perFigure: 1, screenCap: 400, figurePx: 16,
      small: [900, 1900, 3000, 4100, 5200], bigAt: [] },
    { id: 'city', name: '첫 도시', people: 3000000, perFigure: 10, screenCap: 1500, figurePx: 13,
      small: [70000, 140000, 220000, 310000, 400000, 510000, 630000, 750000,
              1000000, 1200000, 1400000, 1600000, 1800000, 2100000, 2400000, 2600000],
      bigAt: [0.3] },
  ];
  // 문턱은 「보통 손」 계산기(web/sim/run.mjs 가정)로 선택 사이가 동네 약 62초 · 도시 약 68초가 되도록 맞춘 뒤 둥근 수로 고쳤다
  // (동네는 마지막 문턱을 조금 늦춰 「동네 끝 → 도시 첫 큰 선택」 사이가 2분을 덜 넘게 했다).
  // 도시 큰 선택은 사람 수 30%(90만) — 빠르기가 갈수록 붙어 이때가 도시 21분의 시간상 가운데다(절반 150만은 23분쯤이라 너무 늦다).
  // 이 큰 선택이 작은 선택 한 자리를 차지한다(750,000 과 1,000,000 사이).

  var BASE = {
    radius: 30,          // 흡입구 반경 — 이 원 안에 들어온 사람은 빨려 든다
    ring: 1.56,          // 끌림 고리 반경 = radius × (1 + ring × pull) — 고리 안 사람은 신나서 흡입구 쪽으로 걸어온다(시안 D 비율 50 → 128)
    pull: 1,
    walkIn: 60,          // 고리 안 사람이 흡입구로 걸어오는 빠르기(px/초 · 시안 D 54)
    maxSpeed: 1600,      // 흡입구가 손을 따라가는 최고 빠르기(px/초) — 이보다 빠르면 호스를 끌며 살짝 늦게 따라온다(550 → 1600 · 대표 11/25 휴대폰으로 해 보고 「흡입구 움직이는 동작이 애매해」 — 550 은 휴대폰 화면에서 1초에 손가락 한 뼘도 못 따라갔다)
    choiceMinGap: 30,    // 선택과 선택 사이는 놀이 시간으로 30초 넘게 띄운다(문턱을 넘어도 그때까지 기다림)
    choiceMaxGap: 100,   // 100초가 지나도록 문턱에 못 닿으면 작은 선택을 그냥 띄운다(느린 손 돕기)
    choiceHoldTail: 0.10, // 판에 남은 사람이 10% 아래면 작은 선택을 미뤘다가 다음 판에서 준다(판 끝 큰 선택 · 끝 화면과 붙지 않게)
    robotRadius: 0.55,   // 마중 로봇 반경 = 흡입구 반경 × 이것
    robotSpeed: 90,      // px/초
    walkerShare: 0.45,   // 산책 나온 손님 한 명 = 로봇 0.45 대 몫
    walkerMax: 6,
    gaugeFill: 25,       // 신바람이 가득 차는 데 드는 「손으로 쓰는 시간」(초)
    burstSec: 6,         // 신바람 타임 길이
    burstMul: 1.6,       // 신바람 타임 동안 흡입구 · 고리 반경 배수
    autoSpeed: 320,      // 「혼자서도 빙글」 — 손을 쉬면 흡입구가 혼자 도는 빠르기
    autoIdleSec: 1.5,    // 손을 이만큼 쉬면 혼자 돌기 시작
    lastCall: 0.25,      // 판에 남은 사람 그림이 화면 몫(screenCap)의 1/4 아래로 줄면 남은 사람들이 「나도!」 하고 손을 흔들며
    lastCallRing: 2,     //   더 멀리서도 걸어온다(끌림 고리 × 2) — 판 끝 「남은 사람 찾기」가 길게 늘어지지 않게
    lastWaveN: 20,       // 사람 그림이 이 수 아래로 남으면 화면 가장자리에 그 사람 쪽 화살표가 뜬다
    offerBoost: 0.5,     // 카드 뽑기 — 한동안 안 나온 카드일수록 잘 나온다(무게 = 1 + 0.5 × 안 나온 횟수, 최대 4)
    offerBoostMax: 4,
  };

  // 카드. small = 작은 선택(겹쳐 고름 · max 까지) · big = 큰 선택(한 번씩)
  // fx 는 한 번 고를 때마다 한 번 더해진다(Mul = 곱 · Add = 더함 · 그 밖 = 켜짐)
  var CARDS = [
    { id: 'wide',   tier: 'small', max: 5, name: '큰 흡입구',     line: '흡입구가 한 뼘 커져요',              fx: { radiusMul: 1.1 } },
    { id: 'pull',   tier: 'small', max: 5, name: '흡입력',        line: '조금 떨어진 사람도 쏙 빨려 와요',     fx: { pullAdd: 0.25 } },
    { id: 'robot',  tier: 'small', max: 5, name: '마중 로봇',     line: '손을 떼도 알아서 마중 나가요',        fx: { robotsAdd: 1 } },
    { id: 'friend', tier: 'small', max: 5, name: '친구랑 같이',   line: '한 명이 오면 친구도 따라와요',        fx: { friendsAdd: 0.12 } },
    { id: 'trail',  tier: 'small', max: 5, name: '꼬리바람',      line: '지나간 자리에도 바람이 남아요',       fx: { trailAdd: 0.12 } },
    { id: 'joy',    tier: 'small', max: 5, name: '신바람',        line: '신바람이 더 빨리 차고 더 오래 가요',  fx: { gaugeFillMul: 0.8, burstSecAdd: 2 }, needs: { gauge: true } },

    { id: 'twin',   tier: 'big', name: '쌍둥이 흡입구',   line: '흡입구가 둘이 돼요',                          fx: { twinMul: 1.4 } },
    { id: 'jumbo',  tier: 'big', name: '나팔 흡입구',     line: '나팔처럼 큰 흡입구로 바꿔 달아요',            fx: { radiusMul: 1.25 } },
    { id: 'spin',   tier: 'big', name: '혼자서도 빙글',   line: '손을 쉬면 흡입구가 혼자 빙글빙글 돌아요',     fx: { autoSpin: 1 } },
    { id: 'robot3', tier: 'big', name: '로봇 셋 더',      line: '마중 로봇 셋이 한꺼번에 와요',                fx: { robotsAdd: 3 } },
    { id: 'chubby', tier: 'big', name: '통통 로봇',       line: '마중 로봇이 모두 커지고 빨라져요',            fx: { robotSizeMul: 1.5, robotSpeedMul: 1.3 }, needs: { robots: 2 } },
    { id: 'stroll', tier: 'big', name: '산책 나온 손님',  line: '정거장 손님이 산책 나왔다가 친구랑 같이 돌아가요', fx: { walkers: 1 }, needs: { guests: 1000 } },
    { id: 'fest',   tier: 'big', name: '신바람 축제',     line: '신바람 타임이 더 세고 길어지고 로봇도 같이 신나요', fx: { burstMulSet: 2.4, burstSecAdd: 2, burstAll: 1 }, needs: { gauge: true } },
    { id: 'again',  tier: 'big', name: '신바람 한 번 더', line: '신바람이 끝나도 게이지가 반 넘게 남아요',     fx: { gaugeAfter: 0.6 }, needs: { gauge: true } },
    { id: 'fof',    tier: 'big', name: '친구의 친구',     line: '친구가 또 친구를 데려와요',                   fx: { friendsMul: 1.25 } },
    { id: 'window', tier: 'big', name: '창문 풍선',       line: '흡입구 위에 정거장 창문이 떠서 손님들이 손을 흔들어요', fx: { pullAdd: 0.6 } },
  ];
  var FIRST_SMALL = ['wide', 'pull', 'robot'];   // 첫 작은 선택은 늘 이 셋(배우는 판 · 시안 D 의 카드 셋과 같다)

  function cardById(id) {
    for (var i = 0; i < CARDS.length; i++) if (CARDS[i].id === id) return CARDS[i];
    return null;
  }

  function newRun(seed) {
    return {
      v: 1, seed: seed >>> 0, stage: 0, left: STAGES[0].people, guests: 0, earth: EARTH_START,
      picks: {}, smallCount: 0, bigCount: 0, since: {},
      smallIdx: 0, bigIdx: 0, smallDue: 0, bigDue: 0, lastChoiceAt: 0,
      gaugeOn: false, gauge: 0, burst: 0, bursts: 0, playSec: 0,
    };
  }

  // 고른 카드 → 지금 능력치
  function stats(picks) {
    var s = {
      radius: BASE.radius, pull: BASE.pull, twin: 1, trail: 1, robots: 0, robotSize: 1, robotSpeed: 1,
      walkers: false, friends: 1, gaugeFill: BASE.gaugeFill, burstSec: BASE.burstSec, burstMul: BASE.burstMul,
      burstAll: false, gaugeAfter: 0, autoSpin: false,
    };
    var friendsAdd = 0, friendsMul = 1, trailAdd = 0;
    for (var i = 0; i < CARDS.length; i++) {
      var c = CARDS[i], lv = picks[c.id] || 0, fx = c.fx;
      for (var k = 0; k < lv; k++) {
        if (fx.radiusMul) s.radius *= fx.radiusMul;
        if (fx.pullAdd) s.pull += fx.pullAdd;
        if (fx.robotsAdd) s.robots += fx.robotsAdd;
        if (fx.friendsAdd) friendsAdd += fx.friendsAdd;
        if (fx.friendsMul) friendsMul *= fx.friendsMul;
        if (fx.trailAdd) trailAdd += fx.trailAdd;
        if (fx.gaugeFillMul) s.gaugeFill *= fx.gaugeFillMul;
        if (fx.burstSecAdd) s.burstSec += fx.burstSecAdd;
        if (fx.twinMul) s.twin *= fx.twinMul;
        if (fx.autoSpin) s.autoSpin = true;
        if (fx.robotSizeMul) s.robotSize *= fx.robotSizeMul;
        if (fx.robotSpeedMul) s.robotSpeed *= fx.robotSpeedMul;
        if (fx.walkers) s.walkers = true;
        if (fx.burstMulSet) s.burstMul = fx.burstMulSet;
        if (fx.burstAll) s.burstAll = true;
        if (fx.gaugeAfter) s.gaugeAfter = fx.gaugeAfter;
      }
    }
    s.friends = (1 + friendsAdd) * friendsMul;
    s.trail = 1 + trailAdd;
    return s;
  }

  // 끌림 고리 반경 — 이 안의 사람은 흡입구 쪽으로 걸어오고, radius 안에 들면 빨려 든다
  function ringRadius(st) { return st.radius * (1 + BASE.ring * st.pull); }
  // 판 끝 무렵인가(남은 사람이 손을 흔들며 더 멀리서도 온다)
  function lastCall(st, stage, left) {
    return left > 0 && left / perFigure(st, stage) < BASE.lastCall * STAGES[stage].screenCap;
  }
  function walkerCount(guests) {
    return Math.min(BASE.walkerMax, 1 + Math.floor(Math.log10(Math.max(1, guests))));
  }
  // 그림 속 사람 한 명이 나타내는 사람 수(친구랑 같이 포함) · 화면에 있는 사람 그림 수
  function perFigure(st, stage) { return STAGES[stage].perFigure * st.friends; }
  function figuresOnScreen(st, stage, left) {
    if (left <= 0) return 0;
    return Math.min(STAGES[stage].screenCap, Math.max(1, left / perFigure(st, stage)));
  }

  // 작은 선택 문턱을 정거장 손님 수로(문서 · 화면 표시용)
  function smallThresholdsAsGuests() {
    var out = [], before = 0;
    for (var s = 0; s < STAGES.length; s++) {
      for (var i = 0; i < STAGES[s].small.length; i++) out.push({ stage: STAGES[s].id, guests: before + STAGES[s].small[i] });
      before += STAGES[s].people;
    }
    return out;
  }

  function eligible(state, c) {
    var lv = state.picks[c.id] || 0;
    if (c.tier === 'small' && lv >= c.max) return false;
    if (c.tier === 'big' && lv > 0) return false;
    var nd = c.needs;
    if (!nd) return true;
    if (nd.robots && stats(state.picks).robots < nd.robots) return false;
    if (nd.gauge && !(state.bursts > 0)) return false;      // 신바람 타임을 한 번은 본 뒤부터
    if (nd.guests && state.guests < nd.guests) return false;
    return true;
  }

  // 카드 셋 뽑기. rand = 0~1 을 돌려주는 함수. 돌려줌 = { ids, state }(state.since 를 고친 새 상태)
  function offer(state, tier, rand) {
    var ids;
    if (tier === 'small' && state.smallCount === 0) {
      ids = FIRST_SMALL.slice();
    } else {
      var pool = CARDS.filter(function (c) { return c.tier === tier && eligible(state, c); });
      var w = pool.map(function (c) {
        var n = state.since[c.id] === undefined ? BASE.offerBoostMax : Math.min(BASE.offerBoostMax, state.since[c.id]);
        return 1 + BASE.offerBoost * n;
      });
      ids = [];
      while (ids.length < 3 && pool.length) {
        var tot = 0, k;
        for (k = 0; k < w.length; k++) tot += w[k];
        var r = rand() * tot;
        for (k = 0; k < w.length - 1 && r >= w[k]; k++) r -= w[k];
        ids.push(pool[k].id);
        pool.splice(k, 1); w.splice(k, 1);
      }
    }
    var since = assign({}, state.since);
    for (var i = 0; i < CARDS.length; i++) {
      var c = CARDS[i];
      if (c.tier !== tier) continue;
      since[c.id] = ids.indexOf(c.id) >= 0 ? 0 : (since[c.id] === undefined ? BASE.offerBoostMax : since[c.id] + 1);
    }
    return { ids: ids, state: assign({}, state, { since: since }) };
  }

  // 지금 선택창을 띄울 때인가 — 'big' · 'small' · null
  // 판 끝 큰 선택은 여기를 거치지 않고 바로 띄운다(줌아웃과 같이 · openChoice 를 바로 부름)
  function nextChoice(state) {
    var since = state.playSec - state.lastChoiceAt;
    if (since < BASE.choiceMinGap) return null;
    if (state.bigDue > 0) return 'big';
    if (state.left < BASE.choiceHoldTail * STAGES[state.stage].people) return null;
    if (state.smallDue > 0) return 'small';
    if (state.stage > 0 && since >= BASE.choiceMaxGap) return 'small';
    return null;
  }
  // 다음 카드까지 얼마나 찼나(0~1 · 화면 표시용 · 규칙은 위 nextChoice 그대로) — null 이면 표시하지 않는다(내 방 · 판 끝 무렵 미룸)
  // 문턱을 넘어도 「카드 사이 최소 30초」가 안 지났으면 카드가 안 뜬다 → 막대도 그 30초에 맞춰 찬다(꽉 차면 곧 뜬다 · 대표 화면 기록 11/26 「꽉 찬 채 오래 멈춤」)
  function choiceProgress(state) {
    var S = STAGES[state.stage];
    if (!S.small.length) return null;
    if (state.left < BASE.choiceHoldTail * S.people) return null;
    var since = state.playSec - state.lastChoiceAt;
    var p = 0;
    if (state.smallDue > 0 || state.bigDue > 0) p = 1;
    else if (state.smallIdx < S.small.length) {
      var done = S.people - state.left, a = state.smallIdx > 0 ? S.small[state.smallIdx - 1] : 0;
      p = (done - a) / (S.small[state.smallIdx] - a);
    }
    if (state.stage > 0) p = Math.max(p, since / BASE.choiceMaxGap);
    p = Math.min(p, since / BASE.choiceMinGap);
    return Math.max(0, Math.min(1, p));
  }
  // 선택창을 연다 — 카드 셋을 뽑고, 기다리던 몫을 하나 줄이고, 연 때를 적는다
  function openChoice(state, tier, rand) {
    var o = offer(state, tier, rand);
    var s = assign({}, o.state, { lastChoiceAt: state.playSec });
    if (tier === 'small' && s.smallDue > 0) s.smallDue--;
    if (tier === 'big' && s.bigDue > 0) s.bigDue--;
    return { ids: o.ids, state: s };
  }

  function pick(state, id) {
    var c = cardById(id);
    if (!c) return state;
    var picks = assign({}, state.picks);
    picks[id] = (picks[id] || 0) + 1;
    return assign({}, state, {
      picks: picks,
      smallCount: state.smallCount + (c.tier === 'small' ? 1 : 0),
      bigCount: state.bigCount + (c.tier === 'big' ? 1 : 0),
    });
  }

  // 사람을 모셨다 → 숫자를 고치고, 넘은 문턱을 기다리는 몫(smallDue · bigDue)에 더하고, 생긴 일을 돌려준다
  function welcome(state, people) {
    var S = STAGES[state.stage];
    var take = Math.min(people, state.left);
    var left = state.left - take;
    if (left < 0.5) { take += left; left = 0; }
    var s = assign({}, state, { left: left, guests: state.guests + take, earth: state.earth - take });
    var ev = [];
    var done = S.people - left;
    while (s.smallIdx < S.small.length && done >= S.small[s.smallIdx]) { s.smallDue++; s.smallIdx++; ev.push({ type: 'small' }); }
    while (s.bigIdx < S.bigAt.length && done >= S.bigAt[s.bigIdx] * S.people) { s.bigDue++; s.bigIdx++; ev.push({ type: 'big' }); }
    if (left === 0) ev.push(state.stage < STAGES.length - 1 ? { type: 'clear' } : { type: 'end' });
    return { state: s, events: ev };
  }

  // 판이 끝나면 다음 판으로. 신바람은 동네부터 켜진다. 기다리던 작은 선택은 다음 판으로 넘어간다.
  function nextStage(state) {
    var n = state.stage + 1;
    if (n >= STAGES.length) return state;
    return assign({}, state, { stage: n, left: STAGES[n].people, smallIdx: 0, bigIdx: 0, gaugeOn: true, burst: 0 });
  }

  // 놀이 시간이 dt 만큼 흐름(멈춘 동안은 부르지 않는다) — 신바람은 손으로 쓰는 동안 차고, 가득 차면 저절로 신바람 타임
  function tick(state, st, dt, handOn) {
    var s = assign({}, state, { playSec: state.playSec + dt }), ev = [];
    if (!s.gaugeOn) return { state: s, events: ev };
    if (s.burst > 0) {
      s.burst = Math.max(0, s.burst - dt);
      if (s.burst === 0) { s.gauge = st.gaugeAfter; ev.push({ type: 'burstEnd' }); }
    } else if (handOn) {
      s.gauge += dt / st.gaugeFill;
      if (s.gauge >= 1) { s.gauge = 0; s.burst = st.burstSec; s.bursts++; ev.push({ type: 'burstStart' }); }
    }
    return { state: s, events: ev };
  }

  // 저장 — 웹 맛보기와 스팀판이 같은 꼴을 쓴다(이어하기 코드 = 이것을 JSON → base64)
  var SAVE_KEYS = ['v', 'seed', 'stage', 'left', 'guests', 'earth', 'picks', 'smallCount', 'bigCount', 'since',
    'smallIdx', 'bigIdx', 'smallDue', 'bigDue', 'lastChoiceAt', 'gaugeOn', 'gauge', 'bursts', 'playSec'];
  function toSave(state) {
    var o = {};
    for (var i = 0; i < SAVE_KEYS.length; i++) o[SAVE_KEYS[i]] = state[SAVE_KEYS[i]];
    o.left = Math.round(o.left); o.guests = Math.round(o.guests); o.earth = EARTH_START - o.guests;
    return o;
  }
  function fromSave(o) {
    if (!o || o.v !== 1 || typeof o.stage !== 'number' || o.stage < 0 || o.stage >= STAGES.length) return null;
    return assign(newRun(o.seed || 0), o, { burst: 0 });
  }

  // 0~1 난수(같은 seed 면 같은 줄)
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ───────────── ② 어림(계산기 전용) ─────────────
  // 손 hand = { v: 쓰는 빠르기 px/초, e: 덮는 효율(겹쳐 지나가는 몫을 뺀 것), tReact: 사람이 드문드문할 때 한 명 노리는 반응 시간 }
  // 사람이 빽빽하면 「지나간 폭 × 빠르기 × 밀도」, 드문드문하면 「가까운 사람까지 가는 시간」 — 둘 중 큰 쪽.
  // 지나간 폭 = 흡입구 지름 + 고리에서 걸어 들어오는 몫. 고리 위를 빨리 지나갈수록 걸어 들어올 틈이 줄어든다(WALK_K = 어림 상수).
  var WALK_K = 2.5;
  function modelCatchRadius(r, ring, v) {
    return r + (ring - r) * Math.min(1, WALK_K * BASE.walkIn / v);
  }

  function modelRate(st, ctx) {
    var stage = ctx.stage, per = perFigure(st, stage);
    var n = figuresOnScreen(st, stage, ctx.left);
    if (n <= 0) return { n: 0, per: per, fig: 0, people: 0, handFig: 0, botFig: 0 };
    var rho = n / MAP_AREA;
    var dnn = 0.5 * Math.sqrt(MAP_AREA / n) * (n <= BASE.lastWaveN ? 0.6 : 1);
    var bm = ctx.burst ? st.burstMul : 1;
    var r = st.radius * bm, ring = ringRadius(st) * bm * (lastCall(st, stage, ctx.left) ? BASE.lastCallRing : 1);
    var handFig = 0;
    if (ctx.handOn) {
      var v = Math.min(ctx.hand.v, BASE.maxSpeed);
      var R = modelCatchRadius(r, ring, v);
      var area = rho * 2 * R * v * ctx.hand.e * st.twin * st.trail;
      var aim = 1 / (Math.max(0, dnn - R) / v + ctx.hand.tReact);
      handFig = Math.max(area, aim);
    } else if (ctx.autoOn && st.autoSpin) {
      handFig = rho * 2 * modelCatchRadius(r, ring, BASE.autoSpeed) * BASE.autoSpeed * ctx.autoEff * st.twin * st.trail;
    }
    var bots = st.robots + (st.walkers ? walkerCount(ctx.guests) * BASE.walkerShare : 0);
    var botFig = 0;
    if (bots > 0) {
      var rbm = ctx.burst && st.burstAll ? BASE.burstMul : 1;
      var rR = st.radius * BASE.robotRadius * st.robotSize * rbm;
      var rv = BASE.robotSpeed * st.robotSpeed;
      var bArea = bots * rho * 2 * rR * rv * ctx.botEff;
      var bAim = bots / (Math.max(0, dnn - rR) / rv + ctx.botReact);
      botFig = Math.max(bArea, bAim);
    }
    var fig = handFig + botFig;
    return { n: n, per: per, fig: fig, people: fig * per, handFig: handFig, botFig: botFig };
  }

  // 사람이 화면에 꽉 찼을 때 평균 1초에 모시는 사람 수(쉬는 몫 · 신바람 몫을 평균 낸 것) — 카드 고르기 어림과 문서용
  function modelAverage(st, stage, hand, opt) {
    var base = { stage: stage, left: STAGES[stage].people, guests: opt.guests, hand: hand,
      autoEff: opt.autoEff, botEff: opt.botEff, botReact: opt.botReact };
    var on = modelRate(st, assign({}, base, { handOn: true, burst: false }));
    var onB = modelRate(st, assign({}, base, { handOn: true, burst: true }));
    var off = modelRate(st, assign({}, base, { handOn: false, autoOn: true, burst: false }));
    var bShare = stage >= 1 ? st.burstSec / (st.gaugeFill * (1 - st.gaugeAfter) + st.burstSec) : 0;
    var active = (1 - bShare) * on.people + bShare * onB.people;
    return (1 - opt.rest) * active + opt.rest * off.people;
  }

  var N = {
    EARTH_START: EARTH_START, MAP_AREA: MAP_AREA, STAGES: STAGES, BASE: BASE, CARDS: CARDS, FIRST_SMALL: FIRST_SMALL,
    cardById: cardById, newRun: newRun, stats: stats, ringRadius: ringRadius, lastCall: lastCall, walkerCount: walkerCount,
    perFigure: perFigure, figuresOnScreen: figuresOnScreen, smallThresholdsAsGuests: smallThresholdsAsGuests,
    eligible: eligible, offer: offer, nextChoice: nextChoice, choiceProgress: choiceProgress, openChoice: openChoice, pick: pick,
    welcome: welcome, nextStage: nextStage, tick: tick, toSave: toSave, fromSave: fromSave, rng: rng,
    modelRate: modelRate, modelAverage: modelAverage, modelCatchRadius: modelCatchRadius,
  };
  root.EarthCleanNumbers = N;
  if (typeof module === 'object' && module && module.exports) module.exports = N;
})(typeof globalThis !== 'undefined' ? globalThis : this);
