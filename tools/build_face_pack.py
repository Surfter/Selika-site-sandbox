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

def coverage(src_shape, M):
    """Which pixels of the aligned frame the source photo actually covers."""
    h0, w0 = src_shape[:2]
    return cv2.warpAffine(np.full((h0, w0), 255, np.uint8), M, (W, H), flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT, borderValue=0) > 0

def fill_outside(img, inside):
    """Where the aligned frame reaches past the source photo, BORDER_REPLICATE smears the edge pixels into
    streaks. Replace those areas with a soft, blurred extension that fades into the dark studio background.
    (At the sides this is never on screen; a gap at the top is then rebuilt by extend_top.)"""
    out = (~inside).astype(np.uint8)
    if out.sum() == 0: return img
    dist = cv2.distanceTransform(out, cv2.DIST_L2, 5)
    soft = cv2.GaussianBlur(img, (0, 0), 22)
    bg = np.percentile(img[inside].reshape(-1, 3).astype(np.float32), 6, axis=0)   # the backdrop: the darkest few percent
    fade = np.clip(dist / 70.0, 0, 1)[..., None]
    fill = soft.astype(np.float32) * (1 - fade) + bg * fade
    fill += np.random.default_rng(7).normal(0, 2.2, fill.shape)   # the photo's grain, so the fill doesn't band
    m = cv2.GaussianBlur(out.astype(np.float32), (0, 0), 3)[..., None]
    return np.clip(img.astype(np.float32) * (1 - m) + fill * m, 0, 255).astype(np.uint8)

def head_ellipse(img, y0, y1):
    """The head's outline (hair included) between rows y0 and y1, as an axis-aligned ellipse (cx, cy, a, b)."""
    seg = mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=0)
    m = seg.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)).segmentation_mask > 0.5
    pts = []
    for y in range(y0, y1, 2):
        xs = np.where(m[y])[0]
        if len(xs) < 2: continue
        br = np.where(np.diff(xs) > 1)[0]                       # the widest run of "person" in the row
        starts, ends = np.r_[xs[0], xs[br + 1]], np.r_[xs[br], xs[-1]]
        k = np.argmax(ends - starts)
        pts += [(starts[k], y), (ends[k], y)]
    if len(pts) < 10: return None
    x, y = np.array(pts, np.float64).T                          # least squares: A x^2 + B y^2 + C x + D y = 1
    p = np.linalg.lstsq(np.c_[x * x, y * y, x, y], np.ones_like(x), rcond=None)[0]
    if p[0] * p[1] <= 0: return None                             # not an ellipse
    cx, cy = -p[2] / (2 * p[0]), -p[3] / (2 * p[1])
    g = 1 + p[0] * cx * cx + p[1] * cy * cy
    if g / p[0] <= 0: return None
    return cx, cy, math.sqrt(g / p[0]), math.sqrt(g / p[1])

def extend_top(img, inside):
    """Where the source photo stops short of the top of the frame (a close crop through the hair), continue the
    head upward instead of leaving a cut: each missing row is the row the same distance below the photo's edge
    (a mirror, so hair and backdrop carry on seamlessly), squeezed to the head's width at that height (an ellipse
    fitted to the hair outline, so the crown closes naturally), and a little darker toward the crown."""
    cols = inside.any(0)
    ytop = np.where(cols, np.argmax(inside, axis=0), 0)
    yc = int(ytop[W // 5: W - W // 5].max())
    if yc <= 0: return img
    yc += 3                                                     # clear of the edge's resampling
    e = head_ellipse(img, yc + 22, min(H - 1, yc + 260))
    if e is None: return img
    cx, cy, a, b = e
    crown = cy - b
    hw = lambda y: a * math.sqrt(max(0.0, 1 - ((y - cy) / b) ** 2))
    t = np.arange(W, dtype=np.float64) - cx
    sgn, E = np.where(t < 0, -1.0, 1.0), np.where(t < 0, cx, W - 1 - cx)
    map_x, map_y = np.zeros((yc, W), np.float32), np.zeros((yc, W), np.float32)
    head, squeeze = np.zeros((yc, W), np.float32), np.ones(yc, np.float32)
    for y in range(yc):
        yr = 2 * yc - y
        hb = hw(yr)
        # above the crown the half-width goes "negative", so the outline's soft edge closes over the top of the
        # head instead of running on up the backdrop
        ha = hw(y) if y >= crown else -2.0 * (crown - y)
        inner = t * (hb / ha) if ha >= 0.5 else np.zeros_like(t)
        outer = sgn * (hb + (np.abs(t) - ha) * (E - hb) / (E - ha))
        map_x[y] = cx + np.where(np.abs(t) <= max(ha, 0.0), inner, outer); map_y[y] = yr
        head[y] = np.clip((ha - np.abs(t)) / 3.0 + 0.5, 0, 1)
        if ha >= 0.5: squeeze[y] = hb / ha
    # near the crown the hair is squeezed hard: sample horizontally softened copies there, so it doesn't alias
    levels = [img] + [cv2.GaussianBlur(img, (0, 0), sigmaX=sg, sigmaY=0.01) for sg in (1.5, 4.0)]
    syn = [cv2.remap(L, map_x, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT).astype(np.float32) for L in levels]
    q = (np.clip((np.log2(np.maximum(squeeze, 1)) - 1.0) / 2.0, 0, 1) * 2)[:, None, None]
    lo = np.minimum(q, 1)
    hair = np.where(q <= 1, syn[0] * (1 - lo) + syn[1] * lo, syn[1] * (2 - q) + syn[2] * (q - 1))
    k = np.clip((yc - np.arange(yc, dtype=np.float32)) / max(1.0, yc - crown), 0, 1)[:, None, None]
    hair *= 1 - 0.28 * k ** 1.5                                  # the dome turns away from the light
    out = img.copy()
    out[:yc] = np.clip(hair * head[..., None] + syn[0] * (1 - head[..., None]), 0, 255).astype(np.uint8)
    return out

src = cv2.imread(OPEN)
lm0 = landmarks(src)
photo, M = align(src, lm0)
inside = coverage(src.shape, M)
photo = extend_top(fill_outside(photo, inside), inside)
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
