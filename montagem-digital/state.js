export const KEY='hol-digital-v1';
export function normalize(raw,blocks){const steps=blocks.map((b,i)=>Number.isInteger(raw?.steps?.[i])?Math.max(0,Math.min(b.missions.length,raw.steps[i])):0);if(raw?.version!==2&&steps[5]>6)steps[5]=6;let locked=false;for(let i=0;i<steps.length;i++){if(locked)steps[i]=0;if(steps[i]<blocks[i].missions.length)locked=true;}return {version:2,steps};}
export function available(state,blocks,i){return i===0||state.steps[i-1]===blocks[i-1].missions.length;}
export function advance(state,blocks,i,step){if(!available(state,blocks,i)||step!==state.steps[i])return false;state.steps[i]=Math.min(blocks[i].missions.length,step+1);return true;}
export function record(name,detail={}){window.dispatchEvent(new CustomEvent('hol:analytics',{detail:{name,...detail,timestamp:Date.now()}}));}
