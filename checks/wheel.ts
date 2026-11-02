import { type Browser, type CDPSession, chromium, firefox, type Page } from "playwright"
import { serveDist } from "./serve"

// Each gesture also runs under a stand-in for a review tool's overlay (an open shadow root on <html>),
// the way iter8's own dock covers a page it reviews.
const target = process.argv[2] || undefined
const engines = (process.argv[3] ?? "chromium").split(",")
const SPOTS = ["text", "card", "demo window", "hero", "dots", "empty space"] as const
type Spot = (typeof SPOTS)[number]
type Gesture = "notch" | "trackpad" | "phased"

const spotAt: Record<Spot, (p: Page) => Promise<{ x: number; y: number; section: string }>> = {
  text: async (p) => at(p, "#how .lede", 0.3, 0.5),
  card: async (p) => at(p, ".agcard.today", 0.5, 0.5),
  "demo window": async (p) => at(p, "#win", 0.5, 0.45),
  hero: async (p) => at(p, "#h1", 0.4, 0.5),
  dots: async (p) => at(p, '.dots a[href="#owner"]', 0.5, 0.5, "owner"),
  "empty space": async (p) => { await jump(p, "top"); return { x: 60, y: 450, section: "top" } },
}
async function at(p: Page, sel: string, fx: number, fy: number, scrollTo?: string) {
  const section = scrollTo ?? (await p.locator(sel).evaluate((el) => el.closest("#home > section")!.id))
  await jump(p, section)
  const b = (await p.locator(sel).boundingBox())!
  return { x: b.x + b.width * fx, y: b.y + b.height * fy, section }
}
async function jump(p: Page, id: string) {
  await p.evaluate((i) => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, Math.round(document.getElementById(i)!.getBoundingClientRect().top + scrollY)) }, id)
  await settle(p)
  await p.waitForTimeout(260)
}
const settle = (p: Page) => p.evaluate(() => new Promise<number>((res) => { let last = scrollY, still = 0; const t0 = performance.now(); const tick = () => { if (scrollY === last) still += 1; else { still = 0; last = scrollY } if (still >= 20 || performance.now() - t0 > 3000) res(Math.round(scrollY)); else requestAnimationFrame(tick) }; requestAnimationFrame(tick) }))

async function overlayUnder(p: Page, x: number, y: number) {
  await p.evaluate(([px, py]) => {
    const host = document.createElement("review-overlay")
    host.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none"
    const part = document.createElement("div")
    part.style.cssText = `position:fixed;left:${px - 120}px;top:${py - 24}px;width:240px;height:48px;pointer-events:auto;background:rgb(0 0 0 / .04)`
    host.attachShadow({ mode: "open" }).append(part)
    document.documentElement.append(host)
  }, [x, y])
}

async function gesture(p: Page, cdp: CDPSession | null, kind: Gesture, x: number, y: number) {
  await p.mouse.move(x, y)
  if (kind === "notch") await p.mouse.wheel(0, 100)
  else if (kind === "trackpad") {
    for (const d of [2, 5, 9, 14, 18, 16, 12]) { await p.mouse.wheel(0, d); await p.waitForTimeout(16) }
    for (let v = 11; v >= 1; v -= 0.45) { await p.mouse.wheel(0, Math.round(v)); await p.waitForTimeout(16) }
  } else await cdp!.send("Input.synthesizeScrollGesture", { x: Math.round(x), y: Math.round(y), yDistance: -160, gestureSourceType: "mouse", speed: 1600, preventFling: false })
}

async function run(browser: Browser, engine: string, url: string) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const p = await ctx.newPage()
  await p.goto(url, { waitUntil: "networkidle" })
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(800)
  const cdp = engine === "chromium" ? await ctx.newCDPSession(p) : null
  const kinds: Gesture[] = cdp ? ["notch", "trackpad", "phased"] : ["notch", "trackpad"]
  const rows: { spot: Spot; overlay: boolean; kind: Gesture; ok: boolean; got: number; want: number }[] = []
  for (const overlay of [false, true]) for (const spot of SPOTS) for (const kind of kinds) {
    await p.reload({ waitUntil: "networkidle" })
    await p.evaluate(() => document.fonts.ready)
    await p.waitForTimeout(500)
    const { x, y, section } = await spotAt[spot](p)
    const secs = await p.evaluate(() => [...document.querySelectorAll("#home > section")].map((s) => ({ id: s.id, top: Math.min(Math.round(s.getBoundingClientRect().top + scrollY), document.documentElement.scrollHeight - innerHeight) })))
    const from = secs.findIndex((s) => s.id === section)
    const want = secs[from + 1]!.top
    if (overlay) await overlayUnder(p, x, y)
    await gesture(p, cdp, kind, x, y)
    await p.waitForTimeout(300)
    const got = await settle(p)
    rows.push({ spot, overlay, kind, ok: got === want, got, want })
  }
  await ctx.close()
  return rows
}

const server = target ? null : serveDist()
const url = target ?? server!.url
let failed = 0
try {
  for (const engine of engines) {
    const browser = await (engine === "firefox" ? firefox : chromium).launch()
    try {
      const rows = await run(browser, engine, url)
      const bad = rows.filter((r) => !r.ok)
      failed += bad.length
      console.log(`${engine}: ${rows.length - bad.length}/${rows.length} gestures landed on the next section's top`)
      for (const r of bad) console.log(`  FAIL ${r.kind} over ${r.spot}${r.overlay ? " under an overlay" : ""}: stopped at ${r.got}, expected ${r.want}`)
    } finally { await browser.close() }
  }
} finally { server?.stop() }
process.exit(failed ? 1 : 0)
