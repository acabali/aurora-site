export function mountCursorGravity(el){
window.addEventListener("mousemove",(e)=>{
const x=e.clientX/window.innerWidth
const y=e.clientY/window.innerHeight
el.style.transform=`perspective(800px) rotateY(${(x-.5)*12}deg) rotateX(${(y-.5)*-12}deg)`
})
}
