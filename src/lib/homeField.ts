
export function initHomeSystem() {

  const canvas = document.querySelector('[data-aurora-canvas]');
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  let DPR = window.devicePixelRatio || 1;

  function resize(){

    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    canvas.width = w * DPR;
    canvas.height = h * DPR;

    ctx.setTransform(DPR,0,0,DPR,0,0);

  }

  resize();
  window.addEventListener("resize", resize);

  const nodes = [];
  const density = 0.00006;

  function createNodes(){

    nodes.length = 0;

    const total = Math.floor(window.innerWidth * window.innerHeight * density);

    for(let i=0;i<total;i++){

      nodes.push({
        x:Math.random()*window.innerWidth,
        y:Math.random()*window.innerHeight,
        vx:(Math.random()-0.5)*0.3,
        vy:(Math.random()-0.5)*0.3
      });

    }

  }

  createNodes();
  window.addEventListener("resize",createNodes);

  function render(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    const maxDist = 140;

    ctx.lineWidth = 1;

    for(let i=0;i<nodes.length;i++){

      const a = nodes[i];

      a.x += a.vx;
      a.y += a.vy;

      if(a.x < 0 || a.x > window.innerWidth) a.vx *= -1;
      if(a.y < 0 || a.y > window.innerHeight) a.vy *= -1;

      ctx.beginPath();
      ctx.arc(a.x,a.y,1.3,0,Math.PI*2);
      ctx.fillStyle="rgba(255,255,255,0.45)";
      ctx.fill();

      for(let j=i+1;j<nodes.length;j++){

        const b = nodes[j];

        const dx = a.x - b.x;
        const dy = a.y - b.y;

        const dist = Math.sqrt(dx*dx + dy*dy);

        if(dist < maxDist){

          const alpha = 1 - dist/maxDist;

          ctx.strokeStyle = "rgba(255,255,255,"+(alpha*0.15)+")";

          ctx.beginPath();
          ctx.moveTo(a.x,a.y);
          ctx.lineTo(b.x,b.y);
          ctx.stroke();

        }

      }

    }

    requestAnimationFrame(render);

  }

  render();

}

