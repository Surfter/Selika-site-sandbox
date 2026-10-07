import numpy as np
def read_obj(path, want_faces=True):
    V, VT, F = [], [], []
    with open(path) as fh:
        for line in fh:
            if line.startswith('v '):
                V.append([float(x) for x in line.split()[1:4]])
            elif want_faces and line.startswith('vt '):
                VT.append([float(x) for x in line.split()[1:3]])
            elif want_faces and line.startswith('f '):
                F.append([tuple(int(i) - 1 if i else -1 for i in (p.split('/') + ['', ''])[:2]) for p in line.split()[1:]])
    return np.array(V, np.float64), (np.array(VT, np.float64) if VT else None), F
