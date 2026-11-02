/// <reference types="bun" />
import { join, resolve } from "node:path"

export const BASE_PATH = "/iter8-site/"
const root = resolve(import.meta.dir, "../dist")

/** Serves dist/ under the GitHub Pages base path, so asset and link paths are tested as deployed. */
export function serveDist() {
  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    async fetch(req) {
      const { pathname } = new URL(req.url)
      if (!pathname.startsWith(BASE_PATH)) return new Response("not found", { status: 404 })
      let rel = decodeURIComponent(pathname.slice(BASE_PATH.length))
      if (rel === "" || rel.endsWith("/")) rel += "index.html"
      const path = join(root, rel)
      const file = Bun.file(path)
      if (!path.startsWith(root) || !(await file.exists())) return new Response("not found", { status: 404 })
      return new Response(file)
    },
  })
  return { url: `http://127.0.0.1:${server.port}${BASE_PATH}`, stop: () => server.stop(true) }
}
