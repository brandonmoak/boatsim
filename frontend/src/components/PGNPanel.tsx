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
  onPGNFieldsUpdate,
  onPGNRateUpdate, 
  onSelectedPGNsChange 
}: PGNPanelProps) => {
    
    const [pgnDefinitions, setPgnDefinitions] = useState<Record<string, PGNDefinition>>({});
    const [selectedPGNs, setSelectedPGNs] = useState<string[]>(getDefaultPGNArray());
    const lastPGNsRef = React.useRef('');

    useEffect(() => {
        loadPGNConfig().then(definitions => {
            setPgnDefinitions(definitions);
        });
    }, []);

    useEffect(() => {
        // Deep equality check to see if the array actually changed
        const currentPGNsString = JSON.stringify(selectedPGNs.sort());
        
        if (currentPGNsString !== lastPGNsRef.current) {
            console.log('Selected PGNs actually changed:', selectedPGNs);
            onSelectedPGNsChange(selectedPGNs);
            lastPGNsRef.current = currentPGNsString;
        }
    }, [selectedPGNs, onSelectedPGNsChange]);

    const handlePGNChange = (pgnKey: string, field: string, value: number) => {
        onPGNFieldsUpdate(pgnKey, { [field]: value });
    };

    const handleRateChange = (pgnKey: string, value: number) => {
        onPGNRateUpdate(pgnKey, value);
    };

    const handlePGNSelect = (option: PGNOption | null) => {
        if (option && !selectedPGNs.includes(option.value)) {
            setSelectedPGNs([...selectedPGNs, option.value]);
        }
    };

    const handleRemovePGN = (pgnKey: string) => {
        setSelectedPGNs(selectedPGNs.filter(key => key !== pgnKey));
    };

    const pgnOptions: PGNOption[] = Object.entries(pgnDefinitions).map(([key, defs]) => ({
        value: key,
        label: `${key} - ${defs?.Description || 'Unknown'}`
    }));

    return (
        <div className="pgn-panel">
            <div className="pgn-panel-header">
                <h3>NMEA 2000 Parameters</h3>
                
                <div className="pgn-selector">
                    <Select
                        options={pgnOptions}
                        onChange={handlePGNSelect}
                        value={null}
                        placeholder="Add PGN..."
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
        JSON.stringify(prevProps.pgnRates) === JSON.stringify(nextProps.pgnRates)
    );
});

export default PGNPanel; 