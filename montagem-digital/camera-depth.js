// CAD surface layers are only 0.01 mm apart. Match depth range to this tabletop
// instead of wasting precision on a near=0.1 / far=1000 frustum.
// 110 mm encloses the PCB, sockets, installed modules and lifted previews.
export function boardDepthRange(distance){
 return {near:Math.max(1,distance-110),far:distance+160};
}
export function updateBoardDepth(camera,target){
 const range=boardDepthRange(camera.position.distanceTo(target));
 if(camera.near!==range.near||camera.far!==range.far){camera.near=range.near;camera.far=range.far;camera.updateProjectionMatrix();}
}
