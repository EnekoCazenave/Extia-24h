/**
 * Creates a focus trap within a container element.
 * Use inside modals and drawers to prevent keyboard focus from escaping.
 *
 * @returns cleanup function — call it when the trap should be released
 */
export function createFocusTrap(container: HTMLElement): () => void {
  const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  function getFocusable(): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.closest('[hidden]'),
    )
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return

    const focusable = getFocusable()
    if (focusable.length === 0) {
      e.preventDefault()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement as HTMLElement

    if (e.shiftKey) {
      if (active === first || !container.contains(active)) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (active === last || !container.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown)

  const first = getFocusable()[0]
  first?.focus()

  return () => container.removeEventListener('keydown', handleKeyDown)
}
