// 빌드 뒤 단계(npm run build 가 astro build 다음에 부른다) — Wanted Sans 를 dist 에 실제로 쓰인 글자만 남긴 조각으로 바꾼다.
//
//   node tools/subset-font.mjs
//
// 1) dist 의 글 파일(html · js · css · xml · txt · json · md)에서 글자를 모은다. 숫자 · 기호가 빠지지 않게
//    ASCII · Latin-1 · 일반 구두점(U+2000–206F) · 통화 · 화살표 · 도형 · 딩뱃 블록은 늘 넣는다.
// 2) 원본을 그 글자로 자른다 — 굵기 축(wght 400–1000)과 OpenType 기능은 그대로 둔다(subset-font = HarfBuzz WASM · Python 없음).
// 3) 내용 해시를 붙여 dist/_astro/ 에 쓴다(public/_headers 의 1년 immutable 캐시가 덮는다).
//    dist 안의 /fonts/WantedSansVariable-KR.woff2 참조(미리 받기 링크 · @font-face)를 그 주소로 바꾼다.
//    원본 dist/fonts/WantedSansVariable-KR.woff2 는 그대로 남긴다(밖에서 걸어 둔 주소가 살게).
// 4) 원본에 있던 글자가 조각에서 하나라도 빠졌거나 굵기 축이 달라지면 빌드를 멈춘다.
// 글꼴은 SIL OFL 1.1(public/fonts/WantedSans-OFL.txt) — 예약 글꼴 이름(Reserved Font Name)이 없어 이름은 그대로 둔다.
import { readFile, readdir, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { extname, join } from "node:path"
import { fileURLToPath } from "node:url"
import subsetFont from "subset-font"
import fontverter from "fontverter"
import { Blob, Face } from "harfbuzzjs"

const dist = fileURLToPath(new URL("../dist/", import.meta.url))
const FONT_URL = "/fonts/WantedSansVariable-KR.woff2"
const TEXT = new Set([".html", ".js", ".mjs", ".css", ".xml", ".txt", ".json", ".md"])
const ALWAYS = [
  [0x20, 0x7e], // ASCII
  [0xa0, 0xff], // Latin-1
  [0x2000, 0x206f], // 일반 구두점 – — ‘ ’ “ ” … •
  [0x20a0, 0x20cf], // 통화 € ₩
  [0x2190, 0x21ff], // 화살표
  [0x25a0, 0x25ff], // 도형
  [0x2700, 0x27bf], // 딩뱃 ✓
]

const walk = async (dir) =>
  (await Promise.all((await readdir(dir, { withFileTypes: true })).map((d) => (d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)])))).flat()

// 글 안에 이스케이프로 적힌 글자(&#…; · \u… · CSS \…)도 글자로 센다 — 넉넉히 넣어도 원본에 없는 글자는 버려진다
const decoded = (s) =>
  s.replace(/&#x([0-9a-f]+);|&#(\d+);|\\u\{([0-9a-f]+)\}|\\u([0-9a-f]{4})|\\([0-9a-f]{1,6})/gi, (m, hex, dec, u1, u2, css) => {
    const cp = dec ? parseInt(dec, 10) : parseInt(hex ?? u1 ?? u2 ?? css, 16)
    return cp > 0 && cp <= 0x10ffff ? m + String.fromCodePoint(cp) : m
  })

const inspect = async (woff2) => {
  const face = new Face(new Blob(await fontverter.convert(woff2, "truetype")))
  return { cmap: new Set(face.collectUnicodes()), wght: face.getAxisInfos().wght }
}

const files = (await walk(dist)).filter((f) => TEXT.has(extname(f).toLowerCase()))
const texts = new Map(await Promise.all(files.map(async (f) => [f, await readFile(f, "utf8")])))

const used = new Set()
for (const t of texts.values())
  for (const ch of decoded(t)) {
    const c = ch.codePointAt(0)
    if (c >= 0x20 && (c < 0x7f || c > 0x9f)) used.add(c) // 줄바꿈 · 탭 같은 제어 문자는 빼고
  }
const want = new Set(used)
for (const [lo, hi] of ALWAYS) for (let c = lo; c <= hi; c++) want.add(c)

const original = await readFile(join(dist, "fonts", "WantedSansVariable-KR.woff2"))
const orig = await inspect(original)
const keep = [...want].filter((c) => orig.cmap.has(c)).sort((a, b) => a - b)

const subset = await subsetFont(original, String.fromCodePoint(...keep), { targetFormat: "woff2" })
const sub = await inspect(subset)

const missing = keep.filter((c) => !sub.cmap.has(c))
const axisOk = sub.wght && sub.wght.min === orig.wght.min && sub.wght.max === orig.wght.max && sub.wght.default === orig.wght.default
if (missing.length || !axisOk) {
  console.error(`\n[subset-font] 실패 — 원본에 있던 글자 ${missing.length}자가 조각에 없다: ${missing.slice(0, 40).map((c) => String.fromCodePoint(c) + " U+" + c.toString(16).toUpperCase()).join(" · ")}`)
  if (!axisOk) console.error(`[subset-font] 실패 — 굵기 축이 달라졌다: 원본 ${JSON.stringify(orig.wght)} · 조각 ${JSON.stringify(sub.wght)}`)
  process.exit(1)
}

const hash = createHash("sha256").update(subset).digest("hex").slice(0, 10)
const name = `WantedSansVariable-KR.${hash}.woff2`
await writeFile(join(dist, "_astro", name), subset)

let refs = 0
for (const [f, t] of texts) {
  if (!t.includes(FONT_URL)) continue
  refs += t.split(FONT_URL).length - 1
  await writeFile(f, t.replaceAll(FONT_URL, `/_astro/${name}`))
}

const isHangul = (c) => c >= 0xac00 && c <= 0xd7a3
const usedInFont = [...used].filter((c) => orig.cmap.has(c))
const kb = (n) => n.toLocaleString("en-US")
console.log(
  `[subset-font] 쓰인 글자 ${kb(used.size)}자(한글 ${usedInFont.filter(isHangul).length} · 글꼴에 없어 기기 글꼴로 ${used.size - usedInFont.length}) · 조각 ${kb(keep.length)}자 · ${kb(original.length)} → ${kb(subset.length)} B · /_astro/${name} · 참조 ${refs}곳 바꿈`,
)
if (!refs) console.warn(`[subset-font] 경고 — dist 에 ${FONT_URL} 참조가 없다(조각은 만들었지만 쓰는 곳이 없다)`)
