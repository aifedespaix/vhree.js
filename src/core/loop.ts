export type FrameCallback = (dt: number, now: number) => void

export interface RenderLoop {
  add: (cb: FrameCallback) => () => void
  remove: (cb: FrameCallback) => void
  step: (timeMs: number) => void
  reset: () => void
}

export function createRenderLoop(): RenderLoop {
  const callbacks = new Set<FrameCallback>()
  let lastNow = 0

  const remove = (cb: FrameCallback) => {
    callbacks.delete(cb)
  }

  const add = (cb: FrameCallback) => {
    callbacks.add(cb)
    return () => remove(cb)
  }

  const step = (timeMs: number) => {
    const now = timeMs * 0.001
    if (!callbacks.size) {
      lastNow = now
      return
    }

    const dt = lastNow === 0 ? 0 : now - lastNow
    lastNow = now

    callbacks.forEach((cb) => {
      cb(dt, now)
    })
  }

  const reset = () => {
    lastNow = 0
  }

  return { add, remove, step, reset }
}
