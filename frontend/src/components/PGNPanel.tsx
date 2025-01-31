import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import PGNItem from './PGNItem';
import { PGNDefinition } from '../types';
import { loadPGNConfig, getDefaultPGNArray } from '../utils/pgn_loader';
import { 
  PGNPanelProps 
} from '../types';

interface PGNOption {
    value: string;
    label: string;
}

const PGNPanel = React.memo(({ 
  pgnState, 
  pgnRates, 
  selectedPGNs,
  onPGNFieldsUpdate,
  onPGNRateUpdate, 
  onSelectedPGNsChange 
}: PGNPanelProps) => {
    
    const [pgnDefinitions, setPgnDefinitions] = useState<Record<string, PGNDefinition>>({});

    useEffect(() => {
        loadPGNConfig().then(definitions => {
            setPgnDefinitions(definitions);
        });
    }, []);

    const handlePGNChange = (pgnKey: string, field: string, value: number) => {
        onPGNFieldsUpdate(pgnKey, { [field]: value });
    };

    const handleRateChange = (pgnKey: string, value: number) => {
        onPGNRateUpdate(pgnKey, value);
    };

    const handlePGNSelect = (option: PGNOption | null) => {
        if (option && !selectedPGNs.includes(option.value)) {
            onSelectedPGNsChange([...selectedPGNs, option.value]);
        }
    };

    const handleRemovePGN = (pgnKey: string) => {
        onSelectedPGNsChange(selectedPGNs.filter(key => key !== pgnKey));
    };

    const pgnOptions: PGNOption[] = Object.entries(pgnDefinitions).map(([key, defs]) => ({
        value: key,
        label: `${key} - ${defs?.Description || 'Unknown'}`
    }));

    return (
        <div className="pgn-panel">
            <div className="pgn-panel-header">
                <div className="pgn-selector">
                    <Select
                        options={pgnOptions}
                        onChange={handlePGNSelect}
                        value={null}
                        placeholder="Add NMEA 2000 PGN"
                        className="pgn-select-container"
                        classNamePrefix="pgn-select"
                        isClearable={false}
                    />
                </div>
            </div>

            <div className="pgn-panel-content">
                {selectedPGNs
                    .sort((a, b) => parseInt(b) - parseInt(a))
                    .map(pgnKey => {
                        const definitions = pgnDefinitions[pgnKey];
                        if (!definitions) return null;

                        return (
                            <div key={pgnKey} className="pgn-item-container">
                                <button 
                                    className="remove-pgn"
                                    onClick={() => handleRemovePGN(pgnKey)}
                                >
                                    ×
                                </button>
                                <PGNItem 
                                    config={definitions}
                                    value={pgnState[pgnKey] || {}}
                                    rate={pgnRates[pgnKey]}
                                    onValueChange={(field, value) => handlePGNChange(pgnKey, field, value)}
                                    onRateChange={(value) => handleRateChange(pgnKey, value)}
                                />
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        JSON.stringify(prevProps.pgnState) === JSON.stringify(nextProps.pgnState) &&
        JSON.stringify(prevProps.pgnRates) === JSON.stringify(nextProps.pgnRates) &&
        JSON.stringify(prevProps.selectedPGNs) === JSON.stringify(nextProps.selectedPGNs)
    );
});

export default PGNPanel; 