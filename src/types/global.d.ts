// The canvas engines (src/lib/charcoal.js, src/lib/playground.js) are vanilla
// JS attached to window at runtime via dynamic import — this declares their
// shape so TypeScript-authored components can call them without `any`.
export {}

declare global {
  interface Window {
    Charcoal?: {
      FigureCanvas: (canvas: HTMLCanvasElement) => {
        init: (animate: boolean) => void
        resize: () => void
      }
      Dust: (canvas: HTMLCanvasElement) => void
    }
    Playground?: (opts: {
      canvas: HTMLCanvasElement
      fx: HTMLCanvasElement
      toolbar: HTMLElement
    }) => void
  }
}
