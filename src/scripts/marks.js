import { $, box } from "./dom.js"

const ringPrev = new Map()
export function ringTo(el, r) {
  const b = box(el), p = 3, t = { x: b.x - p, y: b.y - p, w: b.w + p * 2, h: b.h + p * 2 }, prev = ringPrev.get(r)
  r.querySelector(".wtag").textContent = Math.round(b.w)
  r.querySelector(".htag").textContent = Math.round(b.h)
  r.style.transition = "none"
  r.style.width = `${t.w}px`; r.style.height = `${t.h}px`
  if (prev && r.classList.contains("on")) {
    r.style.transform = `translate(${prev.x}px,${prev.y}px) scale(${prev.w / t.w},${prev.h / t.h})`
    void r.offsetWidth
    r.style.transition = ""
  }
  r.style.transform = `translate(${t.x}px,${t.y}px)`
  requestAnimationFrame(() => { r.style.transition = "" })
  r.classList.add("on")
  ringPrev.set(r, t)
}
export const ringOff = (r) => { r.classList.remove("on"); ringPrev.delete(r) }
export function cursorAt(x, y, c) { c.style.transform = `translate(${x - 3}px,${y - 2}px)` }
export function tap(c) { const t = $(".tap", c); t.classList.remove("go"); void t.offsetWidth; t.classList.add("go") }
