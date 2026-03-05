let state="chaos"

export function initAuroraField(){
 const canvas=document.querySelector("#aurora-field") as HTMLCanvasElement
 const ctx=canvas.getContext("2d")!

 let nodes=Array.from({length:120},()=>({
  x:Math.random()*window.innerWidth,
  y:Math.random()*window.innerHeight,
  vx:(Math.random()-.5)*0.4,
  vy:(Math.random()-.5)*0.4
 }))

 function resize(){
  canvas.width=window.innerWidth
  canvas.height=window.innerHeight
 }
 resize()
 window.addEventListener("resize",resize)

 function step(){
  ctx.clearRect(0,0,canvas.width,canvas.height)

  nodes.forEach(n=>{
   n.x+=n.vx
   n.y+=n.vy

   if(n.x<0||n.x>canvas.width)n.vx*=-1
   if(n.y<0||n.y>canvas.height)n.vy*=-1

   ctx.beginPath()
   ctx.arc(n.x,n.y,1.8,0,Math.PI*2)
   ctx.fillStyle="#BFC2C7"
   ctx.fill()
  })

  for(let i=0;i<nodes.length;i++){
   for(let j=i+1;j<nodes.length;j++){
    const dx=nodes[i].x-nodes[j].x
    const dy=nodes[i].y-nodes[j].y
    const d=Math.sqrt(dx*dx+dy*dy)

    if(d<120){
     ctx.strokeStyle="rgba(191,194,199,.08)"
     ctx.beginPath()
     ctx.moveTo(nodes[i].x,nodes[i].y)
     ctx.lineTo(nodes[j].x,nodes[j].y)
     ctx.stroke()
    }
   }
  }

  requestAnimationFrame(step)
 }

 step()
}
