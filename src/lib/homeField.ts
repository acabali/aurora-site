import { AuroraEngine } from "./auroraEngine/engine"

export function mountAuroraField(root:HTMLElement){

  const canvas = root.querySelector(
    "[data-aurora-canvas]"
  ) as HTMLCanvasElement

  if(!canvas) return

  new AuroraEngine(canvas)

}
