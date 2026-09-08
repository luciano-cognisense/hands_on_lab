"""Convert the supplied EasyEDA OBJ/MTL ZIP to indexed float32 geometry.
Usage: python3 tools/convert_pcb.py /path/to/3D_PCB.zip
No geometry is invented or removed. Original source is left untouched.
"""
import sys,zipfile,json,struct,pathlib,hashlib
source=pathlib.Path(sys.argv[1]); output=pathlib.Path(__file__).resolve().parents[1]/'models'
z=zipfile.ZipFile(source); materials={};current=None
for line in z.read(next(n for n in z.namelist() if n.endswith('.mtl'))).decode().splitlines():
 if line.startswith('newmtl '): current=line.split()[1]
 elif line.startswith('Kd '): materials[current]=list(map(float,line.split()[1:]))
vertices=[];faces={}
for line in z.read(next(n for n in z.namelist() if n.endswith('.obj'))).decode().splitlines():
 if line.startswith('v '):vertices.append(tuple(map(float,line.split()[1:])))
 elif line.startswith('usemtl '):current=line.split()[1]
 elif line.startswith('f '):
  ids=[int(v.split('/')[0])-1 for v in line.split()[1:]]
  for i in range(1,len(ids)-1):faces.setdefault(current,[]).append((ids[0],ids[i],ids[i+1]))
# Material-local vertices preserve hard material boundaries. Weld exact coordinates.
positions=[];indices=[];groups=[]
for material,triangles in faces.items():
 lookup={};start=len(indices)
 for tri in triangles:
  for original in tri:
   point=tuple(round(v,5) for v in vertices[original])
   if point not in lookup:
    lookup[point]=len(positions)//3;positions.extend(point)
   indices.append(lookup[point])
 groups.append(dict(start=start,count=len(indices)-start,color=materials[material],name=material))
output.mkdir(exist_ok=True)
binary=struct.pack('<%sf'%len(positions),*positions)+struct.pack('<%sI'%len(indices),*indices)
(output/'pcb.bin').write_bytes(binary)
(output/'pcb.json').write_text(json.dumps(dict(positionCount=len(positions)//3,indexCount=len(indices),groups=groups,source=source.name,sha256=hashlib.sha256(source.read_bytes()).hexdigest(),units='mm',center=[49,-65,-.8]),separators=(',',':')))
print('%s vertices, %s triangles, %.2f MB'%(len(positions)//3,len(indices)//3,len(binary)/1e6))
