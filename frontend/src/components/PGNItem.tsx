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

    const handleValueChange = (fieldName: string, value: string) => {
        // Parse the value and limit to 3 decimal places
        const parsedValue = parseFloat(parseFloat(value).toFixed(3));
        onValueChange(fieldName, parsedValue);
    };

    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Parse the rate and limit to 3 decimal places
        const parsedRate = parseFloat(parseFloat(e.target.value).toFixed(3));
        onRateChange(parsedRate);
    };

    return (
        <div className="pgn-item">
            <div className="pgn-item-fixed">
                <div className="pgn-fixed-content">
                    <span className="pgn-number">PGN {config.PGN}</span>
                    <div className="pgn-value">
                        <div className="pgn-value-input-group">
                            <input
                                type="number"
                                value={rate?.toFixed(3) || ''}
                                onChange={handleRateChange}
                                min={0}
                                max={100}
                                step={0.1}
                            />
                            <span className="pgn-value-unit">Hz</span>
                        </div>
                    </div>
                    <div className="pgn-description">
                        {config.Description}
                    </div>
                </div>
            </div>
            <div className="pgn-item-scrollable">
                <div className="pgn-values-container">
                    {config.Fields.map((field) => {
                        if (field.Name.startsWith('Reserved')) return null;

                        if (field.FieldType === 'LOOKUP' && field.EnumValues) {
                            return (
                                <div key={field.Name} className="pgn-value">
                                    <div className="pgn-value-label">
                                        {field.Description || field.Name}
                                    </div>
                                    <div className="pgn-value-input-group">
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
                                        {field.Unit && <span className="pgn-value-unit">{field.Unit}</span>}
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={field.Name} className="pgn-value">
                                <div className="pgn-value-label">
                                    {field.Description || field.Name}
                                </div>
                                <div className="pgn-value-input-group">
                                    <input
                                        type="number"
                                        value={currentValues[field.Name]?.toFixed(2) || '0.00'}
                                        onChange={(e) => handleValueChange(field.Name, e.target.value)}
                                        min={getFieldMin(field)}
                                        max={getFieldMax(field)}
                                        step={getFieldStep(field)}
                                    />
                                    {field.Unit && <span className="pgn-value-unit">{field.Unit}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PGNItem; 