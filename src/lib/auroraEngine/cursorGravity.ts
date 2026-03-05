
export function mountCursorGravity(canvas){

canvas.addEventListener("mousemove",e=>{

const x=e.clientX/window.innerWidth
const y=e.clientY/window.innerHeight

canvas.style.transform=`perspective(800px) rotateY(${(x-.5)*10}deg) rotateX(${(y-.5)*-10}deg)`

})

}
