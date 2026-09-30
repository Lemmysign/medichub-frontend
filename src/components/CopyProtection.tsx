import { useEffect } from "react"

const EDITABLE_SELECTOR = "input, textarea, [contenteditable='true'], [contenteditable='']"

function isEditable(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(EDITABLE_SELECTOR) != null
}

/**
 * Blocks copying rendered page content (course text, MCQs, recalls, explanations) — the CSS
 * `user-select: none` in index.css stops most selection, this catches what CSS can't: the
 * right-click "Copy" menu, keyboard copy/cut, and dragging text out. Form fields are exempt so
 * typing, pasting into inputs, and normal editing still work everywhere.
 *
 * This is a deterrent, not real protection — anyone with dev tools, a screenshot, or JS disabled
 * can still get the content. It just removes the one-click "select all → copy" path.
 */
export function CopyProtection() {
  useEffect(() => {
    const blockContextMenu = (e: MouseEvent) => {
      if (!isEditable(e.target)) e.preventDefault()
    }
    const blockCopyCut = (e: ClipboardEvent) => {
      if (!isEditable(e.target)) e.preventDefault()
    }
    const blockDragStart = (e: DragEvent) => {
      if (!isEditable(e.target)) e.preventDefault()
    }

    document.addEventListener("contextmenu", blockContextMenu)
    document.addEventListener("copy", blockCopyCut)
    document.addEventListener("cut", blockCopyCut)
    document.addEventListener("dragstart", blockDragStart)

    return () => {
      document.removeEventListener("contextmenu", blockContextMenu)
      document.removeEventListener("copy", blockCopyCut)
      document.removeEventListener("cut", blockCopyCut)
      document.removeEventListener("dragstart", blockDragStart)
    }
  }, [])

  return null
}
