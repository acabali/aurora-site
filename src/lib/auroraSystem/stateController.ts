type SystemState = {
density:number
energy:number
connectionDistance:number
dominantProbability:number
rotationSpeed:number
}

const states:Record<string,SystemState>={
hero:{density:.2,energy:.1,connectionDistance:32,dominantProbability:.002,rotationSpeed:.0004},
changed:{density:.35,energy:.25,connectionDistance:36,dominantProbability:.004,rotationSpeed:.0006},
misalignment:{density:.55,energy:.55,connectionDistance:40,dominantProbability:.008,rotationSpeed:.0009},
break:{density:.7,energy:.7,connectionDistance:44,dominantProbability:.015,rotationSpeed:.0012},
aurora:{density:.85,energy:.35,connectionDistance:38,dominantProbability:.01,rotationSpeed:.0008},
demo:{density:.9,energy:.2,connectionDistance:34,dominantProbability:.004,rotationSpeed:.0005}
}

let current:SystemState=states.hero

export function setSystemState(key:string){
if(states[key]) current=states[key]
}

export function getSystemState(){ return current }
