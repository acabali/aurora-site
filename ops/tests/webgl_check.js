const canvas=document.querySelector("[data-aurora-canvas]");
if(!canvas){console.log("NO CANVAS");process.exit(1);}
const gl=canvas.getContext("webgl")||canvas.getContext("experimental-webgl");
if(gl){console.log("WEBGL OK");}
else{console.log("WEBGL FAIL");}
