import { create } from 'zustand';

interface EmitterStore {
    PGNsToStream: string[];
    isEmitting: boolean;
    streamLog: string[];
    showStreamLog: boolean;
    pauseStreamLog: boolean;

    setPGNsToStream: (pgns: string[]) => void;
    addPGNToStream: (pgn: string) => void;
    removePGNFromStream: (pgn: string) => void;
    setIsEmitting: (isEmitting: boolean) => void;
    setStreamLog: (log: string[]) => void;
    appendToStreamLog: (log: string) => void;
    clearStreamLog: () => void;
    toggleStreamLog: () => void;
    togglePauseStreamLog: () => void;
}

export const useEmitterStore = create<EmitterStore>((set) => ({
    PGNsToStream: [],
    isEmitting: false,
    streamLog: [],
    showStreamLog: false,
    pauseStreamLog: false,

    setPGNsToStream: (pgns: string[]) => set({ PGNsToStream: pgns }),
    addPGNToStream: (pgn: string) => set((state) => ({
        PGNsToStream: [...state.PGNsToStream, pgn]
    })),
    removePGNFromStream: (pgn: string) => set((state) => ({
        PGNsToStream: state.PGNsToStream.filter((p) => p !== pgn)
    })),
    setIsEmitting: (isEmitting: boolean) => set({ isEmitting }),
    setStreamLog: (log: string[]) => set({ streamLog: log }),
    appendToStreamLog: (log: string) => set((state) => ({
        streamLog: [...state.streamLog, log].slice(-10000)
    })),
    clearStreamLog: () => set({ streamLog: [] }),
    toggleStreamLog: () => set((state) => ({ showStreamLog: !state.showStreamLog })),
    togglePauseStreamLog: () => set((state) => ({ pauseStreamLog: !state.pauseStreamLog })),
}));