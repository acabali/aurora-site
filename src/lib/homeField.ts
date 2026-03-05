import { AuroraProEngine } from "./auroraEngine/proEngine"

export function mountAuroraField(root:HTMLElement){

const canvas=root.querySelector("[data-aurora-canvas]") as HTMLCanvasElement
if(!canvas)return

new AuroraProEngine(canvas)

}
