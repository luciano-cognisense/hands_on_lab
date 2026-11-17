// Verify the approved launcher image without writing to a device.
export async function inspectRestore(fetcher=fetch) {
  const base=new URL('./firmware/',import.meta.url);
  const response=await fetcher(new URL('restore-manifest.json',base),{cache:'no-store'});
  if(!response.ok) throw new Error('Pacote de retorno indisponível.');
  const manifest=await response.json();
  const part=manifest.part;
  if(manifest.installationEnabled!==false || manifest.chip!=='ESP32-S3' || manifest.requiredLayout!=='v1b-with-gbsp' || part?.path!=='launcher-v1b-with-gbsp.bin' || part.offset!==0x10000 || part.size<=0 || part.size>0x130000) throw new Error('Pacote de retorno incompatível.');
  const file=await fetcher(new URL(part.path,base),{cache:'no-store'});
  if(!file.ok) throw new Error('Launcher de retorno indisponível.');
  const data=await file.arrayBuffer();
  const sha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(x=>x.toString(16).padStart(2,'0')).join('');
  if(data.byteLength!==part.size || sha!==part.sha256) throw new Error('Integridade do launcher não confirmada.');
  return manifest;
}
