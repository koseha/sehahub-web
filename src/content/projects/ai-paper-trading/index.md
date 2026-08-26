---
title: "AI 페이퍼 트레이딩"
summary: "같은 데이터와 같은 지시를 받은 AI 셋이 각자 가상 자금을 운용하는 실험 기록. 국내·미국 두 트랙과 마찰까지 붙인 단타 관전봇."
date: "2026-07-27"
period: "2026.07 ~ 진행 중"
team: "개인 프로젝트 (1인)"
badges:
- WEB
- DEMO
draft: false
tags:
- Python
- GitHub Actions
- Cloudflare Pages
- Cloudflare Workers
demos:
- url: "https://ai-paper-trading.sehahub.info"
  label: "국내 트랙 데모"
- url: "https://ai-paper-trading-us.sehahub.info"
  label: "미국 트랙 데모"
- url: "https://danta-bot.sehahub.info"
  label: "단타봇 데모"
images:
- src: ./01_leaderboard.png
  caption: 국내 트랙 — 계좌별 누적 성적과 장중 실시간 표시
- src: ./02_rounds.png
  caption: 회차 기록 — AI가 남긴 판단 근거
- src: ./03_us_leaderboard.png
  caption: 미국 트랙 — 대형주 8종목과 벤치마크 계좌
- src: ./04_danta.png
  caption: 단타 관전봇 — 봇 넷의 당일 성적
---

AI에게 산업 사이클 지표와 주가를 주고 가상 자금을 운용시키면 어떻게 되는지 지켜보는 실험입니다. **가상 계좌이고 실제 매매는 없습니다.** 어떤 종목도 권하지 않습니다.

계좌 셋에게 주는 데이터와 지시는 완전히 같습니다. 그래야 계좌 사이의 차이를 성격 차이가 아니라 판단 차이로 읽을 수 있습니다. 각 계좌는 첫 회차에 자기 운용 원칙을 스스로 정하고 이후 회차에서 그 원칙을 지키거나 바꿉니다. 벤치마크 계좌는 첫 회차에 균등 매수한 뒤 아무것도 하지 않습니다. 이게 없으면 수익률 숫자를 해석할 수 없습니다. 여기에 입력 제약 없이 판단하는 계좌 하나를 별도 트랙으로 함께 굴립니다. 이 계좌는 뉴스도 공시도 다른 계좌의 판단도 볼 수 있어 AI 셋과 조건이 다르고 그래서 같은 표에 놓지 않습니다.

## 두 트랙

국내 트랙은 산업 사이클 지표와 주가를 봅니다. 미국 트랙은 별도 저장소의 수집기가 공시·실적·옵션·공매도·심리 등 무료로 닿는 소스를 모아 판정 규칙 없이 통째로 넘깁니다. 규칙을 미리 두지 않은 이유는 축이 늘어날수록 우연히 맞아떨어지는 조건이 반드시 나오기 때문입니다.

두 트랙은 통화도 대상도 시작 시점도 다르고 AI가 보는 것도 다릅니다. 성적을 나란히 놓고 비교할 수 없습니다.

## 단타 관전봇

같은 페이지에 두지만 다른 봇입니다. 1분봉을 보고 장중에 사고팔며 장이 끝나기 전에 전량 청산합니다. 매매마다 수수료와 매도 거래세를 정직하게 붙입니다. 왕복 마찰이 0.23% 정도라 하루 다섯 번 매매하면 그것만으로 하루 1%가 넘게 깎입니다. 마찰을 0으로 두고 돌리면 거의 무조건 벌었다고 나와서 볼 가치가 없습니다.

봇은 종목 선정 기준과 매매 규칙을 한 묶음으로 가집니다. 유동성형·변동성형·갭형 셋을 기계적으로 돌리고 여기에 AI가 전날 저녁 뉴스까지 보고 직접 고르는 봇을 하나 더했습니다. 이 봇은 매매 규칙이 유동성형과 완전히 같습니다. 그래서 성적 차이가 나면 그건 종목 선정 한 축에서만 나온 차이입니다.

국내와 미국을 같은 규칙으로 돌립니다. 국내는 팔 때 거래세가 붙고 미국은 없습니다. 같은 전략이 양쪽에서 어떻게 갈리는지가 그대로 대조가 됩니다. 8주가 한 시즌이고 초기 자금의 절반을 잃으면 그 봇의 시즌은 거기서 끝납니다.

## 만들면서 신경 쓴 것

**판단 세션을 오염시키지 않기.** 판단하는 쪽이 닿는 경로를 지시문과 입력 파일 둘로 제한했습니다. 다른 계좌가 무엇을 샀는지, 자기 원칙의 변화가 관측 대상이라는 사실도 알리지 않습니다. 알면 일관성을 인위적으로 지키기 때문입니다.

**공급자가 늘어도 소비자를 고치지 않기.** 관측 대상 업종은 별도 저장소에서 관리하는데 거기에 업종이 추가돼도 이쪽 코드는 고치지 않는 것을 목표로 삼았습니다. 종목 이름까지 데이터에서 가져오게 만든 뒤에야 달성했습니다. 화면에 이름 맵 한 줄을 남겨둔 탓에 한 번 미달로 판정했습니다.

**검사기를 믿지 않기.** 화면 산출물을 검사하는 게이트를 열 종 만들고 일부러 고장 낸 코드를 넣어 그 게이트가 실제로 잡는지 확인했습니다. 매수·매도에 방향색을 쓰지 못하게 막는 검사가 파스텔 색을 통째로 놓치고 있던 것을 이 방식으로 찾았습니다. 검사기를 만들었다는 것과 그게 잡는다는 것은 다릅니다.

**공급이 끊겨도 화면이 완결되게 하기.** 회차 종가로 서버에서 완성된 HTML을 먼저 만들고 장중 시세는 같은 서버의 JSON을 30초마다 받아 그 위에 덧그립니다. 시세 공급원이 집에 둔 상주 머신이라 언제든 끊길 수 있습니다. 그래서 공급이 죽어도 화면은 회차 기준으로 멀쩡하고 기준 시각을 함께 띄워 멈춘 것이 보이게 했습니다.

## 구조

<div class="not-prose flow-box">
  <div class="flex flex-col gap-6">
    <div>
      <div class="flow-label">기록층 · 회차마다</div>
      <div class="flow-row">
        <span class="flow-node">회차 기록 JSON</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node">site.py</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node">GitHub Actions</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node">Cloudflare Pages</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node flow-node-end">완성된 HTML 한 장</span>
      </div>
    </div>
    <div>
      <div class="flow-label">표시층 · 장중 30초</div>
      <div class="flow-row">
        <span class="flow-node">시세 API</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node">맥미니 폴러</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node">Cloudflare KV</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node">Worker /live.json</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node flow-node-end">브라우저가 숫자만 덧그림</span>
      </div>
    </div>
    <div class="flow-note">표시층이 죽어도 기록층이 그린 화면은 그대로 남습니다. 기준 시각만 낡습니다.</div>
  </div>
</div>

의존성 없이 파이썬 표준 라이브러리만으로 HTML 한 장을 만듭니다. 차트도 SVG를 직접 생성합니다. GitHub Actions에서 렌더링하고 Cloudflare Pages로 배포합니다.

장중 시세만 경로가 다릅니다. 시세 API가 호출 IP를 확인해서 CI 러너에서는 부를 수 없습니다. 그래서 집에 둔 맥미니가 30초마다 시세를 받아 Cloudflare KV에 넣고 Worker가 같은 도메인으로 내줍니다. 제3자 요청이 0건인지는 배포 전에 기계가 검사합니다.
