---
title: "내돈아님"
summary: "다가오는 고정 지출을 월급 주기로 묶어 확보해야 할 금액을 바로 보여주는 iOS 앱."
date: "2026-04-17"
period: "2026.04 ~ 진행 중 · App Store 첫 출시 2026.07"
team: "개인 프로젝트 (1인)"
storeUrl: "https://apps.apple.com/kr/app/id6786492719"
badges:
- MOBILE
draft: false
pinned: true
tags:
- Flutter
- Supabase
- Riverpod
images:
- src: ./01_home.png
  caption: 홈 — 다음 월급까지 확보해야 할 금액
- src: ./02_register.png
  caption: 지출 등록
- src: ./03_monthly.png
  caption: 월별 지출 내역
- src: ./04_settings.png
  caption: 설정
---

월세 전기세 관리비처럼 날짜도 금액도 제각각인 고정 지출을 월급 주기 기준으로 모아 보여주는 예정 지출 관리 앱입니다. 가계부처럼 지난 소비를 기록하는 대신 앞으로 나갈 돈에만 집중해 다음 월급까지 확보해야 할 금액을 바로 알려줍니다.

2026년 7월 App Store에 첫 출시했습니다. [App Store에서 받기](https://apps.apple.com/kr/app/id6786492719) · [업데이트 내역](/notmine/releases)

## 핵심 도전·결정

혼자 기획하고 만들며 가장 공들인 건 기능을 더하는 쪽이 아니라 빼는 쪽이었습니다.

### 가계부가 아니라 '앞으로 나갈 돈'

- 제약: 고정 지출은 날짜와 금액이 제각각이라 다음 월급까지 얼마가 빠질지 파악이 안 됨
- 택한 것: 예정 지출만 관리. 완료 체크와 금액 수정은 전부 선택. 미처리 건은 자동 소멸 없이 직접 처리
- 버린 대안: 지출 기록 · 카테고리 분석 · 리포트 등 가계부 표준 기능 전부
- 트레이드오프: 익숙한 가계부 기능의 부재 ↔ "얼마 남겨야 하나"에 대한 즉답

### 캘린더 월 대신 월급 주기

- 제약: 지출 판단의 실제 단위는 달력이 아니라 월급일
- 택한 것: 주기는 월급일부터 다음 월급일 전날까지. 월급일 31일은 말일 자동 보정. 반복 지출은 미리 만들지 않고 조회 시 온디맨드 생성
- 버린 대안: 캘린더 월 기준 집계 · 반복 건 사전 일괄 생성
- 트레이드오프: 주기 경계와 말일 보정의 계산 복잡도 ↔ 체감과 일치하는 숫자

## 스택

Flutter · Supabase · Riverpod

## 문의

앱 관련 문의: [sehahub.info@gmail.com](mailto:sehahub.info@gmail.com)
