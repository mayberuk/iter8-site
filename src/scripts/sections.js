import { $, $$ } from "./dom.js"
import { route } from "./pager.js"
import "./blueprint.js"

const dotsEl = $(".dots"), tbar = $(".tbar"), tsheet = $("#tsheet"), tscrim = $(".tscrim")
const DOTS = $$("a", dotsEl).map((a) => [a.hash.slice(1), a.getAttribute("aria-label"), a.className])

dotsEl.addEventListener("click", (e) => { const a = e.target.closest("a"); if (a && a.hash === location.hash) { e.preventDefault(); route() } })
const tbBtn = $(".tb-sec", tbar)
function tsheetOpen(on) { document.body.classList.toggle("tsheet-on", on); tbBtn.setAttribute("aria-expanded", String(on)); if (on) ($('[aria-current="true"]', tsheet) || $("a", tsheet)).focus() }
tbBtn.addEventListener("click", () => tsheetOpen(true))
tscrim.addEventListener("click", () => tsheetOpen(false))
tsheet.addEventListener("click", (e) => { const a = e.target.closest("a"); if (!a) return; tsheetOpen(false); if (a.getAttribute("href") === location.hash) { e.preventDefault(); route() } })
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && document.body.classList.contains("tsheet-on")) { tsheetOpen(false); tbBtn.focus() } })
const dotIO = new IntersectionObserver((es) => {
  for (const e of es) {
    if (!e.isIntersecting) continue
    for (const a of [...dotsEl.children, ...$$("a[href^='#']", tsheet)]) a.setAttribute("aria-current", String(a.hash === `#${e.target.id}`))
    const d = DOTS.find(([id]) => id === e.target.id)
    $("span", tbBtn).textContent = d[1]; $(".hue", tbBtn).className = `hue ${d[2]}`
  }
}, { rootMargin: "-50% 0px -50% 0px" })
for (const [id] of DOTS) dotIO.observe(document.getElementById(id))
