import { $, $$, box } from "./dom.js"

const bpEl = $(".bp")
let bpSecs = [], bpL = 0, bpR = 0
function bpBuild() {
  bpSecs = []
  if (innerWidth <= 1180) { bpEl.innerHTML = ""; return }
  const wrap = $("#top .wrap"), wb = box(wrap), pad = Math.round(parseFloat(getComputedStyle(wrap).paddingLeft)), H = document.documentElement.scrollHeight
  bpL = Math.round(wb.x); bpR = Math.round(wb.x + wb.w)
  let h = `<i class="g" style="left:${bpL}px;height:${H}px"></i><i class="g" style="left:${bpR}px;height:${H}px"></i>`
  for (const sec of $$("#home > section")) {
    const sb = box(sec), gap = Math.round(box($(".wrap > *", sec)).y - sb.y)
    bpSecs.push({ top: sb.y, bottom: sb.y + sb.h })
    h += `<div class="s" style="position:absolute;left:0;top:${Math.round(sb.y)}px"><i class="x" style="left:${bpL}px;top:0"></i><i class="x" style="left:${bpR}px;top:0"></i>`
      + `<span class="d v" style="left:${bpL}px;top:0;height:${gap}px"><b>${gap}</b></span>`
      + `<span class="d h" style="left:${bpL}px;top:${gap}px;width:${pad}px"><b>${pad}</b></span><span class="d h" style="left:${bpR - pad}px;top:${gap}px;width:${pad}px"><b>${pad}</b></span></div>`
  }
  bpEl.innerHTML = h
}
export function bpNear(x, y) {
  const k = bpSecs.findIndex((s) => y >= s.top && y < s.bottom)
  const near = k >= 0 && y - bpSecs[k].top < 460 && (Math.abs(x - bpL) < 170 || Math.abs(x - bpR) < 170)
  $$(".s", bpEl).forEach((g, i) => g.classList.toggle("near", near && i === k))
}
let bpRaf = 0, bpPt = null
document.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse" || !bpSecs.length) return
  bpPt = e
  if (bpRaf) return
  bpRaf = requestAnimationFrame(() => { bpRaf = 0; bpNear(bpPt.pageX, bpPt.pageY) })
})
let bpQueued = 0
const rebuild = () => { cancelAnimationFrame(bpQueued); bpQueued = requestAnimationFrame(bpBuild) }
addEventListener("resize", rebuild)
new ResizeObserver(rebuild).observe($("#home"))
if (document.fonts) document.fonts.ready.then(bpBuild)
