/* The photographic demo faces in public/faces (built offline from AI-generated
   portraits, not real people). Each pack is NAME.jpg, NAME-closed.jpg (eyes shut,
   for blinks), NAME-depth.png, NAME-thumb.jpg and NAME.json (landmarks). While the
   list is empty the demo uses the ICT-FaceKit 3D face instead. */
export type FacePack = { id: string; label: string; blink: boolean };

let packs: FacePack[] = [];

// development only: ?faces=a,b loads packs that are not listed yet
if (import.meta.env.DEV && typeof window !== "undefined") {
  const q = new URLSearchParams(window.location.search).get("faces");
  if (q) packs = q.split(",").filter(Boolean).map((id) => ({ id, label: id, blink: !id.startsWith("test") }));
}

export const FACE_PACKS: FacePack[] = packs;
export const facePath = (id: string, part = "") => `/faces/face-${id}${part}`;
