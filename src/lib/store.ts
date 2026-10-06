import { create } from "zustand";

export type Product = "beauty" | "dev";

type State = {
  product: Product;
  /** increments on every switch, so effects can replay their animation */
  switchCount: number;
  /** true for the ~1.2 s the hero mirror spends spinning between products */
  switching: boolean;
  /** the preloader has finished and the page may start its entrance */
  entered: boolean;
  setProduct: (p: Product) => void;
  toggleProduct: () => void;
  enter: () => void;
};

let switchTimer: ReturnType<typeof setTimeout> | undefined;

export const useSite = create<State>((set, get) => ({
  product: "beauty",
  switchCount: 0,
  switching: false,
  entered: false,
  setProduct: (p) => {
    if (p === get().product) return;
    document.documentElement.dataset.product = p;
    set((s) => ({ product: p, switchCount: s.switchCount + 1, switching: true }));
    clearTimeout(switchTimer);
    switchTimer = setTimeout(() => set({ switching: false }), 1250);
  },
  toggleProduct: () => get().setProduct(get().product === "beauty" ? "dev" : "beauty"),
  enter: () => set({ entered: true }),
}));
