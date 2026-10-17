"""Convert ICT-FaceKit (MIT, (c) 2020 USC Institute for Creative Technologies) into a compact GLB for the Selika demo.
Meshes: skin (face, head and neck, eye sockets, mouth socket) and lashes with shared morph targets; two eyeballs as separate
nodes pivoted at their centres so the app can rotate them toward the cursor. Units converted from cm to m."""
import sys, json, struct
import numpy as np
from objread import read_obj

D = sys.argv[1]; OUT = sys.argv[2]
SHAPES = ["eyeBlink_L", "eyeBlink_R", "eyeLookUp_L", "eyeLookUp_R", "eyeLookDown_L", "eyeLookDown_R", "eyeLookIn_L", "eyeLookIn_R",
          "eyeLookOut_L", "eyeLookOut_R", "eyeSquint_L", "eyeSquint_R", "eyeWide_L", "eyeWide_R", "browInnerUp_L", "browInnerUp_R",
          "browOuterUp_L", "browOuterUp_R", "mouthSmile_L", "mouthSmile_R", "cheekSquint_L", "cheekSquint_R", "mouthPucker"]
S = 0.01  # cm -> m

V, VT, F = read_obj(D + "generic_neutral_mesh.obj")
EX = {s: read_obj(D + s + ".obj", want_faces=False)[0] for s in SHAPES}

def vnormals(P, tris):
    n = np.zeros_like(P)
    a, b, c = P[tris[:, 0]], P[tris[:, 1]], P[tris[:, 2]]
    fn = np.cross(b - a, c - a)
    for k in range(3): np.add.at(n, tris[:, k], fn)
    l = np.linalg.norm(n, axis=1, keepdims=True); l[l == 0] = 1
    return n / l

def build(poly_ranges, center=None, with_targets=True):
    """Collect polygons, triangulate, split vertices on UV seams, return arrays."""
    polys = [F[i] for (p0, p1) in poly_ranges for i in range(p0, p1 + 1)]
    tris_vt = []  # (v, vt) triples
    for p in polys:
        for k in range(1, len(p) - 1): tris_vt.append((p[0], p[k], p[k + 1]))
    key = {}; vid = []; tid = []; idx = []
    for tri in tris_vt:
        for (vi, ti) in tri:
            kk = (vi, ti)
            if kk not in key: key[kk] = len(vid); vid.append(vi); tid.append(ti)
            idx.append(key[kk])
    vid = np.array(vid); tid = np.array(tid); idx = np.array(idx, np.uint32).reshape(-1, 3)
    # normals on the original (welded) topology so seams stay smooth
    orig_tris = np.array([[a[0], b[0], c[0]] for (a, b, c) in tris_vt])
    used = np.unique(orig_tris)
    nb = vnormals(V, orig_tris)
    pos = V[vid] * S; nrm = nb[vid]; uv = VT[tid].copy(); uv[:, 1] = 1.0 - uv[:, 1]
    if center is not None: pos = pos - center
    targets = []
    if with_targets:
        for s in SHAPES:
            E = EX[s]; ne = vnormals(E, orig_tris)
            dp = (E[vid] - V[vid]) * S; dn = ne[vid] - nb[vid]
            dp[np.abs(dp) < 1e-7] = 0; dn[np.abs(dn) < 1e-5] = 0
            targets.append((dp.astype(np.float32), dn.astype(np.float32)))
    return dict(pos=pos.astype(np.float32), nrm=nrm.astype(np.float32), uv=uv.astype(np.float32), idx=idx, targets=targets)

skin = build([(0, 9229), (9230, 11143), (11144, 13225), (13226, 14033)])
lash = build([(25304, 26383)])
eyes = []
for (p0, p1, v0, v1) in [(21496, 22295, 21451, 22220), (23094, 23893, 23021, 23790)]:
    c = V[v0:v1 + 1].mean(0) * S
    e = build([(p0, p1)], center=c, with_targets=False); e["center"] = c; eyes.append(e)

# ---------- write GLB ----------
buf = bytearray(); views = []; accs = []
def add_view(data, target=None):
    while len(buf) % 4: buf.append(0)
    off = len(buf); buf.extend(data)
    v = {"buffer": 0, "byteOffset": off, "byteLength": len(data)}
    if target: v["target"] = target
    views.append(v); return len(views) - 1
def add_acc(arr, ctype, typ, target=None, minmax=False):
    arr = np.ascontiguousarray(arr)
    a = {"bufferView": add_view(arr.tobytes(), target), "componentType": ctype, "count": int(arr.shape[0]), "type": typ}
    if minmax: a["min"] = arr.min(0).tolist(); a["max"] = arr.max(0).tolist()
    accs.append(a); return len(accs) - 1
meshes = []; nodes = []
def add_mesh(name, m):
    prim = {"attributes": {"POSITION": add_acc(m["pos"], 5126, "VEC3", 34962, True), "NORMAL": add_acc(m["nrm"], 5126, "VEC3", 34962),
            "TEXCOORD_0": add_acc(m["uv"], 5126, "VEC2", 34962)},
            "indices": add_acc(m["idx"].reshape(-1), 5125, "SCALAR", 34963), "mode": 4}
    mesh = {"name": name, "primitives": [prim]}
    if m["targets"]:
        prim["targets"] = [{"POSITION": add_acc(dp, 5126, "VEC3", 34962, True), "NORMAL": add_acc(dn, 5126, "VEC3", 34962)} for (dp, dn) in m["targets"]]
        mesh["weights"] = [0.0] * len(SHAPES); mesh["extras"] = {"targetNames": SHAPES}
    meshes.append(mesh); return len(meshes) - 1
nodes.append({"name": "skin", "mesh": add_mesh("skin", skin)})
nodes.append({"name": "lashes", "mesh": add_mesh("lashes", lash)})
for i, e in enumerate(eyes):
    nodes.append({"name": ["eye_L", "eye_R"][i], "mesh": add_mesh(["eye_L", "eye_R"][i], e), "translation": e["center"].tolist()})
gltf = {"asset": {"version": "2.0", "generator": "selika ict2glb", "copyright": "ICT-FaceKit (c) 2020 USC Institute for Creative Technologies, MIT"},
        "scene": 0, "scenes": [{"nodes": [len(nodes)]}],
        "nodes": nodes + [{"name": "head", "children": list(range(len(nodes)))}],
        "meshes": meshes, "accessors": accs, "bufferViews": views, "buffers": [{"byteLength": len(buf)}]}
js = json.dumps(gltf, separators=(",", ":")).encode()
js += b" " * ((4 - len(js) % 4) % 4)
while len(buf) % 4: buf.append(0)
with open(OUT, "wb") as fh:
    fh.write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(buf)))
    fh.write(struct.pack("<II", len(js), 0x4E4F534A)); fh.write(js)
    fh.write(struct.pack("<II", len(buf), 0x004E4942)); fh.write(bytes(buf))
print("skin verts", len(skin["pos"]), "tris", len(skin["idx"]), "| lash verts", len(lash["pos"]), "| eye verts", len(eyes[0]["pos"]), "| GLB bytes", 12 + 16 + len(js) + len(buf))
print("eye centres", [e["center"].round(4).tolist() for e in eyes])
