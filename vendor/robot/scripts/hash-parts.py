# usage: python3 scripts/hash-parts.py model.glb leg_L leg_R  -> md5 per subtree (transforms, buffers, materials)
import json,struct,hashlib,sys
d=open(sys.argv[1],'rb').read(); n=struct.unpack('<I',d[12:16])[0]; j=json.loads(d[20:20+n]); b=d[20+n+8:]
def sub(name):
  idx=[i for i,x in enumerate(j['nodes']) if x.get('name')==name][0]; h=hashlib.md5()
  def walk(i):
    x=j['nodes'][i]; h.update(json.dumps([x.get('translation'),x.get('rotation'),x.get('scale')]).encode())
    if 'mesh' in x:
      for pr in j['meshes'][x['mesh']]['primitives']:
        for k,a in sorted(pr['attributes'].items())+[('i',pr.get('indices'))]:
          if a is None: continue
          acc=j['accessors'][a]; bv=j['bufferViews'][acc['bufferView']]; o=bv.get('byteOffset',0)+acc.get('byteOffset',0); h.update(b[o:o+bv['byteLength']])
        h.update(j['materials'][pr['material']].get('name','').encode())
    [walk(c) for c in x.get('children',[])]
  walk(idx); return h.hexdigest()
for nm in sys.argv[2:]: print(nm, sub(nm))
