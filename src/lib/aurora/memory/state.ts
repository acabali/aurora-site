export function remember(node){
let s=JSON.parse(localStorage.getItem("aurora-memory")||"[]")
s.push(node)
localStorage.setItem("aurora-memory",JSON.stringify(s))
}
