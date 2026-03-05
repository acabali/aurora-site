export function mountTimeline(container){
const slider=document.createElement("input")
slider.type="range"
slider.min=0
slider.max=100
slider.value=0
slider.style.position="fixed"
slider.style.bottom="20px"
slider.style.left="50%"
slider.style.transform="translateX(-50%)"
slider.style.width="300px"
container.appendChild(slider)
}
