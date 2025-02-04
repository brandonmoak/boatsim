import React, { useEffect } from 'react';
import { PGNDefinition, PGNField } from '../types';
import { usePGNStore } from '../stores/pgnStore';
import { useEmitterStore } from '../stores/emitterStore';

interface PGNItemProps {
    config: PGNDefinition;
    pgnKey: string;
    rate: number;
    isSimulated: boolean;
}

const PGNItem: React.FC<PGNItemProps> = ({ config, pgnKey, rate, isSimulated }) => {
    const { pgnState, updatePGNFields, updatePGNRate } = usePGNStore();
    const { PGNsToStream, addPGNToStream, removePGNFromStream } = useEmitterStore();
    const [intermediateValues, setIntermediateValues] = React.useState<Record<string, string>>({});
    const [isExpanded, setIsExpanded] = React.useState(false);
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

    const handleStreamToggle = () => {
        if (PGNsToStream.includes(pgnKey)) {
            removePGNFromStream(pgnKey);
        } else {
            addPGNToStream(pgnKey);
        }
    };

    // Add this helper function to format the field summary
    const getFieldsSummary = () => {
        return config.Fields
            .filter(field => !field.Name.startsWith('Reserved'))
            .map(field => {
                const value = currentValues[field.Name];
                if (value === undefined) return '';
                const formattedValue = field.FieldType === 'LOOKUP' && field.EnumValues
                    ? field.EnumValues.find(e => e.value === value)?.name
                    : value.toFixed(2);
                return `${field.Name}: ${formattedValue}${field.Unit ? ' ' + field.Unit : ''}`;
            })
            .filter(Boolean)
            .join(', ');
    };

    return (
        <div className={`pgn-item ${isSimulated ? 'simulated' : ''} ${isExpanded ? 'expanded' : ''}`}>
            <div 
                className="pgn-item-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <input
                    type="checkbox"
                    className="pgn-stream-radio"
                    checked={PGNsToStream.includes(pgnKey)}
                    onChange={handleStreamToggle}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Toggle streaming for PGN ${config.PGN}`}
                />
                <div className="pgn-fixed-content">
                    <span className="pgn-number">PGN {config.PGN}</span>
                    <div className="pgn-value">
                        <div className="pgn-value-box" style={{borderWidth: '0px'}}>
                            <div className="pgn-value-label"></div>
                            <div 
                                className="pgn-value-input-wrapper"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <input
                                    type="number"
                                    value={rate.toFixed(2) || 0}
                                    onChange={handleRateChange}
                                    className="pgn-value-input"
                                />
                                <span className="pgn-value-unit">Hz</span>
                            </div>
                        </div>
                    </div>
                    <div className="pgn-description">
                        <span className="description-text">{config.Description}</span>
                        {!isExpanded && (
                            <span className="pgn-fields-summary" title={getFieldsSummary()}>
                                &nbsp;—&nbsp;{getFieldsSummary()}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="pgn-values-container">
                {config.Fields.map((field) => {
                    if (field.Name.startsWith('Reserved')) return null;

                    if (field.FieldType === 'LOOKUP' && field.EnumValues) {
                        return (
                            <div key={field.Name} className="pgn-value-box">
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
                        <div key={field.Name} className="pgn-value-box">
                            <div className="pgn-value-label">
                                {field.Description || field.Name}
                            </div>
                            <div className="pgn-value-input-wrapper">
                                <input
                                    type="number"
                                    value={intermediateValues[field.Name] || currentValues[field.Name]?.toFixed(2) || '0.00'}
                                    onChange={(e) => handleValueChange(field.Name, e.target.value)}
                                    onBlur={(e) => handleValueCommit(field.Name, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, field.Name, e.currentTarget.value)}
                                    min={getFieldMin(field)}
                                    max={getFieldMax(field)}
                                    step={getFieldStep(field)}
                                    className="pgn-value-input"
                                />
                                {field.Unit && <span className="pgn-value-unit">{field.Unit}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PGNItem; 