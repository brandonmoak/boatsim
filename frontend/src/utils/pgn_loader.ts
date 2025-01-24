import pgnConfig from '../config/pgn_config.yaml';
import pgnsBase from '@canboat/pgns/canboat.json';
import pgnsIK from '@canboat/pgns/pgns-ik.json';
import pgnsNGT from '@canboat/pgns/pgns-ngt.json';
import { PGNDefinition } from '../types';

function getPGNArray(): number[] {
    return pgnConfig.default_pgns || [];
}

export function getDefaultPGNs(): string[] {
    return getPGNArray().map(String);
}

export function organizePGNs(): Record<string, PGNDefinition[]> {
    const res: Record<string, PGNDefinition[]> = {};
    const all = [...pgnsBase.PGNs, ...pgnsIK.PGNs, ...pgnsNGT.PGNs];
    
    all.forEach(pgn => {
        const pgnKey = pgn.PGN.toString();
        if (!res[pgnKey]) {
            res[pgnKey] = [];
        }
        
        // Ensure Fields is always an array
        pgn.Fields = Array.isArray(pgn.Fields) ? pgn.Fields : [];
        
        // Handle Reserved field names
        let reservedCount = 1;
        pgn.Fields.forEach((field) => {
            if (field.Name === 'Reserved') {
                field.Name = `Reserved${reservedCount++}`;
            }
        });
        
        res[pgnKey].push(pgn as PGNDefinition);
    });
    return res;
}

export function loadPGNConfig(): Promise<Record<string, PGNDefinition[]>> {
    return Promise.resolve(organizePGNs());
}

export function getInitialPGNState(config: Record<string, PGNDefinition[]>): Record<string, Record<string, number>> {
    const state: Record<string, Record<string, number>> = {};
    
    // For each default PGN
    getPGNArray().forEach(pgn => {
        const pgnKey = String(pgn);
        const pgnConfig = config[pgnKey]?.[0];  // Get first definition
        
        if (pgnConfig) {
            // Initialize each field with a default value (0)
            state[pgnKey] = {};
            pgnConfig.Fields.forEach(field => {
                state[pgnKey][field.Name] = 0;
            });
        } else {
            state[pgnKey] = {};
        }
    });

    return state;
} 