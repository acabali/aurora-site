export function ripple(x,y){
const r=document.createElement("div")
r.style.position="fixed"
r.style.left=x+"px"
r.style.top=y+"px"
r.style.width="20px"
r.style.height="20px"
r.style.border="1px solid cyan"
r.style.borderRadius="50%"
r.style.animation="auroraRipple 1s ease-out"
document.body.appendChild(r)
setTimeout(()=>r.remove(),1000)
}
