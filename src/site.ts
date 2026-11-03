export const GITHUB = "https://github.com/mayberuk/iter8"
export const MARKETPLACE_CMD = "/plugin marketplace add"
export const MARKETPLACE_ARGS = "mayberuk/iter8"
export const MARKETPLACE = `${MARKETPLACE_CMD} ${MARKETPLACE_ARGS}`
export const INSTALL_CMD = "/plugin install"
export const INSTALL_ARGS = "iter8@iter8"
export const INSTALL = `${INSTALL_CMD} ${INSTALL_ARGS}`
export const SSH_HOST = "my-server"
export const BASE = import.meta.env.BASE_URL

export const NOTES = {
  1: "Make this shorter. Lead with what you do: point, say, send.",
  2: "Does this work when the dev server runs on a remote machine?",
  3: "The Astro chip is misaligned. It overlaps the row.",
  4: "Love this logo. Keep it exactly as is.",
}
export const N2_REPLY = `Yes. Run <code>iter8 setup ${SSH_HOST}</code> once on your laptop. It keeps an SSH tunnel up from login, so pages served on the remote machine open here.`
