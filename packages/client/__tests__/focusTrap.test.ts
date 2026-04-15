import { describe, it, expect, beforeEach } from 'vitest'
import { createFocusTrap } from '../src/utils/focusTrap.ts'

describe('createFocusTrap', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    document.body.innerHTML = ''
    container = document.createElement('div')
    container.innerHTML = `
      <button id="btn1">Button 1</button>
      <button id="btn2">Button 2</button>
      <button id="btn3">Button 3</button>
    `
    document.body.appendChild(container)
  })

  it('focuses the first focusable element on init', () => {
    createFocusTrap(container)
    expect(document.activeElement?.id).toBe('btn1')
  })

  it('returns a cleanup function', () => {
    const cleanup = createFocusTrap(container)
    expect(typeof cleanup).toBe('function')
    cleanup()
  })

  it('traps Tab from last element back to first', () => {
    createFocusTrap(container)
    const last = document.getElementById('btn3')!
    last.focus()

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
    let prevented = false
    event.preventDefault = () => { prevented = true }
    container.dispatchEvent(event)

    expect(prevented).toBe(true)
    expect(document.activeElement?.id).toBe('btn1')
  })

  it('traps Shift+Tab from first element back to last', () => {
    createFocusTrap(container)
    const first = document.getElementById('btn1')!
    first.focus()

    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })
    let prevented = false
    event.preventDefault = () => { prevented = true }
    container.dispatchEvent(event)

    expect(prevented).toBe(true)
    expect(document.activeElement?.id).toBe('btn3')
  })
})
