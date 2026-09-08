let context;export let enabled=false;
export function toggle(){enabled=!enabled;if(enabled){context??=new (window.AudioContext||window.webkitAudioContext)();context.resume();}return enabled;}
export function tone(freq=660,duration=.12,pan=0,rich=false){if(!enabled||!context)return;const osc=context.createOscillator(),gain=context.createGain(),stereo=context.createStereoPanner();osc.type=rich?'triangle':'square';osc.frequency.value=freq;gain.gain.setValueAtTime(.035,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+duration);stereo.pan.value=pan;osc.connect(gain).connect(stereo).connect(context.destination);osc.start();osc.stop(context.currentTime+duration);}
export function melody(){[392,523,659,784].forEach((f,i)=>setTimeout(()=>tone(f,.18),i*180));}
