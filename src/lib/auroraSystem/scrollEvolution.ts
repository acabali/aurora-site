import {setSystemState} from "./stateController"

export function mountScrollEvolution(){

const sections=document.querySelectorAll("[data-aurora-state]")

const io=new IntersectionObserver((entries)=>{
entries.forEach(e=>{
if(e.isIntersecting){
const key=e.target.getAttribute("data-aurora-state")
if(key) setSystemState(key)
}
})
},{threshold:.5})

sections.forEach(s=>io.observe(s))

}
