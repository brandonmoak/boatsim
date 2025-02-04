import { create } from 'zustand';
import { PGNDefinition, PGNDefaults } from '../types';

export interface PGNState {
    [key: string]: Record<string, number>;
}

interface PGNStore {

    pgnState: PGNState;
    pgnRates: Record<string, number>;
    pgnDefault: PGNDefaults;
    pgnDefinitions: Record<string, PGNDefinition>;

    initializePGNStore: (pgnDefinitions: Record<string, PGNDefinition>, defaultPGNs: PGNDefaults) => void;

    //// STATE ////
    fetchPGNState: () => PGNState;
    fetchPGNFields: (pgn: string) => Record<string, number>;
    replacePGNState: (pgnState: PGNState) => void;
    updatePGNState: (pgnState: PGNState) => void;
    updatePGNFields: (pgn: string, values: Record<string, number>) => void;
    initializePGNState: (pgnConfigs: Record<string, PGNDefinition>, defaultPGNs: PGNDefaults) => void;

    //// RATES ////
    replacePGNRates: (pgnRates: Record<string, number>) => void;
    initializePGNRates: (pgnConfigs: Record<string, PGNDefinition>) => void;
    fetchPGNRate: (pgn: string) => number;
    updatePGNRate: (pgn: string, rate: number) => void;

    //// DEFAULTS ////
    initializePGNDefault: (defaultPGNs: PGNDefaults) => void;
    updatePGNDefault: (pgn: string, values: Record<string, number>) => void;
    addPGNToDefault: (pgn: string, values: Record<string, number>) => void;
    removePGNFromDefault: (pgn: string) => void;

    //// CONFIGS ////
    initializePGNDefinitions: (pgnDefinitions: Record<string, PGNDefinition>) => void;
    fetchPGNDefinitions: () => Record<string, PGNDefinition>;
}


export const usePGNStore = create<PGNStore>((set, get) => ({
    
    pgnState: {},
    pgnRates: {},
    pgnDefault: {},
    pgnDefinitions: {},

    initializePGNStore: (pgnDefinitions: Record<string, PGNDefinition>, defaultPGNs: PGNDefaults) => {
        const { initializePGNDefinitions, initializePGNDefault, initializePGNRates, initializePGNState } = get();
        initializePGNDefinitions(pgnDefinitions);
        initializePGNDefault(defaultPGNs);
        initializePGNRates(pgnDefinitions);
        initializePGNState(pgnDefinitions, defaultPGNs);
    },

    //// STATE ////
    fetchPGNState: () => { return get().pgnState; },
    fetchPGNFields: (pgn) => { return get().pgnState[pgn]; },
    replacePGNState: (pgnState) => set({ pgnState }),
    updatePGNState: (pgnState) => set((state) => ({
        pgnState: { ...state.pgnState, ...pgnState }
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
    initializePGNState: (pgnConfigs: Record<string, PGNDefinition>, defaultPGNs: PGNDefaults) => {
        const state: PGNDefaults = {};
        
        // For each default PGN
        Object.entries(pgnConfigs).forEach(([pgnKey, pgnDefinition]) => {
            // Initialize state for this PGN
            state[pgnKey] = {};
            
            // If we have defaults for this PGN, use them, otherwise initialize to 0
            const pgnDefault = defaultPGNs[pgnKey] ?? {};
            
            // Initialize each field with either the default value or 0
            pgnDefinition.Fields.forEach(field => {
                state[pgnKey][field.Name] = pgnDefault[field.Name] ?? 0;
            });
        });
        set({ pgnState: state });
    },

    //// RATES ////
    replacePGNRates: (pgnRates) => set({ pgnRates }),
    fetchPGNRate: (pgn) => { return get().pgnRates[pgn]; },
    updatePGNRate: (pgn, rate) => set((state) => ({
        pgnRates: { ...state.pgnRates, [pgn]: rate }
    })),
    initializePGNRates: (pgnConfigs: Record<string, PGNDefinition>) => {
        const rates = Object.keys(pgnConfigs).reduce((acc, pgnKey) => {
            const interval = pgnConfigs[pgnKey]?.TransmissionInterval;
            return {
                ...acc,
                [pgnKey]: interval ? 1000 / interval : 1
            };
        }, {});
        set({ pgnRates: rates });
    },


    //// DEFAULTS ////
    initializePGNDefault: (defaultPGNs: PGNDefaults) => {
        set({ pgnDefault: defaultPGNs });
    },
    updatePGNDefault: (pgn: string, values: Record<string, number>) => set((state) => ({
        pgnDefault: { ...state.pgnDefault, [pgn]: values }
    })),
    addPGNToDefault: (pgn: string, values: Record<string, number>) => {
        set((state) => ({
            pgnDefault: { ...state.pgnDefault, [pgn]: values }
        }));
    },
    removePGNFromDefault: (pgn: string) => {
        set((state) => {
            const { [pgn]: _, ...rest } = state.pgnDefault;
            return { pgnDefault: rest };
        });
    },


    //// CONFIGS ////
    initializePGNDefinitions: (pgnDefinitions: Record<string, PGNDefinition>) => {
        set({ pgnDefinitions });
    },
    fetchPGNDefinitions: () => { return get().pgnDefinitions; },
}));
