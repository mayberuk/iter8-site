import { $, clamp, esc } from "./dom.js"

const tip = $("#tip")
export function tipHtml(raw) { const [a, k] = raw.split("|"); return `${esc(a)}${k ? ` <kbd>${esc(k)}</kbd>` : ""}` }
export function showTip(el, html) {
  tip.innerHTML = html
  tip.classList.add("on")
  const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight
  const x = clamp(r.left + r.width / 2 - w / 2, 8, innerWidth - w - 8)
  const y = r.top - h - 10 > 8 ? r.top - h - 10 : r.bottom + 10
  tip.style.left = `${x}px`; tip.style.top = `${y}px`
}
export const hideTip = () => tip.classList.remove("on")
let tipTimer = 0
export function flashTip(el, text, ms) { if (!el) return; showTip(el, esc(text)); clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, ms) }
document.addEventListener("mouseover", (e) => { const t = e.target.closest("[data-tip]"); if (t && !(t.classList.contains("spk") && !t.classList.contains("on"))) showTip(t, tipHtml(t.dataset.tip)) })
document.addEventListener("mouseout", (e) => { if (e.target.closest("[data-tip]")) hideTip() })
