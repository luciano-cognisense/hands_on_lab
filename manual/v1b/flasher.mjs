// Adapter for esptool-js. Release policy must explicitly enable installation.
export async function flashVerifiedPackage({manifest, files, loader, onProgress = () => {}}) {
  if (manifest.installationEnabled !== true) throw new Error('Instalação aguardando validação física.');
  if (loader.chip?.CHIP_NAME !== 'ESP32-S3') throw new Error('O dispositivo identificado não é ESP32-S3.');
  if (manifest.requiredLayout !== 'v1b-with-gbsp' || manifest.parts.length !== 1 || manifest.parts[0].offset !== 0x10000) throw new Error('Layout de jogos V1B incompatível.');
  const table = new Uint8Array(await loader.readFlash(0x8000, 0xc00));
  const tableHash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', table))].map(x=>x.toString(16).padStart(2,'0')).join('');
  if (tableHash !== manifest.partitionTableSha256) throw new Error('A tabela de partições instalada não corresponde ao layout V1B com GBSP.');
  if (!Array.isArray(files) || files.length !== manifest.parts.length) throw new Error('Pacote incompleto.');
  const fileArray=[];
  for (let i=0;i<files.length;i++) {
    const bytes=new Uint8Array(files[i]); const part=manifest.parts[i];
    const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
    if(bytes.length!==part.size || digest!==part.sha256) throw new Error('Integridade do firmware não confirmada.');
    let data=''; for(let j=0;j<bytes.length;j+=8192) data+=String.fromCharCode(...bytes.subarray(j,j+8192));
    fileArray.push({address:part.offset,data});
  }
  await loader.writeFlash({fileArray,flashSize:'keep',flashMode:'keep',flashFreq:'keep',eraseAll:false,compress:true,reportProgress:onProgress});
  // Verify actual flash bytes before reporting a completed write.
  for(let i=0;i<files.length;i++) {
    const actual=new Uint8Array(await loader.readFlash(manifest.parts[i].offset,manifest.parts[i].size));
    const expected=new Uint8Array(files[i]);
    if(actual.length!==expected.length || actual.some((value,j)=>value!==expected[j])) throw new Error('A leitura da flash diverge do pacote.');
  }
  await loader.after('hard_reset');
  return {flashVerified:true, firmwareIdentified:false};
}
