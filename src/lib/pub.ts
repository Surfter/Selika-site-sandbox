/* Files in public/ keep their plain names, so a browser or CDN that cached an earlier copy could keep
   showing it after an update. Each one is addressed with a short hash of its contents instead
   (worked out in vite.config.ts), so a changed photo or video always loads fresh and an unchanged
   one stays cached. */
declare const __PUBLIC_V__: Record<string, string>;

export const pub = (path: string) => {
  const v = __PUBLIC_V__[path];
  return v ? `${path}?v=${v}` : path;
};
