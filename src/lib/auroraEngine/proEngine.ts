import * as THREE from "three"

type Node = { p:THREE.Vector3; v:THREE.Vector3; e:number }

export class AuroraProEngine{

scene=new THREE.Scene()
camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.1,1000)
renderer:THREE.WebGLRenderer
nodes:Node[]=[]
lineGeo=new THREE.BufferGeometry()
lines!:THREE.LineSegments
dominant=0
depth=200
sectionFactor=1

constructor(canvas:HTMLCanvasElement){

this.renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true})
this.renderer.setSize(innerWidth,innerHeight)
this.renderer.setPixelRatio(Math.min(devicePixelRatio,2))
this.camera.position.z=140

this.initNodes()
this.initLines()
this.bindScroll()

addEventListener("resize",()=>this.resize())
this.loop()

}

initNodes(){

for(let i=0;i<180;i++){

this.nodes.push({
p:new THREE.Vector3(
(Math.random()-.5)*this.depth,
(Math.random()-.5)*this.depth,
(Math.random()-.5)*this.depth),
v:new THREE.Vector3(
(Math.random()-.5)*0.25,
(Math.random()-.5)*0.25,
(Math.random()-.5)*0.25),
e:Math.random()
})

}

}

initLines(){

const max=9000
const pos=new Float32Array(max*6)

this.lineGeo.setAttribute("position",new THREE.BufferAttribute(pos,3))

const mat=new THREE.LineBasicMaterial({
color:0x2e5bff,
transparent:true,
opacity:.35
})

this.lines=new THREE.LineSegments(this.lineGeo,mat)
this.scene.add(this.lines)

}

bindScroll(){

const secs=document.querySelectorAll("section")

const io=new IntersectionObserver(e=>{
e.forEach(i=>{
if(i.isIntersecting){
const idx=[...secs].indexOf(i.target)
this.sectionFactor=1+(idx*.2)
}
})
},{threshold:.5})

secs.forEach(s=>io.observe(s))

}

updateNodes(){

const dom=this.nodes[this.dominant]

this.nodes.forEach((n,i)=>{

n.p.add(n.v)

if(i!==this.dominant){
const pull=new THREE.Vector3()
.subVectors(dom.p,n.p)
.multiplyScalar(.0008*this.sectionFactor)

n.v.add(pull)
}

if(n.p.length()>180)n.v.multiplyScalar(-1)

})

if(Math.random()<.003)
this.dominant=Math.floor(Math.random()*this.nodes.length)

}

updateLines(){

const arr=this.lineGeo.attributes.position.array as Float32Array
let ptr=0
const th=42*this.sectionFactor

for(let i=0;i<this.nodes.length;i++){

for(let j=i+1;j<this.nodes.length;j++){

const a=this.nodes[i]
const b=this.nodes[j]

const d=a.p.distanceTo(b.p)

if(d<th&&ptr<arr.length-6){

arr[ptr++]=a.p.x
arr[ptr++]=a.p.y
arr[ptr++]=a.p.z
arr[ptr++]=b.p.x
arr[ptr++]=b.p.y
arr[ptr++]=b.p.z

}

}

}

this.lineGeo.setDrawRange(0,ptr/3)
this.lineGeo.attributes.position.needsUpdate=true

}

loop=()=>{

requestAnimationFrame(this.loop)

this.updateNodes()
this.updateLines()

this.scene.rotation.y+=.0008
this.scene.rotation.x+=.0002

this.renderer.render(this.scene,this.camera)

}

resize(){

this.camera.aspect=innerWidth/innerHeight
this.camera.updateProjectionMatrix()
this.renderer.setSize(innerWidth,innerHeight)

}

}
