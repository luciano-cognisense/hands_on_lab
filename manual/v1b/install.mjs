export async function inspectPackage(fetcher = fetch) {
  const base = new URL('./firmware/', import.meta.url);
  const response = await fetcher(new URL('manifest.json', base), {cache: 'no-store'});
  if (!response.ok) throw new Error('Pacote de instalação indisponível.');
  const manifest = await response.json();
  if (manifest.chip !== 'ESP32-S3' || manifest.version !== '0.1.0' || !Array.isArray(manifest.parts) || manifest.parts.length !== 1 || !/^[0-9a-f]{64}$/.test(manifest.partitionTableSha256)) throw new Error('Manifesto incompatível.');
  const paths = ['hol_activities.bin'];
  const offsets = [0x10000];
  const limits = [0x130000];
  for (let i = 0; i < 1; i++) {
    const part = manifest.parts[i];
    if (part.path !== paths[i] || part.offset !== offsets[i] || !Number.isInteger(part.size) || part.size <= 0 || part.size > limits[i]) throw new Error('Layout incompatível.');
    const result = await fetcher(new URL(part.path, base), {cache: 'no-store'});
    if (!result.ok) throw new Error('Arquivo de firmware indisponível.');
    const data = await result.arrayBuffer();
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', data))].map(x => x.toString(16).padStart(2, '0')).join('');
    if (data.byteLength !== part.size || hash !== part.sha256) throw new Error('Integridade do firmware não confirmada.');
  }
  return manifest;
}
