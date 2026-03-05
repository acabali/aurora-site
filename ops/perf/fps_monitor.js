let last=performance.now();
let frames=0;

function loop(){
frames++;
const now=performance.now();
if(now-last>=1000){
console.log("FPS:",frames);
frames=0;
last=now;
}
requestAnimationFrame(loop);
}
loop();
