import {ESPLoader,Transport} from './vendor/esptool-js.mjs';
import {inspectBoot} from './boot-diagnostic.mjs';
import {inspectPackage} from './install.mjs';
import {inspectRestore} from './restore.mjs';

// Read-only preflight. Never invokes writeFlash or changes otadata.
export async function diagnoseConsole(serial=globalThis.navigator?.serial,{Loader=ESPLoader,SerialTransport=Transport,inspect=inspectBoot,packageInfo=inspectPackage,restoreInfo=inspectRestore}={}){
  if(!serial) throw new Error('Este navegador não oferece Web Serial.');
  const [manifest,restoreManifest]=await Promise.all([packageInfo(),restoreInfo()]);
  const port=await serial.requestPort();
  const transport=new SerialTransport(port,true);
  try{
    const loader=new Loader({transport,baudrate:115200,serialOptions:{bufferSize:64*1024},terminal:{clean(){},write(){},writeLine(){}}});
    await loader.main();
    return await inspect(loader,manifest,restoreManifest);
  }finally{await transport.disconnect().catch(()=>{});}
}
