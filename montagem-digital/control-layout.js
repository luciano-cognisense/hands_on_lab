// Same positions and colors as the physical console/manual.
export function layoutControl(button,key){
 button.dataset.control=key;
 button.setAttribute('aria-label',key);
 button.textContent=({CIMA:'↑',BAIXO:'↓',ESQUERDA:'←',DIREITA:'→'})[key]||key;
}
