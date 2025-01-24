import React from 'react';
import { PGNDefinition, PGNField } from '../types';

interface PGNItemProps {
    config: PGNDefinition;
    value: Record<string, number>;
    onChange: (field: string, value: string | number) => void;
    rate?: number;
    onRateChange?: (value: number) => void;
}

const PGNItem: React.FC<PGNItemProps> = ({ config, value, onChange, rate, onRateChange }) => {
    // Add debug log when component renders

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

    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onRateChange?.(Number(e.target.value));
    };

    return (
        <div className="pgn-item">
            <div className="pgn-description">
                <span className="pgn-number">PGN {config.PGN}</span>
                {config.Description}
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
            {rate !== undefined && (
                <div className="pgn-value">
                    <label>Rate:</label>
                    <input
                        type="number"
                        value={rate || ''}
                        onChange={handleRateChange}
                        min={0}
                        max={100}
                        step={0.1}
                    />
                    <span>Hz</span>
                </div>
            )}
        </div>
    );
};

export default PGNItem; 