import pgnDefaultConfig from '../config/pgn_defaults.json';
import { PGNDefaults, PGNDefinition } from '../types';

export function getDefaultPGNArray(): string[] {
    return Object.keys(pgnDefaultConfig);
}

export function getDefaultPGNs(): PGNDefaults {
    return pgnDefaultConfig;
}

