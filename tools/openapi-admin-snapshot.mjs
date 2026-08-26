// trackareer 관리자 API 스냅샷 갱신 — src/data/trackareer-admin-openapi.json 을 다시 만든다.
//
//   node tools/openapi-admin-snapshot.mjs [입력] [서버 커밋 표기]
//     입력: OpenAPI JSON 파일 경로 또는 URL (기본 http://localhost:3000/openapi.json)
//     서버 커밋 표기: x-snapshot.source 에 적을 문자열 (예: "trackareer-server main 3164378 (2026-08-18)")
//
// 서버는 NODE_ENV !== 'production' 에서만 /openapi.json 을 내므로 로컬 기동(docker DB → migration → start)이 전제다.
// /admin 경로만 남기고 그 경로들이 참조하는 스키마의 폐포(閉包)만 담는다. 앱(모바일) API 는 공개하지 않는다.
import { writeFileSync } from "node:fs"
import { readFile } from "node:fs/promises"

const input = process.argv[2] ?? "http://localhost:3000/openapi.json"
const source = process.argv[3] ?? "unknown"
const out = new URL("../src/data/trackareer-admin-openapi.json", import.meta.url)

const text = /^https?:/.test(input) ? await (await fetch(input)).text() : await readFile(input, "utf-8")
const spec = JSON.parse(text)

const paths = Object.fromEntries(Object.entries(spec.paths).filter(([p]) => p.startsWith("/admin")))
const all = spec.components?.schemas ?? {}
const need = new Set()
const walk = (o) => {
  if (Array.isArray(o)) return o.forEach(walk)
  if (!o || typeof o !== "object") return
  if (typeof o.$ref === "string") {
    const name = o.$ref.split("/").pop()
    if (!need.has(name)) {
      need.add(name)
      walk(all[name])
    }
  }
  Object.values(o).forEach(walk)
}
walk(paths)

const snapshot = {
  openapi: spec.openapi,
  info: { title: spec.info?.title, version: spec.info?.version },
  "x-snapshot": { date: new Date().toISOString().slice(0, 10), source, scope: "admin paths only" },
  paths,
  components: {
    schemas: Object.fromEntries([...need].sort().map((n) => [n, all[n]])),
    securitySchemes: spec.components?.securitySchemes ?? {},
  },
}
writeFileSync(out, JSON.stringify(snapshot, null, 1) + "\n", "utf-8")
console.log(`paths ${Object.keys(paths).length} · schemas ${need.size} → ${out.pathname}`)
