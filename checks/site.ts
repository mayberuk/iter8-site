import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { type Browser, chromium, type Page } from "playwright"
import { BASE_PATH, serveDist } from "./serve"

const runs = (process.argv[2] ?? "desktop,desktop760,phone390,phone360,landscape,paging,reduced").split(",")
const out = process.env.CHECK_OUT ?? mkdtempSync(join(tmpdir(), "iter8-site-check-"))
const HEADLINE = "Point at it. Say what’s wrong. Send it to your agent."

type Result = { name: string; ok: boolean; detail?: unknown }
const results: { run: string; checks: Result[] }[] = []
function record(run: string) {
  const checks: Result[] = []
  results.push({ run, checks })
  return (name: string, ok: boolean, detail?: unknown) => { checks.push({ name, ok, detail }) }
}

const LONGTASKS = `window.__lt = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration)) }).observe({ type: "longtask", buffered: true })`
const WATCH = `window.__pay = {}; window.__ov = 0; window.__heroPanels = 0; setInterval(() => {
  const d = document.querySelector("#demo")
  if (d && d.getBoundingClientRect().top > innerHeight && document.querySelector("#chip.on, #cmp.on, #pcard.on")) window.__heroPanels++
  const s = document.querySelector("[data-demo-status]")?.textContent || "", t = Math.round(performance.now()), p = window.__pay
  if (/turns on Pick/.test(s) && !p.start) p.start = t
  if (/fixes the chip/.test(s) && !p.fix) p.fix = t
  if (/is done/.test(s) && !p.done) p.done = t
  const cm = document.querySelector("#cmp"), co = document.querySelector(".coach")
  if (cm && co && cm.classList.contains("on")) { const a = cm.getBoundingClientRect(), b = co.getBoundingClientRect(); const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)), iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)); window.__ov = Math.max(window.__ov, Math.round(ix * iy)) }
}, 100)`

const SAMPLES = ["#sub", ".cta .cl", ".spec dt", ".spec dd", ".spec .ag.soon", ".spec .ag.on", ".spec .fw", "#demo .lede", ".win-bar .url", "#msub", ".term-h .tt", ".coach .of", ".coach .now", ".agents-band .lede", ".agcard.today b", ".agcard.today .badge", ".agcard.today p", ".agcard.planned b", ".agcard.planned .badge", ".agcard.planned p", ".adapter .ab", ".adapter .ab.mid", "#data .lede", "#data .legend div:nth-child(2) span", "#data .legend div:nth-child(2) b", "#data .card .eb", ".seg2 button[aria-pressed=false]", ".grp.you .row dt", ".saw.c", "#owner .pair .why", "#owner .pair.busy .why b", "#owner .pair.gone .why b", "#ssh .lede", "#ssh .pipe .lbl", "#ssh .cmds p", "#ssh .acard .q", "#install .step h3 span", "#install .step p", ".ik .kl small", ".tray h3", ".foot .note", ".tb-sec span", ".ptabs button[aria-pressed=false]", ".tick"]
const DOC_SAMPLES = [".prose .crumb", ".prose p", ".prose .intro", ".dnav a", ".dnav .na", ".dnav .nh", ".toc a", ".itable td", ".callout p", ".pager small"]

function contrast(page: Page, sels: string[]) {
  return page.evaluate((list) => {
    const parse = (c: string) => { const m = c.match(/[\d.]+/g)!.map(Number); return c.startsWith("color(") ? [m[0]! * 255, m[1]! * 255, m[2]! * 255, m[3] ?? 1] : [m[0]!, m[1]!, m[2]!, m[3] ?? 1] }
    const lum = ([r, g, b]: number[]) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!) }
    const res: Record<string, string> = {}
    for (const s of list) {
      const el = document.querySelector(s)
      if (!el) { res[s] = "missing"; continue }
      if (getComputedStyle(el).display === "none" || ((el as HTMLElement).offsetParent === null && getComputedStyle(el).position !== "fixed")) { res[s] = "hidden"; continue }
      const fg = parse(getComputedStyle(el).color)
      let p: Element | null = el, bg = [255, 255, 255, 0]
      while (p) { const c = parse(getComputedStyle(p).backgroundColor); if (c[3]! > 0.5) { bg = c; break } p = p.parentElement }
      if (bg[3] === 0) bg = parse(getComputedStyle(document.body).backgroundColor)
      const a = lum(fg), b = lum(bg)
      res[s] = ((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2)
    }
    return res
  }, sels)
}
const lowContrast = (r: Record<string, string>) => Object.fromEntries(Object.entries(r).filter(([, v]) => v === "missing" || (v !== "hidden" && Number(v) < 4.5)))

function overflow(page: Page) {
  return page.evaluate(() => {
    const w = document.documentElement.clientWidth
    const wide = [...document.querySelectorAll("body *")].filter((el) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || el.closest(".ovl, .tsheet")) return false
      let p = el.parentElement, clipped = false
      while (p) { if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowX)) { clipped = true; break } p = p.parentElement }
      return !clipped && r.right > w + 1
    }).slice(0, 6).map((el) => `${el.tagName.toLowerCase()}.${String((el as HTMLElement).className).slice(0, 30)}`)
    return { scrollWidth: document.documentElement.scrollWidth, clientWidth: w, wide }
  })
}
const status = (page: Page) => page.locator("[data-demo-status]").innerText()
async function waitStatus(page: Page, re: RegExp, ms: number) {
  const end = Date.now() + ms
  while (Date.now() < end) { if (re.test(await status(page))) return true; await page.waitForTimeout(250) }
  return false
}
const settle = (p: Page) => p.evaluate(() => new Promise<number>((res) => { let last = scrollY, still = 0; const t0 = performance.now(); const tick = () => { if (scrollY === last) still += 1; else { still = 0; last = scrollY } if (still >= 20 || performance.now() - t0 > 3000) res(Math.round(scrollY)); else requestAnimationFrame(tick) }; requestAnimationFrame(tick) }))
function track(page: Page) {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`))
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`console ${m.type()}: ${m.text()}`) })
  page.on("requestfailed", (r) => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`))
  page.on("response", (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`) })
  return errors
}
const fontsLoaded = (page: Page) => page.evaluate(async () => { await document.fonts.ready; return [...new Set([...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, "")))].sort() })

async function shadowKeys(page: Page, check: ReturnType<typeof record>) {
  await page.evaluate(() => {
    for (const mode of ["open", "closed"] as const) {
      const host = document.createElement("div")
      host.style.cssText = `position:fixed;left:${mode === "open" ? 10 : 170}px;top:120px;z-index:2147483647`
      const ta = document.createElement("textarea")
      host.attachShadow({ mode }).append(ta)
      document.body.append(host)
      ;(window as unknown as Record<string, HTMLTextAreaElement>)[`__ta_${mode}`] = ta
    }
  })
  const typed = "cdakr1234 cc"
  for (const mode of ["open", "closed"]) {
    await page.evaluate((m) => (window as unknown as Record<string, HTMLTextAreaElement>)[`__ta_${m}`]!.focus(), mode)
    const y0 = await page.evaluate(() => scrollY)
    await page.keyboard.type(typed)
    for (const k of ["Enter", "ArrowUp", "ArrowDown", "PageDown"]) await page.keyboard.press(k)
    const r = await page.evaluate(([m, y]) => ({
      value: (window as unknown as Record<string, HTMLTextAreaElement>)[`__ta_${m}`]!.value,
      takeOver: document.querySelector("[data-demo-takeover]")!.getAttribute("aria-pressed"),
      moved: Math.round(scrollY) !== y,
    }), [mode, y0] as const)
    check(`keys typed in another tool's ${mode} shadow root stay there`, r.value === `${typed}\n` && r.takeOver !== "true" && !r.moved, r)
  }
  await page.evaluate(() => { for (const m of ["open", "closed"]) ((window as unknown as Record<string, HTMLTextAreaElement>)[`__ta_${m}`]!.getRootNode() as ShadowRoot).host.remove() })
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.keyboard.press("c")
  await page.waitForTimeout(500)
  check("C on the page starts Take over", (await page.locator("[data-demo-takeover]").getAttribute("aria-pressed")) === "true")
  await page.keyboard.press("Escape")
  await page.waitForTimeout(300)
}

type Size = { tag: string; w: number; h: number; touch: boolean }
async function baseRun(browser: Browser, url: string, s: Size, theme: "light" | "dark", extras?: (page: Page, check: ReturnType<typeof record>) => Promise<void>) {
  const check = record(`${s.tag} ${s.w}×${s.h} ${theme}`)
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1, hasTouch: s.touch, isMobile: s.touch })
  await ctx.addInitScript(LONGTASKS)
  await ctx.addInitScript(WATCH)
  const page = await ctx.newPage()
  const errors = track(page)
  const shot = (what: string) => page.screenshot({ path: join(out, `${s.tag}-${theme}-${what}.png`) })
  await page.goto(url, { waitUntil: "networkidle" })
  if (theme === "dark") { await page.locator("#themeSw").click(); check("theme switch turns dark", (await page.evaluate(() => document.documentElement.dataset.theme)) === "dark") }
  check("both self-hosted fonts load", JSON.stringify(await fontsLoaded(page)) === JSON.stringify(["JetBrains Mono", "Reddit Sans"]), await fontsLoaded(page))
  await page.waitForTimeout(12600)
  await shot("hero-end")
  check("hero pass drops four pins", (await page.locator("#hpins .pin").count()) === 4)
  check("no demo panel shows while the demo is off screen", (await page.evaluate(() => (window as unknown as { __heroPanels: number }).__heroPanels)) === 0)
  const paged = await page.evaluate(() => document.documentElement.classList.contains("paged"))
  const fits = await page.evaluate(() => [...document.querySelectorAll("#home > section")].every((x) => (x as HTMLElement).offsetHeight <= innerHeight + 1))
  check(`section paging ${s.w > 960 && s.h >= 700 ? "on" : "off"}`, paged === (s.w > 960 && s.h >= 700 && fits) && paged === (s.w > 960 && s.h >= 700), { paged, fits })
  check("scroll snapping follows paging", (await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)) === (paged ? "y mandatory" : "none"))
  check(`section dots ${s.w > 1180 ? "shown" : "hidden"}`, (await page.evaluate(() => getComputedStyle(document.querySelector(".dots")!).display !== "none")) === s.w > 1180)
  check(`thumb bar ${s.touch ? "shown" : "hidden"}`, (await page.evaluate(() => getComputedStyle(document.querySelector(".tbar")!).display !== "none")) === s.touch)
  check("three colour bands carry their motif", (await page.evaluate(() => [...document.querySelectorAll(".band.wash")].filter((b) => getComputedStyle(b).getPropertyValue("--motif").trim().startsWith("url(")).length)) === 3)
  await page.evaluate(() => document.getElementById("demo")!.scrollIntoView())
  await page.waitForTimeout(900)
  check("header floats once scrolled", (await page.locator(".site.float").count()) === 1)
  check("demo starts when in view", await page.evaluate(() => document.body.classList.contains("demo-in")))
  if (s.touch) check("thumb bar steps aside in the demo", await page.evaluate(() => getComputedStyle(document.querySelector(".tbar")!).opacity === "0"))
  await page.waitForTimeout(7000)
  await shot("demo-mid")
  check("demo runs to its end state", await waitStatus(page, /is done/, 60000), await status(page))
  await page.waitForTimeout(400)
  await shot("demo-end")
  check("headline rewritten", (await page.locator("#mh1 .v:not([aria-hidden])").innerText()) === HEADLINE)
  check("Astro chip straightened", !(await page.locator("#mastro").evaluate((el) => el.classList.contains("tilt"))))
  const pins = await page.$$eval("#pins .pin", (ps) => ps.map((p) => p.className.replace("pin ", "")))
  check("pins end done, answered, done, done", JSON.stringify(pins) === JSON.stringify(["change done", "question answered", "fix done", "keep done"]), pins)
  check("answer card stays open", (await page.locator("#pcard.on").count()) === 1)
  check(`answer card ${s.touch ? "is" : "is not"} a bottom sheet`, (await page.evaluate(() => document.querySelector("#pcard")!.classList.contains("bsheet"))) === s.touch)
  const timing = await page.evaluate(() => { const p = (window as unknown as { __pay: Record<string, number> }).__pay; return { payoffS: (p.fix! - p.start!) / 1000, totalS: (p.done! - p.start!) / 1000 } })
  check("payoff near 25 s, round near 35 s", timing.payoffS > 20 && timing.payoffS < 30 && timing.totalS > 30 && timing.totalS < 40, timing)
  check("composer never covers the coach", (await page.evaluate(() => (window as unknown as { __ov: number }).__ov)) === 0)
  check("browser window fits the viewport", await page.evaluate(() => document.querySelector("#win")!.getBoundingClientRect().height <= innerHeight))
  const lt = await page.evaluate(() => (window as unknown as { __lt: number[] }).__lt)
  check("no main-thread task over 50 ms", lt.every((d) => d <= 50), lt)
  const of = await overflow(page)
  check("no horizontal overflow", of.scrollWidth === of.clientWidth && of.wide.length === 0, of)
  const low = lowContrast(await contrast(page, SAMPLES))
  check("sampled text contrast ≥ 4.5", Object.keys(low).length === 0, low)
  await page.screenshot({ path: join(out, `${s.tag}-${theme}-full.png`), fullPage: true })
  if (extras && theme === "light") await extras(page, check)

  await page.goto(`${url}docs/`, { waitUntil: "networkidle" })
  await page.waitForTimeout(400)
  await shot("docs")
  const dof = await overflow(page)
  check("docs: no horizontal overflow", dof.scrollWidth === dof.clientWidth && dof.wide.length === 0, dof)
  check("docs: not paged", !(await page.evaluate(() => document.documentElement.classList.contains("paged"))))
  const dlow = lowContrast(await contrast(page, DOC_SAMPLES))
  check("docs: sampled text contrast ≥ 4.5", Object.keys(dlow).length === 0, dlow)
  const glyphs = await page.evaluate(() => ({ callouts: document.querySelectorAll(".callout > svg").length, intents: document.querySelectorAll(".itable .gl").length, stages: document.querySelectorAll(".itable .sg").length, left: document.querySelectorAll(".prose i[data-icon], .prose i[data-glyph], .prose i[data-status]").length }))
  check("docs: icons and glyphs rendered", glyphs.callouts === 2 && glyphs.intents === 4 && glyphs.stages === 3 && glyphs.left === 0, glyphs)
  const toc = await page.$$eval(".toc a", (as) => as.map((a) => !!document.getElementById(decodeURIComponent((a as HTMLAnchorElement).hash.slice(1)))))
  check("docs: every contents link has its heading", toc.length === 5 && toc.every(Boolean))
  if (!s.touch && s.w > 960) {
    await page.locator('.toc a[href="#4-send-the-round"]').click()
    await settle(page)
    const top = await page.evaluate(() => Math.round(document.getElementById("4-send-the-round")!.getBoundingClientRect().top))
    check("docs: a contents link lands its heading below the header", top >= 68 && top <= 100, top)
  }
  await page.locator(".pager a").first().click()
  await page.waitForURL(`${url}#install`)
  await page.waitForTimeout(1500)
  const installTop = await page.evaluate(() => Math.round(document.getElementById("install")!.getBoundingClientRect().top))
  check("docs: Previous returns to Install on the home page", Math.abs(installTop) <= 2, installTop)
  check("no console errors or failed requests", errors.length === 0, errors)
  await ctx.close()
}

async function desktopExtras(page: Page, check: ReturnType<typeof record>) {
  await page.evaluate(() => document.getElementById("demo")!.scrollIntoView())
  await page.waitForTimeout(600)
  await shadowKeys(page, check)
  await page.locator("[data-demo-takeover]").click()
  await page.waitForTimeout(400)
  const target = page.locator("#msub")
  await target.hover({ position: { x: 40, y: 12 } })
  await page.waitForTimeout(300)
  await target.click({ position: { x: 40, y: 12 } })
  await page.waitForTimeout(400)
  await page.locator("#cmpText").click()
  await page.keyboard.type("Cut the copy, it is cramped")
  check("take over: composer gets every key, C included", (await page.locator("#cmpText").inputValue()) === "Cut the copy, it is cramped")
  await page.locator("#cmpText").press("Control+Enter")
  await page.waitForTimeout(500)
  check("take over: saving counts one note", (await page.locator("#countN").innerText()) === "1 note")
  await page.locator("[data-demo-send]").click()
  check("take over: the agent replies to the visitor's round", await page.waitForFunction(() => /That’s your round/.test(document.querySelector("[data-demo-term]")?.textContent ?? ""), null, { timeout: 30000 }).then(() => true, () => false))
  await page.screenshot({ path: join(out, "desktop-takeover.png") })
  await page.locator("#data").scrollIntoViewIfNeeded()
  await page.locator('#hand .card[data-n="2"]').click({ position: { x: 20, y: 40 } })
  await page.locator('.seg2 [data-view="reads"]').click()
  await page.waitForTimeout(300)
  const dv = await page.evaluate(() => ({ selected: document.querySelector('#hand [aria-selected="true"]')?.getAttribute("data-n"), recHidden: (document.getElementById("rec") as HTMLElement).hidden, readsShown: !(document.getElementById("reads") as HTMLElement).hidden, excerpt: document.getElementById("showEx")!.textContent!.slice(0, 13) }))
  check("notes are data: picking N3 and the agent's view", dv.selected === "2" && dv.recHidden && dv.readsShown && dv.excerpt === "## N3 — fix\n`", dv)
}

async function phoneExtras(page: Page, check: ReturnType<typeof record>) {
  await page.evaluate(() => scrollTo(0, 0))
  await page.waitForTimeout(500)
  check("thumb bar shown at the top", await page.evaluate(() => getComputedStyle(document.querySelector(".tbar")!).opacity === "1"))
  await page.locator(".tb-sec").tap()
  await page.waitForTimeout(600)
  check("sections sheet opens", await page.evaluate(() => getComputedStyle(document.querySelector(".tsheet")!).visibility === "visible"))
  await page.screenshot({ path: join(out, `phone${page.viewportSize()!.width}-sheet.png`) })
  await page.locator('.tsheet a[href="#install"]').tap()
  await page.waitForTimeout(1400)
  const nav = await page.evaluate(() => ({ closed: !document.body.classList.contains("tsheet-on"), installTop: Math.round(document.getElementById("install")!.getBoundingClientRect().top) }))
  check("sheet link closes the sheet and lands on Install", nav.closed && Math.abs(nav.installTop) <= 2, nav)
  await page.locator("#owner").scrollIntoViewIfNeeded()
  await page.locator('.ptabs [data-k="2"]').tap()
  await page.waitForTimeout(900)
  const car = await page.evaluate(() => { const p = document.querySelector(".pairs") as HTMLElement, c = p.children[2] as HTMLElement, pr = p.getBoundingClientRect(), cr = c.getBoundingClientRect(); return { off: Math.round(Math.abs(cr.left + cr.width / 2 - (pr.left + pr.width / 2))), atEnd: p.scrollLeft >= p.scrollWidth - p.clientWidth - 1, pressed: document.querySelector('.ptabs [aria-pressed="true"]')?.getAttribute("data-k") } })
  check("pairing carousel brings the last state as near the centre as it scrolls", (car.off <= 2 || car.atEnd) && car.pressed === "2", car)
  await page.evaluate(() => document.getElementById("demo")!.scrollIntoView())
  await page.waitForTimeout(700)
  const term = await page.evaluate(() => ({ collapsed: !document.querySelector("[data-demo-term]")!.classList.contains("open"), ticker: document.getElementById("tickTx")!.textContent }))
  check("terminal collapses to a ticker", term.collapsed && !!term.ticker, term)
  await shadowKeys(page, check)
  await page.locator("[data-demo-takeover]").tap()
  await page.waitForTimeout(500)
  await page.locator("#msub").tap()
  await page.waitForTimeout(600)
  const cs = await page.evaluate(() => { const c = document.getElementById("cmp")!, w = document.getElementById("win")!.getBoundingClientRect(), b = c.getBoundingClientRect(); return { sheet: c.classList.contains("bsheet"), open: c.classList.contains("on"), inside: b.left >= w.left - 1 && b.right <= w.right + 1 && b.bottom <= w.bottom + 1 && b.top >= w.top } })
  check("composer opens as a sheet inside the browser window", cs.sheet && cs.open && cs.inside, cs)
  await page.locator("#cmpText").tap()
  await page.keyboard.type("Cut the copy, it is cramped")
  check("take over: composer gets every key", (await page.locator("#cmpText").inputValue()) === "Cut the copy, it is cramped")
  await page.locator("#cmpText").press("Control+Enter")
  await page.waitForTimeout(600)
  check("take over: saving counts one note", (await page.locator("#countN").innerText()) === "1 note")
  await page.locator("[data-demo-send]").tap()
  check("take over: the agent replies", await page.waitForFunction(() => /That’s your round/.test(document.querySelector("[data-demo-term]")?.textContent ?? ""), null, { timeout: 30000 }).then(() => true, () => false))
  check("terminal opens on Send", await page.evaluate(() => document.querySelector("[data-demo-term]")!.classList.contains("open")))
}

async function pagingRun(browser: Browser, url: string) {
  const check = record("paging 1440×900")
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errors = track(page)
  await page.goto(url, { waitUntil: "networkidle" })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(800)
  const info = await page.evaluate(() => ({ max: document.documentElement.scrollHeight - innerHeight, secs: [...document.querySelectorAll("#home > section")].map((s) => ({ id: s.id, top: Math.round(s.getBoundingClientRect().top + scrollY), h: Math.round(s.getBoundingClientRect().height) })) }))
  const pages = info.secs.map((s) => Math.min(s.top, info.max))
  if (pages[pages.length - 1]! < info.max - 1) pages.push(info.max)
  const topOf = (id: string) => info.secs.find((s) => s.id === id)!.top
  check("every section is one viewport tall", info.secs.every((s) => s.h === 900), info.secs.filter((s) => s.h !== 900))
  await page.mouse.move(60, 450)
  const log: string[] = []
  let at = 0, ok = 0, total = 0
  const gesture = async (kind: "notch" | "trackpad", dir: 1 | -1) => {
    if (kind === "notch") await page.mouse.wheel(0, 100 * dir)
    else {
      for (const d of [2, 5, 9, 14, 18, 16, 12]) { await page.mouse.wheel(0, d * dir); await page.waitForTimeout(16) }
      for (let v = 11; v >= 1; v -= 0.45) { await page.mouse.wheel(0, Math.round(v) * dir); await page.waitForTimeout(16) }
    }
    const y = await settle(page)
    const want = pages[Math.max(0, Math.min(pages.length - 1, at + dir))]!
    total++
    if (y === want) ok++
    log.push(`${kind}${dir > 0 ? "↓" : "↑"}${y}${y === want ? "" : `≠${want}`}`)
    at = pages.indexOf(y) >= 0 ? pages.indexOf(y) : at
  }
  for (let i = 0; i < 4; i++) await gesture("notch", 1)
  while (at < pages.length - 1) await gesture("trackpad", 1)
  await gesture("trackpad", 1)
  for (let i = 0; i < 3; i++) await gesture("trackpad", -1)
  for (let i = 0; i < 2; i++) await gesture("notch", -1)
  check(`wheel: ${ok}/${total} gestures land on a section top`, ok === total, log.join(" "))

  await page.evaluate(() => scrollTo(0, 0))
  await settle(page)
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  const keyLog: string[] = []
  let kOk = 0
  const key = async (k: string, want: number) => { await page.keyboard.press(k); const y = await settle(page); keyLog.push(`${k}:${y}${y === want ? "" : `≠${want}`}`); if (y === want) kOk++ }
  await key("PageDown", pages[1]!); await key("ArrowDown", pages[2]!); await key("Space", pages[3]!); await key("Shift+Space", pages[2]!); await key("PageUp", pages[1]!); await key("End", pages[pages.length - 1]!); await key("Home", 0)
  const keysIdx = info.secs.findIndex((s) => s.id === "keys")
  await page.evaluate((y) => scrollTo(0, y), pages[keysIdx]!); await settle(page)
  await page.evaluate(() => document.querySelector("#cmp")!.classList.add("on", "scripted"))
  await key("ArrowDown", pages[keysIdx]!); await key("PageDown", pages[keysIdx + 1]!)
  check(`keyboard: ${kOk}/${keyLog.length} keys land on a section top, the demo's scripted composer open or not`, kOk === keyLog.length, keyLog.join(" "))
  await page.evaluate(() => { document.querySelector("#cmp")!.classList.remove("scripted"); addEventListener("keydown", (e) => { (window as unknown as { __kept: boolean }).__kept = !e.defaultPrevented }) })
  await page.keyboard.press("PageDown")
  check("the pager leaves keys alone while a visitor's composer is open", await page.evaluate(() => (window as unknown as { __kept: boolean }).__kept))
  await settle(page)
  await page.evaluate(() => document.querySelector("#cmp")!.classList.remove("on"))

  await page.evaluate(() => scrollTo(0, 0)); await settle(page)
  await page.locator('.dots a[href="#install"]').click()
  const yI = await settle(page)
  await page.locator('.dots a[href="#faq"]').click()
  const yF = await settle(page)
  check("dots land on Install and Questions", yI === topOf("install") && yF === Math.min(topOf("faq"), info.max), { yI, yF })
  check("current dot follows", (await page.evaluate(() => document.querySelector('.dots a[aria-current="true"]')?.getAttribute("href"))) === "#faq")

  const demoTop = topOf("demo")
  await page.evaluate((y) => scrollTo(0, y), demoTop); await settle(page)
  await page.evaluate(() => { const c = document.getElementById("chat")!; for (let i = 0; i < 40; i++) { const d = document.createElement("div"); d.className = "ln"; d.textContent = `filler line ${i}`; c.append(d) } c.scrollTop = 0 })
  const cb = (await page.locator("#chat").boundingBox())!
  await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2)
  for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(60) }
  await page.waitForTimeout(400)
  const inside = await page.evaluate((y) => ({ chatScrolled: document.getElementById("chat")!.scrollTop > 0, pageStayed: Math.round(scrollY) === y }), demoTop)
  check("a terminal that can scroll takes the wheel", inside.chatScrolled && inside.pageStayed, inside)
  await page.evaluate(() => { const c = document.getElementById("chat")!; c.scrollTop = c.scrollHeight })
  await page.waitForTimeout(400)
  await page.mouse.wheel(0, 120)
  check("at the terminal's end the page takes over", (await settle(page)) === topOf("how"))

  await page.goto(`${url}#ssh`, { waitUntil: "networkidle" })
  await page.waitForTimeout(1500)
  check("loading with #ssh lands on its top", (await page.evaluate(() => Math.round(document.getElementById("ssh")!.getBoundingClientRect().top))) === 0)
  check("no console errors or failed requests", errors.length === 0, errors)
  await ctx.close()

  for (const [w, h, want] of [[1440, 760, true], [1280, 720, false]] as const) {
    const c = await browser.newContext({ viewport: { width: w, height: h } })
    const p = await c.newPage()
    await p.goto(url, { waitUntil: "networkidle" })
    await p.evaluate(() => document.fonts.ready)
    await p.waitForTimeout(600)
    const r = await p.evaluate(() => ({ paged: document.documentElement.classList.contains("paged"), tallest: Math.max(...[...document.querySelectorAll("#home > section")].map((s) => Math.round(s.getBoundingClientRect().height))) }))
    check(`${w}×${h}: paging ${want ? "on, every section fits" : "off, a section is taller than the viewport"}`, r.paged === want && (want ? r.tallest <= h : r.tallest > h), r)
    await c.close()
  }
}

async function reducedRun(browser: Browser, url: string) {
  for (const [tag, w, h, touch] of [["desktop", 1440, 900, false], ["phone", 390, 844, true]] as const) {
    const check = record(`reduced motion ${tag} ${w}×${h}`)
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce", hasTouch: touch, isMobile: touch })
    await ctx.addInitScript(LONGTASKS)
    const page = await ctx.newPage()
    const errors = track(page)
    await page.goto(url, { waitUntil: "networkidle" })
    await page.waitForTimeout(1000)
    check("hero pins placed at once", (await page.locator("#hpins .pin").count()) === 4)
    check("no paging", !(await page.evaluate(() => document.documentElement.classList.contains("paged"))))
    check("no snapping", (await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)) === "none")
    await page.evaluate(() => document.getElementById("demo")!.scrollIntoView())
    await page.waitForTimeout(1500)
    check("demo shows its end state", /is done/.test(await status(page)), await status(page))
    await page.screenshot({ path: join(out, `reduced-${tag}.png`) })
    check("headline rewritten", (await page.locator("#mh1 .v:not([aria-hidden])").innerText()) === HEADLINE)
    check("Astro chip straight", !(await page.locator("#mastro").evaluate((el) => el.classList.contains("tilt"))))
    const y = await page.evaluate(() => scrollY)
    await page.mouse.wheel(0, 100)
    await page.waitForTimeout(400)
    check("the wheel scrolls natively", (await page.evaluate(() => scrollY)) > y)
    const lt = await page.evaluate(() => (window as unknown as { __lt: number[] }).__lt)
    check("no main-thread task over 50 ms", lt.every((d) => d <= 50), lt)
    check("no console errors or failed requests", errors.length === 0, errors)
    await ctx.close()
  }
}

const SIZES: Record<string, Size> = {
  desktop: { tag: "desktop", w: 1440, h: 900, touch: false },
  desktop760: { tag: "desktop760", w: 1440, h: 760, touch: false },
  phone390: { tag: "phone390", w: 390, h: 844, touch: true },
  phone360: { tag: "phone360", w: 360, h: 780, touch: true },
  landscape: { tag: "landscape", w: 844, h: 390, touch: true },
}
const server = serveDist()
const browser = await chromium.launch()
try {
  for (const run of runs) {
    const size = SIZES[run]
    if (size) {
      const extras = size.touch ? (size.w < 640 ? phoneExtras : undefined) : desktopExtras
      for (const theme of ["light", "dark"] as const) await baseRun(browser, server.url, size, theme, extras)
    } else if (run === "paging") await pagingRun(browser, server.url)
    else if (run === "reduced") await reducedRun(browser, server.url)
    else throw new Error(`unknown run ${run}`)
  }
} finally {
  await browser.close()
  server.stop()
}
let failed = 0
for (const { run, checks } of results) {
  const bad = checks.filter((c) => !c.ok)
  failed += bad.length
  console.log(`${run}: ${checks.length - bad.length}/${checks.length} pass`)
  for (const c of bad) console.log(`  FAIL ${c.name}: ${JSON.stringify(c.detail)}`)
}
console.log(`screenshots in ${out}; base path ${BASE_PATH}`)
process.exit(failed ? 1 : 0)
