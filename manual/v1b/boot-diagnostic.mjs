// Read-only snapshot. Never infers a safe boot switch from raw OTA bytes.
export async function inspectBoot(loader, manifest, restoreManifest) {
  if (loader.chip?.CHIP_NAME !== 'ESP32-S3') throw new Error('Dispositivo não é ESP32-S3.');
  const table = new Uint8Array(await loader.readFlash(0x8000, 0xc00));
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', table))].map(x => x.toString(16).padStart(2,'0')).join('');
  if (hash !== manifest.partitionTableSha256) throw new Error('Tabela de partições instalada difere do pacote V1B com GBSP.');
  const ota = new Uint8Array(await loader.readFlash(0xd000, 0x2000));
  if (ota.byteLength !== 0x2000) throw new Error('Leitura de otadata incompleta.');
  const view = new DataView(ota.buffer, ota.byteOffset, ota.byteLength);
  const sequences = [view.getUint32(0,true),view.getUint32(0x1000,true)];
  let launcher='not-checked';
  if (restoreManifest) {
    const part=restoreManifest.part;
    if (part?.offset!==0x10000 || !Number.isInteger(part.size) || part.size<=0 || part.size>0x130000) throw new Error('Manifesto do launcher incompatível.');
    const bytes=new Uint8Array(part.size);
    for(let position=0;position<bytes.length;position+=0x10000){
      const size=Math.min(0x10000,bytes.length-position);
      const chunk=new Uint8Array(await loader.readFlash(part.offset+position,size));
      if(chunk.length!==size) throw new Error('Leitura do launcher incompleta.');
      bytes.set(chunk,position);
    }
    const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
    launcher=digest===part.sha256?'approved':'different';
  }
  return {layout:'v1b-with-gbsp', otaSequences:sequences, launcher, bootSelection:'unverified', canInstall:false};
}
