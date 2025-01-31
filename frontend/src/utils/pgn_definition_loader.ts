import pgnsBase from '@canboat/pgns/canboat.json';
import pgnsIK from '@canboat/pgns/pgns-ik.json';
import pgnsNGT from '@canboat/pgns/pgns-ngt.json';
import { PGNDefinition, PGNField } from '../types';

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
    
    const all: RawPGN[] = [...pgnsBase.PGNs, ...pgnsIK.PGNs, ...pgnsNGT.PGNs];
    
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
        // ... existing code ...
        const pgnKey = pgn.PGN.toString();
        const fields = Array.isArray(pgn.Fields) ? pgn.Fields : [pgn.Fields];
        
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
            
            if (field.FieldType === 'LOOKUP' && field.LookupEnumeration) {
                transformedField.EnumValues = lookupEnums.get(field.LookupEnumeration);
            }
            
            return transformedField;
        });
        
        const pgnDefinition: PGNDefinition = {
            PGN: pgn.PGN,
            Id: pgn.Id,
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