let cursor={x:0,y:0}

export function mountCursorField(){
window.addEventListener("pointermove",(e)=>{
cursor.x=e.clientX/window.innerWidth
cursor.y=e.clientY/window.innerHeight
})
}

export function getCursor(){ return cursor }
