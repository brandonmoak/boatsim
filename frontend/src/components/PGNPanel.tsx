import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import pgnsBase from '@canboat/pgns/canboat.json';
import pgnsIK from '@canboat/pgns/pgns-ik.json';
import pgnsNGT from '@canboat/pgns/pgns-ngt.json';
import PGNItem from './PGNItem';
import { PGNDefinition } from '../types';
import pgnConfig from '../config/pgn_config.yaml';

interface PGNOption {
    value: string;
    label: string;
}

interface PGNPanelProps {
    pgnState: Record<string, Record<string, number>>;
    onPGNUpdate: (pgnKey: string, updates: Record<string, number>) => void;
}

function organizePGNs() {
    console.log('Loading PGN Definitions:', {
        base: {
            count: pgnsBase.PGNs.length,
            pgns: pgnsBase.PGNs.map(p => `${p.PGN} - ${p.Description}`),
        },
        ik: {
            count: pgnsIK.PGNs.length,
            pgns: pgnsIK.PGNs.map(p => `${p.PGN} - ${p.Description}`),
        },
        ngt: {
            count: pgnsNGT.PGNs.length,
            pgns: pgnsNGT.PGNs.map(p => `${p.PGN} - ${p.Description}`),
        }
    });

    const res: Record<string, PGNDefinition[]> = {};
    const all = [...pgnsBase.PGNs, ...pgnsIK.PGNs, ...pgnsNGT.PGNs];
    
    all.forEach(pgn => {
        const pgnKey = pgn.PGN.toString();
        if (!res[pgnKey]) {
            res[pgnKey] = [];
        }
        
        // Ensure Fields is always an array
        pgn.Fields = Array.isArray(pgn.Fields) ? pgn.Fields : [];
        
        // Handle Reserved field names
        let reservedCount = 1;
        pgn.Fields.forEach((field) => {
            if (field.Name === 'Reserved') {
                field.Name = `Reserved${reservedCount++}`;
            }
        });
        
        res[pgnKey].push(pgn as PGNDefinition);
    });
    return res;
}

const PGNPanel: React.FC<PGNPanelProps> = ({ pgnState, onPGNUpdate }) => {
    const [pgnDefinitions, setPgnDefinitions] = useState<Record<string, PGNDefinition[]>>({});
    const [selectedPGNs, setSelectedPGNs] = useState<string[]>(
        Object.values(pgnConfig.default_pgns || {}).map((pgn: unknown) => String(pgn))
    );

    useEffect(() => {
        const definitions = organizePGNs();
        setPgnDefinitions(definitions);
    }, []);

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
                                    rate={definitions[0].TransmissionInterval ? (1000 / definitions[0].TransmissionInterval) : undefined}
                                />
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};

export default PGNPanel; 