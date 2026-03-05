
import * as Tone from "tone"

const synth = new Tone.Synth().toDestination()

export function signalSound(){

synth.triggerAttackRelease("C4","8n")

}

