import * as THREE from "three";

type Node = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  energy: number;
};

export class AuroraEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private nodes: Node[] = [];
  private lines!: THREE.LineSegments;
  private dominant = 0;
  private width = 0;
  private height = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);
    this.camera.position.z = 120;

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.initNodes();
    this.initLines();

    window.addEventListener("resize", () => this.onResize());
    this.animate();
  }

  private initNodes() {
    const count = 120;
    for (let i = 0; i < count; i++) {
      this.nodes.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 200
        ),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        ),
        energy: Math.random(),
      });
    }
  }

  private initLines() {
    const geometry = new THREE.BufferGeometry();
    const maxConnections = 4000;
    const positions = new Float32Array(maxConnections * 3 * 2);

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: 0x2e5bff,
      transparent: true,
      opacity: 0.35,
    });

    this.lines = new THREE.LineSegments(geometry, material);
    this.scene.add(this.lines);
  }

  private updateNodes() {
    const dom = this.nodes[this.dominant];

    this.nodes.forEach((n, i) => {
      n.pos.add(n.vel);

      if (i !== this.dominant) {
        const dir = new THREE.Vector3().subVectors(dom.pos, n.pos).multiplyScalar(0.0005);
        n.vel.add(dir);
      }

      if (n.pos.length() > 150) n.vel.multiplyScalar(-1);
    });

    if (Math.random() < 0.002) {
      this.dominant = Math.floor(Math.random() * this.nodes.length);
    }
  }

  private updateLines() {
    const positions = this.lines.geometry.attributes.position.array as Float32Array;

    let ptr = 0;
    const threshold = 35;

    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const a = this.nodes[i];
        const b = this.nodes[j];
        const dist = a.pos.distanceTo(b.pos);

        if (dist < threshold && ptr < positions.length - 6) {
          positions[ptr++] = a.pos.x;
          positions[ptr++] = a.pos.y;
          positions[ptr++] = a.pos.z;

          positions[ptr++] = b.pos.x;
          positions[ptr++] = b.pos.y;
          positions[ptr++] = b.pos.z;
        }
      }
    }

    this.lines.geometry.setDrawRange(0, ptr / 3);
    this.lines.geometry.attributes.position.needsUpdate = true;
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.updateNodes();
    this.updateLines();
    this.renderer.render(this.scene, this.camera);
  };

  private onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }
}
