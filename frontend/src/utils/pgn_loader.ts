import pgnConfig from '../config/pgn_config.yaml';

export interface PGNConfig {
    pgn: number;
    description: string;
    system: string;
    parameters: Record<string, ParameterConfig>;
}

export interface ParameterConfig {
    description: string;
    unit: string;
    min: number;
    max: number;
    step: number;
}

// Cache for the parsed config
let configCache: Record<string, PGNConfig> | null = null;

export async function loadPGNConfig(): Promise<Record<string, PGNConfig>> {
    // Return cached config if available
    if (configCache) {
        return configCache;
    }

    try {
        console.log('Raw PGN config:', pgnConfig);
        
        if (!pgnConfig || !pgnConfig.pgns) {
            console.error('Invalid config structure:', pgnConfig);
            return {};
        }

        console.log('Parsed PGN config:', pgnConfig.pgns);
        
        // Cache the config and return it
        configCache = pgnConfig.pgns;
        return pgnConfig.pgns;
    } catch (error) {
        console.error('Failed to load PGN config:', error);
        return {};
    }
}

export function clearPGNConfigCache(): void {
    configCache = null;
}

export function getInitialPGNState(config: Record<string, PGNConfig>): Record<string, Record<string, number>> {
    const initialState: Record<string, Record<string, number>> = {};
    
    Object.entries(config).forEach(([key, pgn]) => {
        const systemKey = key;
        if (!initialState[systemKey]) {
            initialState[systemKey] = {};
        }
        
        Object.entries(pgn.parameters).forEach(([paramKey, paramConfig]) => {
            initialState[systemKey][paramKey] = paramConfig.min;
        });
    });
    
    return initialState;
} 