import { parse } from 'yaml';

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

export async function loadPGNConfig(): Promise<Record<string, PGNConfig>> {
    try {
        const response = await fetch('/config/pgn_config.yaml');
        const yamlText = await response.text();
        console.log('Raw YAML text:', yamlText);
        const config = parse(yamlText);
        console.log('Parsed config:', config);
        if (!config || !config.pgns) {
            console.error('Invalid config structure:', config);
            return {};
        }
        return config.pgns;
    } catch (error) {
        console.error('Failed to load PGN config:', error);
        return {};
    }
} 