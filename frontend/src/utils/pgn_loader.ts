import pgnConfig from '../config/pgn_config.yaml';
import pgnsBase from '@canboat/pgns/canboat.json';
import pgnsIK from '@canboat/pgns/pgns-ik.json';
import pgnsNGT from '@canboat/pgns/pgns-ngt.json';
import { PGNDefinition, PGNField, PGNDefaults, PGNDefaultField} from '../types';

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

interface RawPGNField {
    Name: string;
    FieldType?: string;
    LookupEnumeration?: string;
    Description?: string;
    Unit?: string;
    EnumValues?: Array<{ Name: string; Value: number }>;
    Order?: number;
    Id?: string;
    BitLength?: number;
    BitOffset?: number;
    BitStart?: number;
    Signed?: boolean;
    Resolution?: number;
    Offset?: number;
    RangeMin?: number;
    RangeMax?: number;
}

interface RawPGN {
    PGN: number;
    Id: string;
    Description: string;
    Priority?: number;
    Explanation?: string;
    Type?: string;
    Complete?: boolean;
    FieldCount?: number;
    Length?: number;
    TransmissionIrregular?: boolean;
    TransmissionInterval?: number;
    Fields: RawPGNField[] | RawPGNField;
}

interface LookupEnumeration {
    Name: string;
    MaxValue?: number;
    EnumValues: Array<{ Name: string; Value: number }>;
}

export function organizePGNs(): Record<string, PGNDefinition> {
    const res: Record<string, PGNDefinition> = {};
    
    // Explicitly type the combined PGNs array
    const all: RawPGN[] = [...pgnsBase.PGNs, ...pgnsIK.PGNs, ...pgnsNGT.PGNs];
    
    // Create a map of lookup enumerations for easy access
    const lookupEnums: Map<string, Array<{ name: string; value: number }>> = new Map(
        (pgnsBase.LookupEnumerations as LookupEnumeration[]).map(lookup => [
            lookup.Name,
            lookup.EnumValues.map(ev => ({
                name: ev.Name,
                value: ev.Value
            }))
        ])
    );
    
    all.forEach(pgn => {
        const pgnKey = pgn.PGN.toString();
        
        // Ensure Fields is always an array and convert to PGNField type
        const fields = Array.isArray(pgn.Fields) ? pgn.Fields : [pgn.Fields];
        
        // Transform fields with explicit typing
        let reservedCount = 1;
        const transformedFields = fields.map(field => {
            const transformedField: PGNField = {
                Name: field.Name === 'Reserved' ? `Reserved ${reservedCount++}` : field.Name,
                FieldType: field.FieldType || '',
                Description: field.Description || '',
                Unit: field.Unit,
                Order: field.Order || 0,
                Id: field.Id || '0',
                BitLength: field.BitLength || 0,
                BitOffset: field.BitOffset || 0,
                BitStart: field.BitStart || 0,
                Signed: field.Signed || false,
                Resolution: field.Resolution || 1,
                RangeMin: field.RangeMin || 0,
                RangeMax: field.RangeMax || 0
            };
            
            // Add enum values if this is a lookup field
            if (field.FieldType === 'LOOKUP' && field.LookupEnumeration) {
                transformedField.EnumValues = lookupEnums.get(field.LookupEnumeration);
            }
            
            return transformedField;
        });
        
        // Create the final PGNDefinition
        const pgnDefinition: PGNDefinition = {
            PGN: pgn.PGN,
            Id: pgn.Id,  // Use the Id if available, otherwise use PGN as string
            Description: pgn.Description,
            Fields: transformedFields,
            TransmissionInterval: pgn.TransmissionInterval
        };
        
        res[pgnKey] = pgnDefinition;
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