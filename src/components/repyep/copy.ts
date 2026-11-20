// 운동해 넵 소개 쪽 글 — 새로 지은 문장 없음(그룹 지식 §2 · 대표 11/20 「완전 ai 생성물 같고 별로야」).
// 출처(팀 repo sehahub/team-repyep):
//   page.one · steps[3] 둘째 줄 = 라이브 지원 쪽 FAQ(web-pages-2026-11-20.md 3 · 4절)
//   steps · medical = 스토어 설명 초안(release-plan.md 4-2 + copy-review-2026-11-19.md 4절 고친 안)
//   nav = 앱 설정 줄 이름(Third.xcstrings settings.support · settings.privacy)
//   ui = 앱 안 글(코드 repo App/Resources/*.xcstrings · Shared/RestShared.xcstrings · Core BodyPart · SeedCatalog)
// 화면 속 숫자 · 날짜 · 루틴 이름은 지어낸 예시다(대표 실제 기록 · 몸 수치 · 결과지 금지 · 팀 AGENTS.md).

export type Lang = "ko" | "en"

export type Step = {
  id: "log" | "rest" | "beep" | "lock" | "checkin" | "daily" | "history" | "calendar" | "local"
  section?: string
  lines: string[]
}

const ko = {
  lang: "ko",
  name: "운동해 넵",
  heroTop: "운동해",
  heroBottom: "넵",
  one: "운동 기록과 그 뒤 몸의 반응을 같이 적는 아이폰 일지예요.",
  nav: {
    support: "지원 · 문의",
    privacy: "개인정보처리방침",
    other: "English",
    otherLang: "en",
    otherHref: "/repyep/en/",
    supportHref: "/repyep/support/",
    privacyHref: "/repyep/privacy/",
  },
  steps: [
    {
      id: "log",
      section: "운동할 때",
      lines: [
        "루틴을 고르고 세트마다 무게와 횟수를 적어요. 지난번 값이 미리 채워져요.",
        "그날만 종목 순서를 바꾸거나 추가하고 뺄 수 있어요.",
      ],
    },
    { id: "rest", lines: ["세트를 체크하면 휴식 타이머가 시작돼요. 쉬는 시간은 종목마다 따로예요."] },
    {
      id: "beep",
      lines: ["남은 시간을 삑 소리로 알려요.", "삑은 이어폰을 꽂았을 때만 나요(유선 · 블루투스). 무음 모드여도 나고 듣던 음악은 끄지 않아요."],
    },
    { id: "lock", lines: ["잠금 화면과 Dynamic Island에서 남은 시간을 보고 다음 세트를 시작해요."] },
    {
      id: "checkin",
      section: "다음 날",
      lines: ["어제 운동한 부위를 물어요. 없음 · 약간 · 뚜렷 · 지장 중에 고르고, 근육통인지 관절 · 찌릿함인지 적어요."],
    },
    { id: "daily", lines: ["잠 · 날씨 · 식사 · 체중도 한 줄씩 남겨요."] },
    {
      id: "history",
      section: "돌아볼 때",
      lines: ["히스토리에서 부위마다 운동한 날과 통증을 같은 날짜 줄로 봐요.", "종목별 무게와 횟수 흐름, 체중 흐름을 봐요."],
    },
    { id: "calendar", lines: ["캘린더에 앞으로 할 운동을 날짜마다 놓아요."] },
    {
      id: "local",
      section: "기록은 이 폰 안에만 있어요",
      lines: [
        "계정과 로그인이 없어요. 서버가 없어 기록이 밖으로 나가지 않아요.",
        "건강 앱 저장을 켜면 끝낸 운동과 체중만 이 폰의 건강 앱에도 저장돼요.",
        "폰을 바꿀 때는 기록을 파일로 내보내 새 폰에서 가져와요.",
      ],
    },
  ] as Step[],
  medical: "운동해 넵은 진단이나 치료를 하지 않아요. 아픈 곳이 이어지면 의사와 상의하세요.",
  ui: {
    tabs: ["오늘", "캘린더", "히스토리", "설정"],
    date: "11월 18일 수요일",
    routines: { push: "밀기", pull: "당기기", legs: "하체" },
    workout: {
      started: "7:12 시작",
      reorder: "순서 · 빼기",
      done: { name: "바벨 벤치프레스", progress: "4/4" },
      active: { name: "인클라인 덤벨 벤치프레스", rest: "쉬는 시간 1:30" },
      columns: ["세트", "kg", "회", "완료"],
      removeSet: "세트 빼기",
      addSet: "세트 추가하기",
      upcoming: [
        { name: "덤벨 레터럴 레이즈", sets: "3세트" },
        { name: "딥스", sets: "3세트" },
      ],
      finish: "운동 완료",
    },
    rest: { title: "휴식", collapse: "접기", next: "다음 · 세트 4 · 24 kg × 12", skip: "건너뛰기" },
    lock: { title: "휴식", skip: "건너뛰기", setDone: "세트 완료" },
    today: {
      title: "오늘",
      checkin: "체크인",
      sub: "어제 밀기 · 3곳",
      parts: ["가슴", "전면·측면 어깨", "삼두"],
      pain: ["없음", "약간", "뚜렷", "지장"],
      sleep: "잠",
      sleepOptions: ["부족(~6)", "보통(6~8)", "충분(8~)"],
      weather: "날씨",
      weatherOptions: ["맑음", "구름", "흐림", "비", "눈"],
      addPart: "부위 추가하기",
      allFine: "나머지 다 괜찮음",
      confirm: "확인",
      workout: "운동",
      choose: "운동 고르기",
      chooseSub: "당기기 · 밀기 · 하체",
    },
    history: {
      title: "히스토리",
      chips: ["부위", "체중", "종목", "사진"],
      part: "가슴",
      today: "오늘 약간",
      periods: ["2주", "달"],
      work: "운동",
      volume: "볼륨 kg",
      pain: "통증",
      levels: ["약간", "뚜렷", "지장"],
      weekdays: ["일", "월", "화", "수", "목", "금", "토"],
      all: "전체 부위",
      allParts: ["가슴", "전면·측면 어깨", "후면 어깨", "삼두", "이두", "전완", "광배", "승모·능형", "기립근"],
    },
    calendar: {
      title: "캘린더",
      month: "2026년 11월",
      weekdays: ["일", "월", "화", "수", "목", "금", "토"],
      legendWorkout: "운동한 날",
      legendPlan: "계획",
      legendPain: "통증(그날 가장 높은 단계)",
    },
    settings: {
      title: "설정",
      health: "애플 건강",
      healthRows: ["운동을 건강 앱에 저장", "체중을 건강 앱에 저장"],
      healthHelp:
        "끝낸 운동(근력 운동 · 시작과 끝 시각)과 적은 체중만 건강 앱에 써요. 건강 앱의 자료는 읽지 않아요. 켜기 전 기록은 쓰지 않고, 여기서 고치거나 지우면 이 앱이 쓴 것도 따라 바뀌어요.",
      records: "기록",
      recordRows: [
        { title: "파일로 내보내기", sub: "다른 폰으로 옮길 파일을 만들어요" },
        { title: "파일에서 가져오기", sub: "옮기기용 파일로 이 폰 기록을 바꿔요" },
        { title: "다른 앱 기록 가져오기", sub: "" },
      ],
    },
  },
}

export type Copy = typeof ko

const en: Copy = {
  lang: "en",
  name: "RepYep",
  heroTop: "Rep",
  heroBottom: "Yep",
  one: "An iPhone journal for your workouts and how your body feels afterward.",
  nav: {
    support: "Support",
    privacy: "Privacy Policy",
    other: "한국어",
    otherLang: "ko",
    otherHref: "/repyep/",
    supportHref: "/repyep/en/support/",
    privacyHref: "/repyep/en/privacy/",
  },
  steps: [
    {
      id: "log",
      section: "While you train",
      lines: [
        "Pick a routine and log weight and reps for each set. Last time's numbers are filled in for you.",
        "Reorder, add or remove exercises just for today.",
      ],
    },
    { id: "rest", lines: ["Check off a set and the rest timer starts. Each exercise keeps its own rest time."] },
    {
      id: "beep",
      lines: [
        "Beeps tell you how much rest is left.",
        "Beeps play only through headphones (wired or Bluetooth) — even in silent mode, and without stopping your music.",
      ],
    },
    { id: "lock", lines: ["See the countdown on the Lock Screen and in the Dynamic Island, and start your next set from there."] },
    {
      id: "checkin",
      section: "The next day",
      lines: [
        "It asks about the muscles you trained. Pick None, Mild, Moderate or Severe, and note whether it's muscle soreness or joint/sharp pain.",
      ],
    },
    { id: "daily", lines: ["Add a line for sleep, weather, meals and body weight."] },
    {
      id: "history",
      section: "Looking back",
      lines: [
        "History shows, for each body area, the days you trained and how sore it was, on the same timeline.",
        "Follow weight and reps for each exercise, and your body weight over time.",
      ],
    },
    { id: "calendar", lines: ["Plan upcoming workouts by date on the calendar."] },
    {
      id: "local",
      section: "Your data stays on this iPhone",
      lines: [
        "No account, no sign-in. There's no server, so nothing leaves your phone.",
        "If you turn on saving to Health, finished workouts and body weight are also saved to the Health app on this iPhone.",
        "Moving to a new phone? Export your data to a file and import it there.",
      ],
    },
  ],
  medical: "RepYep doesn't diagnose or treat anything. If pain keeps coming back, talk to a doctor.",
  ui: {
    tabs: ["Today", "Calendar", "History", "Settings"],
    date: "Wednesday, November 18",
    routines: { push: "Push", pull: "Pull", legs: "Legs" },
    workout: {
      started: "Started 7:12",
      reorder: "Reorder",
      done: { name: "Barbell Bench Press", progress: "4/4" },
      active: { name: "Incline Dumbbell Press", rest: "Rest 1:30" },
      columns: ["Set", "kg", "Reps", "Done"],
      removeSet: "Remove Set",
      addSet: "Add Set",
      upcoming: [
        { name: "Dumbbell Lateral Raise", sets: "3 sets" },
        { name: "Dip", sets: "3 sets" },
      ],
      finish: "Finish Workout",
    },
    rest: { title: "Rest", collapse: "Collapse", next: "Next · Set 4 · 24 kg × 12", skip: "Skip" },
    lock: { title: "Rest", skip: "Skip", setDone: "Set Done" },
    today: {
      title: "Today",
      checkin: "Check-in",
      sub: "Yesterday: Push · 3 areas",
      parts: ["Chest", "Front/Side Delts", "Triceps"],
      pain: ["None", "Mild", "Moderate", "Severe"],
      sleep: "Sleep",
      sleepOptions: ["Short (<6h)", "Normal (6–8h)", "Plenty (8h+)"],
      weather: "Weather",
      weatherOptions: ["Sunny", "Partly", "Cloudy", "Rain", "Snow"],
      addPart: "Add Body Area",
      allFine: "All Others Fine",
      confirm: "Confirm",
      workout: "Workout",
      choose: "Choose Workout",
      chooseSub: "Pull · Push · Legs",
    },
    history: {
      title: "History",
      chips: ["Body", "Weight", "Exercises", "Photos"],
      part: "Chest",
      today: "Today Mild",
      periods: ["2 wks", "Month"],
      work: "Workout",
      volume: "Volume kg",
      pain: "Pain",
      levels: ["Mild", "Moderate", "Severe"],
      weekdays: ["S", "M", "T", "W", "T", "F", "S"],
      all: "All Areas",
      allParts: ["Chest", "Front/Side Delts", "Rear Delts", "Triceps", "Biceps", "Forearms", "Lats", "Traps/Rhomboids", "Lower Back"],
    },
    calendar: {
      title: "Calendar",
      month: "November 2026",
      weekdays: ["S", "M", "T", "W", "T", "F", "S"],
      legendWorkout: "Workout day",
      legendPlan: "Planned",
      legendPain: "Pain (highest that day)",
    },
    settings: {
      title: "Settings",
      health: "Apple Health",
      healthRows: ["Save Workouts to Health", "Save Body Weight to Health"],
      healthHelp:
        "RepYep adds finished workouts (as strength training, with start and end time) and the body weight you log to the Health app. It doesn't read anything from Health. Records from before you turn this on aren't added, and edits or deletions here carry over to what RepYep saved.",
      records: "Records",
      recordRows: [
        { title: "Export to File", sub: "Make a file to move your records to another phone" },
        { title: "Import from File", sub: "Replace this phone's records with a transfer file" },
        { title: "Import from Another App", sub: "" },
      ],
    },
  },
}

export const copy: Record<Lang, Copy> = { ko, en }
