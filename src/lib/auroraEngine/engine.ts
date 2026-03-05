import * as THREE from "three";

type Node = {
  pos: THREE.Vector3
  vel: THREE.Vector3
  energy: number
}

export class AuroraEngine {

  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer

  private nodes: Node[] = []
  private lines!: THREE.LineSegments

  private dominant = 0
  private width = window.innerWidth
  private height = window.innerHeight

  private sectionFactor = 1

  constructor(private canvas: HTMLCanvasElement){

    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.width / this.height,
      0.1,
      1000
    )

    this.camera.position.z = 140

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    })

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
    this.renderer.setSize(this.width,this.height)

    this.initNodes()
    this.initLines()

    this.bindScroll()
    this.animate()

    window.addEventListener("resize",()=>this.resize())
  }

  private initNodes(){

    const count = 140

    for(let i=0;i<count;i++){

      this.nodes.push({
        pos:new THREE.Vector3(
          (Math.random()-0.5)*220,
          (Math.random()-0.5)*220,
          (Math.random()-0.5)*220
        ),

        vel:new THREE.Vector3(
          (Math.random()-0.5)*0.3,
          (Math.random()-0.5)*0.3,
          (Math.random()-0.5)*0.3
        ),

        energy:Math.random()
      })

    }

  }

  private initLines(){

    const maxConnections = 6000

    const geo = new THREE.BufferGeometry()

    const positions = new Float32Array(maxConnections*6)

    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions,3)
    )

    const mat = new THREE.LineBasicMaterial({
      color:0x3a6cff,
      transparent:true,
      opacity:0.32
    })

    this.lines = new THREE.LineSegments(geo,mat)

    this.scene.add(this.lines)

  }

  private bindScroll(){

    const sections = document.querySelectorAll("section")

    const observer = new IntersectionObserver((entries)=>{

      entries.forEach(e=>{

        if(e.isIntersecting){

          const idx = Array.from(sections).indexOf(e.target)

          this.sectionFactor = 1 + idx * 0.15

        }

      })

    },{
      threshold:0.5
    })

    sections.forEach(s=>observer.observe(s))

  }

  private updateNodes(){

    const dom = this.nodes[this.dominant]

    this.nodes.forEach((n,i)=>{

      n.pos.add(n.vel)

      if(i!==this.dominant){

        const pull = new THREE.Vector3()
          .subVectors(dom.pos,n.pos)
          .multiplyScalar(0.0006*this.sectionFactor)

        n.vel.add(pull)

      }

      if(n.pos.length()>160){
        n.vel.multiplyScalar(-1)
      }

    })

    if(Math.random()<0.002){
      this.dominant = Math.floor(Math.random()*this.nodes.length)
    }

  }

  private updateLines(){

    const arr = this.lines.geometry.attributes.position.array as Float32Array

    let ptr = 0

    const threshold = 38 * this.sectionFactor

    for(let i=0;i<this.nodes.length;i++){

      for(let j=i+1;j<this.nodes.length;j++){

        const a = this.nodes[i]
        const b = this.nodes[j]

        const d = a.pos.distanceTo(b.pos)

        if(d<threshold && ptr<arr.length-6){

          arr[ptr++]=a.pos.x
          arr[ptr++]=a.pos.y
          arr[ptr++]=a.pos.z

          arr[ptr++]=b.pos.x
          arr[ptr++]=b.pos.y
          arr[ptr++]=b.pos.z

        }

      }

    }

    this.lines.geometry.setDrawRange(0,ptr/3)
    this.lines.geometry.attributes.position.needsUpdate=true

  }

  private animate = () => {

    requestAnimationFrame(this.animate)

    this.updateNodes()
    this.updateLines()

    this.scene.rotation.y += 0.0007

    this.renderer.render(this.scene,this.camera)

  }

  private resize(){

    this.width = window.innerWidth
    this.height = window.innerHeight

    this.camera.aspect = this.width/this.height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.width,this.height)

  }

}
