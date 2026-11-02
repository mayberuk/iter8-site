export const $ = (s, r = document) => r.querySelector(s)
export const $$ = (s, r = document) => [...r.querySelectorAll(s)]
export const RM = matchMedia("(prefers-reduced-motion: reduce)")
export const PHONE = matchMedia("(max-width:640px), (max-height:500px) and (max-width:960px)")
export const MOD = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"
export const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])
export const CANCEL = Symbol("cancel")

// The overlay layer spans the document, so boxes are in page coordinates.
export const box = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height } }
export const center = (el, fx = 0.5, fy = 0.5) => { const b = box(el); return { x: b.x + b.w * fx, y: b.y + b.h * fy } }
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

export const STEPS = Array.from({ length: 21 }, (_, i) => i / 20)
export const seen = (e, part) => e.isIntersecting && (e.intersectionRatio >= part || e.intersectionRect.height >= innerHeight * 0.6)

// A key event from inside a shadow root reaches document retargeted to its host, so e.target never
// shows the text field. Only composedPath()[0] does, and only for open roots.
export function forPage(e) {
  const t = e.composedPath()[0]
  if (t === document || t === document.body || t === document.documentElement) return true
  if (!(t instanceof Element) || !t.closest("[data-site]")) return false
  return !t.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")
}

export function playGlyph(host) { if (!host) return; host.classList.remove("play"); void host.offsetWidth; host.classList.add("play") }
