import { $, $$, forPage, RM } from "./dom.js"
import { hideTip } from "./tip.js"

// One wheel or trackpad gesture moves exactly one section. With CSS mandatory snapping alone, Chrome
// snapped a wheel notch or a short trackpad swipe back to the section it started from.
const PAGED = matchMedia("(min-width:961px) and (min-height:700px) and (prefers-reduced-motion:no-preference)")
let paging = false, pages = [], locked = false, moving = false, lastWheel = 0, wheelSum = 0, settleTimer = 0, innerWheel = 0
export function pagerSync() {
  const secs = $$("#home > section")
  paging = PAGED.matches && secs.every((sec) => sec.offsetHeight <= innerHeight + 1)
  document.documentElement.classList.toggle("paged", paging)
  const max = document.documentElement.scrollHeight - innerHeight
  pages = paging ? secs.map((sec) => Math.min(Math.round(sec.getBoundingClientRect().top + scrollY), max)) : []
  if (paging && pages[pages.length - 1] < max - 1) pages.push(max)
}
function pageStep(dir) {
  if (dir > 0) { const i = pages.findIndex((top) => top > scrollY + 2); return i < 0 ? -1 : i }
  for (let i = pages.length - 1; i >= 0; i--) if (pages[i] < scrollY - 2) return i
  return -1
}
function release() {
  const quiet = performance.now() - lastWheel
  if (quiet >= 200) locked = false
  else setTimeout(release, 205 - quiet)
}
function goPage(i) {
  if (i < 0 || i >= pages.length || Math.abs(pages[i] - scrollY) < 2) return
  locked = true; moving = true
  scrollTo({ top: pages[i], behavior: "smooth" })
  clearTimeout(settleTimer)
  settleTimer = setTimeout(() => { if (moving) { moving = false; release() } }, 1400)
}
addEventListener("scrollend", () => { if (moving) { moving = false; clearTimeout(settleTimer); release() } })
function scrollsInside(e) {
  for (const el of e.composedPath()) {
    if (el === document.body || el === document.documentElement) return false
    if (el instanceof Element && el.scrollHeight > el.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(el).overflowY)
      && (e.deltaY > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0)) return true
  }
  return false
}
// A wheel event pages wherever the pointer is, over another tool's overlay too, unless something under it
// can still scroll that way. A gesture that began scrolling inside stays there to its end.
addEventListener("wheel", (e) => {
  if (!paging || e.ctrlKey || !e.cancelable) return
  const now = performance.now(), gap = now - lastWheel
  if (gap > 200 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
  if (scrollsInside(e) || now - innerWheel < 200) { innerWheel = now; return }
  e.preventDefault()
  lastWheel = now
  if (locked) return
  if (gap > 200) wheelSum = 0
  wheelSum += e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1)
  if (Math.abs(wheelSum) < 12) return
  const dir = Math.sign(wheelSum)
  wheelSum = 0
  goPage(pageStep(dir))
}, { passive: false })
document.addEventListener("keydown", (e) => {
  if (!paging || e.altKey || e.ctrlKey || e.metaKey || demoHasKeys() || !forPage(e)) return
  const t = e.composedPath()[0], k = e.key
  const onKeys = Math.abs(pages[$$("#home > section").indexOf($("#keys"))] - scrollY) < 2
  if (k === " " && t instanceof Element && t.closest("button, a, summary, [role]")) return
  // On the Keys section these keys press the keycaps on screen; Page Up and Page Down still move.
  if (onKeys && (k === "ArrowDown" || k === "ArrowUp" || k === " ")) { e.preventDefault(); return }
  let to = -1
  if (k === "PageDown" || k === "ArrowDown" || (k === " " && !e.shiftKey)) to = pageStep(1)
  else if (k === "PageUp" || k === "ArrowUp" || (k === " " && e.shiftKey)) to = pageStep(-1)
  else if (k === "Home") to = 0
  else if (k === "End") to = pages.length - 1
  else return
  e.preventDefault()
  if (!locked) goPage(to)
})

const demoHasKeys = () => $("[data-demo-takeover]").getAttribute("aria-pressed") === "true" || !!$("#cmp.on:not(.scripted)")

export function route() {
  hideTip()
  pagerSync()
  const h = decodeURIComponent(location.hash.slice(1)), t = h && document.getElementById(h), k = t ? $$("#home > section").indexOf(t) : -1
  if (t && paging && k >= 0) goPage(k)
  else if (t) t.scrollIntoView({ behavior: RM.matches ? "auto" : "smooth" })
}
addEventListener("hashchange", route)
let rz = 0
const sync = () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(pagerSync) }
addEventListener("resize", sync)
new ResizeObserver(sync).observe($("#home"))
PAGED.addEventListener("change", pagerSync)
if (document.fonts) document.fonts.ready.then(pagerSync)
route()
