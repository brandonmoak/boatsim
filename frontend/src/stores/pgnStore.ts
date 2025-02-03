import { create } from 'zustand';

export interface PGNState {
    [key: string]: Record<string, number>;
}

interface PGNStore {
    // State
    pgnState: PGNState;
    pgnRates: Record<string, number>;

    // Actions
    fetchPGNState: () => PGNState;
    fetchPGNFields: (pgn: string) => Record<string, number>;
    fetchPGNRate: (pgn: string) => number;
    replacePGNRates: (pgnRates: Record<string, number>) => void;
    replacePGNState: (pgnState: PGNState) => void;
    updatePGNRate: (pgn: string, rate: number) => void;
    updatePGNState: (pgnState: PGNState) => void;
    updatePGNFields: (pgn: string, values: Record<string, number>) => void;
}


export const usePGNStore = create<PGNStore>((set, get) => ({
    // Initial state
    pgnState: {},
    pgnRates: {},

    // Actions
    fetchPGNState: () => { return get().pgnState; },
    fetchPGNFields: (pgn) => { return get().pgnState[pgn]; },
    fetchPGNRate: (pgn) => { return get().pgnRates[pgn]; },
    replacePGNState: (pgnState) => set({ pgnState }),
    replacePGNRates: (pgnRates) => set({ pgnRates }),
    updatePGNState: (pgnState) => set((state) => ({
        pgnState: { ...state.pgnState, ...pgnState }
    })),
    updatePGNRate: (pgn, rate) => set((state) => ({
        pgnRates: { ...state.pgnRates, [pgn]: rate }
    })),
    updatePGNFields: (pgn, values) => set((state) => ({
        pgnState: {
            ...state.pgnState,
            [pgn]: {
                ...state.pgnState[pgn],
                ...values
            }
        }
    })),
}));