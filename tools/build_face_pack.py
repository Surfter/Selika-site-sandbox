"""Turn a front-facing portrait (and optionally an eyes-closed copy of it) into a demo "face pack":
   an aligned 4:5 photo, a matching eyes-closed photo, a soft depth map for the 3D tilt, and the
   landmarks the makeup and guides are drawn from. Usage:
   python3 -I build_pack.py <open.png> <closed.png|-> <out_dir> <name>"""
import sys, json, math
import numpy as np, cv2
import mediapipe as mp

OPEN, CLOSED, OUT, NAME = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
W, H = 1024, 1280                     # output frame, 4:5 like the demo mirror
import os
EYE_Y = float(os.environ.get("EYE_Y", 0.40))   # eye line height, as a fraction of H
EYE_D = float(os.environ.get("EYE_D", 0.26))   # inter-pupil distance, as a fraction of W

fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.3)
def landmarks(img):
    r = fm.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    if not r.multi_face_landmarks: raise SystemExit("no face found in " + str(img.shape))
    h, w = img.shape[:2]
    return np.array([[p.x * w, p.y * h, p.z * w] for p in r.multi_face_landmarks[0].landmark])

def align(img, lm):
    l, r = lm[468, :2], lm[473, :2]            # iris centres (subject's right, left)
    mid = (l + r) / 2; d = np.linalg.norm(r - l); ang = math.degrees(math.atan2(r[1] - l[1], r[0] - l[0]))
    s = (EYE_D * W) / d
    M = cv2.getRotationMatrix2D((float(mid[0]), float(mid[1])), ang, s)
    M[0, 2] += W / 2 - mid[0]; M[1, 2] += EYE_Y * H - mid[1]
    out = cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    return out, M

src = cv2.imread(OPEN)
lm0 = landmarks(src)
photo, M = align(src, lm0)
lm = landmarks(photo)                               # landmarks in the aligned frame
cv2.imwrite(f"{OUT}/{NAME}.jpg", photo, [cv2.IMWRITE_JPEG_QUALITY, 86, cv2.IMWRITE_JPEG_PROGRESSIVE, 1])
# a small round-crop thumbnail for the face picker (centred between the eyes and the mouth)
cx, cy, half = W / 2, EYE_Y * H + 0.07 * H, int(0.25 * W)
thumb = photo[int(cy - half):int(cy + half), int(cx - half):int(cx + half)]
cv2.imwrite(f"{OUT}/{NAME}-thumb.jpg", cv2.resize(thumb, (112, 112), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 82])

# eyes closed: align on the outer eye corners and brows (the irises are hidden), then keep only the eye band
if CLOSED != "-":
    c = cv2.imread(CLOSED)
    lc = landmarks(c)
    ids = [33, 133, 362, 263, 70, 105, 334, 300, 168, 6, 197, 1]
    A, _ = cv2.estimateAffinePartial2D(lc[ids, :2].astype(np.float32), lm[ids, :2].astype(np.float32), method=cv2.LMEDS)
    cw = cv2.warpAffine(c, A, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    # match the colour of the eye band to the open photo, so only the lids change
    band = np.zeros((H, W), np.uint8)
    for ring in ([33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246], [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]):
        pts = lm[ring, :2]; cen = pts.mean(0); pts = cen + (pts - cen) * np.array([1.45, 2.3])
        cv2.fillPoly(band, [pts.astype(np.int32)], 255)
    band = cv2.GaussianBlur(band, (0, 0), 9)
    m = band > 40
    for ch in range(3):
        a, b = photo[..., ch][m].astype(np.float32), cw[..., ch][m].astype(np.float32)
        cw[..., ch] = np.clip((cw[..., ch].astype(np.float32) - b.mean()) * (a.std() / max(1, b.std())) + a.mean(), 0, 255).astype(np.uint8)
    blink = (photo.astype(np.float32) * (1 - band[..., None] / 255.0) + cw.astype(np.float32) * (band[..., None] / 255.0)).astype(np.uint8)
    cv2.imwrite(f"{OUT}/{NAME}-closed.jpg", blink, [cv2.IMWRITE_JPEG_QUALITY, 84, cv2.IMWRITE_JPEG_PROGRESSIVE, 1])

# depth: the face mesh rasterised (nearer = brighter), extended softly over the head and faded to the background
from mediapipe.python.solutions.face_mesh_connections import FACEMESH_TESSELATION
edges = np.array(list(FACEMESH_TESSELATION))
# rebuild triangles from the tessellation edges
adj = {}
for a, b in edges: adj.setdefault(a, set()).add(b); adj.setdefault(b, set()).add(a)
tris = set()
for a, b in edges:
    for c in adj[a] & adj[b]: tris.add(tuple(sorted((a, b, c))))
tris = np.array(list(tris))
z = -lm[:, 2]; z = (z - z.min()) / (z.max() - z.min())          # 0 far .. 1 near (nose tip)
dw, dh = 256, 320; sx, sy = dw / W, dh / H
depth = np.zeros((dh, dw), np.float32); cover = np.zeros((dh, dw), np.float32)
for t in tris:
    p = lm[t, :2] * [sx, sy]
    x0, y0 = np.floor(p.min(0)).astype(int); x1, y1 = np.ceil(p.max(0)).astype(int)
    x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(dw - 1, x1), min(dh - 1, y1)
    if x1 < x0 or y1 < y0: continue
    ys, xs = np.mgrid[y0:y1 + 1, x0:x1 + 1]
    v0, v1, v2 = p[0], p[1], p[2]
    den = (v1[1] - v2[1]) * (v0[0] - v2[0]) + (v2[0] - v1[0]) * (v0[1] - v2[1])
    if abs(den) < 1e-6: continue
    w0 = ((v1[1] - v2[1]) * (xs + .5 - v2[0]) + (v2[0] - v1[0]) * (ys + .5 - v2[1])) / den
    w1 = ((v2[1] - v0[1]) * (xs + .5 - v2[0]) + (v0[0] - v2[0]) * (ys + .5 - v2[1])) / den
    w2 = 1 - w0 - w1
    inside = (w0 >= -0.01) & (w1 >= -0.01) & (w2 >= -0.01)
    zz = w0 * z[t[0]] + w1 * z[t[1]] + w2 * z[t[2]]
    sel = inside & (zz > depth[ys, xs])
    depth[ys[sel], xs[sel]] = zz[sel]; cover[ys[sel], xs[sel]] = 1
# the head beyond the mesh (hair, ears, neck): grow outward with a falloff, then blur everything
oval = lm[[10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109], :2] * [sx, sy]
cen = oval.mean(0)
head = np.zeros((dh, dw), np.uint8)
cv2.fillPoly(head, [(cen + (oval - cen) * np.array([1.18, 1.22]) - [0, 6]).astype(np.int32)], 255)
neck = np.zeros((dh, dw), np.uint8)
chin = lm[152, :2] * [sx, sy]; half_w = (oval[:, 0].max() - oval[:, 0].min()) / 2
cv2.ellipse(neck, (int(chin[0]), int(chin[1] + 0.1 * dh)), (int(half_w * 0.62), int(0.16 * dh)), 0, 0, 360, 255, -1)
edge_val = np.percentile(depth[cover > 0], 8)
base = np.where(head > 0, edge_val * 0.55, 0) + np.where(neck > 0, edge_val * 0.35, 0)
depth = np.maximum(depth, base.astype(np.float32))
depth = cv2.GaussianBlur(depth, (0, 0), 3.2)
d8 = np.clip(depth * 255, 0, 255).astype(np.uint8)
cv2.imwrite(f"{OUT}/{NAME}-depth.png", d8)

# landmarks the site draws from, normalised to the frame (x right, y down)
def P(ids): return [[round(float(lm[i, 0] / W), 4), round(float(lm[i, 1] / H), 4)] for i in ids]
out = {
    "lipsOuter": P([61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146]),
    "lipsInner": P([78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95]),
    "eyeR": P([33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7]),
    "eyeL": P([263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249]),
    "browR": P([70, 63, 105, 66, 107]), "browRLow": P([46, 53, 52, 65, 55]),
    "browL": P([300, 293, 334, 296, 336]), "browLLow": P([276, 283, 282, 295, 285]),
    "irisR": P([468]) + [[round(float(np.linalg.norm(lm[469, :2] - lm[471, :2]) / 2 / W), 4), 0]],
    "irisL": P([473]) + [[round(float(np.linalg.norm(lm[474, :2] - lm[476, :2]) / 2 / W), 4), 0]],
    "cheekR": P([116, 117, 118, 101, 36, 205, 187, 123]), "cheekL": P([345, 346, 347, 330, 266, 425, 411, 352]),
    "noseBridge": P([168, 6, 197, 195, 5, 4, 1]), "noseBase": P([98, 97, 2, 326, 327]),
    "oval": P([10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]),
    "lidR": P([33, 246, 161, 160, 159, 158, 157, 173, 133]), "lidL": P([263, 466, 388, 387, 386, 385, 384, 398, 362]),
    "creaseR": P([226, 247, 30, 29, 27, 28, 56, 190, 243]), "creaseL": P([446, 467, 260, 259, 257, 258, 286, 414, 463]),
    "all": [[round(float(p[0] / W), 4), round(float(p[1] / H), 4)] for p in lm[:468:3]],
}
json.dump(out, open(f"{OUT}/{NAME}.json", "w"))
print(NAME, "ok", photo.shape, "closed" if CLOSED != "-" else "", "depth", d8.shape)
