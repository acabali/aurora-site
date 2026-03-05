export function mountNeuralBackground(){
const bg=document.createElement("div")
bg.style.position="fixed"
bg.style.inset="0"
bg.style.background="radial-gradient(circle at center,rgba(0,255,255,.08),transparent 70%)"
bg.style.pointerEvents="none"
document.body.appendChild(bg)
}
