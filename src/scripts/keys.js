import { $, forPage, playGlyph } from "./dom.js"

document.addEventListener("keydown", (e) => {
  if (!forPage(e)) return
  const cap = $(`.cap[data-key="${CSS.escape(e.key.toLowerCase())}"]`) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" ? $('.cap[data-key="k"]') : null)
  if (!cap) return
  cap.classList.add("down"); setTimeout(() => cap.classList.remove("down"), 160)
  playGlyph(cap.closest(".ik"))
})
