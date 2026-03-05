export function signalPulse(graph){
if(!graph) return
graph.linkDirectionalParticles(3)
graph.linkDirectionalParticleSpeed(()=>0.006)
}
