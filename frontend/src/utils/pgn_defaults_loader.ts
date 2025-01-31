import pgnDefaultConfig from '../config/pgn_defaults.json';
import { PGNDefaults, PGNDefinition } from '../types';

export function getDefaultPGNArray(): string[] {
    return Object.keys(pgnDefaultConfig);
}

export function getDefaultPGNs(): PGNDefaults {
    return pgnDefaultConfig;
}

export function getInitialPGNState(config: Record<string, PGNDefinition>): PGNDefaults {
    const state: PGNDefaults = {};
    
    const defaultPGNs = getDefaultPGNs();
    // For each default PGN
    Object.entries(config).forEach(([pgnKey, pgnDefinition]) => {
        // Initialize state for this PGN
        state[pgnKey] = {};
        
        // If we have defaults for this PGN, use them, otherwise initialize to 0
        const pgnDefault = defaultPGNs[pgnKey] ?? {};
        
        // Initialize each field with either the default value or 0
        pgnDefinition.Fields.forEach(field => {
            state[pgnKey][field.Name] = pgnDefault[field.Name] ?? 0;
        });
    });

    return state;
} 