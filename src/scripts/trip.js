import { $, $$, RM } from "./dom.js"

const trip = $("#trip"), rider = $("#rider"), stops = $$(".stop", trip), segs = $$(".groove i", trip)
let tripI = -1, tripTimer = 0
function tripTo(i) {
  stops.forEach((s, k) => { s.classList.toggle("on", k === i); s.classList.toggle("past", k < i) })
  segs.forEach((g, k) => g.classList.toggle("on", k < i))
  rider.classList.toggle("done", i === stops.length - 1)
  const tok = $(".tok", stops[i]), tr = trip.getBoundingClientRect(), r = tok.getBoundingClientRect()
  const vertical = stops.length > 1 && Math.abs(stops[0].getBoundingClientRect().left - stops[1].getBoundingClientRect().left) < 4
  rider.style.transform = vertical ? `translateY(${r.top - tr.top + r.height / 2 - 14}px)` : `translateX(${r.left - tr.left + r.width / 2}px)`
  const inner = rider.firstChild; inner.classList.remove("hopper"); void inner.offsetWidth; inner.classList.add("hopper")
  const g = $(".sg", tok); if (g) { const c = g.cloneNode(true); g.replaceWith(c) }
}
function tripLoop() { clearTimeout(tripTimer); if (RM.matches) { tripTo(stops.length - 1); return } tripI = (tripI + 1) % stops.length; tripTo(tripI); tripTimer = setTimeout(tripLoop, tripI === stops.length - 1 ? 2600 : 1500) }
new IntersectionObserver(([e]) => { if (e.isIntersecting) tripLoop(); else clearTimeout(tripTimer) }, { threshold: 0.2 }).observe($("#how"))
