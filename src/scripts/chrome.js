import { icon, sg } from "../glyphs"
import { $, $$, MOD, playGlyph } from "./dom.js"
import { flashTip } from "./tip.js"

for (const el of $$("[data-mod]")) if (MOD !== "⌘") el.textContent = MOD

const themeSw = $("#themeSw"), darkMQ = matchMedia("(prefers-color-scheme: dark)")
function applyTheme(t, save) {
  document.documentElement.dataset.theme = t
  for (const o of $$("[data-theme-set]")) o.setAttribute("aria-checked", String(o.dataset.themeSet === t))
  themeSw.setAttribute("aria-checked", String(t === "dark" || (t === "auto" && darkMQ.matches)))
  if (save) try { localStorage.setItem("iter8-theme", t) } catch {}
}
themeSw.addEventListener("click", () => applyTheme(themeSw.getAttribute("aria-checked") === "true" ? "light" : "dark", true))
for (const b of $$("[data-theme-set]")) b.addEventListener("click", () => applyTheme(b.dataset.themeSet, true))
darkMQ.addEventListener("change", () => applyTheme(document.documentElement.dataset.theme, false))
try { applyTheme(localStorage.getItem("iter8-theme") || "light", false) } catch { applyTheme("light", false) }

for (const b of $$("[data-copy]")) b.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy) } catch { const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); const s = getSelection(); s.removeAllRanges(); s.addRange(r) }
  const step = b.closest(".step"), sn = step && $(".sn", step)
  if (sn && !sn.classList.contains("done")) { sn.classList.add("done"); sn.innerHTML = sg("done") }
  const old = b.innerHTML; b.innerHTML = icon("check", 15); b.style.color = "var(--keep)"
  flashTip(b, "Copied", 1200)
  setTimeout(() => { b.innerHTML = old; b.style.color = "" }, 1400)
})

const io = new IntersectionObserver((es) => { for (const e of es) {
  e.target.classList.toggle("in", e.isIntersecting || e.target.classList.contains("data") && e.target.classList.contains("in"))
} }, { threshold: 0.2 })
for (const s of $$(".reveal")) io.observe(s)

for (const s of $$("#sig > span")) s.addEventListener("mouseenter", () => playGlyph(s))

const siteH = $(".site")
const floatH = () => siteH.classList.toggle("float", scrollY > 12)
addEventListener("scroll", floatH, { passive: true })
floatH()
