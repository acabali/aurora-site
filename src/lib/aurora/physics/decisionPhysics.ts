import * as d3 from "d3-force"

export function applyDecisionPhysics(nodes, links){
const sim = d3.forceSimulation(nodes)
.force("link", d3.forceLink(links).distance(60).strength(.5))
.force("charge", d3.forceManyBody().strength(-30))
.force("center", d3.forceCenter(0,0))
return sim
}
