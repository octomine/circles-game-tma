import { create } from "zustand";

import { GameSessionState } from "../types/gameSessionStore.types";
import { defaults } from "./defaults";

export const useGameSessionStore = create<GameSessionState>((set) => ({
  ...defaults,
  setScreen: (screen) => set({ screen }),
  addScore: (points) => set((state) => ({ score: state.score + points })),
  reset: () => set({ ...defaults })
}));
