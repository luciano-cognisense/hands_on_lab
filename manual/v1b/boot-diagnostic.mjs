// Read-only snapshot. Never infers a safe boot switch from raw OTA bytes.
export async function inspectBoot(loader, manifest) {
  if (loader.chip?.CHIP_NAME !== 'ESP32-S3') throw new Error('Dispositivo não é ESP32-S3.');
  const table = new Uint8Array(await loader.readFlash(0x8000, 0xc00));
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', table))].map(x => x.toString(16).padStart(2,'0')).join('');
  if (hash !== manifest.partitionTableSha256) throw new Error('Tabela de partições instalada difere do pacote V1B com GBSP.');
  const ota = new Uint8Array(await loader.readFlash(0xd000, 0x2000));
  if (ota.byteLength !== 0x2000) throw new Error('Leitura de otadata incompleta.');
  const view = new DataView(ota.buffer, ota.byteOffset, ota.byteLength);
  const sequences = [view.getUint32(0,true),view.getUint32(0x1000,true)];
  return {layout:'v1b-with-gbsp', otaSequences:sequences, bootSelection:'unverified', canInstall:false};
}
