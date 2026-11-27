/* earth-clean · 문구 한 곳(맛보기 · 본편) — 키 → { ko, en } · T(key, vars) · 큰 숫자 표기
 * 근거 = 팀 폴더 design-full.md 「문구 표」(한국어 · 영어를 그대로 옮김 · 일본어 칸은 아직 없음) + 맛보기에서 옮긴 문구(아래 「맛보기에서 옮긴」).
 * 맛보기(index.html) · 본편(full.html) 둘 다 읽는다. 한국어 칸은 맛보기 예전 글자 그대로 — 한국어로 열면 맛보기가 바이트까지 같다(tools/demo-same.mjs).
 * 카드 이름 · 한 줄의 한국어 원본은 numbers.js 에도 있다(맛보기 16장은 글자가 같음 · 본편 「정거장 한 바퀴」 한 줄만 이 표를 따른다).
 * 언어 = 주소 ?lang=ko|en → 없으면 브라우저 언어(ko 로 시작하면 한국어 · 그 밖은 영어).
 * 붙는 이름 = window.EC.text
 */
(function () {
  'use strict';
  const EC = window.EC = window.EC || {};

  // ---------- 문구 표 ----------
  const P = {
    // 판 · 맨 위 · 둘째 줄
    'stage.room': ['내 방', 'My Room'],
    'stage.hood': ['동네', 'Neighborhood'],
    'stage.city': ['첫 도시', 'First City'],
    'top.label': ['지구에 남은 사람', 'People on Earth'],
    // 정거장 칸 · 깃발 · 떠오르는 글
    'stn.count': ['손님 {n}명', '{n} guests'],
    'stn.rate': ['+{n}명/초', '+{n}/s'],
    'stn.next': ['다음 카드', 'Next card'],
    'float.plus': ['손님 +{n}명', '+{n} guests'],
    'float.arrive': ['도착!', "We're here!"],
    'float.metoo': ['나도!', 'Me too!'],
    'float.allgo': ['다 같이 가자~!', "Let's all go!"],
    'float.friend': ['친구도!', 'My friend too!'],
    'float.cheer': [['와~', '야호!', '우와!', '신난다~'], ['Wheee!', 'Yay!', 'Wow!', 'So fun!']],
    // 선택창 · 신바람
    'choice.small': ['하나 골라요', 'Pick one'],
    'choice.big': ['큰 카드! 하나 골라요', 'Big card! Pick one'],
    'burst.big': ['신바람!', 'Joy Rush!'],
    'burst.sub': ['{s}초 동안 흡입구가 커져요', 'The nozzle grows for {s}s'],
    'burst.on': ['신바람 중!', 'Joy Rush!'],
    'burst.end': ['신바람 끝', 'Rush over'],
    'burst.gauge': ['신바람', 'Joy'],
    'burst.again': ['한 번 더!', 'Encore!'],
    // 끝 카드 · 메뉴(맛보기 · 본편 같이 · 본편 전용 문구는 text-full.js)
    'end.title': ['손님 {n}명이 우주 정거장에 놀러 왔어요', '{n} guests came to play at the Space Station'],
    'end.time': ['내 방에서 시작해 {t}', 'From my room in {t}'],
    'end.stats': ['신바람 타임 {b}번 · 가장 많이 모신 1초 {m}명', 'Joy Rush ×{b} · Best second: {m} guests'],
    'end.btn.save': ['그림으로 저장', 'Save picture'],
    'end.btn.again': ['처음부터', 'Start over'],
    'menu.resume': ['계속하기', 'Resume'],
    'menu.sound': ['소리 · 진동', 'Sound & vibration'],
    'menu.restart': ['처음부터', 'Start over'],
    // 시간 표기(설계 표의 예 「2시간 33분」 · "2 h 33 min" 을 틀로 · 표에 따로 키가 없어 새로 둠)
    'time.hm': ['{h}시간 {m}분', '{h} h {m} min'],
    'time.ms': ['{m}분 {s}초', '{m} min {s} s'],

    // ── 맛보기에서 옮긴 문구(11/27 둘째 일) — 한국어 칸은 예전 game.js · ui.js 글자 그대로(맛보기가 바이트까지 같게) · 영어는 개발 담당이 영어 낱말 표대로 옮김(리드 확인 전)
    'unit.people': ['명', ''],                       // 큰 숫자 뒤 단위(영어는 붙이지 않음)
    'stn.title': ['우주 정거장', 'Space Station'],
    'stn.guests': ['손님', 'Guests'],
    'left.room': ['내 방에 남은 사람 {n}명', 'People in my room: {n}'],
    'left.hood': ['이 동네에 남은 사람 {n}명', 'People in the neighborhood: {n}'],
    'left.city': ['이 도시에 남은 사람 {n}명', 'People in the city: {n}'],
    'burst.secs': ['{s}초', '{s}s'],
    'picks.title': ['지금까지 고른 것', 'Picked so far'],
    'picks.empty1': ['아직 없어요 — 손님이 늘면', 'None yet — as guests arrive,'],
    'picks.empty2': ['카드 셋 중 하나를 골라요', 'you pick one of three cards'],
    'card.bigTag': ['큰 카드', 'Big card'],
    'card.bigOnce': ['큰 카드 · 한 번만', 'Big card · once only'],
    'end.title.a': ['손님 {n}명이', '{n} guests came to play'],          // 세로 화면 두 줄
    'end.title.b': ['우주 정거장에 놀러 왔어요', 'at the Space Station'],
    'end.picked': ['고른 카드', 'Cards picked'],
    'end.best': ['지난번 가장 빠른 기록 {t}', 'Best time so far: {t}'],
    'end.demoFoot': ['지구에 남은 사람 {n}명 · 다음은 더 넓은 곳', 'People on Earth: {n} · Up next, somewhere bigger'],
    'end.btn.code': ['이어하기 코드 복사', 'Copy continue code'],
    'photo.snap': ['찰칵!', 'Snap!'],
    'menu.paused': ['잠깐 쉬는 중', 'Paused'],
    'menu.soundOn': ['소리 · 진동 켜짐', 'Sound & vibration: on'],
    'menu.soundOff': ['소리 · 진동 꺼짐', 'Sound & vibration: off'],
    'menu.copy': ['이어하기 코드 복사', 'Copy continue code'],
    'menu.confirm1': ['지금까지 한 것이 지워져요.', 'This erases your progress so far.'],
    'menu.confirm2': ['처음부터 할까요?', 'Start over?'],
    'menu.yes': ['처음부터 할게요', 'Yes, start over'],
    'menu.no': ['아니요', 'No'],
    'menu.button': ['≡ 메뉴', '≡ Menu'],
    'toast.picSaved': ['그림을 저장했어요', 'Picture saved'],
    'toast.picFail': ['그림을 저장하지 못했어요', "Couldn't save the picture"],
    'toast.codeCopied': ['이어하기 코드를 복사했어요', 'Continue code copied'],
    'toast.copyFail': ['복사하지 못했어요', "Couldn't copy"],
    'hint.swipe': ['화면을 쓸어 보세요', 'Swipe across the screen'],
    'float.wow': ['와아~', 'Hooray!'],
    'phase.0': ['아침', 'Morning'],
    'phase.1': ['낮', 'Day'],
    'phase.2': ['오후', 'Afternoon'],
    'phase.3': ['저녁', 'Evening'],
    'banner.room': ['내 방 친구 {n}명 모두 도착!', '{n} friends from My Room are here!'],
    'banner.demo': ['{stage} 사람 {n}명 모두 도착!', '{n} guests from {stage} are here!'],
    'room.breadSign': ['빵', 'Bread'],
    // 정거장 방 말풍선 — 맛보기 11
    'room.lounge': ['어? 여기 좋다!', 'Oh, I like it here!'],
    'room.dining': ['피자 마저 먹자', "Let's finish the pizza"],
    'room.bunk': ['낮잠 자기 딱이야', 'Perfect for a nap'],
    'room.pingpong': ['한 판 더!', 'One more game!'],
    'room.party': ['옆집도 왔네!', 'The neighbors came too!'],
    'room.tramp': ['둥실둥실~', 'Bouncy bouncy~'],
    'room.karaoke': ['한 곡 더!', 'One more song!'],
    'room.bakery': ['갓 구운 빵이다', 'Fresh bread!'],
    'room.view': ['와, 지구 예쁘다', 'Wow, Earth is pretty'],
    'room.pool': ['물방울 수영!', 'Bubble swimming!'],
    'room.cinema': ['팝콘 나눠 먹자', "Let's share popcorn"],
    // 정거장 아무 때나 말풍선 — 맛보기 7
    'talk.0': ['창밖 경치 최고!', 'Great view out there!'],
    'talk.1': ['둥둥 떠다니니 좋다', 'Floating feels nice'],
    'talk.2': ['간식 또 나왔다!', 'More snacks!'],
    'talk.3': ['다들 반가워요~', 'Nice to see you all~'],
    'talk.4': ['무중력 재밌다', 'Zero gravity is fun'],
    'talk.5': ['여기 좋다~', 'I like it here~'],
    'talk.6': ['옆 방도 가 보자', "Let's see the next room"],
  };

  // 카드 — [이름(한), 한 줄(한), Name(EN), Line(EN)] · 설계 「문구 — 카드」 표 그대로(맛보기 16 · 본편 34장은 text-full.js)
  const CARDS = {
    wide: ['큰 흡입구', '흡입구가 한 뼘 커져요', 'Wider Nozzle', 'The nozzle grows a hand wider'],
    pull: ['흡입력', '조금 떨어진 사람도 쏙 빨려 와요', 'Stronger Pull', 'Draws in people a bit farther off'],
    robot: ['마중 로봇', '손을 떼도 알아서 마중 나가요', 'Greeter Bot', 'Goes out to greet, even hands-free'],
    friend: ['친구랑 같이', '한 명이 오면 친구도 따라와요', 'Bring a Friend', 'When one comes, a friend tags along'],
    trail: ['꼬리바람', '지나간 자리에도 바람이 남아요', 'Tailwind', 'The breeze lingers where you pass'],
    joy: ['신바람', '신바람이 더 빨리 차고 더 오래 가요', 'More Joy', 'Joy Rush fills faster, lasts longer'],
    twin: ['쌍둥이 흡입구', '흡입구가 둘이 돼요', 'Twin Nozzle', 'Now there are two nozzles'],
    jumbo: ['나팔 흡입구', '나팔처럼 큰 흡입구로 바꿔 달아요', 'Trumpet Nozzle', 'Swap in a big trumpet-shaped nozzle'],
    spin: ['혼자서도 빙글', '손을 쉬면 흡입구가 혼자 빙글빙글 돌아요', 'Auto Spin', 'Rest your hand, the nozzle spins on'],
    robot3: ['로봇 셋 더', '마중 로봇 셋이 한꺼번에 와요', 'Three More Bots', 'Three Greeter Bots arrive at once'],
    chubby: ['통통 로봇', '마중 로봇이 모두 커지고 빨라져요', 'Chubby Bots', 'Greeter Bots get bigger and faster'],
    stroll: ['산책 나온 손님', '정거장 손님이 산책 나왔다가 친구랑 같이 돌아가요', 'Guest Stroll', 'Guests stroll down, head back with friends'],
    fest: ['신바람 축제', '신바람 타임이 더 세고 길어지고 로봇도 같이 신나요', 'Big Joy', 'Joy Rush grows longer; bots join in'],
    again: ['신바람 한 번 더', '신바람이 끝나도 게이지가 반 넘게 남아요', 'Encore', 'After a Rush, the gauge stays half full'],
    fof: ['친구의 친구', '친구가 또 친구를 데려와요', 'Friends of Friends', 'Friends bring their friends, too'],
    window: ['창문 풍선', '흡입구 위에 정거장 창문이 떠서 손님들이 손을 흔들어요', 'Station Window', 'A station window floats by, guests waving'],
  };
  // 표에 줄을 더한다(본편 전용 문구 text-full.js 가 full.html 에서만 부른다 · 공개 맛보기에는 본편 문구가 안 실린다)
  function add(rows, cards) {
    Object.assign(P, rows || {});
    for (const id in cards || {}) {
      const c = cards[id];
      P['card.' + id + '.name'] = [c[0], c[2]];
      P['card.' + id + '.line'] = [c[1], c[3]];
    }
  }
  add(null, CARDS);

  // ---------- 언어 ----------
  let lang = 'en';
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'ko' || q === 'en') lang = q;
    else if (/^ko/i.test(navigator.language || '')) lang = 'ko';
  } catch (e) { /* 주소를 못 읽으면 영어 */ }
  const LI = { ko: 0, en: 1 };
  try { document.documentElement.lang = lang; } catch (e) { /* 무시 */ }

  // ---------- 큰 숫자 표기(design-full.md 「큰 숫자 표기」) ----------
  // 맨 위 숫자 · 정거장 손님 수 · 엔딩 카드 큰 줄 = 모든 언어에서 쉼표 숫자 전체
  const fmtFull = (n) => Math.round(n).toLocaleString('en-US');
  // 짧은 글(배너 · 카드 · 도전 과제) — 한: 만 · 억 큰 단위 둘까지(「1억」 「41억」 「3억 2천만」) · 영: million · billion 소수 한 자리
  function fmtShort(n, lg) {
    const L = lg || lang;
    n = Math.round(n);
    if (L === 'ko') {
      if (n < 10000) return fmtFull(n);
      if (n < 1e8) return `${fmtFull(Math.floor(n / 1e4))}만`;
      const eok = Math.floor(n / 1e8), cheon = Math.round((n - eok * 1e8) / 1e7);   // 억 아래는 천만 자리까지
      return cheon >= 10 ? `${fmtFull(eok + 1)}억` : cheon > 0 ? `${fmtFull(eok)}억 ${cheon}천만` : `${fmtFull(eok)}억`;
    }
    if (n < 1e6) return fmtFull(n);
    const one = (x) => (Math.round(x * 10) / 10).toString();
    return n < 1e9 ? `${one(n / 1e6)} million` : `${one(n / 1e9)} billion`;
  }
  // 1초에 +N — 한: 1만 밑은 숫자 · 위는 단위(「210만」) · 영: "3,298" · "2.1M"
  function fmtRate(n, lg) {
    const L = lg || lang;
    n = Math.round(n);
    if (n < 10000) return fmtFull(n);
    if (L === 'ko') return fmtShort(n, 'ko');
    const one = (x) => (Math.round(x * 10) / 10).toString();
    return n < 1e6 ? `${one(n / 1e3)}K` : n < 1e9 ? `${one(n / 1e6)}M` : `${one(n / 1e9)}B`;
  }
  // 놀이 시간 — 1시간 넘으면 「2시간 33분」 · 아니면 「11분 44초」
  function fmtTime(sec) {
    const h = Math.floor(sec / 3600), m = Math.floor((sec - h * 3600) / 60), s = Math.floor(sec - h * 3600 - m * 60);
    return h > 0 ? T('time.hm', { h, m }) : T('time.ms', { m, s });
  }
  // 판 하나 걸린 시간 — 「17:19」(언어 공통)
  const fmtClock = (sec) => { const m = Math.floor(sec / 60), s = Math.floor(sec - m * 60); return `${m}:${String(s).padStart(2, '0')}`; };

  function has(key) { return Object.prototype.hasOwnProperty.call(P, key); }
  // T(키, { 이름: 값 }) — 표에 없는 키는 키를 그대로(빠진 문구가 화면에서 바로 보이게)
  function T(key, vars) {
    const row = P[key];
    if (!row) return key;
    let s = row[LI[lang]];
    if (Array.isArray(s)) return s.slice();
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
    if (lang === 'ko') s = s.replace(/([만억])명/g, '$1 명');   // 단위 숫자 뒤 띄어쓰기(「+210만 명/초」 「손님 1억 명!」)
    return s;
  }

  EC.text = { lang, T, has, add, fmtFull, fmtShort, fmtRate, fmtTime, fmtClock, keys: () => Object.keys(P) };
})();
