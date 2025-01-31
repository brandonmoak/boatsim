import React, { useEffect } from 'react';
import { PGNDefinition, PGNField } from '../types';
import { getInitialPGNState } from '../utils/pgn_defaults_loader';

interface PGNItemProps {
    config: PGNDefinition;
    value: Record<string, number>;
    rate?: number;
    onValueChange: (field: string, value: number) => void;
    onRateChange: (value: number) => void;
}

const PGNItem: React.FC<PGNItemProps> = ({ config, value, rate, onValueChange, onRateChange }) => {
    useEffect(() => {
        if (!value || Object.keys(value).length === 0) {
            // Initialize with default values
            const initialValues: Record<string, number> = {};
            config.Fields.forEach(field => {
                initialValues[field.Name] = field.RangeMin || 0;
            });
            
            // Update parent with initial values
            Object.entries(initialValues).forEach(([field, value]) => {
                onValueChange(field, Number(value));
            });
        }
    }, [config.Fields, value, onValueChange]);

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
        onRateChange(parseFloat(e.target.value));
    };

    return (
        <div className="pgn-item">
            <div className="pgn-description">
                <span className="pgn-number">PGN {config.PGN}</span>
                {config.Description}
            </div>
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
                                onChange={(e) => onValueChange(field.Name, parseFloat(e.target.value))}
                            >
                                {field.EnumValues.map((enumValue) => (
                                    <option key={enumValue.value} value={enumValue.value}>
                                        {enumValue.name}
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
                            onChange={(e) => onValueChange(field.Name, parseFloat(e.target.value))}
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