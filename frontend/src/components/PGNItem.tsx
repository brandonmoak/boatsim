import React, { useEffect } from 'react';
import { PGNDefinition, PGNField } from '../types';
import { usePGNStore } from '../stores/pgnStore';

interface PGNItemProps {
    config: PGNDefinition;
    pgnKey: string;
    rate?: number;
    isSimulated?: boolean;
}

const PGNItem: React.FC<PGNItemProps> = ({ config, pgnKey, rate, isSimulated }) => {
    // Add state to track intermediate input values
    const { pgnState, updatePGNFields, updatePGNRate } = usePGNStore();
    const [intermediateValues, setIntermediateValues] = React.useState<Record<string, string>>({});
    const currentValues = pgnState[pgnKey] || {};

    useEffect(() => {
        if (!pgnState[pgnKey] || Object.keys(pgnState[pgnKey]).length === 0) {
            // Initialize with default values
            const initialValues: Record<string, number> = {};
            config.Fields.forEach(field => {
                initialValues[field.Name] = field.RangeMin || 0;
            });
            
            // Update parent with initial values
            Object.entries(initialValues).forEach(([field, value]) => {
                updatePGNFields(pgnKey, { [field]: Number(value) });
            });
        }
    }, [config.Fields, pgnKey]);
    
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

    const handleValueChange = (fieldName: string, inputValue: string) => {
        // Just update the intermediate value while typing
        setIntermediateValues(prev => ({
            ...prev,
            [fieldName]: inputValue
        }));
    };

    const handleValueCommit = (fieldName: string, value: string) => {
        // Parse and commit the value when focus is lost or Enter is pressed
        const parsedValue = parseFloat(parseFloat(value).toFixed(3));
        if (!isNaN(parsedValue)) {
            updatePGNFields(pgnKey, { [fieldName]: parsedValue });
        }
        // Clear intermediate value
        setIntermediateValues(prev => ({
            ...prev,
            [fieldName]: ''
        }));
    };

    const handleKeyDown = (e: React.KeyboardEvent, fieldName: string, value: string) => {
        if (e.key === 'Enter') {
            handleValueCommit(fieldName, value);
        }
    };

    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Parse the rate and limit to 3 decimal places
        const parsedRate = parseFloat(parseFloat(e.target.value).toFixed(3));
        updatePGNRate(pgnKey, parsedRate);
    };

    return (
        <div className={`pgn-item ${isSimulated ? 'simulated' : ''}`}>
            <div className="pgn-item-fixed">
                <div className="pgn-fixed-content">
                    <span className={`pgn-number ${isSimulated ? 'simulated' : ''}`}>PGN {config.PGN}</span>
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
                                            onChange={(e) => updatePGNFields(pgnKey, { [field.Name]: parseFloat(e.target.value) })}
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
                                        value={intermediateValues[field.Name] || currentValues[field.Name]?.toFixed(2) || '0.00'}
                                        onChange={(e) => handleValueChange(field.Name, e.target.value)}
                                        onBlur={(e) => handleValueCommit(field.Name, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, field.Name, e.currentTarget.value)}
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