---
title: "trackareer"
summary: "여러 채용 사이트의 공고를 모아 지원 현황을 추적·관리하는 구직 관리 서비스."
date: "2026-06-01"
period: "2026.01 ~ 진행 중 · App Store 첫 출시 2026.07"
team: "웹 6명 → 모바일 8명"
teamSize: "8명"
badges:
- WEB
- MOBILE
- DEMO
draft: false
tags:
- NestJS
- TypeORM
- PostgreSQL
- Supabase
- React
- Refine
- TypeScript
demos:
- url: "https://trackareer-admin.sehahub.info"
  label: "라이브 데모"
storeUrl: "https://apps.apple.com/kr/app/id6770530325"
images:
- src: ./web-dashboard.png
  caption: 관리자 대시보드
- src: ./web-members.png
  caption: 회원 관리 목록
---

팀이 웹 서비스로 시작해 2026년 7월 모바일 앱을 App Store에 출시했습니다. 저는 백엔드·인프라 전반과 관리자 백오피스(admin)를 맡았습니다.

## 역할

팀 8명(2026.07 기준) — 백엔드·인프라 1(제 담당) · 앱 프론트 1 · 기획·리딩 1 · 디자인 2 · 마케팅 3

- 백엔드 아키텍처·인프라 구축
- 모바일 앱 API 백엔드 (trackareer-server)
- OpenAPI 문서화 — [관리자 API 스냅샷](/trackareer/api/)
- 관리자 페이지 전체(기획~구현)

## 핵심 도전·결정

**실 API 없이 관리자 페이지를 라이브 데모로.** 관리자 페이지를 스크린샷 대신 직접 만져볼 수 있게 두고 싶었는데 운영 API와 실데이터는 열 수 없었습니다. 관리자 페이지의 API 호출이 axios 인스턴스 하나로 모이는 구조라 그 한 곳에 데모 빌드에서만 mock 어댑터를 붙였습니다. 데이터 제공자·인증·인터셉터는 운영 코드 그대로이고 데이터는 합성 fixture를 메모리에 올려 새로고침하면 처음으로 돌아갑니다. 새 엔드포인트에 핸들러를 빠뜨리면 501로 바로 드러나게 해서 관리자 페이지를 고치면 데모도 따라오게 했습니다. 운영 번들에 데모 코드가 섞이지 않은 것은 빌드 산출물에 표식 문자열이 없는 것으로 확인했습니다. 로그인 화면의 최고관리자·관리자 두 계정은 실제 권한 구분 그대로입니다.

**피벗 때 웹 시절 서버와 DB를 이어 쓰지 않고 새로 설계.** 웹으로 시작한 서비스가 모바일로 옮겨 가면서 스코프가 채용 공고의 최초 지원(서류) 일정 관리로 좁혀졌습니다. 면접이나 필기 같은 뒷단계 전형은 다루지 않습니다. 스코프가 좁혀진 만큼 웹 시절 서버와 DB를 이어 쓰는 대신 새 저장소에서 새 스키마로 시작했고 요구사항을 정리하는 단계에서 내린 결정을 문서로 고정해 바뀌면 문서를 같이 고칩니다. 마감 정보는 마감일과 채용 시 마감 여부를 독립된 값으로 두었고(네 가지 조합이 모두 존재합니다) 공고는 바로 지우되 계정은 30일 유예 뒤에 지웁니다.

## 구조

<div class="not-prose flow-box">
  <div class="flex flex-col gap-6">
    <div>
      <div class="flow-label">운영 · 모바일 앱</div>
      <div class="flow-row">
        <span class="flow-node">모바일 앱</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node">Main API · NestJS · Cloud Run</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node flow-node-end">PostgreSQL · Supabase</span>
      </div>
      <div class="flow-row mt-2">
        <span class="flow-node">모바일 앱</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node">스크래퍼 API · Cloud Run</span>
        <span class="flow-note">공고 URL에서 정보를 추출 · 앱이 직접 호출하고 Main API와는 통신하지 않음</span>
      </div>
    </div>
    <div>
      <div class="flow-label">운영 · 관리자</div>
      <div class="flow-row">
        <span class="flow-node">관리자 페이지 · Refine · Cloud Run</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node">Main API /admin/* · 앱과 분리된 인증</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node flow-node-end">같은 DB</span>
      </div>
    </div>
    <div>
      <div class="flow-label">포트폴리오 데모</div>
      <div class="flow-row">
        <span class="flow-node">trackareer-admin.sehahub.info · Cloudflare Workers 정적</span>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <span class="flow-node flow-node-end">mock 어댑터 · 합성 fixture 인메모리</span>
      </div>
      <div class="flow-note mt-2">API 서버가 없습니다. 운영과 같은 코드가 요청을 메모리 안에서 처리하고 새로고침하면 처음으로 돌아갑니다.</div>
    </div>
  </div>
</div>

## 스택

NestJS · TypeORM · PostgreSQL · Supabase · React · Refine · TypeScript

## 라이브 데모

관리자 백오피스(admin)를 라이브 데모로 공개했습니다. 위 라이브 데모 버튼에서 바로 들어가 볼 수 있습니다.
