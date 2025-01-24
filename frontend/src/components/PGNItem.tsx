import React from 'react';

// Types from canboat PGNs
interface PGNField {
    Order: number;
    Id: string;
    Name: string;
    Description?: string;
    BitLength: number;
    BitOffset: number;
    BitStart: number;
    Resolution?: number;
    Signed?: boolean;
    Unit?: string;
    RangeMin?: number;
    RangeMax?: number;
    FieldType: string;
    LookupEnumeration?: string;
    EnumValues?: Record<string, string>;
    Minimum?: number;
    Maximum?: number;
    Type?: string;
}

interface PGNDefinition {
    PGN: number;
    Id: string;
    Description: string;
    Priority?: number;
    Fields: PGNField[];
    Length?: number;
    RepeatingFields?: number;
    Type?: string;
    Complete?: boolean;
    FieldCount?: number;
}

interface PGNItemProps {
    config: PGNDefinition;
    value: Record<string, number>;
    onChange: (field: string, value: string | number) => void;
    rate?: number;
}

const PGNItem: React.FC<PGNItemProps> = ({ config, value, onChange, rate }) => {
    // Add debug log when component renders
    console.log('PGN Configuration:', {
        pgn: config.PGN,
        description: config.Description,
        fields: config.Fields,
        rate,
        currentValues: value
    });

    const currentValues = value || {};
    
    const getFieldStep = (field: PGNField) => {
        if (field.Resolution) return field.Resolution;
        if (field.FieldType === 'NUMBER') return 0.1;
        return 1;
    };

    const getFieldMin = (field: PGNField) => {
        if (field.RangeMin !== undefined) return field.RangeMin;
        if (field.Signed) return -(2 ** (field.BitLength - 1));
        return 0;
    };

    const getFieldMax = (field: PGNField) => {
        if (field.RangeMax !== undefined) return field.RangeMax;
        if (field.Signed) return (2 ** (field.BitLength - 1)) - 1;
        return (2 ** field.BitLength) - 1;
    };

    return (
        <div className="pgn-item">
            <div className="pgn-description">
                <span className="pgn-number">PGN {config.PGN}</span>
                {config.Description}
                {rate !== undefined && (
                    <span className="pgn-rate"> [{rate.toFixed(1)}/s]</span>
                )}
            </div>
            {config.Fields.map((field) => {
                // Skip Reserved fields
                if (field.Name.startsWith('Reserved')) return null;

                // Handle different field types
                if (field.FieldType === 'LOOKUP' && field.EnumValues) {
                    return (
                        <div key={field.Name} className="pgn-value">
                            <label>{field.Description || field.Name}:</label>
                            <select
                                value={currentValues[field.Name] || ''}
                                onChange={(e) => onChange(field.Name, e.target.value)}
                            >
                                {Object.entries(field.EnumValues).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            {field.Unit && <span>{field.Unit}</span>}
                        </div>
                    );
                }

                return (
                    <div key={field.Name} className="pgn-value">
                        <label>{field.Description || field.Name}:</label>
                        <input
                            type="number"
                            value={currentValues[field.Name] || 0}
                            onChange={(e) => onChange(field.Name, e.target.value)}
                            min={getFieldMin(field)}
                            max={getFieldMax(field)}
                            step={getFieldStep(field)}
                        />
                        {field.Unit && <span>{field.Unit}</span>}
                    </div>
                );
            })}
        </div>
    );
};

export default PGNItem; 