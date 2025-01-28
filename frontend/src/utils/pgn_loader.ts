import pgnConfig from '../config/pgn_config.yaml';
import pgnsBase from '@canboat/pgns/canboat.json';
import pgnsIK from '@canboat/pgns/pgns-ik.json';
import pgnsNGT from '@canboat/pgns/pgns-ngt.json';
import { PGNDefinition, PGNDefaults, PGNDefaultField} from '../types';

// load the yaml file into a typed interface
interface YamlPGNDefaultsElement {pgnId: number, fields: PGNDefaultField[]};
interface YamlPGNDefaults {
    default_pgns: YamlPGNDefaultsElement[]
};
const typedPGNConfig: YamlPGNDefaults = pgnConfig;

export function getDefaultPGNArray(): string[] {
    return typedPGNConfig.default_pgns.map((element: YamlPGNDefaultsElement) => String(element.pgnId));
}

function getDefaultPGNs(): PGNDefaults {
    const res: PGNDefaults = {};
    typedPGNConfig.default_pgns.forEach((pgn: YamlPGNDefaultsElement) => {
        const pgnKey = String(pgn.pgnId);
        const resfields: PGNDefaultField = {};
        pgn.fields.forEach((field: PGNDefaultField) => {
            resfields[field.name] = field.defaultValue;
        });
        res[pgnKey] = resfields;
    });
    return res;
}

export function organizePGNs(): Record<string, PGNDefinition> {
    const res: Record<string, PGNDefinition> = {};
    const all = [...pgnsBase.PGNs, ...pgnsIK.PGNs, ...pgnsNGT.PGNs];
    
    all.forEach(pgn => {
        const pgnKey = pgn.PGN.toString();
        // Ensure Fields is always an array
        pgn.Fields = Array.isArray(pgn.Fields) ? pgn.Fields : [];
        
        // Handle Reserved field names
        let reservedCount = 1;
        pgn.Fields.forEach((field) => {
            if (field.Name === 'Reserved') {
                field.Name = `Reserved${reservedCount++}`;
            }
        });
        
        res[pgnKey] = pgn as PGNDefinition;
    });
    return res;
}

export function loadPGNConfig(): Promise<Record<string, PGNDefinition>> {
    return Promise.resolve(organizePGNs());
}

export function getInitialPGNState(config: Record<string, PGNDefinition>): PGNDefaults {
    const state: PGNDefaults = {};
    
    const defaultPGNs = getDefaultPGNs();
    // For each default PGN
    getDefaultPGNArray().forEach(pgn => {
        const pgnKey = String(pgn);
        const pgnDefinition = config[pgnKey];  // Get first definition
        const pgnDefault = defaultPGNs[pgnKey] ?? {};

        if (pgnDefinition) {
            // Initialize each field with a default value (0) or from the default PGN
            state[pgnKey] = {};
            pgnDefinition.Fields.forEach(field => {
                state[pgnKey][field.Name] = pgnDefault[field.Name] ?? 0;
            });
        } else {
            state[pgnKey] = {};
        }
    });

    return state;
} 