import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import PGNItem from './PGNItem';
import { PGNDefinition } from '../types';
import pgnConfig from '../config/pgn_config.yaml';
import { initSocket, getSocket } from '../socket';
import { loadPGNConfig } from '../utils/pgn_loader';

interface PGNOption {
    value: string;
    label: string;
}

interface PGNPanelProps {
    pgnState: Record<string, Record<string, number>>;
    onPGNUpdate: (pgnKey: string, updates: Record<string, number>) => void;
    isSimulating: boolean;
}

const PGNPanel: React.FC<PGNPanelProps> = ({ pgnState, onPGNUpdate, isSimulating }) => {
    const [pgnDefinitions, setPgnDefinitions] = useState<Record<string, PGNDefinition[]>>({});
    const [selectedPGNs, setSelectedPGNs] = useState<string[]>(
        Object.values(pgnConfig.default_pgns || {}).map((pgn: unknown) => String(pgn))
    );
    const [pgnIntervals, setPgnIntervals] = useState<Record<string, NodeJS.Timeout>>({});
    const [pgnRates, setPgnRates] = useState<Record<string, number>>({});

    useEffect(() => {
        // Initialize socket connection once
        const socket = initSocket();

        loadPGNConfig().then(definitions => {
            setPgnDefinitions(definitions);
        });

        // Cleanup on unmount
        return () => {
            Object.values(pgnIntervals).forEach(interval => clearInterval(interval));
        };
    }, []);  // Empty dependency array means this runs once on mount

    const handlePGNChange = (pgnKey: string, field: string, value: string | number) => {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        onPGNUpdate(pgnKey, { [field]: numValue });
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
        label: `${key} - ${defs[0]?.Description || 'Unknown'}`
    }));

    const emitPGNData = (pgnKey: string, config: PGNDefinition) => {
        const socket = getSocket();  // Get the singleton socket instance
        if (!socket) return;  // Safety check

        const timestamp = new Date().toISOString();
        const values: Record<string, number> = {};

        // Get the current values for each field from pgnState
        config.Fields.forEach(field => {
            const fieldValue = pgnState[pgnKey]?.[field.Name];
            if (fieldValue !== undefined) {
                values[field.Name] = fieldValue;
            }
        });

        const pgnUpdate = {
            timestamp,
            pgn_name: pgnKey,
            pgn_id: config.PGN,
            values: values  // Now includes all field values
        };

        console.log('Emitting PGN data:', pgnUpdate);
        socket.emit('update_pgn_2000', [pgnUpdate]);
    };

    const handleRateChange = (pgnKey: string, newRate: number, config: PGNDefinition) => {
        // Store the new rate in state
        setPgnRates(prev => ({
            ...prev,
            [pgnKey]: newRate
        }));

        // Clear existing interval
        if (pgnIntervals[pgnKey]) {
            clearInterval(pgnIntervals[pgnKey]);
        }
        
        // Only create new interval if simulating
        if (isSimulating) {
            const newInterval = setInterval(() => {
                emitPGNData(pgnKey, config);
            }, 1000 / newRate);
            
            setPgnIntervals(prev => ({
                ...prev,
                [pgnKey]: newInterval
            }));
        }
    };

    useEffect(() => {
        Object.values(pgnIntervals).forEach(interval => clearInterval(interval));
        
        const newIntervals: Record<string, NodeJS.Timeout> = {};
        
        if (isSimulating) {
            selectedPGNs.forEach(pgnKey => {
                const config = pgnDefinitions[pgnKey]?.[0];
                if (!config) return;

                const rate = config.TransmissionInterval 
                    ? config.TransmissionInterval 
                    : 1000;

                newIntervals[pgnKey] = setInterval(() => {
                    emitPGNData(pgnKey, config);
                }, rate);
            });
        }

        setPgnIntervals(newIntervals);

        return () => {
            Object.values(newIntervals).forEach(interval => clearInterval(interval));
        };
    }, [selectedPGNs, pgnDefinitions, pgnState, isSimulating]);

    return (
        <div className="pgn-panel">
            <div className="pgn-panel-header">
                <h3>NMEA 2000 Parameters</h3>
                
                {/* PGN Selector */}
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
                {/* Sort PGNs numerically - lowest first */}
                {selectedPGNs
                    .sort((a, b) => parseInt(b) - parseInt(a))
                    .map(pgnKey => {
                        const definitions = pgnDefinitions[pgnKey];
                        if (!definitions?.[0]) return null;

                        return (
                            <div key={pgnKey} className="pgn-item-container">
                                <button 
                                    className="remove-pgn"
                                    onClick={() => handleRemovePGN(pgnKey)}
                                >
                                    ×
                                </button>
                                <PGNItem 
                                    config={definitions[0]}
                                    value={pgnState[pgnKey] || {}}
                                    onChange={(field, value) => handlePGNChange(pgnKey, field, value)}
                                    rate={pgnRates[pgnKey] ?? (definitions[0].TransmissionInterval ? (1000 / definitions[0].TransmissionInterval) : undefined)}
                                    onRateChange={(newRate) => handleRateChange(pgnKey, newRate, definitions[0])}
                                />
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};

export default PGNPanel; 