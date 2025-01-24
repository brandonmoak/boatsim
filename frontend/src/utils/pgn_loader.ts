import pgnConfig from '../config/pgn_config.yaml';
import { PGNDefinition } from '../types';

function getPGNArray(): number[] {
    return pgnConfig.default_pgns || [];
}

export function getDefaultPGNs(): string[] {
    return getPGNArray().map(String);
}

export function loadPGNConfig(): Promise<Record<string, PGNDefinition[]>> {
    return Promise.resolve(pgnConfig);
}

export function getInitialPGNState(config: Record<string, PGNDefinition[]>): Record<string, Record<string, number>> {
    const state: Record<string, Record<string, number>> = {};
    getPGNArray().forEach(pgn => {
        state[String(pgn)] = {};
    });
    return state;
} 