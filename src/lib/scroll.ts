/**
 * The app does not scroll the browser window: AppLayout scrolls its <main id="app-scroll"> pane, so
 * window.scrollTo() does nothing. Use this to bring the content back to the top (page change, result shown).
 */
export function scrollAppToTop(smooth = false) {
  const behavior: ScrollBehavior = smooth ? "smooth" : "auto"
  document.getElementById("app-scroll")?.scrollTo({ top: 0, behavior })
  window.scrollTo({ top: 0, behavior })
}
