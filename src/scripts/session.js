import { $, RM } from "./dom.js"

const ptabs = $(".ptabs"), pairsEl = $(".pairs")
ptabs.addEventListener("click", (e) => {
  const b = e.target.closest("button"), card = b && pairsEl.children[Number(b.dataset.k)]
  if (card) pairsEl.scrollTo({ left: card.offsetLeft - (pairsEl.clientWidth - card.offsetWidth) / 2, behavior: RM.matches ? "auto" : "smooth" })
})
pairsEl.addEventListener("scroll", () => {
  const mid = pairsEl.scrollLeft + pairsEl.clientWidth / 2
  let k = 0
  ;[...pairsEl.children].forEach((c, i) => { if (c.offsetLeft <= mid) k = i })
  for (const b of ptabs.children) b.setAttribute("aria-pressed", String(Number(b.dataset.k) === k))
}, { passive: true })
