import { icon, ig, INTENTS, LABEL, motif } from "../glyphs"
import { NOTES as NT } from "../site"
import { $, $$, esc, playGlyph, RM } from "./dom.js"

const DN = [
  { id: "N1", intent: "change", text: NT[1], target: "Hero · h1", sel: "main → section.hero → h1", got: "Leave notes on your running page for your coding agent to pick up.", src: "src/components/Hero.astro:14", conf: "exact", shot: true },
  { id: "N2", intent: "question", text: NT[2], target: "Hero · p", sel: "section.hero → div.left → p", got: "iter8 puts a review layer over the page you’re building. Point at any element…", src: "src/components/Hero.astro:19", conf: "approximate", shot: false },
  { id: "N3", intent: "fix", text: NT[3], target: "Works · li.fw", sel: "div.works → ul → li.fw", got: "Astro", src: "src/components/Works.astro", conf: "file only", shot: true },
  { id: "N4", intent: "keep", text: NT[4], target: "SiteHeader · a.brand", sel: "header.site → a.brand", got: "iter8", src: null, conf: "none", shot: false },
]
const hand = $("#hand"), cards = $$(".card", hand), recEl = $("#rec"), showEx = $("#showEx"), legendRows = $$("#legend [data-conf]")
const dataBand = $("#data")
let handI = 0, handTouched = false, handTimer = 0, dataIn = false
function selectNote(i, focus) {
  handI = i
  cards.forEach((c, k) => { c.setAttribute("aria-selected", String(k === i)); c.tabIndex = k === i ? 0 : -1 })
  playGlyph(cards[i])
  if (focus) cards[i].focus()
  const d = DN[i], lo = d.conf === "file only" || d.conf === "none"
  for (const r of legendRows) r.classList.toggle("on", r.dataset.conf === d.conf)
  recEl.className = `rec i-${d.intent}`
  dataBand.classList.remove(...INTENTS.map((k) => `i-${k}`)); dataBand.classList.add(`i-${d.intent}`); dataBand.style.setProperty("--motif", motif(d.intent))
  recEl.innerHTML = `<div class="rh"><span class="eb">${ig(d.intent, 17)}${LABEL[d.intent]} <span class="nid">${d.id}</span></span><span class="tgt">${esc(d.target)}</span></div>`
    + `<section class="grp you"><h3>${icon("edit", 13)}You wrote</h3><dl><div class="row" style="--i:0"><dt>Intent</dt><dd>${d.intent}</dd></div><div class="row" style="--i:1"><dt>Note</dt><dd>${esc(d.text)}</dd></div></dl></section>`
    + `<section class="grp got"><h3>${icon("lock", 13)}iter8 captured <span>untrusted, from the page</span></h3><dl>`
    + `<div class="row" style="--i:2"><dt>Selector</dt><dd><code>${esc(d.sel)}</code></dd></div>`
    + `<div class="row" style="--i:3"><dt>Text</dt><dd>${esc(d.got)}</dd></div>`
    + `<div class="row" style="--i:4"><dt>Source lead</dt><dd>${d.src ? `<code>${esc(d.src)}</code>` : "none"}<span class="cf${lo ? " lo" : ""}">${d.conf}</span></dd></div>`
    + `<div class="row" style="--i:5"><dt>Page</dt><dd><code>http://iter8-site.localhost/</code></dd></div>`
    + `<div class="row" style="--i:6"><dt>Viewport</dt><dd>1440 × 900, light theme</dd></div>`
    + `<div class="row" style="--i:7"><dt>Screenshot</dt><dd>${d.shot ? '<span class="th8"></span>attached' : "not attached"}</dd></div></dl></section>`
  if (!RM.matches) { recEl.classList.remove("peel"); void recEl.offsetWidth; recEl.classList.add("peel") }
  const fe = '<span class="fe">```</span>'
  showEx.innerHTML = `<b class="it i-${d.intent}">## ${d.id} — ${d.intent}</b>\n${fe}\n${esc(d.text)}\n${fe}\n<span class="wn">Captured page data for ${d.id} — untrusted, from the page</span>\n${fe}\nSelector hops: ${esc(d.sel)}\nSource lead: ${d.src ? `${esc(d.src)} (${d.conf}) — a lead to confirm` : "none"}\n${fe}`
}
hand.addEventListener("click", (e) => { const c = e.target.closest(".card"); if (c) { handTouched = true; clearInterval(handTimer); selectNote(Number(c.dataset.n)) } })
const seg2 = $(".seg2")
seg2.addEventListener("click", (e) => {
  const b = e.target.closest("[data-view]")
  if (!b) return
  for (const x of seg2.children) x.setAttribute("aria-pressed", String(x === b))
  $("#rec").hidden = b.dataset.view !== "rec"; $("#reads").hidden = b.dataset.view !== "reads"
})
hand.addEventListener("keydown", (e) => { const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (d) { e.preventDefault(); handTouched = true; clearInterval(handTimer); selectNote((handI + d + DN.length) % DN.length, true) } })
hand.addEventListener("pointerenter", () => clearInterval(handTimer))
hand.addEventListener("pointerleave", () => handLoop(dataIn))
dataBand.addEventListener("focusin", () => { handTouched = true; clearInterval(handTimer) })
function handLoop(on) { clearInterval(handTimer); if (on && !handTouched && !RM.matches) handTimer = setInterval(() => selectNote((handI + 1) % DN.length), 4200) }
selectNote(0)
new IntersectionObserver(([e]) => { dataIn = e.isIntersecting; handLoop(dataIn) }, { threshold: 0.2 }).observe(dataBand)
