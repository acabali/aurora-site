import ForceGraph3D from "3d-force-graph"
import * as THREE from "three"

export function mountGraph(canvas){

const graph = ForceGraph3D({controlType:"orbit"})(canvas)

const N = 200

const data = {
nodes:[...Array(N).keys()].map(i=>({id:i})),
links:[...Array(N).keys()].filter(id=>id).map(id=>({
source:id,
target:Math.round(Math.random()*(id-1))
}))
}

graph.graphData(data)

graph.nodeAutoColorBy("id")

graph.linkOpacity(.15)

graph.linkDirectionalParticles(2)

graph.linkDirectionalParticleSpeed(d=>0.005)

}
