
import Stats from "stats.js"

export function mountFPS(){

const stats=new Stats()
stats.showPanel(0)

document.body.appendChild(stats.dom)

function loop(){

stats.begin()
stats.end()

requestAnimationFrame(loop)

}

loop()

}

