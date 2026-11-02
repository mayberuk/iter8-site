import { $, box, CANCEL, RM, seen, STEPS } from "./dom.js"
import { bpNear } from "./blueprint.js"
import { cursorAt, ringOff, ringTo, tap } from "./marks.js"

const hring = $("#hring"), hcur = $("#hcur"), hpinsEl = $("#hpins")
const HERO = [["#h1", "change", 0.2, 0.55], ["#sub", "question", 0.3, 0.4], ["#hastro", "fix", 0.5, 0.5], ["#hbox", "keep", 0.32, 0.5]]
let htoken = 0, heroDone = false, heroRunning = false
const hw = (ms, t) => new Promise((res, rej) => setTimeout(() => (t === htoken ? res() : rej(CANCEL)), ms))
function heroPinXY(el) { const b = box(el); if (el.matches(".fw")) return { x: b.x + b.w - 3, y: b.y - 10 }; return b.x - 13 >= scrollX + 13 ? { x: b.x - 13, y: b.y + 11 } : { x: b.x + b.w - 12, y: b.y - 12 } }
function placeHeroPins() { for (const p of hpinsEl.children) { const { x, y } = heroPinXY($(p.dataset.for)); p.style.transform = `translate(${x}px,${y}px)` } }
function heroPin(sel, intent, k, still) {
  const p = document.createElement("div")
  p.className = `pp hp i-${intent}`; p.dataset.for = sel
  p.innerHTML = `<i class="land${still ? "" : " go"}"></i><span class="pin ${intent}${still ? "" : " drop"}">${k}</span>`
  hpinsEl.append(p); placeHeroPins()
}
async function heroRound() {
  const t = ++htoken
  hpinsEl.innerHTML = ""
  if (RM.matches) { HERO.forEach(([sel, intent], i) => heroPin(sel, intent, i + 1, true)); heroDone = true; return }
  heroRunning = true
  try {
    const h = box($("#h1"))
    hcur.style.transitionDuration = "0ms"; cursorAt(h.x + h.w * 0.62, h.y + h.h + 150, hcur); void hcur.offsetWidth
    hcur.classList.add("on"); await hw(500, t)
    for (const [i, [sel, intent, fx, fy]] of HERO.entries()) {
      const el = $(sel), b = box(el)
      hcur.style.transitionDuration = "950ms, .2s"; cursorAt(b.x + b.w * fx, b.y + b.h * fy, hcur); bpNear(b.x, b.y)
      await hw(950, t); ringTo(el, hring); await hw(750, t)
      tap(hcur); heroPin(sel, intent, i + 1); await hw(1000, t)
    }
    ringOff(hring); bpNear(-1e4, -1e4)
    const e = box($("#hbox")); hcur.style.transitionDuration = "1300ms, .2s"; cursorAt(e.x + e.w + 60, e.y + e.h + 70, hcur)
    await hw(1400, t); hcur.classList.remove("on"); heroDone = true
  } catch (err) { if (err !== CANCEL) throw err } finally { if (t === htoken) heroRunning = false }
}
function heroStop() { htoken++; heroRunning = false; ringOff(hring); hcur.classList.remove("on") }
new IntersectionObserver(([e]) => {
  if (!seen(e, 0.5)) { if (heroRunning) heroStop() }
  else if (!heroDone && !heroRunning) heroRound()
}, { threshold: STEPS }).observe($("#top"))

let rz = 0
addEventListener("resize", () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(placeHeroPins) })
let roQueued = 0
new ResizeObserver(() => { cancelAnimationFrame(roQueued); roQueued = requestAnimationFrame(placeHeroPins) }).observe($("#home"))
