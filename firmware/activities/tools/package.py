"""Package only verified build outputs; does not enable browser installation."""
import hashlib
import json
from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
build = root / 'build'
out = root.parents[1] / 'manual/v1b/firmware'
args = json.loads((build / 'flasher_args.json').read_text())
expected = {'0x0': 'bootloader/bootloader.bin', '0x8000': 'partition_table/partition-table.bin', '0xd000': 'ota_data_initial.bin', '0x10000': 'hol_activities.bin'}
if args['flash_files'] != expected:
    raise SystemExit('Unexpected flash layout; packaging refused')
# Never distribute the partition table or bootloader for the activity update.
# Only the app slot at 0x10000 is eligible after physical layout verification.
parts = []
limits = {0: 0x8000, 0x8000: 0x1000, 0xd000: 0x2000, 0x10000: 0x100000}
for address, source in sorted(expected.items(), key=lambda pair: int(pair[0], 16)):
    data = (build / source).read_bytes()
    offset = int(address, 16)
    if not data or len(data) > limits[offset]:
        raise SystemExit(f'Invalid size: {source}')
    parts.append({'path': Path(source).name, 'offset': offset, 'size': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
out.mkdir(parents=True, exist_ok=True)
parts = [part for part in parts if part['offset'] == 0x10000]
for part in parts:
    shutil.copyfile(build / 'hol_activities.bin', out / part['path'])
manifest = {'name': 'Hands On Lab activities', 'version': '0.1.0', 'chip': 'ESP32-S3', 'flashSize': 16777216, 'installationEnabled': False, 'reason': 'Aguardando validação de alimentação, USB e transição do layout de jogos.', 'parts': parts, 'partitionTableSha256': hashlib.sha256((build / 'partition_table/partition-table.bin').read_bytes()).hexdigest(), 'requiredLayout': 'v1b-with-gbsp', 'replaces': 'launcher ota_0'}
(out / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Packaged {len(parts)} parts; installation remains disabled.')
