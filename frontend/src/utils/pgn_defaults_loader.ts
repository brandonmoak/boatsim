import { PGNDefaults } from '../types';
import { pgnApi } from '../services/api';

export function getDefaultPGNArray(): Promise<string[]> {
    return pgnApi.getDefaults().then(defaults => Object.keys(defaults));
}

export function getDefaultPGNs(): Promise<PGNDefaults> {
    return pgnApi.getDefaults();
}

